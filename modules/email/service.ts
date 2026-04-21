import { getContext } from "telefunc";
import type { PrismaClient } from "../../generated/prisma/client";
import { badRequestError, getErrorMessage } from "../../lib/app-error";
import { logger } from "../../lib/logger";
import { validateEmailConfigInput, validateEmailTemplateInput, validateTestEmailInput } from "../../lib/validators/email";
import { getAdminContext, logAdminOperation } from "../auth/service";
import { getSiteSetting } from "../site/service";
import { createApiEmailAdapter } from "./provider";
import { createEmailLogRecord, getEmailConfigRecord, listEmailConfigRecords, listEmailLogRecords, listEmailTemplateRecords, upsertEmailConfigRecord, upsertEmailTemplateRecord } from "./repository";
import type { EmailApiConfigValue, EmailChannel, EmailCloudflareConfigValue, EmailConfigValue, EmailLogItem, EmailOverviewMetric, EmailScene, EmailSmtpConfigValue, EmailTemplateValue } from "./types";

type EmailConfigRecord = Awaited<ReturnType<typeof listEmailConfigRecords>>[number];
type EmailTemplateRecord = Awaited<ReturnType<typeof listEmailTemplateRecords>>[number];
type EmailLogRecord = Awaited<ReturnType<typeof listEmailLogRecords>>[number];

const emailScenes = ["TEST", "ORDER_PAID", "DELIVERY_SUCCESS", "DELIVERY_FAILED"] as const;
const emailChannels = ["API", "SMTP", "CLOUDFLARE"] as const;

function getChannelDisplayName(channel: EmailChannel) {
  return channel === "API" ? "API" : channel === "SMTP" ? "SMTP" : "CloudFlare";
}

const defaultPushSettings = {
  customerSendOrderPaidEmail: true,
  customerSendDeliverySuccessEmail: true,
  customerSendDeliveryFailedEmail: false,
  adminSendOrderPaidEmail: false,
  adminSendDeliverySuccessEmail: true,
  adminSendDeliveryFailedEmail: true,
};

const defaultApiConfig: EmailApiConfigValue = {
  provider: "API",
  isEnabled: false,
  apiProvider: "BREVO",
  fromEmail: "",
  fromName: "",
  replyTo: "",
  apiBaseUrl: "https://api.brevo.com/v3/smtp/email",
  apiKey: "",
  secretKey: "",
  timeoutMs: 10000,
  ...defaultPushSettings,
};

const defaultSmtpConfig: EmailSmtpConfigValue = {
  provider: "SMTP",
  isEnabled: false,
  fromEmail: "",
  fromName: "",
  replyTo: "",
  smtpHost: "",
  smtpPort: 587,
  smtpSecure: false,
  smtpUsername: "",
  smtpPassword: "",
  ...defaultPushSettings,
};

const defaultCloudflareConfig: EmailCloudflareConfigValue = {
  provider: "CLOUDFLARE",
  isEnabled: false,
  fromEmail: "",
  fromName: "",
  replyTo: "",
  cloudflareBindingName: "",
  cloudflareDestinationAddress: "",
  cloudflareAllowedDestinationAddresses: [],
  ...defaultPushSettings,
};

