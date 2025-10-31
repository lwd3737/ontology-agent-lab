import OntologyDefinition from "@/ontology/ontology-definition";
import { describe, expect, it } from "vitest";
import OntologyToPromptTranslator from "../ontology-to-prompt-translator";

describe("OntologyTranslator", () => {
  it("should translate ontology definition", () => {
    const translator = new OntologyToPromptTranslator(OntologyDefinition);
    const prompt = translator.execute();

    console.log(prompt);

    expect(prompt).toBeDefined();
  });
});
