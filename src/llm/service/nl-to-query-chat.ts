import OntologyDefinition from "@/ontology/ontology-definition";
import { openai } from "@ai-sdk/openai";
import { TextPart, type UIMessage } from "ai";
import generateQueryDslPrompt from "../prompt/query-dsl-generation";
import {
  OntologyQueryDslSchema,
  type OntologyQueryDSL,
} from "@/ontology-query/dsl-schema";
import * as ai from "ai";
import { wrapAISDK } from "langsmith/experimental/vercel";
import { traceable } from "langsmith/traceable";
import type QueryCompiler from "@/connector/query-compiler";
import PrismaQueryResultToOntologyTranslator, {
  type PipelineStepResult,
} from "@/connector/prisma/query-result-to-ontology-translator";
import type { QueryCompileResult } from "@/connector/query-compiler";
import { executeQueriesThenTranslateToOntology } from "@/connector/query-executor";
import OntologyDefinitionContextBuilder from "../adapter/ontology-definition-context-builder";
import OBJECT_INSTANCE_FORMAT_CONTEXT from "../prompt/object-instance-format-context";
import { z } from "zod";
import generateUserQueryResponseInstruction from "../prompt/usery-query-response";
import UserQueryResponseService from "./user-query-response";

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

export default class NLToQueryChatService {
  private readonly queryDSLGenerationPrompt: string;
  private readonly ontologyDefinitionContextBuilder: OntologyDefinitionContextBuilder;
  private readonly prismaQueryResultToOntologyTranslator =
    new PrismaQueryResultToOntologyTranslator();
  private readonly userQueryResponseService: UserQueryResponseService;

  constructor(
    ontologyDefinition: OntologyDefinition,
    private readonly queryCompiler: QueryCompiler
  ) {
    this.ontologyDefinitionContextBuilder =
      new OntologyDefinitionContextBuilder(ontologyDefinition);
    const ontologyDefinitionContext =
      this.ontologyDefinitionContextBuilder.build();
    this.queryDSLGenerationPrompt = generateQueryDslPrompt(
      ontologyDefinitionContext
    );
    this.userQueryResponseService = new UserQueryResponseService(
      ontologyDefinition
    );

    this.generateQueryDsl = traceable(this.generateQueryDsl.bind(this), {
      name: "generateQueryDSL",
    });
    this.compileQueryDSL = traceable(this.compileQueryDSL.bind(this), {
      name: "compileQueryDSL",
    });
    this.translatePrismaQueryResultToOntology = traceable(
      this.translatePrismaQueryResultToOntology.bind(this),
      {
        name: "translatePrismaQueryResultToOntology",
      }
    );
    this.executeQueriesThenTranslateToOntology = traceable(
      this.executeQueriesThenTranslateToOntology.bind(this),
      {
        name: "executeQueriesThenTranslateToOntology",
      }
    );
    this.generateUserQueryResponse = traceable(
      this.generateUserQueryResponse.bind(this),
      {
        name: "generateUserQueryResponse",
      }
    );
  }

  public async ask(messages: UIMessage[]) {
    const message = messages[messages.length - 1].parts[0];
    // TODO: LLM으로 사용자 의도 추출
    const userQuery = (message as TextPart).text;

    const queryDSL = await this.generateQueryDsl(userQuery);
    const compiledQueries = await this.compileQueryDSL(queryDSL);

    if (compiledQueries.pipeline.length === 0) {
      throw new Error("No compiled queries found");
    }

    const pipelineResult = await this.executeQueriesThenTranslateToOntology(
      compiledQueries,
      queryDSL
    );
    const userQueryResponse = await this.generateUserQueryResponse(
      userQuery,
      pipelineResult
    );

    return userQueryResponse;
  }

  public async generateQueryDsl(
    userQueryIntent: string
    // messages: UIMessage[]
  ): Promise<OntologyQueryDSL> {
    const result = await generateObject({
      model: openai("gpt-5-mini"),
      system: this.queryDSLGenerationPrompt,
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

  private async compileQueryDSL(
    queryDSL: OntologyQueryDSL
  ): Promise<QueryCompileResult> {
    return this.queryCompiler.compileFromQueryDSL(queryDSL);
  }

  public async translatePrismaQueryResultToOntology(
    queryResult: any,
    queryDSL: OntologyQueryDSL
  ) {
    return this.prismaQueryResultToOntologyTranslator.translate(
      queryResult,
      queryDSL
    );
  }

  private async executeQueriesThenTranslateToOntology(
    compileResult: QueryCompileResult,
    queryDSL: OntologyQueryDSL
  ): Promise<PipelineStepResult[]> {
    switch (compileResult.type) {
      case "prisma":
        return executeQueriesThenTranslateToOntology(
          "prisma",
          compileResult.pipeline,
          queryDSL
        );
      default:
        throw new Error(
          `Unsupported query compiler type: ${compileResult.type}`
        );
    }
  }

  private async generateUserQueryResponse(
    userQueryIntent: string,
    pipelineResult: PipelineStepResult[]
  ) {
    return this.userQueryResponseService.generateResponse(
      userQueryIntent,
      pipelineResult
    );
  }
}
