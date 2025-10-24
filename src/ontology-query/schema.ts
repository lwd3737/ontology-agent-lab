import { PropertyValueType } from "@/ontology/metadata/ontology-type-schema";

export interface OntologyQueryDSL {
  pipeline: PipelineStep[];
}

export interface PipelineStep {
  name: string;
  node: QueryNode;
}

interface SharedQueryNode<Type> {
  type: Type;
  objectType: string;
  filter: QueryFilter;
}

export type QueryNode = LoadQueryNode;

export interface LoadQueryNode extends SharedQueryNode<"load"> {
  select?: string[];
  orderBy?: {
    fields: string[];
  };
}

export type QueryFilter = CompareOperator;

export interface CompareOperator {
  op: "eq" | "gt" | "gte" | "lt" | "lte";
  field: string;
  value: ScalarType;
}

export type ScalarType =
  | PropertyValueType.NUMBER
  | PropertyValueType.STRING
  | PropertyValueType.BOOLEAN
  | PropertyValueType.DATETIME
  | PropertyValueType.ENUM;
