import { z } from "zod";
import type {
  ObjectInstance,
  PropertyValue,
} from "@/ontology/ontology-instance";

// PropertyValue 스키마
const PropertyValueSchema: z.ZodType<PropertyValue> = z
  .union([
    z.string(),
    z.number(),
    z.boolean(),
    z.string().describe("ISO 8601 format timestamp (YYYY-MM-DDTHH:MM:SS.SSSZ)"),
    z.record(z.string(), z.any()).describe("JSON object value"),
  ])
  .describe(
    "Property value can be string, number, boolean, timestamp, or JSON object"
  );

// ObjectInstance 스키마
export const ObjectInstanceSchema: z.ZodType<ObjectInstance> = z.object({
  id: z.string().describe("The primary key value of the object instance"),
  objectType: z
    .string()
    .describe("The ontology object type id this instance belongs to"),
  properties: z
    .record(z.string(), PropertyValueSchema)
    .describe(
      "Object properties mapped by propertyId. Each propertyId corresponds to an ontology property."
    ),
});

export const ObjectInstanceSetSchema: z.ZodType<ObjectInstance[]> = z
  .array(ObjectInstanceSchema)
  .describe("Array of ObjectInstance objects");
