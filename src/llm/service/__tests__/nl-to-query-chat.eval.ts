import OntologyDefinition from "@/ontology/definition";
import * as ls from "langsmith/vitest";
import NLToQueryChatService from "../nl-to-query-chat";
import {
  OntologyQueryDslSchema,
  type OntologyQueryDSL,
} from "@/ontology-query/dsl-schema";
import * as ai from "ai";
import { wrapAISDK } from "langsmith/experimental/vercel";
import { openai } from "@ai-sdk/openai";
import z from "zod";
import OntologyToPromptTranslator from "@/llm/adapter/ontology-to-prompt-translator";
import zodToJsonSchema from "zod-to-json-schema";
import { describe } from "vitest";

describe("NL to prisma query chat service", () => {
  ls.describe("Query DSL 생성", () => {
    ls.test.each([
      {
        inputs: {
          userQuery: "모든 고객을 조회해줘",
        },
      },
    ])(
      "단순 조회 쿼리 생성 성공",

      async ({ inputs }) => {
        const service = new NLToQueryChatService(OntologyDefinition);
        const queryDSL = await service.generateQueryDsl([
          {
            id: "1",
            role: "user",
            parts: [{ type: "text", text: inputs.userQuery }],
          },
        ]);
        ls.logOutputs({ queryDSL });

        const queryDSLEvaluator = async ({
          outputs,
        }: {
          outputs: OntologyQueryDSL;
        }) => {
          const { generateObject } = wrapAISDK(ai);

          const queryDSLSchemaContext = JSON.stringify(
            zodToJsonSchema(OntologyQueryDslSchema, "QueryDSLSchema")
              .definitions?.["QueryDSLSchema"],
            null,
            2
          );

          const instruction = [
            "You are a strict judge for Natural Language to Query DSL based on the ontology.",
            "Scoring rubric (0~1 each):",
            "- intent: Does DSL target the correct object(s) for the user intent?",
            "- ontologyGroundingAccuracy: Do objectType/property/linkType exist and match ontology semantics?",
            "- queryConstraintSatisfaction: Does the DSL correctly capture the user's constraints?",
            "- queryStructure: Is the DSL structurally minimal and appropriate?",
            "Overall pass = score >= 0.8 AND no critical ontology errors.",
          ].join("\n");
          const prompt = [
            "# Ontology Definition",
            new OntologyToPromptTranslator(OntologyDefinition).execute(),
            "",
            "# Query DSL Schema",
            queryDSLSchemaContext,
            "",
            "# User Query",
            `${inputs.userQuery}.`,
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

        const evaluator = ls.wrapEvaluator(queryDSLEvaluator);
        await evaluator({
          outputs: queryDSL,
        });
      }
    );
  });
});
