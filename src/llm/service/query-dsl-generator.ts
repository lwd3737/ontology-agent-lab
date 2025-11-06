import { wrapAISDK } from "langsmith/experimental/vercel";
import * as ai from "ai";
import { openai } from "@ai-sdk/openai";
import type OntologyDefinition from "@/ontology/ontology-definition";
import OntologyDefinitionContextBuilder from "../prompt/contexts/ontology-definition-context-builder";
import buildQueryDslGenerationInstruction from "../prompt/instructions/query-dsl-generation";
import {
  OntologyQueryDslSchema,
  type OntologyQueryDSL,
} from "@/ontology-query/dsl-schema";

const { generateObject } = wrapAISDK(ai);

export default class QueryDSLGenerator {
  private readonly queryDslGenerationInstruction: string;

  constructor(ontologyDefinition: OntologyDefinition) {
    const ontologyDefinitionContext = new OntologyDefinitionContextBuilder(
      ontologyDefinition
    ).build();
    this.queryDslGenerationInstruction = buildQueryDslGenerationInstruction(
      ontologyDefinitionContext
    );
  }

  public async execute(userQueryIntent: string): Promise<OntologyQueryDSL> {
    const result = await generateObject({
      model: openai("gpt-5-mini"),
      system: this.queryDslGenerationInstruction,
      // messages: convertToModelMessages(messages),
      prompt: userQueryIntent,
      schemaName: "QueryDsl",
      schema: OntologyQueryDslSchema,
      schemaDescription:
        "QueryDSL is a JSON object that represents a query to the database.",
      maxRetries: 3,
      providerOptions: {
        openai: {
          reasoning: {
            effort: "low",
          },
        },
      },
    });

    return result.object;
  }
}
