import OntologyDefinition from "@/ontology/ontology-definition";
import * as ls from "langsmith/vitest";
import { describe } from "vitest";
import chatAgentEvaluator from "./evaluators/chat-agent-evaluator";
import ChatAgentService from "../chat-agent";
import PrismaClientCompiler from "@/connector/prisma/prisma-client-compiler";
import { TextPart } from "ai";

describe("Chat agent service", () => {
  ls.describe("사용자 질의를 기반으로 응답 생성", () => {
    ls.test.each<
      {
        userQuery: string;
      },
      never
    >([
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
      {
        inputs: {
          userQuery: "제품 목록을 보여줘",
        },
      },
    ])(
      "단순 목록 조회 질의",
      async ({ inputs }) => {
        const chatAgentService = new ChatAgentService(
          OntologyDefinition,
          new PrismaClientCompiler()
        );
        const responseResult = await chatAgentService.ask([
          {
            id: "1",
            role: "user",
            parts: [{ type: "text", text: inputs.userQuery } as TextPart],
          },
        ]);

        ls.logOutputs(responseResult);

        const evaluate = ls.wrapEvaluator(chatAgentEvaluator);
        const evaluation = await evaluate({
          inputs: { userQuery: inputs.userQuery },
          outputs: { responseResult: responseResult },
        });

        if (evaluation.score < 0.7) {
          console.warn("응답 생성 평가 기준 미달");
          console.log(JSON.stringify({ evaluation }, null, 2));
        }
      },
      1000000
    );
  });
});