const defaultTemplates: Record<EmailScene, EmailTemplateValue> = {
  TEST: {
    scene: "TEST",
    name: "测试邮件",
    subject: "[{{siteName}}] 测试邮件",
    content: "这是一封测试邮件。\n\n站点：{{siteName}}\n发送时间：{{sentAt}}\n\n{{customContent}}",
    isEnabled: true,
  },
  ORDER_PAID: {
    scene: "ORDER_PAID",
    name: "支付成功通知",
    subject: "[{{siteName}}] 订单 {{orderNo}} 支付成功",
    content: "您的订单已支付成功。\n\n订单号：{{orderNo}}\n商品：{{productName}}\n金额：{{amount}}\n查询地址：{{queryUrl}}\n\n{{footerText}}",
    isEnabled: true,
  },
  DELIVERY_SUCCESS: {
    scene: "DELIVERY_SUCCESS",
    name: "发货成功通知",
    subject: "[{{siteName}}] 订单 {{orderNo}} 已发货",
    content: "您的订单已完成发货。\n\n订单号：{{orderNo}}\n商品：{{productName}}\n数量：{{quantity}}\n发货内容：\n{{deliveryItems}}\n\n查询地址：{{queryUrl}}\n{{supportContact}}",
    isEnabled: true,
  },
  DELIVERY_FAILED: {
    scene: "DELIVERY_FAILED",
    name: "发货失败通知",
    subject: "[{{siteName}}] 订单 {{orderNo}} 发货失败",
    content: "订单发货失败，请尽快处理。\n\n订单号：{{orderNo}}\n商品：{{productName}}\n失败原因：{{errorMessage}}\n\n查询地址：{{queryUrl}}\n{{supportContact}}",
    isEnabled: true,
  },
};

function getEmailContext() {
  return getContext<{ prisma: PrismaClient }>();
}

function getDefaultConfig(provider: EmailChannel): EmailConfigValue {
  if (provider === "API") return defaultApiConfig;
  if (provider === "SMTP") return defaultSmtpConfig;
  return defaultCloudflareConfig;
}

function normalizeEmailConfig(record: Awaited<ReturnType<typeof getEmailConfigRecord>>, provider: EmailChannel): EmailConfigValue {
  const defaults = getDefaultConfig(provider);
  if (!record) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(record.configJson) as Partial<EmailConfigValue>;
    return {
      ...defaults,
      ...parsed,
      provider,
      isEnabled: record.isEnabled,
    } as EmailConfigValue;
  } catch {
    return {
      ...defaults,
      isEnabled: record.isEnabled,
    } as EmailConfigValue;
  }
}

function normalizeEmailTemplate(record: EmailTemplateRecord | undefined, scene: EmailScene): EmailTemplateValue {
  const defaults = defaultTemplates[scene];
  if (!record) {
    return defaults;
  }

  return {
    scene,
    name: record.name,
    subject: record.subject,
    content: record.content,
    isEnabled: record.isEnabled,
  };
}

function renderTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => values[key] ?? "");
}

function formatMetricValue(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

function getQueryUrl(baseOrigin: string, orderNo: string, token: string) {
  return `${baseOrigin}/order/${encodeURIComponent(orderNo)}?token=${encodeURIComponent(token)}`;
}

function buildDeliveryItems(items: string[]) {
  if (!items.length) {
    return "暂无发货内容";
  }

  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function buildHtmlContent(text: string) {
  const escaped = text.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char] || char));
  return `<html><body><pre style="white-space:pre-wrap;font-family:ui-monospace, SFMono-Regular, monospace;">${escaped}</pre></body></html>`;
}

async function createLog(prisma: PrismaClient, input: {
  orderId?: number;
  provider: EmailChannel;
  apiProvider?: "BREVO" | "MAILJET" | null;
  scene: EmailScene;
  status: "SUCCESS" | "FAILED";
  toEmail: string;
  subject: string;
  messageId?: string;
  error?: string;
  triggeredBy?: string;
}) {
  await createEmailLogRecord(prisma, {
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
  });
}

async function getActiveEmailConfig(prisma: PrismaClient) {
  const records = await listEmailConfigRecords(prisma);
  const activeRecord = records.find((record: EmailConfigRecord) => record.isEnabled);
  if (!activeRecord) {
    throw badRequestError("请先启用一个邮件发送分类", "EMAIL_CHANNEL_NOT_ENABLED");
  }

  return normalizeEmailConfig(activeRecord, activeRecord.provider as EmailChannel);
}

