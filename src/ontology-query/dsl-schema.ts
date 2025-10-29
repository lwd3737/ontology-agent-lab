import { PropertyValueType } from "@/ontology/metadata/ontology-type-schema";
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

// validation schema
const ScalarTypeSchema: z.ZodType<ScalarType> = z
  .enum([
    PropertyValueType.NUMBER,
    PropertyValueType.STRING,
    PropertyValueType.BOOLEAN,
    PropertyValueType.DATETIME,
    PropertyValueType.ENUM,
  ])
  .describe("The type of the scalar value for property.");

const QueryFilterSchema: z.ZodType<QueryFilter> = z.object({
  op: z
    .enum(["eq", "gt", "gte", "lt", "lte"])
    .describe("The operator to use for the filter."),
  field: z
    .string()
    .describe(
      "The name of the property of the ontology object type to filter."
    ),
  value: ScalarTypeSchema.describe(
    "The value of the property to filter the records."
  ),
});

const QueryNodeSchema: z.ZodType<QueryNode> = z.object({
  type: z.enum(["load"]).describe("The type of the query node."),
  objectType: z.string().describe("The ontology object type to query."),
  filter: QueryFilterSchema.describe("WHERE conditions to filter records"),
});

const PipelineStepSchema: z.ZodType<PipelineStep> = z.object({
  name: z
    .string()
    .describe(
      "Unique pipeline step name. The name should express the meaning of the query step."
    ),
  node: QueryNodeSchema.describe("Query configuration for this step."),
});

export const OntologyQueryDslSchema: z.ZodType<OntologyQueryDSL> = z.object({
  pipeline: z
    .array(
      PipelineStepSchema.describe(
        "Single pipeline step containing a query node"
      )
    )
    .describe(
      "The pipeline of the query DSL. The pipeline is a list of steps that are executed sequentially."
    ),
});
