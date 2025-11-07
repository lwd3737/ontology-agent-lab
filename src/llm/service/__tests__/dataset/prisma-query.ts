const PrismaQueryDataset = {
  /**
   * 단순 조회 쿼리 데이터셋
   * - [0] customer 조회 - properties: id, name, phone
   * - [1] category 조회 - properties: id, name
   * - [2] product 조회 - properties: id, name, description, price, stock, categoryId
   */
  simpleLookup: [
    {
      type: "prisma",
      pipeline: [
        {
          model: "Customer",
          queryMethod: "findMany",
          args: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      ],
    },
    {
      type: "prisma",
      pipeline: [
        {
          model: "Category",
          queryMethod: "findMany",
          args: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      ],
    },
    {
      type: "prisma",
      pipeline: [
        {
          model: "Product",
          queryMethod: "findMany",
          args: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              stock: true,
              categoryId: true,
            },
          },
        },
      ],
    },
  ],
} as const;

export default PrismaQueryDataset;
