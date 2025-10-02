export interface OntologyMetadataSchema {
  objectTypes: ObjectType[];
}

export interface ObjectType {
  id: string;
  displayName: string;
  description: string;
  properties: PropertyDefinition[];
}

export interface PropertyDefinition {
  id: string;
  displayName: string;
  description: string;
  type: PropertyScalarType;
  required: boolean;
  defaultValue?: PropertyScalarType;
  enumValues?: { value: string; description: string }[];
}

export enum PropertyScalarType {
  STRING = "string",
  NUMBER = "number",
  BOOLEAN = "boolean",
  DATETIME = "datetime",
  ENUM = "enum",
  JSON = "json",
}

export interface LinkType {
  id: string;
  displayName: string;
  description: string;
  from: string;
  to: string;
  cardinality: LinkCardinality;
}

export enum LinkCardinality {
  ONE_TO_ONE = "one_to_one",
  ONE_TO_MANY = "one_to_many",
  MANY_TO_ONE = "many_to_one",
  MANY_TO_MANY = "many_to_many",
}
