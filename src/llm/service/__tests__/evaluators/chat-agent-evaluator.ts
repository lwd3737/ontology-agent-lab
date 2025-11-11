import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import z from "zod";
import PromptBuilder from "@/llm/prompt/helpers/prompt-builder";
import type { UserQueryResponseResult } from "../../user-query-response";
import OntologyDefinitionContextBuilder from "@/llm/prompt/contexts/ontology-definition-context-builder";
import OntologyDefinition from "@/ontology/ontology-definition";
import PrismaSchemaMapper from "@/connector/prisma/schema-mapping/schema-mapper";
import { prisma } from "@/connector/prisma/client";
import type { PrismaModelInstance } from "@/connector/prisma/prisma-query-executor";

type LLMMetricScores = {
  relevance: number;
  completeness: number;
  clarity: number;
};

type LLMMetricReasoning = {
  relevance: string;
  completeness: string;
  clarity: string;
};

type ObjectReferenceValidation = {
  success: boolean;
  errors: ObjectReferenceValidationError[];
};

type ObjectReferenceValidationError = {
  objectType: string;
  rid: string | undefined;
  message: string;
  details?: Record<string, unknown>;
};

type ReferencesObjectMap = NonNullable<
  NonNullable<UserQueryResponseResult["references"]>["objects"]
>;
type ReferencedObjectList = ReferencesObjectMap[string];
type ReferencedObject = ReferencedObjectList[number];

const METRIC_WEIGHTS = {
  objectReference: 0.4,
  relevance: 0.3,
  completeness: 0.2,
  clarity: 0.1,
} as const;

const MAX_SCORE = 1;
const MIN_SCORE = 0;

const evaluationSchema = z.object({
  reasoning: z.object({
    relevance: z.string().describe("Relevance & faithfulness reasoning."),
    completeness: z.string().describe("Completeness reasoning."),
    clarity: z.string().describe("Clarity & structure reasoning."),
  }),
  scores: z.object({
    relevance: z
      .number()
      .min(MIN_SCORE)
      .max(MAX_SCORE)
      .describe("Score for relevance & faithfulness (0-1)."),
    completeness: z
      .number()
      .min(MIN_SCORE)
      .max(MAX_SCORE)
      .describe("Score for completeness (0-1)."),
    clarity: z
      .number()
      .min(MIN_SCORE)
      .max(MAX_SCORE)
      .describe("Score for clarity & structure (0-1)."),
  }),
});

const SYSTEM_PROMPT = new PromptBuilder()
  .section("Role")
  .text(
    "You are a strict evaluator for user-query responses generated from an ontology-backed chat agent."
  )
  .section("Evaluation Rubric")
  .bullet([
    "Relevance & Faithfulness: Does the answer address the user query intent and avoid contradicting known facts?",
    "Completeness: Does the answer cover all required details the user asked for (including multiple entities when requested)?",
    "Clarity & Structure: Is the answer easy to understand and well-structured for the end user?",
    "Object Reference Accuracy is supplied separately via database validation; do not invent that score.",
  ])
  .section("Scoring Instructions")
  .bullet([
    "Provide reasoning for each of the three metrics before the numeric score.",
    "Scores must be between 0 and 1 (inclusive).",
    "Do not reference external knowledge; rely solely on the provided context.",
    "Return JSON that contains only the fields required by the schema: reasoning.{relevance, completeness, clarity} as strings and scores.{relevance, completeness, clarity} as numbers.",
    'Do not nest values inside helper objects (e.g. avoid {"relevance": {"value": 0.9}}) and do not emit extra fields.',
  ])
  .build();

const prismaSchemaMapper = PrismaSchemaMapper.create();

const chatAgentEvaluator = async ({
  inputs,
  outputs,
}: {
  inputs: {
    userQuery: string;
  };
  outputs: { responseResult: UserQueryResponseResult };
}) => {
  const ontologyContext = new OntologyDefinitionContextBuilder(
    OntologyDefinition
  ).build();

  const prompt = buildUserPrompt({
    userQuery: inputs.userQuery,
    responseText: outputs.responseResult.response,
    ontologyContext,
  });

  const referenceValidation = await validateReferences(
    outputs.responseResult.references
  );
  const { scores, reasoning } = await evaluateLLMMetrics(prompt);

  const finalScore = calculateWeightedScore({
    llmScores: scores,
    objectReferenceSuccess: referenceValidation.success,
  });

  return {
    key: "chatAgentScore",
    score: finalScore,
    details: {
      metrics: buildMetricDetails(reasoning, scores, referenceValidation),
      weights: METRIC_WEIGHTS,
    },
  };
};

export default chatAgentEvaluator;

const evaluateLLMMetrics = async (prompt: string) => {
  const { object } = await generateObject({
    model: openai("gpt-5"),
    system: SYSTEM_PROMPT,
    prompt,
    schema: evaluationSchema,
  });

  return {
    scores: object.scores,
    reasoning: object.reasoning,
  };
};

