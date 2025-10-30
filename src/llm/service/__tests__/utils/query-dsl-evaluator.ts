import OntologyToPromptTranslator from "@/llm/adapter/ontology-to-prompt-translator";
import {
  OntologyQueryDslSchema,
  type OntologyQueryDSL,
} from "@/ontology-query/dsl-schema";
import OntologyDefinition from "@/ontology/definition";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import z from "zod";
import zodToJsonSchema from "zod-to-json-schema";

export const queryDSLEvaluator = async ({
  userQuery,
  outputs,
}: {
  userQuery: string;
  outputs: OntologyQueryDSL;
}) => {
  const queryDSLSchemaContext = JSON.stringify(
    zodToJsonSchema(OntologyQueryDslSchema, "QueryDSLSchema").definitions?.[
      "QueryDSLSchema"
    ],
    null,
    2
  );

  const instruction = [
    "You are a strict judge for Natural Language to Query DSL based on the ontology.",
    "",
    "# Scoring rubric (0~1 each):",
    "- intent: Does DSL target the correct object(s) for the user intent?",
    "- ontologyGroundingAccuracy: Do objectType/property/linkType exist and match ontology semantics?",
    "- queryConstraintSatisfaction: Does the DSL correctly capture the user's constraints?",
    "- queryStructure: Is the DSL structurally minimal and appropriate?",
    "Overall pass = score >= 0.8 AND no critical ontology errors.",
    "",
    "# Evaluation",
    "- ",
  ].join("\n");
  const prompt = [
    "# Ontology Definition",
    new OntologyToPromptTranslator(OntologyDefinition).execute(),
    "",
    "# Query DSL Schema",
    queryDSLSchemaContext,
    "",
    "# User Query",
    `${userQuery}.`,
    "",
    "# Generated Query DSL",
    `${JSON.stringify(outputs)}.`,
  ].join("\n");

  const result = await generateObject({
    model: openai("gpt-5"),
    system: instruction,
    prompt,
    schema: z.object({
      score: z.number().describe("The final score of the query DSL."),
      details: z.object({
        intent: z.number().describe("The score of the intent."),
        ontologyGroundingAccuracy: z
          .number()
          .min(0)
          .max(1)
          .describe("The score of the ontology grounding accuracy."),
        queryConstraintSatisfaction: z
          .number()
          .min(0)
          .max(1)
          .describe("The score of the query constraint satisfaction."),
        queryStructure: z
          .number()
          .min(0)
          .max(1)
          .describe("The score of the query structure."),
      }),
      feedback: z.string().describe("The feedback of the query DSL."),
    }),
  });

  return {
    key: "queryDSL",
    ...result.object,
  };
};
