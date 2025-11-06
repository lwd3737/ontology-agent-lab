import { describe } from "vitest";
import * as ls from "langsmith/vitest";
import { formatInputs } from "./dataset/helpers";
import UserQueryInputs from "./dataset/inputs/user-query";
import QueryDSLGenerator from "../query-dsl-generator";
import OntologyDefinition from "@/ontology/ontology-definition";
import { queryDSLEvaluator } from "./evaluators/query-dsl-evaluator";

describe("Query DSL 생성", () => {
  ls.describe("List queries", () => {
    ls.test.each(formatInputs("userQuery", UserQueryInputs.simpleLookup))(
      "단순 조회 질의",

      async ({ inputs }) => {
        const queryDSLGenerator = new QueryDSLGenerator(OntologyDefinition);
        const queryDSL = await queryDSLGenerator.execute(inputs.userQuery);
        ls.logOutputs({ queryDSL });

        const evaluate = ls.wrapEvaluator(queryDSLEvaluator);
        const evaluation = await evaluate({
          userQuery: inputs.userQuery,
          outputs: queryDSL,
        });

        if (evaluation.score < 0.8) {
          console.warn("Query DSL 생성 평가 기준 미달");
          console.log(JSON.stringify({ evaluation }, null, 2));
        }
      },
      1000000
    );
  });
});
