import type {
  LoadQueryNode,
  OntologyQueryDSL,
  PipelineStep,
} from "@/ontology-query/dsl-schema";
import type QueryCompiler from "../query-compiler";

export default class PrismaClientCompiler implements QueryCompiler {
  public compileFromQueryDSL(queryDSL: OntologyQueryDSL) {
    queryDSL.pipeline.map(this.compilePipelineStep.bind(this));
  }

  private compilePipelineStep(step: PipelineStep) {
    switch (step.node.type) {
      case "load":
        return this.compileLoadQueryNode(step.node);
      default:
        throw new Error(`Unsupported query node type: ${step.node.type}`);
    }
  }

  private compileLoadQueryNode(node: LoadQueryNode) {
    const { objectType, filter } = node;
  }
}
