import {
  LinkCardinality,
  PropertyValueType,
  type OntologyDefinition,
} from "./metadata/types";

const OntologyDefinition: OntologyDefinition = {
  objectTypes: [
    {
      id: "customer",
      displayName: "Customer",
      properties: [
        {
          id: "id",
          displayName: "ID",
          type: PropertyValueType.STRING,
          required: true,
          primaryKey: true,
        },
        {
          id: "name",
          displayName: "Name",
          type: PropertyValueType.STRING,
          required: true,
        },
        {
          id: "phone",
          displayName: "Phone",
          type: PropertyValueType.STRING,
          required: false,
        },
      ],
    },
    {
      id: "address",
      displayName: "Address",
      properties: [
        {
          id: "id",
          displayName: "ID",
          type: PropertyValueType.STRING,
          required: true,
          primaryKey: true,
        },
        {
          id: "postalCode",
          displayName: "Postal Code",
          type: PropertyValueType.STRING,
          required: true,
        },
        {
          id: "city",
          displayName: "City",
          type: PropertyValueType.STRING,
          required: true,
        },
        {
          id: "street",
          displayName: "Street",
          type: PropertyValueType.STRING,
          required: true,
        },
        {
          id: "customerId",
          displayName: "CustomerID",
          type: PropertyValueType.STRING,
          required: true,
        },
      ],
    },
    {
      id: "category",
      displayName: "Category",
      properties: [
        {
          id: "id",
          displayName: "ID",
          type: PropertyValueType.STRING,
          required: true,
          primaryKey: true,
        },
        {
          id: "name",
          displayName: "Name",
          type: PropertyValueType.STRING,
          required: true,
        },
      ],
    },
    {
      id: "product",
      displayName: "Product",
      properties: [
        {
          id: "id",
          displayName: "ID",
          type: PropertyValueType.STRING,
          required: true,
          primaryKey: true,
        },
        {
          id: "name",
          displayName: "Name",
          type: PropertyValueType.STRING,
          required: true,
        },
        {
          id: "description",
          displayName: "Description",
          type: PropertyValueType.STRING,
          required: false,
        },
        {
          id: "price",
          displayName: "Price",
          type: PropertyValueType.NUMBER,
          required: true,
        },
        {
          id: "stock",
          displayName: "Stock",
          type: PropertyValueType.NUMBER,
          required: true,
        },
        {
          id: "categoryId",
          displayName: "CategoryID",
          type: PropertyValueType.STRING,
          required: true,
        },
      ],
    },
    {
      id: "order",
      displayName: "Order",
      properties: [
        {
          id: "id",
          displayName: "ID",
          type: PropertyValueType.STRING,
          required: true,
          primaryKey: true,
        },
        {
          id: "customerId",
          displayName: "CustomerID",
          type: PropertyValueType.STRING,
          required: true,
        },
        {
          id: "status",
          displayName: "Status",
          type: PropertyValueType.STRING,
          required: true,
        },
        {
          id: "subTotalAmount",
          displayName: "SubTotalAmount",
          type: PropertyValueType.NUMBER,
          required: true,
        },
        {
          id: "shippingAmount",
          displayName: "ShippingAmount",
          type: PropertyValueType.NUMBER,
          required: true,
        },
        {
          id: "totalAmount",
          displayName: "TotalAmount",
          type: PropertyValueType.NUMBER,
          required: true,
        },
        {
          id: "createdAt",
          displayName: "CreatedAt",
          type: PropertyValueType.DATETIME,
          required: true,
        },
        {
          id: "customerId",
          displayName: "CustomerID",
          type: PropertyValueType.STRING,
          required: false,
        },
      ],
    },
    {
      id: "carrier",
      displayName: "Carrier",
      description: "Shipping carrier/courier company",
      properties: [
        {
          id: "id",
          displayName: "ID",
          type: PropertyValueType.STRING,
          required: true,
          primaryKey: true,
        },
        {
          id: "name",
          displayName: "Name",
          description: "Carrier company name",
          type: PropertyValueType.STRING,
          required: true,
        },
      ],
    },
    {
      id: "shipment",
      displayName: "Shipment",
      properties: [
        {
          id: "id",
          displayName: "ID",
          type: PropertyValueType.STRING,
          required: true,
          primaryKey: true,
        },
        {
          id: "orderId",
          displayName: "OrderID",
          type: PropertyValueType.STRING,
          required: true,
        },
        {
          id: "status",
          displayName: "Status",
          type: PropertyValueType.STRING,
          required: true,
        },
        {
          id: "trackingNo",
          displayName: "Tracking No",
          type: PropertyValueType.STRING,
          required: false,
        },
        {
          id: "carrierId",
          displayName: "CarrierID",
          type: PropertyValueType.STRING,
          required: false,
        },
        {
          id: "shippedAt",
          displayName: "Shipped At",
          type: PropertyValueType.DATETIME,
          required: false,
        },
      ],
    },
  ],
  linkTypes: [
    {
      id: "customer-address",
      objectTypes: ["customer", "address"],
      cardinality: [LinkCardinality.ONE, LinkCardinality.MANY],
      key: {
        type: "foreignKey",
        side: "right",
        foreignKeyProperty: "customerId",
        primaryKeyProperty: "id",
      },
      displayName: ["Customer", "Registered Addresses"],
    },
    {
      id: "customer-order",
      objectTypes: ["customer", "order"],
      cardinality: [LinkCardinality.ONE, LinkCardinality.MANY],
      key: {
        type: "foreignKey",
        side: "right",
        foreignKeyProperty: "customerId",
        primaryKeyProperty: "id",
      },
      displayName: ["Customer", "Placed Orders"],
    },
    {
      id: "category-product",
      objectTypes: ["category", "product"],
      cardinality: [LinkCardinality.MANY, LinkCardinality.MANY],
      key: {
        type: "joinTable",
        leftPrimaryKeyProperty: "id",
        rightPrimaryKeyProperty: "id",
      },
      displayName: ["Categories", "Associated Products"],
    },
    {
      id: "order-shipment",
      objectTypes: ["order", "shipment"],
      cardinality: [LinkCardinality.ONE, LinkCardinality.ONE],
      key: {
        type: "foreignKey",
        side: "right",
        foreignKeyProperty: "orderId",
        primaryKeyProperty: "id",
      },
      displayName: ["Order", "Shipment"],
    },
    {
      id: "carrier-shipment",
      objectTypes: ["carrier", "shipment"],
      cardinality: [LinkCardinality.ONE, LinkCardinality.MANY],
      key: {
        type: "foreignKey",
        side: "right",
        foreignKeyProperty: "carrierId",
        primaryKeyProperty: "id",
      },
      displayName: ["Carrier", "Shipments"],
    },
  ],
};

export default OntologyDefinition;
