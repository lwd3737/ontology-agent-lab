import { ShipmentStatus } from "../../generated/prisma";

export const shipmentData = [
  {
    orderIndex: 0,
    status: ShipmentStatus.DELIVERED,
    trackingNo: "1234567890123",
    carrierIndex: 0,
    shippedAt: "2024-01-16T09:00:00Z",
  },
  {
    orderIndex: 1,
    status: ShipmentStatus.SHIPPED,
    trackingNo: "9876543210987",
    carrierIndex: 1,
    shippedAt: "2024-02-11T08:30:00Z",
  },
  {
    orderIndex: 3,
    status: ShipmentStatus.DELIVERED,
    trackingNo: "5555555555555",
    carrierIndex: 2,
    shippedAt: "2024-01-26T10:00:00Z",
  },
];

