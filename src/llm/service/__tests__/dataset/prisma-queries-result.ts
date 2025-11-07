const PrismaQueriesResultDataset = {
  simpleLookup: [
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
};

export default PrismaQueriesResultDataset;
