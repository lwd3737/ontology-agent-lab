import { describe } from "vitest";
import * as ls from "langsmith/vitest";
import type { PrismaListQueryResult } from "@/connector/prisma/prisma-query-executor";
import type { OntologyQueryDSL } from "@/ontology-query/dsl-schema";
import PrismaQueriesResultTranslator from "@/connector/prisma/prisma-queries-result-translator";
import queryResultToOntologyTranslationEvaluator from "./evaluators/query-result-to-ontology-translation-evaluator";

describe("PrismaQueriesResultTranslator", () => {
  describe("Prisma Query 결과를 Ontology Instance로 변환", () => {
    ls.describe("List queries", () => {
      ls.test.each<
        { queriesResult: PrismaListQueryResult[]; queryDSL: OntologyQueryDSL },
        never
      >([
        {
          inputs: {
            queriesResult: [
              [
                {
                  id: "clx1234567890",
                  name: "김민준",
                  phone: "010-1234-5678",
                },
                {
                  id: "clx0987654321",
                  name: "이소연",
                  phone: "010-2345-6789",
                },
                {
                  id: "clx1122334455",
                  name: "박지현",
                  phone: "010-3456-7890",
                },
              ],
            ],
            queryDSL: {
              pipeline: [
                {
                  name: "list_all_customers",
                  query: {
                    type: "list",
                    objectType: "customer",
                    properties: ["id", "name", "phone"],
                  },
                },
              ],
            },
          },
        },
        {
          inputs: {
            queriesResult: [
              [
                {
                  id: "clxcat001",
                  name: "전자제품",
                },
                {
                  id: "clxcat002",
                  name: "가전제품",
                },
              ],
            ],
            queryDSL: {
              pipeline: [
                {
                  name: "list_categories",
                  query: {
                    type: "list",
                    objectType: "category",
                    properties: ["id", "name"],
                  },
                },
              ],
            },
          },
        },
      ])(
        "단순 Query 결과 변환 성공",

        async ({ inputs }) => {
          const translator = new PrismaQueriesResultTranslator();

          const pipelineResult = translator.translateToOntology(
            inputs.queriesResult,
            inputs.queryDSL
          );

          ls.logOutputs({ pipelineResult });
          const evaluate = ls.wrapEvaluator(
            queryResultToOntologyTranslationEvaluator
          );
          const evaluation = await evaluate({
            inputs: {
              queryDSL: inputs.queryDSL,
              queriesResult: inputs.queriesResult,
            },
            outputs: {
              pipelineResult,
            },
          });

          if (evaluation.score < 1) {
            console.warn("Query 결과 변환 평가 기준 미달");
            console.log(JSON.stringify({ evaluation }, null, 2));
          }
        }
      );
    });
  });
});
