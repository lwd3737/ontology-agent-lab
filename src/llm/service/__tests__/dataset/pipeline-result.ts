import type { PipelineStepResult } from "@/connector/prisma/prisma-queries-result-translator";

const PipelineResultDataset = {
  simpleListQueries: [
    [
      {
        stepName: "list_all_customers",
        objectType: "customer",
        objectInstances: [
          {
            rid: "clx1234567890",
            objectType: "customer",
            properties: {
              id: "clx1234567890",
              name: "김민준",
              phone: "010-1234-5678",
            },
          },
          {
            rid: "clx0987654321",
            objectType: "customer",
            properties: {
              id: "clx0987654321",
              name: "이소연",
              phone: "010-2345-6789",
            },
          },
          {
            rid: "clx1122334455",
            objectType: "customer",
            properties: {
              id: "clx1122334455",
              name: "박지현",
              phone: "010-3456-7890",
            },
          },
        ],
      },
    ],
    [
      {
        stepName: "list_all_categories",
        objectType: "category",
        objectInstances: [
          {
            rid: "clxcat001",
            objectType: "category",
            properties: {
              id: "clxcat001",
              name: "전자제품",
            },
          },
          {
            rid: "clxcat002",
            objectType: "category",
            properties: {
              id: "clxcat002",
              name: "가전제품",
            },
          },
          {
            rid: "clxcat003",
            objectType: "category",
            properties: {
              id: "clxcat003",
              name: "의류",
            },
          },
        ],
      },
    ],

    [
      {
        stepName: "list_all_products",
        objectType: "product",
        objectInstances: [
          {
            rid: "clxprod001",
            objectType: "product",
            properties: {
              id: "clxprod001",
              name: "노트북",
            },
          },
          {
            rid: "clxprod002",
            objectType: "product",
            properties: {
              id: "clxprod002",
              name: "스마트폰",
            },
          },
          {
            rid: "clxprod003",
            objectType: "product",
            properties: {
              id: "clxprod003",
              name: "티셔츠",
            },
          },
        ],
      },
    ],
  ],
} satisfies {
  simpleListQueries: PipelineStepResult[][];
};

export default PipelineResultDataset;
