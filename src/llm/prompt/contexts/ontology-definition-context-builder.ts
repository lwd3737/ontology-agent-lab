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
}
