import type { OntologyQueryDSL } from "@/ontology-query/dsl-schema";
import { OntologyToPrismaMapping, type PrismaFieldsMapping } from "./mapping";
import OntologyDefinition from "@/ontology/ontology-definition";
import type {
  ObjectInstance,
  PropertyValue,
} from "@/ontology/ontology-instance";
import type { Property } from "@/ontology/metadata/ontology-type-schema";
import type {
  PrismaListQueryResult,
  PrismaModelInstance,
  PrismaQueryResult,
} from "./prisma-query-executor";

export interface PipelineStepResult {
  stepName: string;
  objectType: string;
  objectInstances: ObjectInstance[];
}
class PrismaQueryResultToOntologyTranslator {
  translate(
    queryResults: PrismaQueryResult[],
    queryDSL: OntologyQueryDSL
  ): PipelineStepResult[] {
    return queryDSL.pipeline.map((step, index) => {
      const { query } = step;

      const prismaModelMapping = OntologyToPrismaMapping[query.objectType];
      if (!prismaModelMapping) {
        throw new Error(`No mapping found for objectType: ${query.objectType}`);
      }

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
                prismaFieldsMapping: prismaModelMapping.fields,
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
    context: { objectTypeId: string; prismaFieldsMapping: PrismaFieldsMapping }
  ): ObjectInstance[] {
    const { objectTypeId, prismaFieldsMapping } = context;

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

      const primaryKeyField = this.getPrimaryKeyField({
        primaryKeyProperty,
        prismaFieldsMapping,
        modelInstance,
      });
      const properties = this.translateFieldsToProperties(
        modelInstance,
        prismaFieldsMapping
      );

      return {
        rid: primaryKeyField.value,
        objectType: objectTypeId,
        properties,
      };
    });

    return objectInstances;
  }

  private getPrimaryKeyField({
    primaryKeyProperty,
    prismaFieldsMapping,
    modelInstance,
  }: {
    primaryKeyProperty: Property;
    prismaFieldsMapping: PrismaFieldsMapping;
    modelInstance: PrismaModelInstance;
  }): { name: string; value: any } {
    const prismaPrimaryKeyFieldName =
      prismaFieldsMapping[primaryKeyProperty.id].name;
    if (!prismaPrimaryKeyFieldName) {
      throw new Error(
        `No prismaPrimaryKeyFieldName found for propertyId: ${primaryKeyProperty.id}`
      );
    }

    const prismaPrimaryKeyValue = modelInstance[prismaPrimaryKeyFieldName];
    if (!prismaPrimaryKeyValue) {
      throw new Error(
        `No prismaPrimaryKeyValue found for propertyId: ${primaryKeyProperty.id}`
      );
    }

    return {
      name: prismaPrimaryKeyFieldName,
      value: prismaPrimaryKeyValue,
    };
  }

  private translateFieldsToProperties(
    modelInstance: PrismaModelInstance,
    prismaFieldsMapping: PrismaFieldsMapping
  ): Record<string, PropertyValue> {
    return Object.entries<{ [key: string]: any }>(modelInstance).reduce(
      (result, [field, value]) => {
        const fieldMapping = Object.entries(prismaFieldsMapping).find(
          ([propertyId, fieldMapping]) => fieldMapping.name === field
        );
        if (!fieldMapping) {
          throw new Error(`No fieldMapping found for field: ${field}`);
        }

        const propertyId = fieldMapping[0];
        const propertyValue = value;

        result[propertyId] = propertyValue;

        return result;
      },
      {} as Record<string, PropertyValue>
    );
  }
}

export default PrismaQueryResultToOntologyTranslator;
