import type OntologyDefinition from "@/ontology/ontology-definition";
import PromptBuilder from "../helpers/prompt-builder";

export default class OntologyDefinitionContextBuilder {
  private readonly promptBuilder = new PromptBuilder();

  constructor(private readonly ontology: OntologyDefinition) {}

  public build(filter?: {
    objectTypeIds?: string[];
    linkTypeIds?: string[];
  }): string {
    const objectTypes = this.buildObjectTypesContext(filter?.objectTypeIds);
    const linkTypes = this.buildLinkTypesContext(filter?.linkTypeIds);

    // return [
    //   "# Ontology Definition",
    //   "",
    //   "objectTypes",
    //   this.indent(objectTypes, 1),
    //   "",
    //   "linkTypes",
    //   this.indent(linkTypes, 1),
    // ].join("\n");
    return this.promptBuilder
      .section("Ontology Definition")
      .newLine()
      .subSection("Object Types")
      .text(objectTypes)
      .newLine()
      .subSection("Link Types")
      .text(linkTypes)
      .build();
  }

  private buildObjectTypesContext(objectTypeIds?: string[]): string {
    const targetObjectTypes = objectTypeIds
      ? this.ontology.objectTypes.filter((objectType) =>
          objectTypeIds.some((objectTypeId) => objectTypeId === objectType.id)
        )
      : this.ontology.objectTypes;
    // const blocks = targetObjectTypes.map((objectType) => {
    //   const properties = objectType.properties
    //     .map((property) => {
    //       const lines = [
    //         `- id: ${property.id}`,
    //         `  displayName: ${property.displayName}`,
    //         `  type: ${property.type}`,
    //         `  required: ${property.required}`,
    //       ];
    //       if (property.primaryKey) {
    //         lines.push(`  primaryKey: ${property.primaryKey}`);
    //       }

    //       return lines.join("\n");
    //     })
    //     .join("\n");

    //   const blockLines = [
    //     `- id: ${objectType.id}`,
    //     `  displayName: ${objectType.displayName}`,
    //     `  properties:`,
    //     this.indent(properties, 2),
    //   ];
    //   if (objectType.description) {
    //     blockLines.push(`  description: ${objectType.description}`);
    //   }

    //   return blockLines.join("\n");
    // });

    // return blocks.join("\n");
    return this.promptBuilder
      .yaml(
        targetObjectTypes.map((objectType) => ({
          id: objectType.id,
          displayName: objectType.displayName,
          description: objectType.description,
          properties: objectType.properties.map((property) => ({
            id: property.id,
            displayName: property.displayName,
            type: property.type,
            required: property.required,
            primaryKey: property.primaryKey,
          })),
        }))
      )
      .build();
  }

  private buildLinkTypesContext(linkTypeIds?: string[]): string {
    const targetLinkTypes = linkTypeIds
      ? this.ontology.linkTypes.filter((linkType) =>
          linkTypeIds.some((linkTypeId) => linkTypeId === linkType.id)
        )
      : this.ontology.linkTypes;
    // const blocks = targetLinkTypes.map((linkType) => {
    //   const key =
    //     linkType.key.type === "foreignKey"
    //       ? [
    //           `- type: foreignKey`,
    //           `  side: ${linkType.key.side}`,
    //           `  foreignKeyProperty: ${linkType.key.foreignKeyProperty}`,
    //           `  primaryKeyProperty: ${linkType.key.primaryKeyProperty}`,
    //         ].join("\n")
    //       : [
    //           `- type: joinTable`,
    //           `  leftPrimaryKeyProperty: ${linkType.key.leftPrimaryKeyProperty}`,
    //           `  rightPrimaryKeyProperty: ${linkType.key.rightPrimaryKeyProperty}`,
    //         ].join("\n");
    //   const lines = [
    //     `- id: ${linkType.id}`,
    //     `  objectTypes: ${linkType.objectTypes.join(", ")}`,
    //     `  cardinality: ${linkType.cardinality.join(", ")}`,
    //     `  key:`,
    //     this.indent(key, 2),
    //     `  displayName: ${linkType.displayName.join(", ")}`,
    //   ];
    //   if (linkType.description) {
    //     lines.push(`  description: ${linkType.description}`);
    //   }

    //   return lines.join("\n");
    // });

    // return blocks.join("\n");

    return this.promptBuilder
      .yaml(
        targetLinkTypes.map((linkType) => ({
          id: linkType.id,
          objectTypes: linkType.objectTypes,
          displayName: linkType.displayName,
          description: linkType.description,
          cardinality: linkType.cardinality,
          key: linkType.key,
        }))
      )
      .build();
  }

  // private indent(text: string, level: number) {
  //   const pad = "  ".repeat(level);
  //   return text
  //     .split("\n")
  //     .map((line) => (line.length > 0 ? pad + line : line))
  //     .join("\n");
  // }
}
