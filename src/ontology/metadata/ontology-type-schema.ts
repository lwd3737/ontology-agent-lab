export interface OntologyDefinition {
  objectTypes: ObjectType[];
  linkTypes: LinkType[];
}

export interface ObjectType {
  id: string;
  displayName: string;
  description?: string;
  properties: Property[];
}

// 비즈니스 속성
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
  TIMESTAMP = "timestamp",
  ENUM = "enum",
  JSON = "json",
}

export interface LinkType {
  id: string;
  objectTypes: [string, string];
  cardinality: [LinkCardinality, LinkCardinality];
  key: LinkForeignKey | LinkJoinTable;
  displayName: [string, string];
  description?: string;
}

interface LinkForeignKey {
  type: "foreignKey";
  side: "left" | "right"; // 외래키가 있는 쪽
  foreignKeyProperty: string;
  primaryKeyProperty: string;
}

interface LinkJoinTable {
  type: "joinTable";
  leftPrimaryKeyProperty: string;
  rightPrimaryKeyProperty: string;
}

export enum LinkCardinality {
  ONE = "one",
  MANY = "many",
}
