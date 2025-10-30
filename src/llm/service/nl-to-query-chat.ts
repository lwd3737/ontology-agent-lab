import type OntologyDefinition from "@/ontology/definition";
import OntologyToPromptTranslator from "@/llm/adapter/ontology-to-prompt-translator";
import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, type UIMessage } from "ai";
import generateQueryDslPrompt from "../prompt/query-dsl-generator";
import {
  OntologyQueryDslSchema,
  type OntologyQueryDSL,
} from "@/ontology-query/dsl-schema";
import * as ai from "ai";
import { wrapAISDK } from "langsmith/experimental/vercel";
import { traceable } from "langsmith/traceable";
import type QueryCompiler from "@/connector/query-compiler";

const { generateObject } = wrapAISDK(ai);

export default class NLToQueryChatService {
  private readonly queryDSLGeneratorPrompt: string;

  constructor(
    private readonly ontology: OntologyDefinition,
    private readonly queryCompiler: QueryCompiler
  ) {
    const translator = new OntologyToPromptTranslator(ontology);
    this.queryDSLGeneratorPrompt = generateQueryDslPrompt(translator.execute());

    this.generateQueryDsl = traceable(this.generateQueryDsl.bind(this), {
      name: "generateQueryDSL",
    });
  }

  public async ask(messages: UIMessage[]) {
    const queryDSL = await this.generateQueryDsl(messages);
    this.queryCompiler.compileFromQueryDSL(queryDSL);
  }

  public async generateQueryDsl(
    messages: UIMessage[]
  ): Promise<OntologyQueryDSL> {
    const result = await generateObject({
      model: openai("gpt-5"),
      system: this.queryDSLGeneratorPrompt,
      messages: convertToModelMessages(messages),
      schemaName: "QueryDsl",
      schema: OntologyQueryDslSchema,
      schemaDescription:
        "QueryDSL is a JSON object that represents a query to the database.",
      maxRetries: 3,
    });

    return result.object;
  }
}