async function getEmailBaseValues(prisma: PrismaClient) {
  const site = await getSiteSetting(prisma);
  const baseOrigin = site.siteUrl?.trim().replace(/\/+$/, "") || "";
  if (!baseOrigin) {
    throw badRequestError("站点设置缺少网站地址", "SITE_URL_MISSING");
  }

  return {
    siteName: site.siteName,
    footerText: site.footerText || "",
    supportContact: site.supportContact ? `客服联系方式：${site.supportContact}` : "",
    baseOrigin,
  };
}

async function sendByChannel(config: EmailConfigValue, input: {
  toEmail: string;
  subject: string;
  text: string;
  html: string;
}) {
  if (config.provider === "API") {
    const adapter = createApiEmailAdapter(config);
    const result = await adapter.send({
      toEmail: input.toEmail,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: config.replyTo,
    });

    return {
      provider: config.provider,
      apiProvider: config.apiProvider,
      messageId: result.messageId,
    };
  }

  if (config.provider === "SMTP") {
    throw badRequestError("当前版本暂未在 Worker 中实现 SMTP 直连发送，请先使用 API 分类", "SMTP_NOT_IMPLEMENTED");
  }

  throw badRequestError("当前版本暂未接入 CloudFlare Email Send binding 的运行时发送，请先使用 API 分类", "CLOUDFLARE_NOT_IMPLEMENTED");
}

async function sendSceneEmail(prisma: PrismaClient, input: {
  scene: EmailScene;
  toEmail: string;
  values: Record<string, string>;
  orderId?: number;
  triggeredBy?: string;
}) {
  const config = await getActiveEmailConfig(prisma);
  const templates = await listEmailTemplateRecords(prisma);
  const template = normalizeEmailTemplate(templates.find((item: EmailTemplateRecord) => item.scene === input.scene), input.scene);

  if (!template) {
    return { skipped: true };
  }

  const subject = renderTemplate(template.subject, input.values);
  const text = renderTemplate(template.content, input.values);
  const html = buildHtmlContent(text);

  try {
    const result = await sendByChannel(config, {
      toEmail: input.toEmail,
      subject,
      text,
      html,
    });

    await createLog(prisma, {
      orderId: input.orderId,
      provider: result.provider,
      apiProvider: result.apiProvider ?? null,
      scene: input.scene,
      status: "SUCCESS",
      toEmail: input.toEmail,
      subject,
      messageId: result.messageId,
      triggeredBy: input.triggeredBy,
    });

    return {
      skipped: false,
      subject,
      messageId: result.messageId,
    };
  } catch (error) {
    const message = getErrorMessage(error, "邮件发送失败");
    await createLog(prisma, {
      orderId: input.orderId,
      provider: config.provider,
      apiProvider: config.provider === "API" ? config.apiProvider : null,
      scene: input.scene,
      status: "FAILED",
      toEmail: input.toEmail,
      subject,
      error: message,
      triggeredBy: input.triggeredBy,
    });
    logger.error(error instanceof Error ? error : String(error), {
      event: "email.send.failed",
      provider: config.provider,
      apiProvider: config.provider === "API" ? config.apiProvider : undefined,
      scene: input.scene,
      toEmail: input.toEmail,
    });
    throw error;
  }
}

