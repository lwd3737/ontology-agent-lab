import OntologyDefinition from "@/ontology/ontology-definition";
import { describe, expect, it } from "vitest";
import OntologyDescriptionGenerator from "../ontology-description-generator";

describe("OntologyTranslator", () => {
  it("should translate ontology definition", () => {
    const translator = new OntologyDescriptionGenerator(OntologyDefinition);
    const prompt = translator.describe();

    console.log(prompt);

    expect(prompt).toBeDefined();
  });
});
