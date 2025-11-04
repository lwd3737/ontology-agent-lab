import type { OntologyQueryDSL } from "@/ontology-query/dsl-schema";
import { PrismaSchemaMappingDefinition } from "./schema-mapping/schema-mapping-definition";
import OntologyDefinition from "@/ontology/ontology-definition";
import type { ObjectInstance } from "@/ontology/ontology-instance";
import type {
  PrismaListQueryResult,
  PrismaQueryResult,
} from "./prisma-query-executor";
import PrismaSchemaMapper from "./schema-mapping/schema-mapper";

export interface PipelineStepResult {
  stepName: string;
  objectType: string;
  objectInstances: ObjectInstance[];
}
class PrismaQueryResultToOntologyTranslator {
  private readonly prismaSchemaMapper = new PrismaSchemaMapper(
    PrismaSchemaMappingDefinition,
    OntologyDefinition
  );

  public translate(
    queryResults: PrismaQueryResult[],
    queryDSL: OntologyQueryDSL
  ): PipelineStepResult[] {
    return queryDSL.pipeline.map((step, index) => {
      const { query } = step;
      const queryResult = queryResults[index];

      switch (query.type) {
        case "list":
          return {
            stepName: step.name,
            objectType: query.objectType,
            objectInstances: this.translateListQueryResultToObjectInstances(
              queryResult,
              {
                objectTypeId: query.objectType,
              }
            ),
          };
        default:
          throw new Error(`Unsupported query type: ${query.type}`);
      }
    });
  }

  private translateListQueryResultToObjectInstances(
    queryResult: PrismaListQueryResult,
    context: {
      objectTypeId: string;
    }
  ): ObjectInstance[] {
    const { objectTypeId } = context;

    const objectInstances = queryResult.map((modelInstance) => {
      const objectType = OntologyDefinition.objectTypes.find(
        (objectType) => objectType.id === objectTypeId
      );
      if (!objectType) {
        throw new Error(`No objectType found for id: ${objectTypeId}`);
      }

      const primaryKeyProperty = objectType.properties.find(
        (property) => property.primaryKey === true
      );
      if (!primaryKeyProperty) {
        throw new Error(
          `No primaryKey property found for objectType: ${objectTypeId}`
        );
      }

      const primaryKeyField =
        this.prismaSchemaMapper.mapToPrismaPrimaryKeyField(
          objectTypeId,
          modelInstance
        );
      const properties = this.prismaSchemaMapper.mapToOntologyProperties(
        modelInstance,
        objectTypeId
      );

      return {
        rid: primaryKeyField.value,
        objectType: objectTypeId,
        properties,
      };
    });

    return objectInstances;
  }
}

export default PrismaQueryResultToOntologyTranslator;