export async function getEmailManagementData(prisma?: PrismaClient) {
  const client = prisma ?? getEmailContext().prisma;
  const [configRecords, templateRecords, logRecords] = await Promise.all([
    listEmailConfigRecords(client),
    listEmailTemplateRecords(client),
    listEmailLogRecords(client, 100),
  ]);

  const configs = Object.fromEntries(
    emailChannels.map((provider) => [provider, normalizeEmailConfig(configRecords.find((item: EmailConfigRecord) => item.provider === provider) ?? null, provider)]),
  ) as Record<EmailChannel, EmailConfigValue>;

  const templates = emailScenes.map((scene) => normalizeEmailTemplate(templateRecords.find((item: EmailTemplateRecord) => item.scene === scene), scene));

  const statsMap = {
    total: logRecords.length,
    success: logRecords.filter((item: EmailLogRecord) => item.status === "SUCCESS").length,
    failed: logRecords.filter((item: EmailLogRecord) => item.status === "FAILED").length,
    test: logRecords.filter((item: EmailLogRecord) => item.scene === "TEST").length,
  };

  const metrics: EmailOverviewMetric[] = [
    { label: "发送总数", value: formatMetricValue(statsMap.total) },
    { label: "成功次数", value: formatMetricValue(statsMap.success) },
    { label: "失败次数", value: formatMetricValue(statsMap.failed) },
    { label: "测试邮件", value: formatMetricValue(statsMap.test) },
  ];

  const logs: EmailLogItem[] = logRecords.map((item: EmailLogRecord) => ({
    id: item.id,
    provider: item.provider as EmailChannel,
    apiProvider: item.apiProvider as "BREVO" | "MAILJET" | null,
    scene: item.scene as EmailScene,
    status: item.status,
    toEmail: item.toEmail,
    subject: item.subject,
    messageId: item.messageId,
    error: item.error,
    triggeredBy: item.triggeredBy,
    createdAt: item.createdAt.toISOString(),
  }));

  return {
    configs,
    templates,
    logs,
    metrics,
  };
}

export async function saveEmailPushSettings(input: {
  customerSendOrderPaidEmail: boolean;
  customerSendDeliverySuccessEmail: boolean;
  customerSendDeliveryFailedEmail: boolean;
  adminSendOrderPaidEmail: boolean;
  adminSendDeliverySuccessEmail: boolean;
  adminSendDeliveryFailedEmail: boolean;
}) {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;
  const adminId = Number(adminContext.session?.user?.id);

  const records = await prisma.emailConfig.findMany();
  
  for (const record of records) {
    let configJson: Record<string, unknown> = {};
    try {
      configJson = JSON.parse(record.configJson);
    } catch {
      configJson = {};
    }
    configJson.customerSendOrderPaidEmail = Boolean(input.customerSendOrderPaidEmail);
    configJson.customerSendDeliverySuccessEmail = Boolean(input.customerSendDeliverySuccessEmail);
    configJson.customerSendDeliveryFailedEmail = Boolean(input.customerSendDeliveryFailedEmail);
    configJson.adminSendOrderPaidEmail = Boolean(input.adminSendOrderPaidEmail);
    configJson.adminSendDeliverySuccessEmail = Boolean(input.adminSendDeliverySuccessEmail);
    configJson.adminSendDeliveryFailedEmail = Boolean(input.adminSendDeliveryFailedEmail);
    
    await prisma.emailConfig.update({
      where: { id: record.id },
      data: { configJson: JSON.stringify(configJson) }
    });
  }

  await logAdminOperation(
    {
      action: "SAVE_EMAIL_PUSH_SETTINGS",
      targetType: "EmailConfig",
      detail: `updated`,
    },
    {
      prisma,
      adminId,
    },
  );

  return true;
}

export async function activateEmailProvider(provider: EmailChannel) {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;
  const adminId = Number(adminContext.session?.user?.id);

  await prisma.emailConfig.updateMany({
    where: { provider: { not: provider } },
    data: { isEnabled: false },
  });

  const record = await prisma.emailConfig.findUnique({ where: { provider } });
  if (record) {
    await prisma.emailConfig.update({
      where: { provider },
      data: { isEnabled: true },
    });
  } else {
    throw badRequestError(`配置 ${provider} 不存在，请先保存配置`, "EMAIL_CONFIG_NOT_FOUND");
  }

  await logAdminOperation(
    {
      action: "ACTIVATE_EMAIL_PROVIDER",
      targetType: "EmailConfig",
      targetId: provider,
      detail: `activated`,
    },
    {
      prisma,
      adminId,
    },
  );

  return true;
}

