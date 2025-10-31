export interface ObjectInstance {
  rid: string; // Resource ID
  objectType: string; // Object Type ID
  properties: {
    [propertyId: string]: PropertyValue;
  };
}

export type PropertyValue = string | number | boolean | Timestamp | JSONValue;

export type Timestamp = string;

export type JSONValue = Record<string, any>;
