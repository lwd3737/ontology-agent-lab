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
  filter?: QueryFilterCondition;
}

export type QueryNode = ListQueryNode;

export interface ListQueryNode extends SharedQueryNode<"list"> {
  properties?: string[];
  orderBy?: OrderBy;
}

export type QueryFilterCondition = CompareOperator;

export interface CompareOperator {
  type: "eq" | "gt" | "gte" | "lt" | "lte";
  // field: string;
  propertyId: string;
  value: ScalarType;
}

export interface OrderBy {
  fields: { field: string; direction: "asc" | "desc" }[];
}

export type ScalarType = number | string | boolean | Timestamp;

export type Timestamp = string; // ISO 8601 format (YYYY-MM-DDTHH:MM:SS.SSSZ)

// validation schema
const ScalarTypeSchema: z.ZodType<ScalarType> = z
  .union([
    z.number(),
    z.string(),
    z.boolean(),
    z.string().describe("ISO 8601 format (YYYY-MM-DDTHH:MM:SS.SSSZ)"),
  ])
  .describe("The type of the scalar value for property.");

const QueryFilterSchema: z.ZodType<QueryFilterCondition> = z.object({
  type: z
    .enum(["eq", "gt", "gte", "lt", "lte"])
    .describe("The operator to use for the filter."),
  propertyId: z.string().describe("The id of the property to filter."),
  // field: z
  //   .string()
  //   .describe(
  //     "The name of field of the ontology object type to filter. The name should be in the format of 'properties.<propertyId>'."
  //   ),
  value: ScalarTypeSchema.describe(
    "The value of the property to filter the records."
  ),
});

const OrderBySchema: z.ZodType<OrderBy> = z.object({
  fields: z
    .array(
      z.object({
        field: z.string().describe("The field to order by."),
        direction: z
          .enum(["asc", "desc"])
          .describe("The direction to order by."),
      })
    )
    .describe("ORDER BY conditions to sort records"),
});

const SharedQueryNodeSchema = z.object({
  // type: z.enum(QueryNodeType).describe("The type of the query node."),
  objectType: z.string().describe("The ontology object type to query."),
  properties: z
    .array(z.string())
    .optional()
    .describe("The properties to query."),
  filter: QueryFilterSchema.optional().describe(
    "WHERE conditions to filter records"
  ),
});

const ListQueryNodeSchema: z.ZodType<ListQueryNode> =
  SharedQueryNodeSchema.extend({
    type: z.enum(["list"]),
    orderBy: OrderBySchema.optional().describe(
      "ORDER BY conditions to sort records"
    ),
  });

const PipelineStepSchema: z.ZodType<PipelineStep> = z.object({
  name: z
    .string()
    .describe(
      "Unique pipeline step name. The name should express the meaning of the query step."
    ),
  node: z.union([
    ListQueryNodeSchema.describe("Query configuration for this step."),
  ]),
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