export async function saveEmailConfig(input: EmailConfigValue) {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;
  const adminId = Number(adminContext.session?.user?.id);
  const validated = validateEmailConfigInput(input);

  let config: Record<string, unknown>;
  if (validated.provider === "API") {
    const apiInput = input as EmailApiConfigValue;
    config = {
      apiProvider: apiInput.apiProvider,
      fromEmail: apiInput.fromEmail.trim(),
      fromName: apiInput.fromName?.trim() || "",
      replyTo: apiInput.replyTo?.trim() || "",
      apiBaseUrl: apiInput.apiBaseUrl.trim(),
      apiKey: apiInput.apiKey?.trim() || "",
      secretKey: apiInput.secretKey?.trim() || "",
      timeoutMs: Number(apiInput.timeoutMs || 10000),
      customerSendOrderPaidEmail: Boolean(apiInput.customerSendOrderPaidEmail),
      customerSendDeliverySuccessEmail: Boolean(apiInput.customerSendDeliverySuccessEmail),
      customerSendDeliveryFailedEmail: Boolean(apiInput.customerSendDeliveryFailedEmail),
      adminSendOrderPaidEmail: Boolean(apiInput.adminSendOrderPaidEmail),
      adminSendDeliverySuccessEmail: Boolean(apiInput.adminSendDeliverySuccessEmail),
      adminSendDeliveryFailedEmail: Boolean(apiInput.adminSendDeliveryFailedEmail),
    };
  } else if (validated.provider === "SMTP") {
    const smtpInput = input as EmailSmtpConfigValue;
    config = {
      fromEmail: smtpInput.fromEmail.trim(),
      fromName: smtpInput.fromName?.trim() || "",
      replyTo: smtpInput.replyTo?.trim() || "",
      smtpHost: smtpInput.smtpHost?.trim() || "",
      smtpPort: Number(smtpInput.smtpPort || 0),
      smtpSecure: Boolean(smtpInput.smtpSecure),
      smtpUsername: smtpInput.smtpUsername?.trim() || "",
      smtpPassword: smtpInput.smtpPassword?.trim() || "",
      customerSendOrderPaidEmail: Boolean(smtpInput.customerSendOrderPaidEmail),
      customerSendDeliverySuccessEmail: Boolean(smtpInput.customerSendDeliverySuccessEmail),
      customerSendDeliveryFailedEmail: Boolean(smtpInput.customerSendDeliveryFailedEmail),
      adminSendOrderPaidEmail: Boolean(smtpInput.adminSendOrderPaidEmail),
      adminSendDeliverySuccessEmail: Boolean(smtpInput.adminSendDeliverySuccessEmail),
      adminSendDeliveryFailedEmail: Boolean(smtpInput.adminSendDeliveryFailedEmail),
    };
  } else {
    const cloudflareInput = input as EmailCloudflareConfigValue;
    config = {
      fromEmail: cloudflareInput.fromEmail.trim(),
      fromName: cloudflareInput.fromName?.trim() || "",
      replyTo: cloudflareInput.replyTo?.trim() || "",
      cloudflareBindingName: cloudflareInput.cloudflareBindingName?.trim() || "",
      cloudflareDestinationAddress: cloudflareInput.cloudflareDestinationAddress?.trim() || "",
      cloudflareAllowedDestinationAddresses: cloudflareInput.cloudflareAllowedDestinationAddresses ?? [],
      customerSendOrderPaidEmail: Boolean(cloudflareInput.customerSendOrderPaidEmail),
      customerSendDeliverySuccessEmail: Boolean(cloudflareInput.customerSendDeliverySuccessEmail),
      customerSendDeliveryFailedEmail: Boolean(cloudflareInput.customerSendDeliveryFailedEmail),
      adminSendOrderPaidEmail: Boolean(cloudflareInput.adminSendOrderPaidEmail),
      adminSendDeliverySuccessEmail: Boolean(cloudflareInput.adminSendDeliverySuccessEmail),
      adminSendDeliveryFailedEmail: Boolean(cloudflareInput.adminSendDeliveryFailedEmail),
    };
  }

  const existingRecord = await prisma.emailConfig.findUnique({
    where: { provider: validated.provider },
  });

  const record = await upsertEmailConfigRecord(prisma, validated.provider, {
    name: getChannelDisplayName(validated.provider),
    isEnabled: existingRecord?.isEnabled ?? false,
    configJson: JSON.stringify(config),
  });

  await logAdminOperation(
    {
      action: "SAVE_EMAIL_CONFIG",
      targetType: "EmailConfig",
      targetId: input.provider,
      detail: `updated`,
    },
    {
      prisma,
      adminId,
    },
  );

  return normalizeEmailConfig(record, validated.provider);
}

