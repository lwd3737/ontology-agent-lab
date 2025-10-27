import type OntologyDefinition from "@/ontology/definition";
import OntologyToPromptTranslator from "@/llm/adapter/ontology-to-prompt-translator";
import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, generateObject, type UIMessage } from "ai";
import generateQueryDslPrompt from "../prompt/query-dsl-generator";
import { ontologyQueryDsl } from "@/ontology-query/dsl-schema";

export default class NLToQueryChatService {
  private readonly queryDSLGeneratorPrompt: string;

  constructor(private readonly ontology: OntologyDefinition) {
    const translator = new OntologyToPromptTranslator(ontology);
    this.queryDSLGeneratorPrompt = generateQueryDslPrompt(translator.execute());
  }

  public async ask(messages: UIMessage[]) {
    const queryDSLResult = await generateObject({
      model: openai("gpt-5"),
      system: this.queryDSLGeneratorPrompt,
      messages: convertToModelMessages(messages),
      schemaName: "QueryDsl",
      schema: ontologyQueryDsl,
      schemaDescription:
        "QueryDSL is a JSON object that represents a query to the database.",
      temperature: 0,
      maxRetries: 3,
    });
  }
}
