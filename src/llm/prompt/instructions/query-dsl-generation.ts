import PromptBuilder from "../helpers/prompt-builder";

const builder = new PromptBuilder();

const generateQueryDslPrompt = (ontologyDefinitionContext: string) =>
  builder
    .section("Role")
    .text(
      "Translate the user's natural-language request into a QueryDSL object for ORM/DB querying using the provided ontology."
    )
    .newLine()
    .section("Rules")
    .bullet([
      "Use object types, fields, and link types from the ontology only.",
      "Use the correct type for the value of the property.",
      "Use the correct operator for the filter.",
      "Prefer simple, valid values.",
    ])
    .newLine()
    .subSection("Step naming")
    .bullet([
      "Each pipeline step's 'name' must be a concise, descriptive identifier of the step's purpose.",
      "Use lower_snake_case",
    ])
    .newLine()
    .text(ontologyDefinitionContext)
    .build();

export default generateQueryDslPrompt;
