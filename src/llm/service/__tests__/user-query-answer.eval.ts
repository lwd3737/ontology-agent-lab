import { describe } from "vitest";
import * as ls from "langsmith/vitest";
import type { PipelineStepResult } from "@/connector/prisma/prisma-queries-result-translator";
import UserQueryAnswerService from "../user-query-answer";
import OntologyDefinition from "@/ontology/ontology-definition";
import chatAgentEvaluator from "./evaluators/chat-agent-evaluator";
import { formatDataset } from "./dataset/helpers";
import UserQueryDataset from "./dataset/user-query";
import PipelineResultDataset from "./dataset/pipeline-result";

describe("UserQueryAnswer", () => {
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
          const responseResult = await new UserQueryAnswerService(
            OntologyDefinition
          ).generateResponse(inputs.userQuery, inputs.pipelineResult);

          ls.logOutputs(responseResult);

          // const evaluate = ls.wrapEvaluator(chatAgentEvaluator);
          // const evaluation = await evaluate({
          //   inputs: { userQuery: inputs.userQuery },
          //   outputs: { responseResult: responseResult },
          // });

          // if (evaluation.score < 1) {
          //   console.warn("응답 생성 평가 기준 미달");
          //   console.log(JSON.stringify({ evaluation }, null, 2));
          // }
        });
      }
    );
  });
});
