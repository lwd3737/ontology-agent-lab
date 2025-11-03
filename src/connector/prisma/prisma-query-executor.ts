import { prisma } from "./client";
import type { PrismaQuery } from "./prisma-client-compiler";

export type PrismaQueryResult = PrismaListQueryResult;

export type PrismaListQueryResult = PrismaModelInstance[];

export type PrismaModelInstance = Record<string, any>;

export const executePrismaQuery = async (
  query: PrismaQuery
): Promise<PrismaQueryResult> => {
  return await prisma[query.model][query.queryMethod](query.args);
};

export const executePrismaQueries = async (
  queries: PrismaQuery[]
): Promise<PrismaQueryResult[]> => {
  return await Promise.all(queries.map(executePrismaQuery));
};
