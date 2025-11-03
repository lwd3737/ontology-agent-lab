import { UserRole } from "../../generated/prisma";

export const userData = [
  {
    email: "kim.minjun@example.com",
    name: "김민준",
    phone: "010-1234-5678",
    role: UserRole.CUSTOMER,
  },
  {
    email: "lee.soyeon@example.com",
    name: "이소연",
    phone: "010-2345-6789",
    role: UserRole.CUSTOMER,
  },
  {
    email: "park.jihyun@example.com",
    name: "박지현",
    phone: "010-3456-7890",
    role: UserRole.CUSTOMER,
  },
  {
    email: "choi.seungho@example.com",
    name: "최승호",
    phone: "010-4567-8901",
    role: UserRole.CUSTOMER,
  },
  {
    email: "jung.yejin@example.com",
    name: "정예진",
    phone: "010-5678-9012",
    role: UserRole.CUSTOMER,
  },
  {
    email: "yoon.donghyun@example.com",
    name: "윤동현",
    phone: "010-6789-0123",
    role: UserRole.CUSTOMER,
  },
  {
    email: "jang.misun@example.com",
    name: "장미선",
    phone: "010-7890-1234",
    role: UserRole.CUSTOMER,
  },
  {
    email: "lim.jaeho@example.com",
    name: "임재호",
    phone: "010-8901-2345",
    role: UserRole.CUSTOMER,
  },
  { email: "admin1@example.com", name: "관리자1", role: UserRole.ADMIN },
  { email: "admin2@example.com", name: "관리자2", role: UserRole.ADMIN },
];

