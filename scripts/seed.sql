INSERT INTO "Admin" ("username", "passwordHash", "nickname", "status")
VALUES ('admin', 'ac0e7d037817094e9e0b4441f9bae3209d67b02fa484917065f71b16109a1a78', '管理员', 'ACTIVE')
ON CONFLICT("username") DO UPDATE SET
  "passwordHash" = excluded."passwordHash",
  "nickname" = excluded."nickname",
  "status" = excluded."status";

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
{{supportContact}}', true)
ON CONFLICT("scene") DO NOTHING;

