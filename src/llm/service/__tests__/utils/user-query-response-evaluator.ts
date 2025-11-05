import type { UserQueryResponseResult } from "../../user-query-response";

const userQueryResponseEvaluator = async ({
  outputs,
}: {
  outputs: UserQueryResponseResult;
}) => {
  return {
    key: "userQueryResponse",
    score: outputs.success ? 1 : 0,
    details: {
      response: outputs.response,
    },
  };
};

export default userQueryResponseEvaluator;
