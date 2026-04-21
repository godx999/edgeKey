import { getEmailManagementData } from "../../../modules/email/service";

export type Data = ReturnType<typeof data>;

export async function data(pageContext: {
  prisma: import("../../../generated/prisma/client").PrismaClient;
  session?: { user?: { role?: string } };
}) {
  if (pageContext.session?.user?.role !== "admin") {
    return {
      configs: null,
      templates: [],
      logs: [],
      metrics: [],
    };
  }

  return getEmailManagementData(pageContext.prisma);
}
