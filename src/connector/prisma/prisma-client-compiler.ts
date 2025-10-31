import {
  type ListQuery,
  type OntologyQueryDSL,
  type OrderBy,
  type PipelineStep,
  type QueryFilterCondition,
} from "@/ontology-query/dsl-schema";

import type QueryCompiler from "../query-compiler";
import { OntologyToPrismaMapping, type PrismaFieldsMapping } from "./mapping";

export interface PrismaQuery {
  model: string;
  queryMethod: string;
  args?: PrismaQueryArgs;
}
interface PrismaQueryArgs {
  select?: SelectClause;
  where?: WhereClause;
  orderBy?: OrderByClause;
}

interface SelectClause {
  [field: string]: boolean;
}
interface WhereClause {
  [field: string]: {
    [op: string]: any;
  };
}

interface OrderByClause {
  [field: string]: "asc" | "desc";
}
export default class PrismaClientCompiler implements QueryCompiler {
  public compileFromQueryDSL(queryDSL: OntologyQueryDSL): PrismaQuery[] {
    return queryDSL.pipeline.map(this.buildQuery.bind(this));
  }

  private buildQuery(step: PipelineStep) {
    switch (step.query.type) {
      case "list":
        return this.buildListQuery(step.query);
      default:
        throw new Error(`Unsupported query node type: ${step.query.type}`);
    }
  }

  private buildListQuery({
    objectType,
    properties,
    filter,
    orderBy,
  }: ListQuery): PrismaQuery {
    const prismaModelMapping = OntologyToPrismaMapping[objectType];
    if (!prismaModelMapping) {
      throw new Error(`No prisma mapping found for object type: ${objectType}`);
    }

    const queryArgs: PrismaQueryArgs = {};

    if (properties) {
      queryArgs.select = this.buildSelectClause(
        properties,
        prismaModelMapping.fields
      );
    }
    if (filter) {
      queryArgs.where = this.buildWhereClause(
        filter,
        prismaModelMapping.fields
      );
    }
    if (orderBy) {
      queryArgs.orderBy = this.buildOrderByClause(
        orderBy,
        prismaModelMapping.fields
      );
    }

    return {
      model: prismaModelMapping.model,
      queryMethod: "findMany",
      args: queryArgs,
    };
  }

  private buildSelectClause(
    properties: string[],
    fieldsMapping: PrismaFieldsMapping
  ): SelectClause {
    return properties.reduce(
      (result, propertyId) => ({
        ...result,
        [fieldsMapping[propertyId].name]: true,
      }),
      {}
    );
  }

  private buildWhereClause(
    filter: QueryFilterCondition,
    fieldsMapping: PrismaFieldsMapping
  ) {
    const prismaField = fieldsMapping[filter.propertyId];
    if (!prismaField) {
      throw new Error(`No prisma field found for field: ${filter.propertyId}`);
    }

    switch (filter.type) {
      case "eq":
      case "gt":
      case "gte":
      case "lt":
      case "lte":
        return {
          [prismaField.name]: {
            [filter.type]: filter.value,
          },
        };
      default:
        throw new Error(`Unsupported filter operator: ${filter.type}`);
    }
  }

  private buildOrderByClause(
    orderBy: OrderBy,
    fieldsMapping: PrismaFieldsMapping
  ): OrderByClause {
    return orderBy.fields.reduce(
      (result, field) => ({
        ...result,
        [fieldsMapping[field.field].name]: field.direction,
      }),
      {}
    );
  }

  // private getPropertyId(field: string): string {
  //   const fieldChunks = field.split(".");
  //   if (fieldChunks.length > 1 && fieldChunks[0] === "properties") {
  //     return fieldChunks[1];
  //   }
  //   throw new Error(`No property id found for field: ${field}`);
  // }
}
