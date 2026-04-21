import { getAdminOrders } from "../../../modules/order/service";

export type Data = ReturnType<typeof data>;

export async function data(pageContext: {
  prisma: import("../../../generated/prisma/client").PrismaClient;
  session?: { user?: { role?: string } };
}) {
  if (pageContext.session?.user?.role !== "admin") {
    return {
      orders: [],
    };
  }

  return {
    orders: await getAdminOrders(pageContext.prisma),
  };
}
