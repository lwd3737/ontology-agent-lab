import OntologyDefinition from "@/ontology/ontology-definition";
import { TextPart, type UIMessage } from "ai";
import { type OntologyQueryDSL } from "@/ontology-query/dsl-schema";
import * as ai from "ai";
import { wrapAISDK } from "langsmith/experimental/vercel";
import { traceable } from "langsmith/traceable";
import type QueryCompiler from "@/connector/query-compiler";
import PrismaQueryResultTranslator, {
  type PipelineStepResult,
} from "@/connector/prisma/prisma-query-result-translator";
import type { QueryCompileResult } from "@/connector/query-compiler";
import { executeQueriesThenTranslateToOntology } from "@/connector/query-executor";
import UserQueryResponseService from "./user-query-response";
import QueryDSLGenerator from "./query-dsl-generator";

const { generateObject } = wrapAISDK(ai);

export default class ChatAgentService {
  private readonly prismaQueryResultToOntologyTranslator =
    new PrismaQueryResultTranslator();
  private readonly userQueryResponseService: UserQueryResponseService;
  private readonly queryDSLGenerator: QueryDSLGenerator;

  constructor(
    ontologyDefinition: OntologyDefinition,
    private readonly queryCompiler: QueryCompiler
  ) {
    this.queryDSLGenerator = new QueryDSLGenerator(ontologyDefinition);
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
    return this.queryDSLGenerator.execute(userQueryIntent);
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
    return this.prismaQueryResultToOntologyTranslator.translateToOntology(
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
