import { describe } from "vitest";
import * as ls from "langsmith/vitest";
import type { PrismaListQueryResult } from "@/connector/prisma/prisma-query-executor";
import type { OntologyQueryDSL } from "@/ontology-query/dsl-schema";
import PrismaQueriesResultTranslator from "@/connector/prisma/prisma-queries-result-translator";
import { formatDataset } from "./dataset/helpers";
import PrismaQueriesResultDataset from "./dataset/prisma-queries-result";
import QueryDSLDataset from "./dataset/query-dsl";
import prismaQueriesResultTranslationEvaluator from "./evaluators/prisma-queries-result-translation-evaluator";

describe("PrismaQueriesResultTranslator", () => {
  describe("Prisma Query 결과를 Ontology Instance로 변환", () => {
    ls.describe("List queries", () => {
      ls.test.each(
        formatDataset<{
          prismaQueriesResults: PrismaListQueryResult[][];
          queryDSL: OntologyQueryDSL[];
        }>({
          prismaQueriesResults: PrismaQueriesResultDataset.simpleLookup,
          queryDSL: QueryDSLDataset.simpleLookup,
        })
      )(
        "단순 Query 결과 변환 성공",

        async ({ inputs }) => {
          const translator = new PrismaQueriesResultTranslator();

          const pipelineResult = translator.translateToOntology(
            inputs.prismaQueriesResults,
            inputs.queryDSL
          );

          ls.logOutputs({ pipelineResult });
          const evaluate = ls.wrapEvaluator(
            prismaQueriesResultTranslationEvaluator
          );
          const evaluation = await evaluate({
            inputs: {
              queryDSL: inputs.queryDSL,
              queriesResult: inputs.prismaQueriesResults,
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
