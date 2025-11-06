import OntologyDefinition from "@/ontology/ontology-definition";
import { describe, expect, it } from "vitest";
import OntologyDefinitionContextBuilder from "../ontology-definition-context-builder.js";

describe("OntologyTranslator", () => {
  it("should translate ontology definition", () => {
    const translator = new OntologyDefinitionContextBuilder(OntologyDefinition);
    const prompt = translator.build();

    console.log(prompt);

    expect(prompt).toBeDefined();
  });
});
