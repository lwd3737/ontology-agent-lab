import type { OntologyQueryDSL } from "@/ontology-query/dsl-schema";
import { OntologyToPrismaMapping } from "@/connector/prisma/mapping";

const generatePrismaQueryResultToOntologyPrompt = (
  ontologyContext: string,
  mappingContext: string,
  // queryDSLContext: string,
  prismaResult: any
) => {
  return [
    "Role: Convert Prisma query results to Ontology Instance format",
    "",
    "# Rules",
    "- Translate the Prisma query result to Object Instance of Ontology format",
    // "- If there are joined Prisma model objects in the query result, extract them as Ontology Object Instances as well.",
    // "- If the query result includes a join between Prisma model objects, extract this join as a Link Instance in the Ontology format.",
    "- The 'properties' object should use propertyId as keys (not Prisma field names)",
    "- Convert Date objects to ISO 8601 timestamp strings (YYYY-MM-DDTHH:MM:SS.SSSZ)",
    "",
    // "# Ontology Context",
    // ontologyContext,
    "",
    "# Prisma -> Ontology Mapping",
    mappingContext,
    "",
    // "# Query DSL Context",
    // queryDSLContext,
    "",
    "# Prisma Query Result",
    "- Convert the following Prisma query result to Ontology Instance format:",
    JSON.stringify(prismaResult, null, 2),
  ].join("\n");
};

export const generateMappingContext = (objectType: string): string => {
  const mapping = OntologyToPrismaMapping[objectType];
  if (!mapping) {
    return `No mapping found for objectType: ${objectType}`;
  }

  const mappingLines = Object.entries(mapping.fields).map(
    ([propertyId, fieldMapping]) => {
      return `  - ${fieldMapping.name} → ${propertyId}`;
    }
  );

  return [
    `${mapping.model} -> ${objectType}`,
    `- ObjectType: ${objectType}`,
    `- Prisma Model: ${mapping.model}`,
    "- Field Mappings:",
    ...mappingLines,
  ].join("\n");
};

export const generateQueryDSLContext = (queryDSL: OntologyQueryDSL): string => {
  return JSON.stringify(queryDSL, null, 2);
};

export default generatePrismaQueryResultToOntologyPrompt;
