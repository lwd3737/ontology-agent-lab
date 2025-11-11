import {
  ObjectType,
  PropertyValueType,
} from "@/ontology/metadata/ontology-type-schema";
import type { PrismaModelInstance } from "../prisma-query-executor";
import { PrismaSchemaMappingDefinition } from "./schema-mapping-definition";
import OntologyDefinition from "@/ontology/ontology-definition";
import type { PropertyValue } from "@/ontology/ontology-instance";

type PrismaField = {
  name: string;
  value: any;
};

type OntologyProperties = Record<string, PropertyValue>;
export default class PrismaSchemaMapper {
  public static create(): PrismaSchemaMapper {
    return new PrismaSchemaMapper(
      PrismaSchemaMappingDefinition,
      OntologyDefinition
    );
  }

  constructor(
    private readonly schemaMappingDefinition: PrismaSchemaMappingDefinition,
    private readonly ontologyDefinition: OntologyDefinition
  ) {}

  public mapToPrismaModel(objectTypeId: string): string {
    const { model } = this.schemaMappingDefinition[objectTypeId];
    if (!model) {
      throw new Error(`No model found for object type: ${objectTypeId}`);
    }
    return model;
  }

  public mapToPrismaFieldName(
    objectTypeId: string,
    propertyId: string
  ): string {
    const { fields } = this.schemaMappingDefinition[objectTypeId];
    if (!fields) {
      throw new Error(`No fields found for object type: ${objectTypeId}`);
    }
    const field = fields[propertyId];
    if (!field) {
      throw new Error(`No name found for property id: ${propertyId}`);
    }
    return field.name;
  }

  public mapToPrismaField(
    objectTypeId: string,
    propertyId: string,
    modelInstance: PrismaModelInstance
  ): PrismaField {
    const fieldName = this.mapToPrismaFieldName(objectTypeId, propertyId);
    if (!fieldName) {
      throw new Error(`No field name found for property id: ${propertyId}`);
    }
    const value = modelInstance[fieldName];
    if (!value) {
      throw new Error(`No value found for field: ${fieldName}`);
    }

    const propertyType = this.getPropertyType(objectTypeId, propertyId);

    return {
      name: fieldName,
      value: this.normalizePrismaValue(value, propertyType),
    };
  }

  public mapToPrismaPrimaryKeyField(
    objectTypeId: string,
    modelInstance: PrismaModelInstance
  ): { name: string; value: any } {
    const fieldName = this.mapToPrismaPrimaryKeyName(objectTypeId);

    const value = modelInstance[fieldName];
    if (!value) {
      throw new Error(`No value found for field: ${fieldName}`);
    }

    const propertyType = this.getPropertyType(objectTypeId, fieldName);

    return {
      name: fieldName,
      value: this.normalizePrismaValue(value, propertyType),
    };
  }

  public mapToPrismaPrimaryKeyName(objectTypeId: string): string {
    const objectType = this.getObjectType(objectTypeId);

    const primaryKeyProperty = objectType.properties.find(
      (property) => property.primaryKey === true
    );
    if (!primaryKeyProperty) {
      throw new Error(
        `No primary key property found for object type: ${objectTypeId}`
      );
    }

    const fieldName = this.mapToPrismaFieldName(
      objectTypeId,
      primaryKeyProperty.id
    );
    if (!fieldName) {
      throw new Error(
        `No field found for property id: ${primaryKeyProperty.id}`
      );
    }

    return fieldName;
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

  private getPropertyType(
    objectTypeId: string,
    propertyId: string
  ): PropertyValueType {
    const objectType = this.getObjectType(objectTypeId);
    const property = objectType.properties.find(
      (property) => property.id === propertyId
    );
    if (!property) {
      throw new Error(`No property found for id: ${propertyId}`);
    }
    return property.type;
  }

  private normalizePrismaValue(value: any, propertyType: PropertyValueType) {
    switch (propertyType) {
      case PropertyValueType.STRING:
        return String(value);
      case PropertyValueType.NUMBER:
        return Number(value);
      case PropertyValueType.BOOLEAN:
        return Boolean(value);
      case PropertyValueType.TIMESTAMP:
        return new Date(value).toISOString();
      case PropertyValueType.ENUM:
        return value;
      case PropertyValueType.JSON:
        return JSON.parse(value);
      default:
        throw new Error(`Unsupported property type: ${propertyType}`);
    }
  }
}
