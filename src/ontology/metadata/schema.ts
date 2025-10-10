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
  objectTypes: [string, string];
  cardinality: [LinkCardinality, LinkCardinality];
  key:
    | {
        type: "foreignKey";
        side: "left" | "right";
        foreignKeyProperty: string;
        primaryKeyProperty: string;
      }
    | {
        type: "joinTable";
        leftSideForeignKeyProperty: string;
        rightSideForeignKeyProperty: string;
      };
  displayName: [string, string];
  pluralDisplayName?: [string | null, string | null];
  description?: [string | null, string | null];
}

export enum LinkCardinality {
  ONE = "one",
  MANY = "many",
}
