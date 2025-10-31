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
        const compiledQueries = compiler.compileFromQueryDSL(
          inputs.queryDSL as OntologyQueryDSL
        );

        const evaluate = ls.wrapEvaluator(prismaClientCompilerEvaluator);
        await evaluate({
          output: compiledQueries,
          expected: referenceOutputs!.compiledQueries as PrismaQuery[],
        });

        ls.logOutputs({ compiledQuery: compiledQueries });
        expect(compiledQueries).toEqual(referenceOutputs!.compiledQueries);
      }
    );
  });
});
