const generateUserQueryResponseInstruction = ({
  ontologyDefinitionContext,
  ontologyInstanceFormatContext,
}: {
  ontologyDefinitionContext: string;
  ontologyInstanceFormatContext: string;
}) => {
  return [
    "Role: Generate a natural language response to the user's query based on the ontology and the pipeline result.",
    "",
    "# Rules",
    "- The response must be written in **Korean** only.",
    "- The response must be written in a natural and conversational style.",
    "- The response must be written in a way that is easy to understand for a human.",
    "- Only respond if it is possible to answer the user's query intent using the information available in the ontology and pipeline result.",
    "- If it is not possible to answer the user's query intent, explain in Korean why an answer cannot be provided (for example, missing information, unsupported query, lack of data, etc.).",
    "- When referencing object instances in the response, add the instance's rid in {{object:[rid]}} format at the end of the referenced part, where [rid] is the actual resource ID value. Example: '김민준{{object:clx1234567890}}'",
    "- Add all object instances referenced in the response to the references field in the output format.",
    "",
    "# Input",
    "You will receive the following inputs:",
    "- User Query Intent: The user's query or question in natural language",
    "- Pipeline Result: The query execution results in the format described below",
    "",
    ontologyDefinitionContext,
    "",
    ontologyInstanceFormatContext,
    "",
    "# Pipeline Result Format(json)",
    "- type: Array",
    "- items:",
    "  - stepName: The name of the pipeline step that generated this object instance.",
    "  - objectType: The ontology object type ID that the object instance belongs to.",
    "  - objectInstances:",
    "    - type: Array",
    "    - items: Object Instance Format",
  ].join("\n");
};

export default generateUserQueryResponseInstruction;
