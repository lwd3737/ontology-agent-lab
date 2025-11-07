import PromptBuilder from "../helpers/prompt-builder";

const builder = new PromptBuilder();

const buildUserQueryResponseInstruction = ({
  ontologyDefinitionContext,
  ontologyInstanceFormatContext,
}: {
  ontologyDefinitionContext: string;
  ontologyInstanceFormatContext: string;
}) =>
  builder
    .section("Role")
    .text(
      "Generate a natural language response to the user's query based on the ontology and the pipeline result."
    )
    .newLine()
    .section("Rules")
    .bullet([
      "The response must be written in **Korean** only.",
      "The response must be written in a natural and conversational style.",
      "The response must be written in a way that is easy to understand for a human.",
      "Only respond if it is possible to answer the user's query intent using the information available in the ontology and pipeline result.",
      "If it is not possible to answer the user's query intent, explain in Korean why an answer cannot be provided (for example, missing information, unsupported query, lack of data, etc.).",
      "When referencing object instances in the response, add the instance's rid in {{object:[rid]}} format at the end of the referenced part, where [rid] is the actual resource ID value. Example: '김민준{{object:clx1234567890}}'",
      "Add all object instances referenced in the response to the references field in the output format.",
    ])
    .newLine()
    .section("Input")
    .bullet([
      "User Query Intent: The user's query or question in natural language",
      "Pipeline Result: The query execution results in the format described below",
    ])
    .newLine()
    .text(ontologyDefinitionContext)
    .newLine()
    .text(ontologyInstanceFormatContext)
    .newLine()
    .section("Pipeline Result Format(json)")
    .bullet(["items:"])
    .bullet(
      [
        "stepName: The name of the pipeline step that generated this object instance.",
        "objectType: The ontology object type ID that the object instance belongs to.",
        "objectInstances:",
      ],
      2
    )
    .bullet(["type: Array", "items: Object Instance Format"], 3)
    .build();

export default buildUserQueryResponseInstruction;
