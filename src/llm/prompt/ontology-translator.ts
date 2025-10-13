import type OntologyDefinition from "@/ontology/definition";

export default class OntologyTranslator {
  constructor(private readonly ontology: OntologyDefinition) {}

  public translate(): string {
    const objectTypes = this.translateObjectTypes();
    const linkTypes = this.translateLinkTypes();

    return [
      "# Ontology Definition",
      "",
      "objectTypes",
      this.indent(objectTypes, 1),
      "",
      "linkTypes",
      this.indent(linkTypes, 1),
    ].join("\n");
  }

  private translateObjectTypes(): string {
    const blocks = this.ontology.objectTypes.map((objectType) => {
      const properties = objectType.properties
        .map((property) => {
          const lines = [
            `- id: ${property.id}`,
            `  displayName: ${property.displayName}`,
            `  type: ${property.type}`,
            `  required: ${property.required}`,
          ];
          if (property.primaryKey) {
            lines.push(` primaryKey: ${property.primaryKey}`);
          }

          return lines.join("\n");
        })
        .join("\n");

      const blockLines = [
        `- id: ${objectType.id}`,
        `  displayName: ${objectType.displayName}`,
        `  properties:`,
        this.indent(properties, 2),
      ];
      if (objectType.description) {
        blockLines.push(`  description: ${objectType.description}`);
      }

      return blockLines.join("\n");
    });

    return blocks.join("\n");
  }

  private translateLinkTypes(): string {
    const blocks = this.ontology.linkTypes.map((linkType) => {
      const key =
        linkType.key.type === "foreignKey"
          ? [
              `- type: foreignKey`,
              `  side: ${linkType.key.side}`,
              `  foreignKeyProperty: ${linkType.key.foreignKeyProperty}`,
              `  primaryKeyProperty: ${linkType.key.primaryKeyProperty}`,
            ].join("\n")
          : [
              `- type: joinTable`,
              `  leftPrimaryKeyProperty: ${linkType.key.leftPrimaryKeyProperty}`,
              `  rightPrimaryKeyProperty: ${linkType.key.rightPrimaryKeyProperty}`,
            ].join("\n");
      const lines = [
        `- id: ${linkType.id}`,
        `  objectTypes: ${linkType.objectTypes.join(", ")}`,
        `  cardinality: ${linkType.cardinality.join(", ")}`,
        `  key:`,
        this.indent(key, 2),
        `  displayName: ${linkType.displayName.join(", ")}`,
      ];
      if (linkType.description) {
        lines.push(`  description: ${linkType.description}`);
      }

      return lines.join("\n");
    });

    return blocks.join("\n");
  }

  private indent(text: string, level: number) {
    const pad = "  ".repeat(level);
    return text
      .split("\n")
      .map((line) => (line.length > 0 ? pad + line : line))
      .join("\n");
  }
}
