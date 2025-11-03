import { PaymentStatus } from "../../generated/prisma";

export const paymentData = [
  {
    orderIndex: 0,
    status: PaymentStatus.CAPTURED,
    provider: "토스페이먼츠",
    createdAt: "2024-01-15T10:35:00Z",
  },
  {
    orderIndex: 1,
    status: PaymentStatus.CAPTURED,
    provider: "KG이니시스",
    createdAt: "2024-02-10T14:25:00Z",
  },
  {
    orderIndex: 2,
    status: PaymentStatus.CAPTURED,
    provider: "나이스페이",
    createdAt: "2024-02-20T11:05:00Z",
  },
  {
    orderIndex: 3,
    status: PaymentStatus.CAPTURED,
    provider: "토스페이먼츠",
    createdAt: "2024-01-25T16:50:00Z",
  },
];

