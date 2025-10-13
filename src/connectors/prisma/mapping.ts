interface OntologyToPrismaMapping {
  [objectType: string]: {
    model: string;
    fields: {
      [propertyId: string]: {
        name: string;
        type?: string;
      };
    };
  };
}

export const OntologyToPrismaMapping: OntologyToPrismaMapping = {
  customer: {
    model: "Customer",
    fields: {
      id: {
        name: "id",
      },
      name: {
        name: "name",
      },
      phone: {
        name: "phone",
      },
    },
  },
  address: {
    model: "Address",
    fields: {
      id: {
        name: "id",
      },
      postalCode: {
        name: "postalCode",
      },
      city: {
        name: "city",
      },
      street: {
        name: "street",
      },
      customerId: {
        name: "customerId",
      },
    },
  },
  category: {
    model: "Category",
    fields: {
      id: {
        name: "id",
      },
      name: {
        name: "name",
      },
    },
  },
  product: {
    model: "Product",
    fields: {
      id: {
        name: "id",
      },
      name: {
        name: "name",
      },
      description: {
        name: "description",
      },
      price: {
        name: "price",
      },
      stock: {
        name: "stock",
      },
      categoryId: {
        name: "categoryId",
      },
    },
  },
  order: {
    model: "Order",
    fields: {
      id: {
        name: "id",
      },
      customerId: {
        name: "customerId",
      },
      status: {
        name: "status",
      },
      subTotalAmount: {
        name: "subTotalAmount",
      },
      shippingAmount: {
        name: "shippingAmount",
      },
      totalAmount: {
        name: "totalAmount",
      },
      createdAt: {
        name: "createdAt",
      },
    },
  },
  carrier: {
    model: "Carrier",
    fields: {
      id: {
        name: "id",
      },
      name: {
        name: "name",
      },
    },
  },
  shipment: {
    model: "Shipment",
    fields: {
      id: {
        name: "id",
      },
      orderId: {
        name: "orderId",
      },
      status: {
        name: "status",
      },
      trackingNo: {
        name: "trackingNo",
      },
      carrierId: {
        name: "carrierId",
      },
      shippedAt: {
        name: "shippedAt",
      },
    },
  },
};
