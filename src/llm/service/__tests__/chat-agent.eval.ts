import OntologyDefinition from "@/ontology/ontology-definition";
import * as ls from "langsmith/vitest";
import { describe } from "vitest";
import type { PipelineStepResult } from "@/connector/prisma/prisma-queries-result-translator";
import UserQueryResponseService from "../user-query-response";
import userQueryResponseEvaluator from "./evaluators/user-query-response-evaluator";

describe("Chat agent service", () => {
  describe("단순 목록 조회 질의", () => {
    ls.describe(
      "파이프라인 결과(온톨로지 인스턴스)와 사용자 질의를 기반으로 응답 생성",
      () => {
        ls.test.each<
          {
            userQuery: string;
            pipelineResult: PipelineStepResult[];
          },
          never
        >([
          {
            inputs: {
              userQuery: "모든 고객을 조회해줘",
              pipelineResult: [
                {
                  stepName: "list_all_customers",
                  objectType: "customer",
                  objectInstances: [
                    {
                      rid: "clx1234567890",
                      objectType: "customer",
                      properties: {
                        id: "clx1234567890",
                        name: "김민준",
                        phone: "010-1234-5678",
                      },
                    },
                    {
                      rid: "clx0987654321",
                      objectType: "customer",
                      properties: {
                        id: "clx0987654321",
                        name: "이소연",
                        phone: "010-2345-6789",
                      },
                    },
                    {
                      rid: "clx1122334455",
                      objectType: "customer",
                      properties: {
                        id: "clx1122334455",
                        name: "박지현",
                        phone: "010-3456-7890",
                      },
                    },
                  ],
                },
              ],
            },
          },
          {
            inputs: {
              userQuery: "모든 카테고리를 가져와줘",
              pipelineResult: [
                {
                  stepName: "list_categories",
                  objectType: "category",
                  objectInstances: [
                    {
                      rid: "clxcat001",
                      objectType: "category",
                      properties: {
                        id: "clxcat001",
                        name: "전자제품",
                      },
                    },
                    {
                      rid: "clxcat002",
                      objectType: "category",
                      properties: {
                        id: "clxcat002",
                        name: "가전제품",
                      },
                    },
                  ],
                },
              ],
            },
          },
          {
            inputs: {
              userQuery: "제품 목록을 보여줘",
              pipelineResult: [
                {
                  stepName: "list_products",
                  objectType: "product",
                  objectInstances: [
                    {
                      rid: "clxprod001",
                      objectType: "product",
                      properties: {
                        id: "clxprod001",
                        name: "스마트폰",
                        description: "최신 스마트폰",
                        price: 800000,
                        stock: 50,
                        categoryId: "clxcat001",
                      },
                    },
                    {
                      rid: "clxprod002",
                      objectType: "product",
                      properties: {
                        id: "clxprod002",
                        name: "노트북",
                        description: "고성능 노트북",
                        price: 1200000,
                        stock: 30,
                        categoryId: "clxcat001",
                      },
                    },
                  ],
                },
              ],
            },
          },
        ])("단순 응답 생성", async ({ inputs }) => {
          const response = await new UserQueryResponseService(
            OntologyDefinition
          ).generateResponse(inputs.userQuery, inputs.pipelineResult);

          ls.logOutputs(response);

          const evaluate = ls.wrapEvaluator(userQueryResponseEvaluator);
          const evaluation = await evaluate({
            outputs: response,
          });

          if (evaluation.score < 1) {
            console.warn("응답 생성 평가 기준 미달");
            console.log(JSON.stringify({ evaluation }, null, 2));
          }
        });
      }
    );
  });
});
