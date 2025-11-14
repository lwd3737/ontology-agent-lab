import OntologyDefinition from "@/ontology/ontology-definition";
import { type UIMessage } from "ai";
import { type OntologyQueryDSL } from "@/ontology-query/dsl-schema";
import { traceable } from "langsmith/traceable";
import type QueryCompiler from "@/connector/query-compiler";
import PrismaQueriesResultTranslator, {
  type PipelineStepResult,
} from "@/connector/prisma/prisma-queries-result-translator";
import type { QueryCompileResult } from "@/connector/query-compiler";
import UserQueryAnswerService, {
  type UserQueryAnswerResult,
} from "./user-query-answer";
import QueryDSLGenerator from "./query-dsl-generator";
import {
  executePrismaQueries,
  type PrismaQueryResult,
} from "@/connector/prisma/prisma-query-executor";
import type { PrismaQuery } from "@/connector/prisma/prisma-client-compiler";
import UserQueryIntentRouter from "./user-query-intent-router";

export default class ChatAgentService {
  private readonly userQueryIntentRouter: UserQueryIntentRouter;
  private readonly prismaQueryResultToOntologyTranslator =
    new PrismaQueriesResultTranslator();
  private readonly userQueryResponseService: UserQueryAnswerService;
  private readonly queryDSLGenerator: QueryDSLGenerator;

  constructor(
    ontologyDefinition: OntologyDefinition,
    private readonly queryCompiler: QueryCompiler
  ) {
    this.userQueryIntentRouter = new UserQueryIntentRouter(
      ontologyDefinition,
      traceable(this.generateAnswer.bind(this), {
        name: "generateAnswer",
      })
    );
    this.queryDSLGenerator = new QueryDSLGenerator(ontologyDefinition);
    this.userQueryResponseService = new UserQueryAnswerService(
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
    this.executePrismaQueries = traceable(
      this.executePrismaQueries.bind(this),
      {
        name: "executePrismaQueries",
      }
    );
    this.generateUserQueryResponse = traceable(
      this.generateUserQueryResponse.bind(this),
      {
        name: "generateUserQueryResponse",
      }
    );
  }

  public async chat(messages: UIMessage[]) {
    const result = await this.userQueryIntentRouter.execute(messages);
    return result;
  }

  public async generateAnswer(
    userQueryIntent: string
  ): Promise<UserQueryAnswerResult> {
    const queryDSL = await this.generateQueryDsl(userQueryIntent);
    const compiledQueries = await this.compileQueryDSL(queryDSL);

    if (compiledQueries.pipeline.length === 0) {
      throw new Error("No compiled queries found");
    }

    const pipelineResult = await this.executeQueriesThenTranslateToOntology(
      compiledQueries,
      queryDSL
    );
    const userQueryResponse = await this.generateUserQueryResponse(
      userQueryIntent,
      pipelineResult
    );

    return userQueryResponse;
  }

  public async generateQueryDsl(
    userQueryIntent: string
  ): Promise<OntologyQueryDSL> {
    return this.queryDSLGenerator.execute(userQueryIntent);
  }

  private async compileQueryDSL(
    queryDSL: OntologyQueryDSL
  ): Promise<QueryCompileResult> {
    return this.queryCompiler.compileFromQueryDSL(queryDSL);
  }

  private async executeQueriesThenTranslateToOntology(
    compileResult: QueryCompileResult,
    queryDSL: OntologyQueryDSL
  ): Promise<PipelineStepResult[]> {
    switch (compileResult.type) {
      case "prisma":
        const queryResults = await this.executePrismaQueries(
          compileResult.pipeline
        );
        return this.translatePrismaQueryResultToOntology(
          queryResults,
          queryDSL
        );
      default:
        throw new Error(
          `Unsupported query compiler type: ${compileResult.type}`
        );
    }
  }

  public async translatePrismaQueryResultToOntology(
    queryResult: any,
    queryDSL: OntologyQueryDSL
  ) {
    return this.prismaQueryResultToOntologyTranslator.translateToOntology(
      queryResult,
      queryDSL
    );
  }

  private async executePrismaQueries(
    queries: PrismaQuery[]
  ): Promise<PrismaQueryResult[]> {
    return executePrismaQueries(queries);
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
