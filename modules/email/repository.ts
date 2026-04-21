import type { PrismaClient } from "../../generated/prisma/client";
import type { EmailApiProvider, EmailChannel, EmailScene } from "./types";

export function listEmailConfigRecords(prisma: PrismaClient) {
  return prisma.emailConfig.findMany({
    orderBy: [{ provider: "asc" }],
  });
}

export function getEmailConfigRecord(prisma: PrismaClient, provider: EmailChannel) {
  return prisma.emailConfig.findUnique({
    where: { provider },
  });
}

export function upsertEmailConfigRecord(
  prisma: PrismaClient,
  provider: EmailChannel,
  input: {
    name: string;
    isEnabled: boolean;
    configJson: string;
  },
) {
  return prisma.emailConfig.upsert({
    where: { provider },
    create: {
      provider,
      name: input.name,
      isEnabled: input.isEnabled,
      configJson: input.configJson,
    },
    update: {
      name: input.name,
      isEnabled: input.isEnabled,
      configJson: input.configJson,
    },
  });
}

export function listEmailTemplateRecords(prisma: PrismaClient) {
  return prisma.emailTemplate.findMany({
    orderBy: [{ scene: "asc" }],
  });
}

export function upsertEmailTemplateRecord(
  prisma: PrismaClient,
  scene: EmailScene,
  input: {
    name: string;
    subject: string;
    content: string;
    isEnabled: boolean;
  },
) {
  return prisma.emailTemplate.upsert({
    where: { scene },
    create: {
      scene,
      name: input.name,
      subject: input.subject,
      content: input.content,
      isEnabled: input.isEnabled,
    },
    update: {
      name: input.name,
      subject: input.subject,
      content: input.content,
      isEnabled: input.isEnabled,
    },
  });
}

export function listEmailLogRecords(prisma: PrismaClient, limit = 100) {
  return prisma.emailLog.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: limit,
  });
}

export function createEmailLogRecord(
  prisma: PrismaClient,
  input: {
    orderId?: number;
    provider: EmailChannel;
    apiProvider?: EmailApiProvider | null;
    scene: EmailScene;
    status: "SUCCESS" | "FAILED";
    toEmail: string;
    subject: string;
    messageId?: string | null;
    error?: string | null;
    triggeredBy?: string | null;
  },
) {
  return prisma.emailLog.create({
    data: {
      orderId: input.orderId,
      provider: input.provider,
      apiProvider: input.apiProvider ?? null,
      scene: input.scene,
      status: input.status,
      toEmail: input.toEmail,
      subject: input.subject,
      messageId: input.messageId ?? null,
      error: input.error ?? null,
      triggeredBy: input.triggeredBy ?? null,
    },
  });
}
