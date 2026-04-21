CREATE TABLE "EmailConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "configJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "EmailConfig_provider_key" ON "EmailConfig"("provider");

CREATE TABLE "EmailTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scene" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "EmailTemplate_scene_key" ON "EmailTemplate"("scene");

CREATE TABLE "EmailLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER,
    "provider" TEXT NOT NULL,
    "apiProvider" TEXT,
    "scene" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "toEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "messageId" TEXT,
    "error" TEXT,
    "triggeredBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "EmailLog_provider_createdAt_idx" ON "EmailLog"("provider", "createdAt");
CREATE INDEX "EmailLog_scene_createdAt_idx" ON "EmailLog"("scene", "createdAt");
CREATE INDEX "EmailLog_status_createdAt_idx" ON "EmailLog"("status", "createdAt");
CREATE INDEX "EmailLog_orderId_idx" ON "EmailLog"("orderId");

INSERT INTO "EmailTemplate" ("scene", "name", "subject", "content", "isEnabled")
VALUES
  ('TEST', '测试邮件', '[{{siteName}}] 测试邮件', '这是一封测试邮件。
  
站点：{{siteName}}
发送时间：{{sentAt}}

{{customContent}}', true),
  ('ORDER_PAID', '支付成功通知', '[{{siteName}}] 订单 {{orderNo}} 支付成功', '您的订单已支付成功。

订单号：{{orderNo}}
商品：{{productName}}
金额：{{amount}}
查询地址：{{queryUrl}}

{{footerText}}', true),
  ('DELIVERY_SUCCESS', '发货成功通知', '[{{siteName}}] 订单 {{orderNo}} 已发货', '您的订单已完成发货。

订单号：{{orderNo}}
商品：{{productName}}
数量：{{quantity}}
发货内容：
{{deliveryItems}}

查询地址：{{queryUrl}}
{{supportContact}}', true),
  ('DELIVERY_FAILED', '发货失败通知', '[{{siteName}}] 订单 {{orderNo}} 发货失败', '订单发货失败，请尽快处理。

订单号：{{orderNo}}
商品：{{productName}}
失败原因：{{errorMessage}}

查询地址：{{queryUrl}}
{{supportContact}}', true);
