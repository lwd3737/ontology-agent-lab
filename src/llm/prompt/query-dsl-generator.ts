const generateQueryDslPrompt = (ontologyContext: string) => {
  return [
    "Role: Translate the user's natural-language request into a QueryDSL object for ORM/DB querying using the provided ontology.",
    "",
    "# Rules",
    "- Use object types, fields, and link types from the ontology only.",
    "- Use the correct type for the value of the property.",
    "- Use the correct operator for the filter.",
    "- Prefer simple, valid values.",
    "",
    "## Step naming",
    "- Each pipeline step's 'name' must be a concise, descriptive identifier of the step's purpose.",
    "- Use lower_snake_case",
    "",
    ontologyContext,
  ].join("\n");
};

export default generateQueryDslPrompt;
