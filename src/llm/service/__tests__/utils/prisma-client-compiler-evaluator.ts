import type { PrismaQuery } from "@/connector/prisma/prisma-client-compiler";

export const prismaClientCompilerEvaluator = async ({
  output,
  expected,
}: {
  output: PrismaQuery[];
  expected: PrismaQuery[];
}) => {
  return {
    key: "isCompiledCorrectly",
    score: output.every(
      (query, index) =>
        JSON.stringify(query) === JSON.stringify(expected[index])
    )
      ? 1
      : 0,
  };
};
