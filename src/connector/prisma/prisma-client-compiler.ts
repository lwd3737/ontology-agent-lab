import {
  type ListQuery,
  type OntologyQueryDSL,
  type OrderBy,
  type PipelineStep,
  type QueryFilterCondition,
} from "@/ontology-query/dsl-schema";

import type QueryCompiler from "../query-compiler";
import { PrismaSchemaMappingDefinition } from "./schema-mapping/schema-mapping-definition";
import PrismaSchemaMapper from "./schema-mapping/schema-mapper";

export type PrismaQueryCompileResult = {
  type: "prisma";
  pipeline: PrismaQuery[];
};
export interface PrismaQuery {
  model: string;
  queryMethod: string;
  args?: PrismaListQueryArgs;
}
export interface PrismaListQueryArgs {
  select?: SelectClause;
  where?: WhereClause;
  orderBy?: OrderByClause;
}

export interface SelectClause {
  [field: string]: boolean;
}
export interface WhereClause {
  [field: string]: {
    [op: string]: any;
  };
}

interface OrderByClause {
  [field: string]: "asc" | "desc";
}
export default class PrismaClientCompiler implements QueryCompiler {
  private readonly prismaSchemaMapper = new PrismaSchemaMapper(
    PrismaSchemaMappingDefinition
  );

  public compileFromQueryDSL(
    queryDSL: OntologyQueryDSL
  ): PrismaQueryCompileResult {
    return {
      type: "prisma",
      pipeline: queryDSL.pipeline.map(this.buildQuery.bind(this)),
    };
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
    const queryArgs: PrismaListQueryArgs = {};

    if (properties) {
      queryArgs.select = this.buildSelectClause(properties, objectType);
    }
    if (filter) {
      queryArgs.where = this.buildWhereClause(filter, objectType);
    }
    if (orderBy) {
      queryArgs.orderBy = this.buildOrderByClause(orderBy, objectType);
    }

    return {
      model: this.prismaSchemaMapper.getPrismaModel(objectType),
      queryMethod: "findMany",
      args: queryArgs,
    };
  }

  private buildSelectClause(
    properties: string[],
    objectType: string
  ): SelectClause {
    return properties.reduce((result, propertyId) => {
      const prismaField = this.prismaSchemaMapper.getPrismaField(
        objectType,
        propertyId
      );
      return {
        ...result,
        [prismaField.name]: true,
      };
    }, {});
  }

  private buildWhereClause(filter: QueryFilterCondition, objectType: string) {
    const prismaField = this.prismaSchemaMapper.getPrismaField(
      objectType,
      filter.propertyId
    );

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
    objectType: string
  ): OrderByClause {
    return orderBy.fields.reduce((result, field) => {
      const prismaField = this.prismaSchemaMapper.getPrismaField(
        objectType,
        field.field
      );
      return {
        ...result,
        [prismaField.name]: field.direction,
      };
    }, {});
  }
}
