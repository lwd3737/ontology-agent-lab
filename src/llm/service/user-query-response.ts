import type { PipelineStepResult } from "@/connector/prisma/query-result-to-ontology-translator";
import { wrapAISDK } from "langsmith/experimental/vercel";
import * as ai from "ai";
import OntologyDefinitionContextBuilder from "../adapter/ontology-definition-context-builder";
import { openai } from "@ai-sdk/openai";
import generateUserQueryResponseInstruction from "../prompt/usery-query-response";
import OBJECT_INSTANCE_FORMAT_CONTEXT from "../prompt/object-instance-format-context";
import z from "zod";
import type OntologyDefinition from "@/ontology/ontology-definition";
const { generateObject } = wrapAISDK(ai);

const UserQueryResponseSchema = z.object({
  response: z
    .string()
    .describe(
      "The response to the user's query in natural language. If the response is not possible to answer the user's query intent."
    ),
  success: z
    .boolean()
    .describe(
      "Whether the response successfully answered the user's query intent (true for answered, false for not answered)."
    ),
});

class UserQueryResponseService {
  private readonly ontologyDefinitionContextBuilder: OntologyDefinitionContextBuilder;

  constructor(ontologyDefinition: OntologyDefinition) {
    this.ontologyDefinitionContextBuilder =
      new OntologyDefinitionContextBuilder(ontologyDefinition);
  }

  public async generateResponse(
    userQueryIntent: string,
    pipelineResult: PipelineStepResult[]
  ) {
    const objectTypeIds = Array.from(
      new Set(pipelineResult.map((step) => step.objectType))
    );
    const ontologyDefinitionContext =
      this.ontologyDefinitionContextBuilder.build({
        objectTypeIds,
      });

    const input = [
      "User Query Intent: " + userQueryIntent,
      "",
      "Pipeline Result: ",
      "```json",
      JSON.stringify(pipelineResult, null, 2),
      "```",
    ].join("\n");

    const result = await generateObject({
      model: openai("gpt-5-mini"),
      system: generateUserQueryResponseInstruction({
        ontologyDefinitionContext,
        ontologyInstanceFormatContext: OBJECT_INSTANCE_FORMAT_CONTEXT,
      }),
      prompt: input,
      schemaName: "UserQueryResponse",
      schema: UserQueryResponseSchema,
      schemaDescription:
        "This schema generates a conversational Korean response based on the user's natural language query, ontology, and pipeline results.",
      maxRetries: 3,
      // providerOptions: {
      //   openai: {
      //     reasoning: {
      //       effort: "high",
      //     },
      //   },
      // },
    });

    return result.object;
  }
}

export default UserQueryResponseService;
