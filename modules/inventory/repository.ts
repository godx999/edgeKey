import type { PrismaClient } from "../../generated/prisma/client";

export function listCardRecords(prisma: PrismaClient) {
  return prisma.card.findMany({
    include: {
      product: true,
    },
    orderBy: [{ id: "desc" }],
  });
}

export function createCardRecord(
  prisma: PrismaClient,
  input: {
    productId: number;
    content: string;
    batchNo?: string | null;
  },
) {
  return prisma.card.create({
    data: {
      productId: input.productId,
      content: input.content,
      batchNo: input.batchNo ?? null,
    },
    include: {
      product: true,
    },
  });
}

export function createManyCards(
  prisma: PrismaClient,
  input: Array<{
    productId: number;
    content: string;
    batchNo?: string | null;
  }>,
) {
  return prisma.card.createMany({
    data: input.map((item) => ({
      productId: item.productId,
      content: item.content,
      batchNo: item.batchNo ?? null,
    })),
  });
}

export function deleteUnusedCardsByProduct(prisma: PrismaClient, productId: number) {
  return prisma.card.deleteMany({
    where: {
      productId,
      status: "UNUSED",
    },
  });
}

export function countCardStats(prisma: PrismaClient) {
  return prisma.card.groupBy({
    by: ["status"],
    _count: {
      _all: true,
    },
  });
}
