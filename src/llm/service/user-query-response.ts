import type { PipelineStepResult } from "@/connector/prisma/prisma-queries-result-translator";
import { wrapAISDK } from "langsmith/experimental/vercel";
import * as ai from "ai";
import OntologyDefinitionContextBuilder from "../prompt/contexts/ontology-definition-context-builder";
import { openai } from "@ai-sdk/openai";
import buildUserQueryResponseInstruction from "../prompt/instructions/usery-query-response";
import OBJECT_INSTANCE_FORMAT_CONTEXT from "../prompt/contexts/object-instance-format";
import z from "zod";
import type OntologyDefinition from "@/ontology/ontology-definition";
import PromptBuilder from "../prompt/helpers/prompt-builder";
const { generateObject } = wrapAISDK(ai);

const UserQueryResponseSchema = z.object({
  response: z
    .string()
    .describe(
      "The response to the user's query in natural language. When referencing an object instance in the response text, add {{object:[rid]}} at the end of the referenced part, where [rid] is the actual resource ID value. Example: '총 3명의 고객이 있습니다: 김민준{{object:clx1234567890}}, 이소연{{object:clx0987654321}}, 박지현{{object:clx1122334455}}'"
    ),
  references: z
    .object({
      objects: z
        .record(
          z.string().describe("Ontology object type id"),
          z
            .array(
              z
                .object({
                  rid: z.string().describe("The resource ID of the object."),
                  objectType: z
                    .string()
                    .describe("The ontology object type id of the object."),
                  properties: z
                    .record(
                      z.string().describe("Ontology property id"),
                      z.any()
                    )
                    .describe("The properties of the object."),
                })
                .describe("Object instance format")
            )
            .describe("Array of object instances of this type")
        )
        .optional()
        .describe(
          "The ontology objects referenced in the response. Each key is an object type ID, and the value is an array of object instances of that type."
        ),
    })
    .optional()
    .describe(
      "All object instances that were referenced in the response. Contains 'objects' field (and optionally 'links' in the future). Grouped by object type (objectType as key). Include all instances that were mentioned or used to generate the response."
    ),
  success: z
    .boolean()
    .describe(
      "Whether the response successfully answered the user's query intent (true for answered, false for not answered)."
    ),
});

export type UserQueryResponseResult = z.infer<typeof UserQueryResponseSchema>;

class UserQueryResponseService {
  private readonly ontologyDefinitionContextBuilder: OntologyDefinitionContextBuilder;
  private readonly promptBuilder = new PromptBuilder();

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

    const input = this.promptBuilder
      .section("User Query Intent")
      .text(userQueryIntent)
      .newLine()
      .section("Pipeline Result")
      .json(pipelineResult)
      .build();

    const result = await generateObject({
      model: openai("gpt-5-mini"),
      system: buildUserQueryResponseInstruction({
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
