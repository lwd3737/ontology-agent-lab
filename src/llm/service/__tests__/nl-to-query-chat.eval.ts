import OntologyDefinition from "@/ontology/ontology-definition";
import * as ls from "langsmith/vitest";
import NLToQueryChatService from "../nl-to-query-chat";
import { describe, expect } from "vitest";
import PrismaClientCompiler, {
  type PrismaQuery,
} from "@/connector/prisma/prisma-client-compiler";
import { queryDSLEvaluator } from "./utils/query-dsl-evaluator";
import type { OntologyQueryDSL } from "@/ontology-query/dsl-schema";
import { prismaClientCompilerEvaluator } from "./utils/prisma-client-compiler-evaluator";
import type { ObjectInstance } from "@/ontology/ontology-instance";
import PrismaQueryResultToOntologyTranslator from "@/connector/prisma/query-result-to-ontology-translator";
import type {
  PrismaListQueryResult,
  PrismaQueryResult,
} from "@/connector/prisma/prisma-query-executor";
import queryResultToOntologyTranslationEvaluator from "./utils/query-result-to-ontology-translation-evaluator";

describe("NL to prisma query chat service", () => {
  describe("Query DSL 생성", () => {
    ls.describe("list Query DSL 생성", () => {
      ls.test.each([
        {
          inputs: {
            userQuery: "모든 고객을 조회해줘",
          },
        },
        {
          inputs: {
            userQuery: "모든 카테고리를 가져와줘",
          },
        },
        // {
        //   inputs: {
        //     userQuery: "이름에 'John'이 포함된 고객을 찾아줘",
        //   },
        // },
        // {
        //   inputs: {
        //     userQuery: "가격이 100보다 큰 모든 제품을 가져와줘",
        //   },
        // },
        // {
        //   inputs: {
        //     userQuery: "2024년 1월 1일 이후에 생성된 주문을 찾아줘",
        //   },
        // },
        // {
        //   inputs: {
        //     userQuery: "재고가 10 이하인 제품들을 가져와줘",
        //   },
        // },
        // {
        //   inputs: {
        //     userQuery: "전화번호가 '123-456-7890'인 고객을 찾아줘",
        //   },
        // },

        // {
        //   inputs: {
        //     userQuery: "상태가 'shipped'인 배송을 찾아줘",
        //   },
        // },
        // {
        //   inputs: {
        //     userQuery: "가격이 50 이상이고 재고가 5 이상인 제품을 찾아줘",
        //   },
        // },
        // {
        //   inputs: {
        //     userQuery: "총 금액이 1000보다 큰 주문을 찾아줘",
        //   },
        // },
      ])(
        "단순 QueryDSL 생성 성공",

        async ({ inputs }) => {
          const service = new NLToQueryChatService(
            OntologyDefinition,
            new PrismaClientCompiler()
          );
          const queryDSL = await service.generateQueryDsl([
            {
              id: "1",
              role: "user",
              parts: [{ type: "text", text: inputs.userQuery }],
            },
          ]);
          ls.logOutputs({ queryDSL });

          const evaluate = ls.wrapEvaluator(queryDSLEvaluator);
          const evaluation = await evaluate({
            userQuery: inputs.userQuery,
            outputs: queryDSL,
          });

          console.log(JSON.stringify({ queryDSL, evaluation }, null, 2));
          expect(evaluation.score).toBeGreaterThanOrEqual(0.8);
        },
        1000000
      );
    });
  });

  ls.describe("Query DSL -> Prisma Query 컴파일", () => {
    ls.test.each<
      { queryDSL: OntologyQueryDSL },
      { compiledQueries: PrismaQuery[] }
    >([
      {
        inputs: {
          queryDSL: {
            pipeline: [
              {
                name: "list_all_customers",
                query: {
                  objectType: "customer",
                  properties: ["id", "name", "phone"],
                  type: "list",
                },
              },
            ],
          },
        },
        referenceOutputs: {
          compiledQueries: [
            {
              model: "Customer",
              queryMethod: "findMany",
              args: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          ],
        },
      },
      {
        inputs: {
          queryDSL: {
            pipeline: [
              {
                name: "list_categories",
                query: {
                  objectType: "category",
                  properties: ["id", "name"],
                  type: "list",
                },
              },
            ],
          },
        },
        referenceOutputs: {
          compiledQueries: [
            {
              model: "Category",
              queryMethod: "findMany",
              args: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          ],
        },
      },
    ])(
      "단순 Query DSL 컴파일 성공",

      async ({ inputs, referenceOutputs }) => {
        const compiler = new PrismaClientCompiler();
        const compiledResult = compiler.compileFromQueryDSL(
          inputs.queryDSL as OntologyQueryDSL
        );

        const evaluate = ls.wrapEvaluator(prismaClientCompilerEvaluator);
        await evaluate({
          output: compiledResult.pipeline,
          expected: referenceOutputs!.compiledQueries as PrismaQuery[],
        });

        ls.logOutputs({ compiledQuery: compiledResult });
        expect(compiledResult).toEqual(referenceOutputs!.compiledQueries);
      }
    );
  });

  ls.describe("Prisma Query 결과를 Ontology Instance로 변환", () => {
    ls.test.each<
      { queriesResult: PrismaListQueryResult[]; queryDSL: OntologyQueryDSL },
      never
      // { ontologyInstances: ObjectInstance[] }
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
        const translator = new PrismaQueryResultToOntologyTranslator();

        const pipelineResult = translator.translate(
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

        expect(evaluation.score).toBe(1);
      }
    );
  });
});