export async function saveEmailTemplate(input: EmailTemplateValue) {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;
  const adminId = Number(adminContext.session?.user?.id);
  const validated = validateEmailTemplateInput(input);

  const existingRecord = await prisma.emailTemplate.findUnique({
    where: { scene: validated.scene as EmailScene },
  });

  const record = await upsertEmailTemplateRecord(prisma, validated.scene as EmailScene, {
    name: validated.name,
    subject: validated.subject,
    content: validated.content,
    isEnabled: existingRecord?.isEnabled ?? true,
  });

  await logAdminOperation(
    {
      action: "SAVE_EMAIL_TEMPLATE",
      targetType: "EmailTemplate",
      targetId: validated.scene,
      detail: validated.name,
    },
    {
      prisma,
      adminId,
    },
  );

  return normalizeEmailTemplate(record, validated.scene as EmailScene);
}

export async function sendTestEmail(input: {
  toEmail: string;
  customContent?: string;
}) {
  const adminContext = getAdminContext();
  const { prisma } = adminContext;
  const adminId = Number(adminContext.session?.user?.id);
  const validated = validateTestEmailInput(input);
  const baseValues = await getEmailBaseValues(prisma);

  const result = await sendSceneEmail(prisma, {
    scene: "TEST",
    toEmail: validated.toEmail,
    values: {
      siteName: baseValues.siteName,
      sentAt: new Date().toLocaleString("zh-CN"),
      customContent: validated.customContent,
    },
    triggeredBy: `admin:${adminId || 0}`,
  });

  await logAdminOperation(
    {
      action: "SEND_TEST_EMAIL",
      targetType: "EmailLog",
      detail: `to=${validated.toEmail}`,
    },
    {
      prisma,
      adminId,
    },
  );

  return result;
}

export async function notifyOrderPaid(input: {
  prisma?: PrismaClient;
  orderId: number;
  orderNo: string;
  queryToken: string;
  productName: string;
  amount: number;
  toEmail?: string | null;
}) {
  const prisma = input.prisma ?? getEmailContext().prisma;
  const config = await getActiveEmailConfig(prisma).catch(() => null);
  if (!config) return { skipped: true };

  const baseValues = await getEmailBaseValues(prisma);
  const values = {
    siteName: baseValues.siteName,
    orderNo: input.orderNo,
    productName: input.productName,
    amount: (input.amount / 100).toFixed(2),
    queryUrl: getQueryUrl(baseValues.baseOrigin, input.orderNo, input.queryToken),
    footerText: baseValues.footerText,
  };

  const tasks: Promise<any>[] = [];

  if (input.toEmail && config.customerSendOrderPaidEmail) {
    tasks.push(
      sendSceneEmail(prisma, {
        scene: "ORDER_PAID",
        toEmail: input.toEmail,
        orderId: input.orderId,
        triggeredBy: "payment_notify",
        values,
      }).catch(e => logger.error("Customer notifyOrderPaid failed:", e))
    );
  }

  if (config.adminSendOrderPaidEmail) {
    const admins = await prisma.admin.findMany({ where: { status: "ACTIVE" } });
    for (const admin of admins) {
      if (admin.email) {
        tasks.push(
          sendSceneEmail(prisma, {
            scene: "ORDER_PAID",
            toEmail: admin.email,
            orderId: input.orderId,
            triggeredBy: "payment_notify",
            values,
          }).catch(e => logger.error("Admin notifyOrderPaid failed:", e))
        );
      }
    }
  }

  await Promise.all(tasks);
  return { processed: true };
}

