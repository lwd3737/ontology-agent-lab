import { wrapAISDK } from "langsmith/experimental/vercel";
import * as ai from "ai";
import { openai } from "@ai-sdk/openai";
import type OntologyDefinition from "@/ontology/ontology-definition";
import OntologyDefinitionContextBuilder from "../prompt/contexts/ontology-definition-context-builder";

const { generateObject } = wrapAISDK(ai);

export default class QueryDSLGenerator {
  constructor(ontologyDefinition: OntologyDefinition) {
    const ontologyDefinitionContext = new OntologyDefinitionContextBuilder(
      ontologyDefinition
    ).build();
  }

  // public async execute(userQueryIntent: string) {
  //   const result = await generateObject({
  //     model: openai("gpt-5-mini"),
  //     system: this.queryDSLGenerationPrompt,
  //     // messages: convertToModelMessages(messages),
  //     prompt: userQueryIntent,
  //     schemaName: "QueryDsl",
  //     schema: OntologyQueryDslSchema,
  //     schemaDescription:
  //       "QueryDSL is a JSON object that represents a query to the database.",
  //     maxRetries: 3,
  //     providerOptions: {
  //       openai: {
  //         reasoning: {
  //           effort: "low",
  //         },
  //       },
  //     },
  //   });

  //   return result.object;
  // }
}
