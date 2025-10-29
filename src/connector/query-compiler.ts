import type { OntologyQueryDSL } from "@/ontology-query/dsl-schema";

export default interface QueryCompiler {
  // TODO: Return type should be more specific
  compileFromQueryDSL(queryDSL: OntologyQueryDSL): void;
}
