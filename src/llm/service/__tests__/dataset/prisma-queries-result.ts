import type { PrismaListQueryResult } from "@/connector/prisma/prisma-query-executor";

const PrismaQueriesResultDataset = {
  /**
   * 단순 조회 쿼리 결과 데이터셋
   * - [0] customer 조회 - properties: id, name, phone
   * - [1] category 조회 - properties: id, name
   * - [2] product 조회 - properties: id, name, description, price, stock, categoryId
   */
  simpleListQueries: [
    [
      [
        {
          id: "clx1234567890",
          name: "김민준",
          phone: "010-1234-5678",
        },
        {
          id: "clx0987654321",
          name: "이소연",
          phone: "010-2345-6789",
        },
        {
          id: "clx1122334455",
          name: "박지현",
          phone: "010-3456-7890",
        },
      ],
    ],

    [
      [
        {
          id: "clxcat001",
          name: "전자제품",
        },
        {
          id: "clxcat002",
          name: "가전제품",
        },
        {
          id: "clxcat003",
          name: "의류",
        },
      ],
    ],

    [
      [
        {
          id: "clxprod001",
          name: "노트북",
          description: "노트북 설명",
          price: 1000000,
          stock: 10,
          categoryId: "clxcat001",
        },
        {
          id: "clxprod002",
          name: "스마트폰",
          description: "스마트폰 설명",
          price: 800000,
          stock: 20,
          categoryId: "clxcat002",
        },
        {
          id: "clxprod003",
          name: "티셔츠",
          description: "티셔츠 설명",
          price: 30000,
          stock: 30,
          categoryId: "clxcat003",
        },
      ],
    ],
  ],
} satisfies {
  simpleListQueries: PrismaListQueryResult[][];
};

export default PrismaQueriesResultDataset;
