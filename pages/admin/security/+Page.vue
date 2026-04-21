<template>
  <section class="grid gap-6 lg:grid-cols-2">
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h2 class="card-title">认证密钥</h2>
        <p class="text-sm text-base-content/70">
          生产环境必须配置 `AUTH_SECRET` 或 `NEXTAUTH_SECRET`。本地开发可以通过 `.env` 注入，Cloudflare 生产环境建议使用 `wrangler secret put`。
        </p>
      </div>
    </div>

    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h2 class="card-title">登录限流</h2>
        <p class="text-sm text-base-content/70">
          当前管理员登录已启用基础请求限流。你也应在 Cloudflare 后台为 `/api/auth/callback/credentials` 配置 Rate Limiting / WAF 规则。
        </p>
      </div>
    </div>

    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h2 class="card-title">密码安全</h2>
        <p class="text-sm text-base-content/70">
          请在首次初始化完成后，立即前往“个人资料”修改默认管理员密码，并定期轮换高权限账号口令。
        </p>
        <a href="/admin/profile" class="btn btn-primary btn-sm w-fit">前往个人资料</a>
      </div>
    </div>

    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h2 class="card-title">支付安全</h2>
        <p class="text-sm text-base-content/70">
          支付日志会保留业务信息用于排查，但会对 `md5`、`key`、`secret`、`signature` 等敏感字段做脱敏处理。启用支付前，请先在“站点设置”配置网站地址。
        </p>
        <div class="flex gap-3">
          <a href="/admin/settings" class="btn btn-outline btn-sm">站点设置</a>
          <a href="/admin/payments" class="btn btn-primary btn-sm">支付配置</a>
        </div>
      </div>
    </div>
  </section>
</template>
