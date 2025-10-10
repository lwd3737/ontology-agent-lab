export interface OntologyMetadataSchema {
  objectTypes: ObjectType[];
}

export interface ObjectType {
  id: string;
  displayName: string;
  description?: string;
  properties: Property[];
}

export interface Property {
  id: string;
  primaryKey?: boolean;
  type: PropertyValueType;
  displayName: string;
  description?: string;
  required: boolean;
}

export enum PropertyValueType {
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
