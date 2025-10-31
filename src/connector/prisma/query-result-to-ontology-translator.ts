import type { OntologyQueryDSL } from "@/ontology-query/dsl-schema";
import { OntologyToPrismaMapping, type PrismaFieldsMapping } from "./mapping";
import OntologyDefinition from "@/ontology/ontology-definition";
import type { PropertyValue } from "@/ontology/ontology-instance";
import type { Property } from "@/ontology/metadata/ontology-type-schema";

class PrismaQueryResultToOntologyTranslator {
  translate(queryResult: any, queryDSL: OntologyQueryDSL) {
    queryDSL.pipeline.map((step) => {
      const { query } = step;

      const prismaModelMapping = OntologyToPrismaMapping[query.objectType];
      if (!prismaModelMapping) {
        throw new Error(`No mapping found for objectType: ${query.objectType}`);
      }

      switch (query.type) {
        case "list":
          return this.translateListQueryResultToObjectInstances(queryResult, {
            objectTypeId: query.objectType,
            prismaFieldsMapping: prismaModelMapping.fields,
          });
        default:
          throw new Error(`Unsupported query type: ${query.type}`);
      }
    });
  }

  private translateListQueryResultToObjectInstances(
    queryResult: any,
    context: { objectTypeId: string; prismaFieldsMapping: PrismaFieldsMapping }
  ) {
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
      const properties = this.translateFieldsToProperties({
        modelInstance,
        primaryKeyField,
        prismaFieldsMapping,
      });

      return {
        rid: primaryKeyField.value,
        objectType: objectTypeId,
        properties: {
          [primaryKeyProperty.id]: primaryKeyField.value,
          ...properties,
        },
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
    modelInstance: any;
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

  private translateFieldsToProperties({
    modelInstance,
    primaryKeyField,
    prismaFieldsMapping,
  }: {
    modelInstance: any;
    primaryKeyField: { name: string; value: any };
    prismaFieldsMapping: PrismaFieldsMapping;
  }): Record<string, PropertyValue> {
    return Object.entries<{ [key: string]: any }>(modelInstance).reduce(
      (result, [field, value]) => {
        if (field === primaryKeyField.name) {
          return result;
        }

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
