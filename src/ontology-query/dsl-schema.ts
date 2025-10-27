import { PropertyValueType } from "@/ontology/metadata/ontology-type-schema";
import type { Schema } from "ai";
import { z } from "zod";

export interface OntologyQueryDSL {
  pipeline: PipelineStep[];
}

export interface PipelineStep {
  name: string;
  node: QueryNode;
}

interface SharedQueryNode<QueryType> {
  type: QueryType;
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

const scalarType: z.ZodType<ScalarType> = z.enum([
  PropertyValueType.NUMBER,
  PropertyValueType.STRING,
  PropertyValueType.BOOLEAN,
  PropertyValueType.DATETIME,
  PropertyValueType.ENUM,
]);

const queryFilter: z.ZodType<QueryFilter> = z.object({
  op: z.enum(["eq", "gt", "gte", "lt", "lte"]),
  field: z.string(),
  value: scalarType,
});

const queryNode: z.ZodType<QueryNode> = z.object({
  type: z.enum(["load"]),
  objectType: z.string(),
  filter: queryFilter,
});

export const ontologyQueryDsl: z.ZodType<OntologyQueryDSL> = z.object({
  pipeline: z.array(
    z.object({
      name: z.string(),
      node: queryNode,
    })
  ),
});