export async function notifyDeliverySuccess(input: {
  prisma?: PrismaClient;
  orderId: number;
  orderNo: string;
  queryToken: string;
  productName: string;
  quantity: number;
  items: string[];
  toEmail?: string | null;
}) {
  const prisma = input.prisma ?? getEmailContext().prisma;
  const config = await getActiveEmailConfig(prisma).catch(() => null);
  if (!config) return { skipped: true };

  const baseValues = await getEmailBaseValues(prisma);
  const values = {
    siteName: baseValues.siteName,
    orderNo: input.orderNo,
    productName: input.productName,
    quantity: String(input.quantity),
    deliveryItems: buildDeliveryItems(input.items),
    queryUrl: getQueryUrl(baseValues.baseOrigin, input.orderNo, input.queryToken),
    supportContact: baseValues.supportContact,
  };

  const tasks: Promise<any>[] = [];

  if (input.toEmail && config.customerSendDeliverySuccessEmail) {
    tasks.push(
      sendSceneEmail(prisma, {
        scene: "DELIVERY_SUCCESS",
        toEmail: input.toEmail,
        orderId: input.orderId,
        triggeredBy: "delivery_success",
        values,
      }).catch(e => logger.error("Customer notifyDeliverySuccess failed:", e))
    );
  }

  if (config.adminSendDeliverySuccessEmail) {
    const admins = await prisma.admin.findMany({ where: { status: "ACTIVE" } });
    for (const admin of admins) {
      if (admin.email) {
        tasks.push(
          sendSceneEmail(prisma, {
            scene: "DELIVERY_SUCCESS",
            toEmail: admin.email,
            orderId: input.orderId,
            triggeredBy: "delivery_success",
            values,
          }).catch(e => logger.error("Admin notifyDeliverySuccess failed:", e))
        );
      }
    }
  }

  await Promise.all(tasks);
  return { processed: true };
}

export async function notifyDeliveryFailed(input: {
  prisma?: PrismaClient;
  orderId: number;
  orderNo: string;
  queryToken: string;
  productName: string;
  toEmail?: string | null;
  errorMessage: string;
}) {
  const prisma = input.prisma ?? getEmailContext().prisma;
  const config = await getActiveEmailConfig(prisma).catch(() => null);
  if (!config) return { skipped: true };

  const baseValues = await getEmailBaseValues(prisma);
  const values = {
    siteName: baseValues.siteName,
    orderNo: input.orderNo,
    productName: input.productName,
    errorMessage: input.errorMessage,
    queryUrl: getQueryUrl(baseValues.baseOrigin, input.orderNo, input.queryToken),
    supportContact: baseValues.supportContact,
  };

  const tasks: Promise<any>[] = [];

  if (input.toEmail && config.customerSendDeliveryFailedEmail) {
    tasks.push(
      sendSceneEmail(prisma, {
        scene: "DELIVERY_FAILED",
        toEmail: input.toEmail,
        orderId: input.orderId,
        triggeredBy: "delivery_failed",
        values,
      }).catch(e => logger.error("Customer notifyDeliveryFailed failed:", e))
    );
  }

  if (config.adminSendDeliveryFailedEmail) {
    const admins = await prisma.admin.findMany({ where: { status: "ACTIVE" } });
    for (const admin of admins) {
      if (admin.email) {
        tasks.push(
          sendSceneEmail(prisma, {
            scene: "DELIVERY_FAILED",
            toEmail: admin.email,
            orderId: input.orderId,
            triggeredBy: "delivery_failed",
            values,
          }).catch(e => logger.error("Admin notifyDeliveryFailed failed:", e))
        );
      }
    }
  }

  await Promise.all(tasks);
  return { processed: true };
}
