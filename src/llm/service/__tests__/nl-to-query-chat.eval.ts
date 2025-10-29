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
import { describe, expect } from "vitest";

describe("NL to prisma query chat service", () => {
  ls.describe("Query DSL 생성", () => {
    ls.test.each([
      {
        inputs: {
          userQuery: "모든 고객을 조회해줘",
        },
      },
      {
        inputs: {
          userQuery: "이름에 'John'이 포함된 고객을 찾아줘",
        },
      },
      {
        inputs: {
          userQuery: "가격이 100보다 큰 모든 제품을 가져와줘",
        },
      },
      {
        inputs: {
          userQuery: "2024년 1월 1일 이후에 생성된 주문을 찾아줘",
        },
      },
      {
        inputs: {
          userQuery: "재고가 10 이하인 제품들을 가져와줘",
        },
      },
      {
        inputs: {
          userQuery: "전화번호가 '123-456-7890'인 고객을 찾아줘",
        },
      },
      {
        inputs: {
          userQuery: "모든 카테고리를 가져와줘",
        },
      },
      {
        inputs: {
          userQuery: "상태가 'shipped'인 배송을 찾아줘",
        },
      },
      {
        inputs: {
          userQuery: "가격이 50 이상이고 재고가 5 이상인 제품을 찾아줘",
        },
      },
      {
        inputs: {
          userQuery: "총 금액이 1000보다 큰 주문을 찾아줘",
        },
      },
    ])(
      "다양한 쿼리 패턴 생성 성공",

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

        const evaluate = ls.wrapEvaluator(queryDSLEvaluator);
        const evaluation = await evaluate({
          outputs: queryDSL,
        });
        console.log(JSON.stringify({ queryDSL, evaluation }, null, 2));

        expect(evaluation.score).toBeGreaterThanOrEqual(0.8);
      },
      1000000
    );
  });
});
