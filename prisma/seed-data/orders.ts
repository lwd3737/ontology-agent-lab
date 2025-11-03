import { OrderStatus } from "../../generated/prisma";

export const orderData = [
  {
    customerIndex: 0,
    status: OrderStatus.COMPLETED,
    subTotalAmount: 1550000,
    shippingAmount: 3000,
    totalAmount: 1553000,
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    customerIndex: 1,
    status: OrderStatus.SHIPPED,
    subTotalAmount: 1599000,
    shippingAmount: 3000,
    totalAmount: 1602000,
    createdAt: "2024-02-10T14:20:00Z",
  },
  {
    customerIndex: 2,
    status: OrderStatus.PAID,
    subTotalAmount: 4290000,
    shippingAmount: 5000,
    totalAmount: 4295000,
    createdAt: "2024-02-20T11:00:00Z",
  },
  {
    customerIndex: 3,
    status: OrderStatus.COMPLETED,
    subTotalAmount: 7490000,
    shippingAmount: 0,
    totalAmount: 7490000,
    createdAt: "2024-01-25T16:45:00Z",
  },
  {
    customerIndex: 4,
    status: OrderStatus.CREATED,
    subTotalAmount: 1990000,
    shippingAmount: 3000,
    totalAmount: 1993000,
    createdAt: "2024-03-01T09:15:00Z",
  },
];
