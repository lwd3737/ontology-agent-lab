import { describe } from "vitest";
import * as ls from "langsmith/vitest";
import { formatDataset } from "./dataset/helpers";
import UserQueryDataset from "./dataset/user-query";
import OntologyDefinition from "@/ontology/ontology-definition";
import UserQueryIntentRouter from "../user-query-intent-router";
import type { TextPart, UIMessage } from "ai";
import type { UserQueryResponseResult } from "../user-query-response";

describe("UserQueryIntentRouter", () => {
  ls.describe("명확한 사용자 질의", () => {
    ls.test.each(
      formatDataset<{ messages: UIMessage[][] }>({
        messages: UserQueryDataset.simpleListQueries.map((userQuery, index) => [
          {
            id: index.toString(),
            role: "user",
            parts: [{ type: "text", text: userQuery } as TextPart],
          },
        ]),
      })
    )("단순 조회 질의", async ({ inputs }) => {
      const generateAnswer = async (
        userQueryIntent: string
      ): Promise<UserQueryResponseResult> => {
        return {
          response: "단순 조회 질의 테스트 응답",
          success: true,
          references: {
            objects: {
              test: [
                {
                  rid: "clx1234567890",
                  objectType: "clx1234567890",
                  properties: {
                    id: "clx1234567890",
                    name: "test",
                  },
                },
              ],
            },
          },
        };
      };

      const userQueryIntentRouter = new UserQueryIntentRouter(
        OntologyDefinition,
        generateAnswer
      );
      const result = await userQueryIntentRouter.execute(inputs.messages);

      ls.logOutputs({ result });
    });
  });
});
