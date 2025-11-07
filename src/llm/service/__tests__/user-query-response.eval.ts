import { describe } from "vitest";
import * as ls from "langsmith/vitest";
import type { PipelineStepResult } from "@/connector/prisma/prisma-queries-result-translator";
import UserQueryResponseService from "../user-query-response";
import OntologyDefinition from "@/ontology/ontology-definition";
import userQueryResponseEvaluator from "./evaluators/user-query-response-evaluator";
import { formatDataset } from "./dataset/helpers";
import UserQueryDataset from "./dataset/user-query";
import PipelineResultDataset from "./dataset/pipeline-result";

describe("UserQueryResponse", () => {
  describe("단순 목록 조회 질의", () => {
    ls.describe(
      "파이프라인 결과(온톨로지 인스턴스)와 사용자 질의를 기반으로 응답 생성",
      () => {
        ls.test.each(
          formatDataset<{
            userQuery: string[];
            pipelineResult: PipelineStepResult[][];
          }>({
            userQuery: UserQueryDataset.simpleListQueries,
            pipelineResult: PipelineResultDataset.simpleListQueries,
          })
        )("단순 응답 생성", async ({ inputs }) => {
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
