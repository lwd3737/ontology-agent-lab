import type { OntologyQueryDSL } from "@/ontology-query/dsl-schema";

const QueryDSLDataset = {
  /**
   * 단순 조회 쿼리 데이터셋
   * - [0] customer 조회 - properties: id, name, phone
   * - [1] category 조회 - properties: id, name
   * - [2] product 조회 - properties: id, name, description, price, stock, categoryId
   */
  simpleLookup: [
    {
      pipeline: [
        {
          name: "list_all_customers",
          query: {
            objectType: "customer",
            properties: ["id", "name", "phone"],
            type: "list",
          },
        },
      ],
    },
    {
      pipeline: [
        {
          name: "list_all_categories",
          query: {
            objectType: "category",
            properties: ["id", "name"],
            type: "list",
          },
        },
      ],
    },
    {
      pipeline: [
        {
          name: "list_all_products",
          query: {
            objectType: "product",
            properties: [
              "id",
              "name",
              "description",
              "price",
              "stock",
              "categoryId",
            ],
            type: "list",
          },
        },
      ],
    },
  ],
} satisfies {
  simpleLookup: OntologyQueryDSL[];
};

export default QueryDSLDataset;
