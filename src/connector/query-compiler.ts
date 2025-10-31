import type { OntologyQueryDSL } from "@/ontology-query/dsl-schema";

export default interface QueryCompiler {
  compileFromQueryDSL(queryDSL: OntologyQueryDSL): any;
}
