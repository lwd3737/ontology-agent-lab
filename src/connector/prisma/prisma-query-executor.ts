import { prisma } from "./client";
import type { PrismaQuery } from "./prisma-client-compiler";

const executePrismaQuery = async (query: PrismaQuery) => {
  return await prisma[query.model][query.queryMethod](query.args);
};

export default executePrismaQuery;
