import { PrismaClient, UserRole } from "../generated/prisma";
import { Prisma } from "../generated/prisma";
import {
  carrierData,
  categoryData,
  productData,
  userData,
  addressData,
  cartData,
  cartLineData,
  orderData,
  orderLineData,
  paymentData,
  shipmentData,
  reviewData,
} from "./seed-data";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  console.log("Clearing existing data...");
  await prisma.review.deleteMany();
  await prisma.cartLine.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderLine.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.carrier.deleteMany();

  // 1. Carriers (택배사)
  console.log("Creating carriers...");
  await prisma.carrier.createMany({
    data: carrierData,
  });

  // 생성된 carrier들을 다시 조회 (createMany는 생성된 레코드를 반환하지 않음)
  const createdCarriers = await prisma.carrier.findMany({
    orderBy: { slug: "asc" },
  });

  // 2. Categories (카테고리) - 계층 구조 처리
  console.log("Creating categories...");
  const categoryMap = new Map<string, any>();
  for (const catData of categoryData) {
    const parentId = catData.parentKey
      ? categoryMap.get(catData.parentKey)?.id
      : null;
    const category = await prisma.category.create({
      data: {
        name: catData.name,
        slug: catData.slug,
        parentId,
      },
    });
    categoryMap.set(catData.slug, category);
  }

  // 3. Products (제품)
  console.log("Creating products...");
  const products = await Promise.all(
    productData.map((data) =>
      prisma.product.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          price: new Prisma.Decimal(data.price),
          stock: data.stock,
          categoryId: categoryMap.get(data.categorySlug)!.id,
          categories: {
            connect: { id: categoryMap.get(data.categorySlug)!.id },
          },
        },
      })
    )
  );

  // 4. Users and Customers
  console.log("Creating users and customers...");
  const users = await Promise.all(
    userData.map((data) =>
      prisma.user.create({
        data: {
          email: data.email,
          password: "$2b$10$dummyhashedpassword",
          role: data.role,
        },
      })
    )
  );

  const customers = await Promise.all(
    users
      .filter((user) => user.role === UserRole.CUSTOMER)
      .map((user, index) =>
        prisma.customer.create({
          data: {
            userId: user.id,
            name: userData[index].name,
            phone: userData[index].phone,
          },
        })
      )
  );

  // 5. Addresses
  console.log("Creating addresses...");
  await prisma.address.createMany({
    data: addressData.map((data) => ({
      customerId: customers[data.customerIndex].id,
      name: data.name,
      phone: data.phone,
      postalCode: data.postalCode,
      city: data.city,
      street: data.street,
    })),
  });

  // 6. Carts
  console.log("Creating carts...");
  const carts = await Promise.all(
    cartData.map((data) =>
      prisma.cart.create({
        data: {
          customerId: customers[data.customerIndex].id,
        },
      })
    )
  );

  // 6-1. Cart Lines
  console.log("Creating cart lines...");
  await prisma.cartLine.createMany({
    data: cartLineData.map((data) => ({
      cartId: carts[data.cartIndex].id,
      productId: products[data.productIndex].id,
      quantity: data.quantity,
    })),
  });

  // 7. Orders
  console.log("Creating orders...");
  const orders = await Promise.all(
    orderData.map((data) =>
      prisma.order.create({
        data: {
          customerId: customers[data.customerIndex].id,
          status: data.status,
          subTotalAmount: new Prisma.Decimal(data.subTotalAmount),
          shippingAmount: new Prisma.Decimal(data.shippingAmount),
          totalAmount: new Prisma.Decimal(data.totalAmount),
          createdAt: new Date(data.createdAt),
        },
      })
    )
  );

  // 7-1. Order Lines
  console.log("Creating order lines...");
  await prisma.orderLine.createMany({
    data: orderLineData.map((data) => ({
      orderId: orders[data.orderIndex].id,
      productId: products[data.productIndex].id,
      quantity: data.quantity,
      unitPrice: new Prisma.Decimal(data.unitPrice),
      lineTotalAmount: new Prisma.Decimal(data.unitPrice * data.quantity),
    })),
  });

  // 7-2. Payments
  console.log("Creating payments...");
  await Promise.all(
    paymentData.map((data) =>
      prisma.payment.create({
        data: {
          orderId: orders[data.orderIndex].id,
          status: data.status,
          amount: new Prisma.Decimal(orderData[data.orderIndex].totalAmount),
          provider: data.provider,
          createdAt: new Date(data.createdAt),
        },
      })
    )
  );

  // 7-3. Shipments
  console.log("Creating shipments...");
  await Promise.all(
    shipmentData.map((data) =>
      prisma.shipment.create({
        data: {
          orderId: orders[data.orderIndex].id,
          status: data.status,
          trackingNo: data.trackingNo,
          carrierId: createdCarriers[data.carrierIndex].id,
          shippedAt: new Date(data.shippedAt),
        },
      })
    )
  );

  // 8. Reviews
  console.log("Creating reviews...");
  await prisma.review.createMany({
    data: reviewData.map((data) => ({
      customerId: customers[data.customerIndex].id,
      productId: products[data.productIndex].id,
      rating: data.rating,
      comment: data.comment,
      createdAt: new Date(data.createdAt),
    })),
  });

  console.log("✅ Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
