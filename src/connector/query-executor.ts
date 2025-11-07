import type { PrismaQuery } from "./prisma/prisma-client-compiler";
import { executePrismaQueries } from "./prisma/prisma-query-executor";
import PrismaQueriesResultTranslator from "./prisma/prisma-queries-result-translator";
import type { OntologyQueryDSL } from "@/ontology-query/dsl-schema";

export type Query = PrismaQuery;

export const executeQueriesThenTranslateToOntology = async (
  type: string,
  queries: Query[],
  queryDSL: OntologyQueryDSL
) => {
  switch (type) {
    case "prisma": {
      const queryResults = await executePrismaQueries(queries as PrismaQuery[]);
      const translator = new PrismaQueriesResultTranslator();
      return translator.translateToOntology(queryResults, queryDSL);
    }

    default:
      throw new Error(`Unsupported query type: ${type}`);
  }
};
