import type { PrismaQueryCompileResult } from "@/connector/prisma/prisma-client-compiler";
import type { OntologyQueryDSL } from "@/ontology-query/dsl-schema";
import { describe } from "vitest";
import { formatDataset } from "./dataset/helpers";
import * as ls from "langsmith/vitest";
import QueryDSLDataset from "./dataset/query-dsl";
import PrismaQueryDataset from "./dataset/prisma-query";
import PrismaClientCompiler from "@/connector/prisma/prisma-client-compiler";
import { prismaClientCompilerEvaluator } from "./evaluators/prisma-client-compiler-evaluator";

describe("PrismaClientCompiler", () => {
  describe("List queries", () => {
    ls.test.each(
      formatDataset<
        { queryDSL: OntologyQueryDSL },
        { prismaQueries: PrismaQueryCompileResult }
      >(
        { queryDSL: QueryDSLDataset.simpleLookup },
        { prismaQueries: PrismaQueryDataset.simpleLookup }
      )
    )(
      "단순 조회하는 Query DSL 컴파일 성공",

      async ({ inputs, referenceOutputs }) => {
        const compiler = new PrismaClientCompiler();
        const compiledResult = compiler.compileFromQueryDSL(
          inputs.queryDSL as OntologyQueryDSL
        );

        const evaluate = ls.wrapEvaluator(prismaClientCompilerEvaluator);
        ls.logOutputs({ compiledQuery: compiledResult });

        const evaluation = await evaluate({
          output: compiledResult.pipeline,
          expected: referenceOutputs!.prismaQueries.pipeline,
        });

        if (evaluation.score < 1) {
          console.warn("Prisma Query 컴파일 평가 기준 미달");
          console.log(JSON.stringify({ evaluation }, null, 2));
        }
      }
    );
  });
});