const buildMetricDetails = (
  reasoning: LLMMetricReasoning,
  scores: LLMMetricScores,
  referenceValidation: ObjectReferenceValidation
) => ({
  relevance: {
    score: scores.relevance,
    reasoning: reasoning.relevance,
  },
  completeness: {
    score: scores.completeness,
    reasoning: reasoning.completeness,
  },
  clarity: {
    score: scores.clarity,
    reasoning: reasoning.clarity,
  },
  objectReference: {
    score: referenceValidation.success ? 1 : 0,
    details: {
      errors: referenceValidation.errors,
    },
  },
});

const buildUserPrompt = (params: {
  userQuery: string;
  responseText: string;
  ontologyContext: string;
}) => {
  const { userQuery, responseText, ontologyContext } = params;
  return new PromptBuilder()
    .section("User Query")
    .text(userQuery)
    .section("Chat Agent Response")
    .text(responseText)
    .section("Ontology Definition Context")
    .text(ontologyContext)
    .section("Evaluation Tasks")
    .bullet([
      "Assess relevance & faithfulness of the response to the user query.",
      "Assess completeness of the response (ensure all requested details are covered).",
      "Assess clarity & structure of the response.",
      "Do not assign the object reference accuracy score; that score is provided separately.",
      "Return reasoning for each metric followed by the numeric scores in JSON.",
    ])
    .build();
};

const validateReferences = async (
  references: UserQueryResponseResult["references"]
): Promise<ObjectReferenceValidation> => {
  if (!references?.objects) {
    return { success: true, errors: [] };
  }

  const validationErrors: ObjectReferenceValidationError[] = [];
  const referencedObjectsByType = references.objects as ReferencesObjectMap;

  await Promise.all(
    Object.entries(referencedObjectsByType).map(
      async ([objectType, objectInstances]) => {
        await validateObjectsReferences(
          objectType,
          objectInstances,
          validationErrors
        );
      }
    )
  );

  return {
    success: validationErrors.length === 0,
    errors: validationErrors,
  };
};

const validateObjectsReferences = async (
  objectType: string,
  referencedObjects: ReferencedObjectList,
  errors: ObjectReferenceValidationError[]
) => {
  try {
    const prismaModel = prismaSchemaMapper.mapToPrismaModel(objectType);
    const primaryKeyFieldName =
      prismaSchemaMapper.mapToPrismaPrimaryKeyName(objectType);
    const select = buildPrismaSelect(objectType, referencedObjects);

    const prismaModelInstances: PrismaModelInstance[] = await prisma[
      prismaModel
    ].findMany({
      where: {
        [primaryKeyFieldName]: {
          in: referencedObjects.map((object) => object.rid),
        },
      },
      select,
    });

    referencedObjects.forEach((reference) => {
      const modelInstance = prismaModelInstances.find(
        (instance) => instance[primaryKeyFieldName] === reference.rid
      );
      if (!modelInstance) {
        errors.push({
          objectType,
          rid: reference.rid,
          message: "Referenced object was not found in the database.",
        });
        return;
      }

      validatePrismaModelInstance(objectType, reference, modelInstance, errors);
    });
  } catch (error) {
    errors.push({
      objectType,
      rid: undefined,
      message:
        "Exception occurred while validating referenced object instances.",
      details: formatErrorDetails(error),
    });
  }
};

const buildPrismaSelect = (
  objectType: string,
  referencedObjects: ReferencedObjectList
) => {
  return referencedObjects.reduce((select, object) => {
    Object.keys(object.properties).forEach((propertyId) => {
      const prismaField = prismaSchemaMapper.mapToPrismaFieldName(
        objectType,
        propertyId
      );
      select[prismaField] = true;
    });
    return select;
  }, {} as Record<string, boolean>);
};

const validatePrismaModelInstance = (
  objectType: string,
  reference: ReferencedObject,
  modelInstance: PrismaModelInstance,
  errors: ObjectReferenceValidationError[]
) => {
  Object.entries(reference.properties).forEach(
    ([propertyId, propertyValue]) => {
      try {
        const prismaField = prismaSchemaMapper.mapToPrismaField(
          objectType,
          propertyId,
          modelInstance
        );

        if (!(prismaField.name in modelInstance)) {
          errors.push({
            objectType,
            rid: reference.rid,
            message: `Property ${propertyId} does not exist on the Prisma model.`,
            details: {
              availableFields: Object.keys(modelInstance),
            },
          });
          return;
        }

        if (prismaField.value !== propertyValue) {
          errors.push({
            objectType,
            rid: reference.rid,
            message: `Property value mismatch for ${propertyId}.`,
            details: {
              expected: propertyValue,
              actual: prismaField.value,
            },
          });
        }
      } catch (error) {
        errors.push({
          objectType,
          rid: reference.rid,
          message: `Failed to validate property ${propertyId}.`,
          details: formatErrorDetails(error),
        });
      }
    }
  );
};

const formatErrorDetails = (error: unknown) => {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }
  return { error };
};

const calculateWeightedScore = ({
  llmScores,
  objectReferenceSuccess,
}: {
  llmScores: LLMMetricScores;
  objectReferenceSuccess: boolean;
}) => {
  return (
    llmScores.relevance * METRIC_WEIGHTS.relevance +
    llmScores.completeness * METRIC_WEIGHTS.completeness +
    (objectReferenceSuccess ? 1 : 0) * METRIC_WEIGHTS.objectReference +
    llmScores.clarity * METRIC_WEIGHTS.clarity
  );
};
