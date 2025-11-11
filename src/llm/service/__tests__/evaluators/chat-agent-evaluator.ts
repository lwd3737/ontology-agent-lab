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

const chatAgentEvaluator = async ({
  inputs,
  outputs,
}: {
  inputs: {
    userQuery: string;
    // referenceValidation?: ReferenceValidation;
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

  // TODO: 시용자 질의를 기반으로 쿼리 타입을 판단해서 참조 객체를 검증하는 툴 구현
  const { object } = await generateObject({
    model: openai("gpt-5"),
    system: SYSTEM_PROMPT,
    prompt,
    schema: evaluationSchema,
  });

  const { success: objectReferenceSuccess, details: objectReferenceDetails } =
    await evaluateObjectReferenceScore(outputs.responseResult.references);

  const finalScore = calculateWeightedScore({
    llmScores: object.scores,
    objectReferenceSuccess,
  });

  return {
    key: "userQueryResponse",
    score: finalScore,
    details: {
      metrics: {
        relevance: {
          score: object.scores.relevance,
          reasoning: object.reasoning.relevance,
        },
        completeness: {
          score: object.scores.completeness,
          reasoning: object.reasoning.completeness,
        },
        clarity: {
          score: object.scores.clarity,
          reasoning: object.reasoning.clarity,
        },
        objectReference: {
          score: objectReferenceSuccess ? 1 : 0,
          details: objectReferenceDetails,
        },
      },
      weights: METRIC_WEIGHTS,
    },
  };
};

export default chatAgentEvaluator;

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

const evaluateObjectReferenceScore = async (
  references: UserQueryResponseResult["references"]
): Promise<{ success: boolean; details: { errors: any[] } }> => {
  const prismaSchemaMapper = PrismaSchemaMapper.create();
  const errors: any[] = [];

  if (!references?.objects) {
    return {
      success: true,
      details: {
        errors: [],
      },
    };
  }

  await Promise.allSettled(
    Object.entries(references.objects).map(
      async function validateReferenceObjectInstance([objectType, objects]) {
        try {
          const prismaModel = prismaSchemaMapper.mapToPrismaModel(objectType);
          const prismaPrimaryKeyValues = objects.map(
            (object): string =>
              prismaSchemaMapper.mapToPrismaPrimaryKeyField(objectType, object)
                .value
          );
          const prismaPrimaryKeyFieldName =
            prismaSchemaMapper.mapToPrismaPrimaryKeyField(
              objectType,
              objects[0]
            ).name;

          const prismaFieldsSelect = Object.keys(objects[0].properties).reduce(
            (result, property) => {
              result[property] = true;
              return result;
            },
            {} as Record<string, boolean>
          );

          let prismaModelInstances: PrismaModelInstance[] = [];
          try {
            prismaModelInstances = await prisma[prismaModel].findMany({
              where: {
                [prismaPrimaryKeyFieldName]: {
                  in: prismaPrimaryKeyValues,
                },
                select: prismaFieldsSelect,
              },
            });
          } catch (error) {
            errors.push({
              message: `Failed to fetch prisma model instances for object type: ${objectType}`,
              details: {
                fieldNames: Object.keys(prismaFieldsSelect),
                error,
              },
            });
          }

          prismaModelInstances.forEach(function validateModelInstance(
            modelInstance,
            idx
          ) {
            const propertiesWithoutPrimaryKey = Object.entries(
              objects[idx].properties
            ).filter(function filterPrimaryKeyProperty([propertyId]) {
              return propertyId !== prismaPrimaryKeyFieldName;
            });

            propertiesWithoutPrimaryKey.forEach(function validateProperty([
              propertyId,
              propertyValue,
            ]) {
              const prismaField = prismaSchemaMapper.mapToPrismaField(
                objectType,
                propertyId,
                modelInstance
              );

              if (!(prismaField.name in modelInstance)) {
                errors.push({
                  message: `Property ${propertyId} not found in model instance for object type: ${objectType}`,
                  details: {
                    objectRid: objects[idx].rid,
                    fieldNames: Object.keys(prismaFieldsSelect),
                  },
                });
              }

              if (prismaField.value !== propertyValue) {
                errors.push({
                  message: `Property value mismatch for object type: ${objectType}, property id: ${propertyId}`,
                  details: {
                    objectRid: objects[idx].rid,
                    fieldName: prismaField.name,
                    expected: propertyValue,
                    actual: prismaField.value,
                  },
                });
              }
            });
          });
        } catch (error) {
          errors.push({
            message: `Exception occurred while fetching prisma model instances for object type: ${objectType}`,
            details: JSON.stringify(error, null, 2),
          });
        }
      }
    )
  );

  return {
    success: errors.length === 0,
    details: {
      errors,
    },
  };
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
