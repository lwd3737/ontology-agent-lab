import type { ObjectType } from "@/ontology/metadata/ontology-type-schema";
import type { PrismaModelInstance } from "../prisma-query-executor";
import type {
  PrismaFieldsMappingDefinition,
  PrismaSchemaMappingDefinition,
} from "./schema-mapping-definition";
import OntologyDefinition from "@/ontology/ontology-definition";
import type { PropertyValue } from "@/ontology/ontology-instance";

type PrismaFieldMapping = PrismaFieldsMappingDefinition[string];

type OntologyProperties = Record<string, PropertyValue>;
export default class PrismaSchemaMapper {
  constructor(
    private readonly schemaMappingDefinition: PrismaSchemaMappingDefinition,
    private readonly ontologyDefinition: OntologyDefinition
  ) {}

  public mapToPrismaModel(objectType: string): string {
    const { model } = this.schemaMappingDefinition[objectType];
    if (!model) {
      throw new Error(`No model found for object type: ${objectType}`);
    }
    return model;
  }

  public mapToPrismaField(
    objectType: string,
    propertyId: string
  ): PrismaFieldMapping {
    const { fields } = this.schemaMappingDefinition[objectType];
    if (!fields) {
      throw new Error(`No fields found for object type: ${objectType}`);
    }
    const field = fields[propertyId];
    if (!field) {
      throw new Error(`No name found for property id: ${propertyId}`);
    }
    return field;
  }

  public mapToPrismaPrimaryKeyField(
    objectTypeId: string,
    modelInstance: PrismaModelInstance
  ): { name: string; value: any } {
    const objectType = this.getObjectType(objectTypeId);

    const primaryKeyProperty = objectType.properties.find(
      (property) => property.primaryKey === true
    );
    if (!primaryKeyProperty) {
      throw new Error(
        `No primary key property found for object type: ${objectTypeId}`
      );
    }

    const field = this.mapToPrismaField(objectTypeId, primaryKeyProperty.id);
    if (!field) {
      throw new Error(
        `No field found for property id: ${primaryKeyProperty.id}`
      );
    }

    const value = modelInstance[field.name];
    if (!value) {
      throw new Error(`No value found for field: ${field.name}`);
    }

    return {
      name: field.name,
      value: value,
    };
  }

  public mapToOntologyProperties(
    modelInstance: PrismaModelInstance,
    objectTypeId: string
  ): OntologyProperties {
    const objectType = this.getObjectType(objectTypeId);

    return Object.entries(modelInstance).reduce(
      (result, [fieldName, fieldValue]) => {
        const property = objectType.properties.find(
          (property) => property.id === fieldName
        );
        if (!property) {
          throw new Error(`No property found for field name: ${fieldName}`);
        }

        result[property.id] = fieldValue;
        return result;
      },
      {} as OntologyProperties
    );
  }

  private getObjectType(objectTypeId: string): ObjectType {
    const objectType = this.ontologyDefinition.objectTypes.find(
      (objectType) => objectType.id === objectTypeId
    );
    if (!objectType) {
      throw new Error(`No object type found for id: ${objectTypeId}`);
    }
    return objectType;
  }
}
