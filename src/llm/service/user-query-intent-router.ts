import {
  type UIMessage,
  Experimental_Agent as Agent,
  Output,
  tool,
  validateUIMessages,
} from "ai";
import { openai } from "@ai-sdk/openai";
import PromptBuilder from "../prompt/helpers/prompt-builder";
import type OntologyDefinition from "@/ontology/ontology-definition";
import OntologyDefinitionContextBuilder from "../prompt/contexts/ontology-definition-context-builder";
import z from "zod";

const buildUserQueryIntentRouterInstruction = ({
  ontologyDefinitionContext,
}: {
  ontologyDefinitionContext: string;
}) =>
  new PromptBuilder()
    .section("Role")
    .text(
      "You analyze the conversation history to decide whether the user's intent is clear, ambiguous (needs clarification), or unsupported (cannot be answered). Respond in Korean when generating follow-up messages."
    )
    .newLine()
    .section("Rules")
    .bullet([
      "Leverage the provided ontology definition context to determine if the request is answerable.",
      "Use the conversation history to extract the user's intent.",
      "Return both the inferred intent and a status indicating whether the intent is clear enough to answer using the ontology context.",
      "If the ontology context does not cover the requested information, mark the status as unsupported.",
      "When the intent is ambiguous or unsupported, craft an appropriate Korean follow-up message (clarifying question or refusal) that fits the dialogue context.",
    ])
    .newLine()
    .section("Ontology Definition Context")
    .text(ontologyDefinitionContext)
    .build();

const UserQueryIntentRouterSchema = z.object({
  status: z
    .enum(["clear", "ambiguous", "unsupported"])
    .describe("The status of the user query intent."),
  response: z.string().describe("The response to the user."),
});

export default class UserQueryIntentRouter {
  private readonly agent: Agent<any, any, any>;

  constructor(
    ontologyDefinition: OntologyDefinition,
    private readonly onGenerateAnswer: (userQueryIntent: string) => Promise<any>
  ) {
    const ontologyDefinitionContextBuilder =
      new OntologyDefinitionContextBuilder(ontologyDefinition);
    this.agent = new Agent({
      model: openai("gpt-5-mini"),
      system: buildUserQueryIntentRouterInstruction({
        ontologyDefinitionContext: ontologyDefinitionContextBuilder.build(),
      }),
      experimental_output: Output.object({
        schema: UserQueryIntentRouterSchema,
      }),
      tools: {
        generateAnswer: tool({
          description:
            "Generate an answer to the user's query when user's query intent is clear.",
          inputSchema: z.object({
            userQueryIntent: z.string().describe("The user's query intent."),
          }),
          execute: async ({ userQueryIntent }) => {
            return await this.onGenerateAnswer(userQueryIntent);
          },
        }),
      },
    });
  }

  public async execute(messages: UIMessage[]) {
    return this.agent.respond({
      messages: await validateUIMessages({ messages }),
    });
  }
}
