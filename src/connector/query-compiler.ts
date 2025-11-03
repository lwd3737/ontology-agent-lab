import type { OntologyQueryDSL } from "@/ontology-query/dsl-schema";
import type { PrismaQueryCompileResult } from "./prisma/prisma-client-compiler";

export default interface QueryCompiler {
  compileFromQueryDSL(queryDSL: OntologyQueryDSL): QueryCompileResult;
}

export type QueryCompileResult = PrismaQueryCompileResult;
