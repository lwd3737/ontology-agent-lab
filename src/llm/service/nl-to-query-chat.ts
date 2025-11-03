import OntologyDefinition from "@/ontology/ontology-definition";
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
import { executePrismaQueries } from "@/connector/prisma/prisma-query-executor";
import PrismaQueryResultToOntologyTranslator from "@/connector/prisma/query-result-to-ontology-translator";
import type { QueryCompileResult } from "@/connector/query-compiler";

const { generateObject } = wrapAISDK(ai);

export default class NLToQueryChatService {
  private readonly queryDSLGeneratorPrompt: string;
  private readonly ontologyToPromptTranslator: OntologyToPromptTranslator;
  private readonly prismaQueryResultToOntologyTranslator =
    new PrismaQueryResultToOntologyTranslator();

  constructor(
    private readonly ontology: OntologyDefinition,
    private readonly queryCompiler: QueryCompiler
  ) {
    this.ontologyToPromptTranslator = new OntologyToPromptTranslator(ontology);
    const ontologyContext = this.ontologyToPromptTranslator.execute();
    this.queryDSLGeneratorPrompt = generateQueryDslPrompt(ontologyContext);

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
  }

  public async ask(messages: UIMessage[]) {
    const queryDSL = await this.generateQueryDsl(messages);
    const compiledQueries = await this.compileQueryDSL(queryDSL);

    // 첫 번째 쿼리만 실행 (나중에 여러 쿼리 지원 확장 가능)
    if (compiledQueries.pipeline.length === 0) {
      throw new Error("No compiled queries found");
    }

    // TODO: 인터페이스로 추상화

    switch (compiledQueries.type) {
      case "prisma":
        const queryResults = await executePrismaQueries(
          compiledQueries.pipeline
        );
        break;
      default:
        throw new Error(
          `Unsupported query compiler type: ${compiledQueries.type}`
        );
    }
    // const instances = await this.mapPrismaQueryResultToOntology(
    //   queryDSL,
    //   queryResult
    // );
  }

  public async generateQueryDsl(
    messages: UIMessage[]
  ): Promise<OntologyQueryDSL> {
    const result = await generateObject({
      model: openai("gpt-5-mini"),
      system: this.queryDSLGeneratorPrompt,
      messages: convertToModelMessages(messages),
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
}
