import {
  type Tool,
  type UIMessage,
  Experimental_Agent as Agent,
  convertToModelMessages,
  tool,
  validateUIMessages,
} from "ai";
import { openai } from "@ai-sdk/openai";
import type OntologyDefinition from "@/ontology/ontology-definition";
import OntologyDefinitionContextBuilder from "../prompt/contexts/ontology-definition-context-builder";
import z from "zod";
import buildUserQueryIntentRouterInstruction from "../prompt/instructions/user-query-intent-router";
import type { UserQueryResponseResult } from "./user-query-response";

// const UserQueryIntentRouterSchema = z.object({
//   status: z
//     .enum(["clear", "ambiguous", "unsupported"])
//     .describe("The status of the user query intent."),
//   response: z.string().describe("The response to the user."),
// });

// type UserQueryIntentRouterResult = z.infer<typeof UserQueryIntentRouterSchema>;

const GenerateAnswerInputSchema = z.object({
  userQueryIntent: z.string().describe("The user's query intent."),
});

// zod infer
type GenerateAnswerInput = z.infer<typeof GenerateAnswerInputSchema>;

export type UserQueryIntentRouterResult =
  | {
      userQueryIntent: string;
      response: string;
      success: boolean;
      references?: {
        objects?: Record<
          string,
          {
            rid: string;
            objectType: string;
            properties: Record<string, any>;
          }[]
        >;
      };
    }
  | string;

export default class UserQueryIntentRouter {
  private readonly agent: Agent<
    {
      generateAnswer: Tool<
        { userQueryIntent: string },
        UserQueryResponseResult
      >;
    },
    any,
    any
  >;

  constructor(
    ontologyDefinition: OntologyDefinition,
    private readonly onGenerateAnswer: (
      userQueryIntent: string
    ) => Promise<UserQueryResponseResult>
  ) {
    const ontologyDefinitionContextBuilder =
      new OntologyDefinitionContextBuilder(ontologyDefinition);
    this.agent = new Agent({
      model: openai("gpt-5-mini"),
      system: buildUserQueryIntentRouterInstruction({
        ontologyDefinitionContext: ontologyDefinitionContextBuilder.build(),
      }),
      // experimental_output: Output.object({
      //   schema: UserQueryIntentRouterSchema,
      // }),
      tools: {
        generateAnswer: tool({
          description:
            "Generate an answer to the user's query when user's query intent is clear.",
          inputSchema: GenerateAnswerInputSchema,
          execute: async ({ userQueryIntent }) => {
            return await this.onGenerateAnswer(userQueryIntent);
          },
        }),
      },
    });
  }

  public async execute(
    messages: UIMessage[]
  ): Promise<UserQueryIntentRouterResult> {
    const result = await this.agent.generate({
      messages: convertToModelMessages(await validateUIMessages({ messages })),
    });

    for (const step of result.steps) {
      const toolResult = step.content.find(
        (content) => content.type === "tool-result"
      );

      if (toolResult?.toolName === "generateAnswer") {
        const { userQueryIntent } = toolResult.input as GenerateAnswerInput;
        return {
          userQueryIntent,
          ...(toolResult.output as UserQueryResponseResult),
        };
      }
    }

    return result.text;
  }
}
