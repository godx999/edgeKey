<template>
  <section class="space-y-6">
    <div class="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
      <div>
        <h1 class="text-2xl font-bold">邮件管理</h1>
        <p class="text-sm text-base-content/70">配置邮件发送通道、推送开关、日志列表和模板。</p>
      </div>
      <!-- <div class="badge badge-outline">配置分类：API / SMTP / CloudFlare</div> -->
    </div>

    <div role="tablist" class="tabs tabs-box">
      <a role="tab" class="tab" :class="{ 'tab-active': activeTab === 'stats' }" @click="activeTab = 'stats'">统计</a>
      <a role="tab" class="tab" :class="{ 'tab-active': activeTab === 'config' }" @click="activeTab = 'config'">配置</a>
      <a role="tab" class="tab" :class="{ 'tab-active': activeTab === 'list' }" @click="activeTab = 'list'">列表</a>
      <a role="tab" class="tab" :class="{ 'tab-active': activeTab === 'template' }" @click="activeTab = 'template'">模板</a>
    </div>

    <section v-if="activeTab === 'stats'" class="space-y-4">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article v-for="metric in metrics" :key="metric.label" class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <div class="text-sm text-base-content/60">{{ metric.label }}</div>
            <div class="text-3xl font-bold">{{ metric.value }}</div>
          </div>
        </article>
      </div>
    </section>

    <section v-if="activeTab === 'config'" class="space-y-6">
      <!-- 1. 消息推送配置 -->
      <section class="card bg-base-100 shadow-sm">
        <div class="card-body space-y-4">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold">消息推送设置</h2>
              <p class="text-sm text-base-content/70">全局推送开关，对当前激活状态的邮局有效。</p>
            </div>
          </div>
          <div class="space-y-2">
            <h3 class="font-semibold text-base-content/80">发给客户</h3>
            <div class="grid gap-4 md:grid-cols-3">
              <label class="label cursor-pointer justify-start gap-3">
                <input v-model="pushSettings.customerSendOrderPaidEmail" type="checkbox" class="checkbox checkbox-primary" />
                <span class="label-text font-medium">支付成功发送</span>
              </label>
              <label class="label cursor-pointer justify-start gap-3">
                <input v-model="pushSettings.customerSendDeliverySuccessEmail" type="checkbox" class="checkbox checkbox-primary" />
                <span class="label-text font-medium">发货成功发送</span>
              </label>
              <label class="label cursor-pointer justify-start gap-3">
                <input v-model="pushSettings.customerSendDeliveryFailedEmail" type="checkbox" class="checkbox checkbox-primary" />
                <span class="label-text font-medium">发货失败发送</span>
              </label>
            </div>
          </div>
          
          <div class="space-y-2 mt-4">
            <h3 class="font-semibold text-base-content/80">发给管理员 (需在个人资料配置邮箱)</h3>
            <div class="grid gap-4 md:grid-cols-3">
              <label class="label cursor-pointer justify-start gap-3">
                <input v-model="pushSettings.adminSendOrderPaidEmail" type="checkbox" class="checkbox checkbox-primary" />
                <span class="label-text font-medium">支付成功发送</span>
              </label>
              <label class="label cursor-pointer justify-start gap-3">
                <input v-model="pushSettings.adminSendDeliverySuccessEmail" type="checkbox" class="checkbox checkbox-primary" />
                <span class="label-text font-medium">发货成功发送</span>
              </label>
              <label class="label cursor-pointer justify-start gap-3">
                <input v-model="pushSettings.adminSendDeliveryFailedEmail" type="checkbox" class="checkbox checkbox-primary" />
                <span class="label-text font-medium">发货失败发送</span>
              </label>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <button class="btn btn-primary" :disabled="savingPushSettings" @click="handleSavePushSettings">
              {{ savingPushSettings ? '保存中...' : '保存推送设置' }}
            </button>
            <span v-if="pushSettingsMessage" class="text-sm" :class="pushSettingsError ? 'text-error' : 'text-success'">
              {{ pushSettingsMessage }}
            </span>
          </div>
        </div>
      </section>

      <!-- 2. 邮局配置表单 -->
      <section class="card bg-base-100 shadow-sm" id="provider-form">
        <div class="card-body space-y-4">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold">邮局配置</h2>
              <p class="text-sm text-base-content/70">配置对应的发送通道参数，保存后可在下方列表中测试和激活。</p>
            </div>
          </div>

          <label class="flex flex-col gap-1.5 max-w-xs">
            <span class="label-text font-medium">选择邮件类型</span>
            <select v-model="activeProviderFormType" class="select select-bordered w-full">
              <option value="API">API</option>
              <option value="SMTP">SMTP</option>
              <option value="CLOUDFLARE">Cloudflare</option>
            </select>
          </label>

          <div class="divider my-0"></div>

          <!-- API Form -->
          <div v-if="activeProviderFormType === 'API'" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label class="flex flex-col gap-1.5">
              <span class="label-text font-medium">API 服务商</span>
              <select v-model="apiForm.apiProvider" class="select select-bordered w-full">
                <option value="BREVO">Brevo</option>
                <option value="MAILJET">Mailjet</option>
              </select>
            </label>
            <label class="flex flex-col gap-1.5"><span class="label-text font-medium">发件邮箱</span><input v-model="apiForm.fromEmail" class="input input-bordered w-full" placeholder="admin@example.com" /></label>
            <label class="flex flex-col gap-1.5"><span class="label-text font-medium">发件人名称</span><input v-model="apiForm.fromName" class="input input-bordered w-full" /></label>
            <label class="flex flex-col gap-1.5"><span class="label-text font-medium">回复邮箱</span><input v-model="apiForm.replyTo" class="input input-bordered w-full" /></label>
            <label class="flex flex-col gap-1.5"><span class="label-text font-medium">API 地址</span><input v-model="apiForm.apiBaseUrl" class="input input-bordered w-full" :placeholder="apiForm.apiProvider === 'BREVO' ? 'https://api.brevo.com/v3/smtp/email' : 'https://api.mailjet.com/v3.1/send'" /></label>
            <label class="flex flex-col gap-1.5"><span class="label-text font-medium">API Key</span><input v-model="apiForm.apiKey" class="input input-bordered w-full" /></label>
            <label class="flex flex-col gap-1.5"><span class="label-text font-medium">Secret Key</span><input v-model="apiForm.secretKey" class="input input-bordered w-full" :disabled="apiForm.apiProvider !== 'MAILJET'" :placeholder="apiForm.apiProvider === 'MAILJET' ? 'Mailjet Secret Key' : 'Brevo 不需要该字段'" /></label>
            <label class="flex flex-col gap-1.5"><span class="label-text font-medium">超时(ms)</span><input v-model.number="apiForm.timeoutMs" type="number" class="input input-bordered w-full" /></label>
          </div>

          <!-- SMTP Form -->
          <div v-if="activeProviderFormType === 'SMTP'">
            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mb-4">
              <label class="flex flex-col gap-1.5"><span class="label-text font-medium">发件邮箱</span><input v-model="smtpForm.fromEmail" class="input input-bordered w-full" /></label>
              <label class="flex flex-col gap-1.5"><span class="label-text font-medium">发件人名称</span><input v-model="smtpForm.fromName" class="input input-bordered w-full" /></label>
              <label class="flex flex-col gap-1.5"><span class="label-text font-medium">回复邮箱</span><input v-model="smtpForm.replyTo" class="input input-bordered w-full" /></label>
              <label class="flex flex-col gap-1.5"><span class="label-text font-medium">SMTP Host</span><input v-model="smtpForm.smtpHost" class="input input-bordered w-full" placeholder="smtp.example.com" /></label>
              <label class="flex flex-col gap-1.5"><span class="label-text font-medium">SMTP Port</span><input v-model.number="smtpForm.smtpPort" type="number" class="input input-bordered w-full" /></label>
              <label class="flex flex-col gap-1.5"><span class="label-text font-medium">SMTP 用户名</span><input v-model="smtpForm.smtpUsername" class="input input-bordered w-full" /></label>
              <label class="flex flex-col gap-1.5"><span class="label-text font-medium">SMTP 密码</span><input v-model="smtpForm.smtpPassword" class="input input-bordered w-full" /></label>
            </div>
            <label class="label cursor-pointer justify-start gap-3 w-fit">
              <input v-model="smtpForm.smtpSecure" type="checkbox" class="checkbox checkbox-primary" />
              <span class="label-text font-medium">使用 SMTPS / SSL</span>
            </label>
          </div>

          <!-- Cloudflare Form -->
          <div v-if="activeProviderFormType === 'CLOUDFLARE'" class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label class="flex flex-col gap-1.5"><span class="label-text font-medium">发件邮箱</span><input v-model="cloudflareForm.fromEmail" class="input input-bordered w-full" placeholder="sender@your-domain.com" /></label>
              <label class="flex flex-col gap-1.5"><span class="label-text font-medium">发件人名称</span><input v-model="cloudflareForm.fromName" class="input input-bordered w-full" /></label>
              <label class="flex flex-col gap-1.5"><span class="label-text font-medium">回复邮箱</span><input v-model="cloudflareForm.replyTo" class="input input-bordered w-full" /></label>
              <label class="flex flex-col gap-1.5"><span class="label-text font-medium">Binding 名称</span><input v-model="cloudflareForm.cloudflareBindingName" class="input input-bordered w-full" placeholder="SEB" /></label>
              <label class="flex flex-col gap-1.5"><span class="label-text font-medium">目标邮箱</span><input v-model="cloudflareForm.cloudflareDestinationAddress" class="input input-bordered w-full" placeholder="you@example.com" /></label>
            </div>
            <label class="flex flex-col gap-1.5">
              <span class="label-text font-medium">允许目标邮箱列表</span>
              <textarea v-model="cloudflareAllowedText" class="textarea textarea-bordered w-full" rows="4" placeholder="一行一个邮箱"></textarea>
            </label>
          </div>

          <div class="flex flex-wrap items-center gap-3 mt-4">
            <button class="btn btn-primary" :disabled="savingChannel === activeProviderFormType" @click="handleSaveConfig(activeProviderFormType)">
              {{ savingChannel === activeProviderFormType ? '保存中...' : '保存/更新配置到列表' }}
            </button>
            <span v-if="channelMessages[activeProviderFormType]" class="text-sm" :class="channelErrors[activeProviderFormType] ? 'text-error' : 'text-success'">
              {{ channelMessages[activeProviderFormType] }}
            </span>
          </div>
        </div>
      </section>

      <!-- 3. 邮局列表 -->
      <section class="card bg-base-100 shadow-sm">
        <div class="card-body space-y-4">
          <h2 class="text-xl font-semibold">邮局列表</h2>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>类型</th>
                  <th>发件邮箱</th>
                  <th>服务商/地址</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="channel in ['API', 'SMTP', 'CLOUDFLARE']" :key="channel">
                  <td>{{ getChannelLabel(channel) }}</td>
                  <td>{{ getChannelForm(channel as any).fromEmail || '-' }}</td>
                  <td>
                    <span v-if="channel === 'API'">{{ getChannelForm(channel).apiProvider || '-' }}</span>
                    <span v-else-if="channel === 'SMTP'">{{ getChannelForm(channel).smtpHost || '-' }}</span>
                    <span v-else>{{ getChannelForm(channel).cloudflareBindingName || '-' }}</span>
                  </td>
                  <td>
                    <span class="badge" :class="getChannelForm(channel as any).isEnabled ? 'badge-success' : 'badge-ghost'">
                      {{ getChannelForm(channel as any).isEnabled ? '已激活' : '未激活' }}
                    </span>
                  </td>
                  <td>
                    <div class="flex items-center gap-2">
                      <button class="btn btn-xs btn-outline" @click="editProvider(channel as any)">编辑</button>
                      <button class="btn btn-xs btn-outline" @click="openTestModal(channel as any)">测试发送</button>
                      <button 
                        class="btn btn-xs" 
                        :class="getChannelForm(channel as any).isEnabled ? 'btn-disabled' : 'btn-primary'"
                        @click="handleActivateProvider(channel as any)"
                      >
                        {{ getChannelForm(channel as any).isEnabled ? '当前激活' : '激活' }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </section>

    <!-- 测试发送弹窗 -->
    <dialog id="test-email-modal" class="modal" :class="{ 'modal-open': showTestModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">测试发送 ({{ getChannelLabel(testingChannel) }})</h3>
        <div class="py-4 space-y-4">
          <label class="flex flex-col gap-1.5">
            <span class="label-text font-medium">测试收件邮箱</span>
            <input v-model="testToEmail" class="input input-bordered w-full" placeholder="receiver@example.com" />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="label-text font-medium">测试内容</span>
            <textarea v-model="testContent" class="textarea textarea-bordered w-full" rows="5" placeholder="这是从 Cloudflare 发出的第一封邮件。"></textarea>
          </label>
          <div v-if="testModalMessage" class="text-sm mt-2" :class="testModalError ? 'text-error' : 'text-success'">
            {{ testModalMessage }}
          </div>
        </div>
        <div class="modal-action">
          <form method="dialog" class="flex gap-2">
            <button class="btn" @click="closeTestModal" type="button">关闭</button>
            <button class="btn btn-primary" :disabled="isTesting" @click="handleSendTest(testingChannel)" type="button">
              {{ isTesting ? '发送中...' : '发送' }}
            </button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeTestModal">关闭</button>
      </form>
    </dialog>

    <section v-if="activeTab === 'list'" class="card bg-base-100 shadow-sm">
      <div class="card-body space-y-4">
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>#</th>
                <th>时间</th>
                <th>分类</th>
                <th>API服务商</th>
                <th>场景</th>
                <th>状态</th>
                <th>收件人</th>
                <th>主题</th>
                <th>触发来源</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!logs.length"><td colspan="10" class="text-center text-base-content/60">暂无邮件日志</td></tr>
              <tr v-for="(log, index) in logs" :key="log.id">
                <th>{{ index + 1 }}</th>
                <td class="whitespace-nowrap">{{ formatDate(log.createdAt) }}</td>
                <td class="whitespace-nowrap">{{ getChannelLabel(log.provider) }}</td>
                <td class="whitespace-nowrap">{{ log.apiProvider || '-' }}</td>
                <td class="whitespace-nowrap">{{ getSceneLabel(log.scene) }}</td>
                <td>
                  <span class="badge whitespace-nowrap" :class="log.status === 'SUCCESS' ? 'badge-success' : 'badge-error'">
                    {{ log.status === 'SUCCESS' ? '成功' : '失败' }}
                  </span>
                </td>
                <td class="whitespace-nowrap">{{ log.toEmail }}</td>
                <td class="max-w-xs truncate" :title="log.subject">{{ log.subject }}</td>
                <td class="whitespace-nowrap">{{ log.triggeredBy || '-' }}</td>
                <td class="max-w-xs truncate" :title="log.error || log.messageId || ''">{{ log.error || log.messageId || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section v-if="activeTab === 'template'" class="space-y-4">
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body space-y-4 p-4 md:p-6">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold">邮件模板配置</h2>
              <p class="text-sm text-base-content/70">选择不同场景进行编辑</p>
            </div>
          </div>

          <label class="flex flex-col gap-1.5 max-w-xs">
            <span class="label-text font-medium">选择模板场景</span>
            <select v-model="activeTemplateScene" class="select select-bordered w-full">
              <option v-for="t in templateList" :key="t.scene" :value="t.scene">
                {{ getSceneLabel(t.scene) }}
              </option>
            </select>
          </label>

          <div class="divider my-0"></div>

          <div v-if="activeTemplate" class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <label class="flex flex-col gap-1.5">
                <span class="label-text font-medium">模板名称</span>
                <input v-model="activeTemplate.name" class="input input-bordered w-full" />
              </label>
              <label class="flex flex-col gap-1.5">
                <span class="label-text font-medium">邮件主题</span>
                <input v-model="activeTemplate.subject" class="input input-bordered w-full" />
              </label>
            </div>

            <label class="flex flex-col gap-1.5">
              <span class="label-text font-medium">邮件内容</span>
              <textarea v-model="activeTemplate.content" class="textarea textarea-bordered w-full font-mono text-sm leading-tight" rows="8"></textarea>
            </label>

            <div class="flex items-center gap-3">
              <button class="btn btn-primary" :disabled="savingTemplate === activeTemplate.scene" @click="handleSaveTemplate(activeTemplate.scene)">
                {{ savingTemplate === activeTemplate.scene ? '保存中...' : '保存模板' }}
              </button>
              <span v-if="templateMessages[activeTemplate.scene]" class="text-sm" :class="templateErrors[activeTemplate.scene] ? 'text-error' : 'text-success'">
                {{ templateMessages[activeTemplate.scene] }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { normalizeTelefuncError } from "../../../lib/app-error";
import { reactive, ref, computed } from "vue";
import { useData } from "vike-vue/useData";
import { onSaveEmailConfig, onSaveEmailPushSettings, onActivateEmailProvider } from "./saveEmailConfig.telefunc";
import { onSaveEmailTemplate } from "./saveEmailTemplate.telefunc";
import { onSendTestEmail } from "./sendTestEmail.telefunc";
import type { Data } from "./+data";

const { configs, templates, logs, metrics } = useData<Data>();

const activeTab = ref<"stats" | "config" | "list" | "template">("stats");

const apiForm = reactive({ ...(configs?.API as any) });
const smtpForm = reactive({ ...(configs?.SMTP as any) });
const cloudflareForm = reactive({ ...(configs?.CLOUDFLARE as any) });
const templateList = reactive(templates.map((item) => ({ ...item })));

const activeTemplateScene = ref<"TEST" | "ORDER_PAID" | "DELIVERY_SUCCESS" | "DELIVERY_FAILED">(templateList[0]?.scene || "TEST");
const activeTemplate = computed(() => {
  return templateList.find((t) => t.scene === activeTemplateScene.value) || templateList[0];
});

const activeProviderFormType = ref<"API" | "SMTP" | "CLOUDFLARE">("API");

const pushSettings = reactive({
  customerSendOrderPaidEmail: configs?.API?.customerSendOrderPaidEmail ?? configs?.SMTP?.customerSendOrderPaidEmail ?? configs?.CLOUDFLARE?.customerSendOrderPaidEmail ?? false,
  customerSendDeliverySuccessEmail: configs?.API?.customerSendDeliverySuccessEmail ?? false,
  customerSendDeliveryFailedEmail: configs?.API?.customerSendDeliveryFailedEmail ?? false,
  adminSendOrderPaidEmail: configs?.API?.adminSendOrderPaidEmail ?? configs?.SMTP?.adminSendOrderPaidEmail ?? configs?.CLOUDFLARE?.adminSendOrderPaidEmail ?? false,
  adminSendDeliverySuccessEmail: configs?.API?.adminSendDeliverySuccessEmail ?? false,
  adminSendDeliveryFailedEmail: configs?.API?.adminSendDeliveryFailedEmail ?? false,
});

const savingPushSettings = ref(false);
const pushSettingsMessage = ref("");
const pushSettingsError = ref(false);

const testToEmail = ref("");
const testContent = ref("嘿！API 跑通了\n\n这是从 Cloudflare 发出的第一封邮件。");
const cloudflareAllowedText = ref(Array.isArray((cloudflareForm as any).cloudflareAllowedDestinationAddresses) ? (cloudflareForm as any).cloudflareAllowedDestinationAddresses.join("\n") : "");

const savingChannel = ref<"API" | "SMTP" | "CLOUDFLARE" | "">("");
const testingChannel = ref<"API" | "SMTP" | "CLOUDFLARE" | "">("");
const channelMessages = reactive<Record<string, string>>({ API: "", SMTP: "", CLOUDFLARE: "" });
const channelErrors = reactive<Record<string, boolean>>({ API: false, SMTP: false, CLOUDFLARE: false });

const savingTemplate = ref<"TEST" | "ORDER_PAID" | "DELIVERY_SUCCESS" | "DELIVERY_FAILED" | "">("");
const templateMessages = reactive<Record<string, string>>({ TEST: "", ORDER_PAID: "", DELIVERY_SUCCESS: "", DELIVERY_FAILED: "" });
const templateErrors = reactive<Record<string, boolean>>({ TEST: false, ORDER_PAID: false, DELIVERY_SUCCESS: false, DELIVERY_FAILED: false });

const showTestModal = ref(false);
const isTesting = ref(false);
const testModalMessage = ref("");
const testModalError = ref(false);

function formatDate(value: string) {
  return new Date(value).toLocaleString("zh-CN");
}

function getSceneLabel(scene: string) {
  return ({ TEST: "测试邮件", ORDER_PAID: "支付成功", DELIVERY_SUCCESS: "发货成功", DELIVERY_FAILED: "发货失败" } as Record<string, string>)[scene] || scene;
}

function getChannelLabel(provider: string) {
  return ({ API: "API", SMTP: "SMTP", CLOUDFLARE: "CloudFlare" } as Record<string, string>)[provider] || provider;
}

function getChannelForm(channel: "API" | "SMTP" | "CLOUDFLARE") {
  if (channel === "API") return apiForm;
  if (channel === "SMTP") return smtpForm;
  return cloudflareForm;
}

async function handleSavePushSettings() {
  savingPushSettings.value = true;
  pushSettingsMessage.value = "";
  pushSettingsError.value = false;
  try {
    await onSaveEmailPushSettings({ ...pushSettings });
    // 同步到本地表单状态，避免下次保存邮局时覆盖
    apiForm.customerSendOrderPaidEmail = pushSettings.customerSendOrderPaidEmail;
    apiForm.customerSendDeliverySuccessEmail = pushSettings.customerSendDeliverySuccessEmail;
    apiForm.customerSendDeliveryFailedEmail = pushSettings.customerSendDeliveryFailedEmail;
    apiForm.adminSendOrderPaidEmail = pushSettings.adminSendOrderPaidEmail;
    apiForm.adminSendDeliverySuccessEmail = pushSettings.adminSendDeliverySuccessEmail;
    apiForm.adminSendDeliveryFailedEmail = pushSettings.adminSendDeliveryFailedEmail;

    smtpForm.customerSendOrderPaidEmail = pushSettings.customerSendOrderPaidEmail;
    smtpForm.customerSendDeliverySuccessEmail = pushSettings.customerSendDeliverySuccessEmail;
    smtpForm.customerSendDeliveryFailedEmail = pushSettings.customerSendDeliveryFailedEmail;
    smtpForm.adminSendOrderPaidEmail = pushSettings.adminSendOrderPaidEmail;
    smtpForm.adminSendDeliverySuccessEmail = pushSettings.adminSendDeliverySuccessEmail;
    smtpForm.adminSendDeliveryFailedEmail = pushSettings.adminSendDeliveryFailedEmail;

    cloudflareForm.customerSendOrderPaidEmail = pushSettings.customerSendOrderPaidEmail;
    cloudflareForm.customerSendDeliverySuccessEmail = pushSettings.customerSendDeliverySuccessEmail;
    cloudflareForm.customerSendDeliveryFailedEmail = pushSettings.customerSendDeliveryFailedEmail;
    cloudflareForm.adminSendOrderPaidEmail = pushSettings.adminSendOrderPaidEmail;
    cloudflareForm.adminSendDeliverySuccessEmail = pushSettings.adminSendDeliverySuccessEmail;
    cloudflareForm.adminSendDeliveryFailedEmail = pushSettings.adminSendDeliveryFailedEmail;
    
    pushSettingsMessage.value = "推送设置保存成功";
  } catch (error) {
    pushSettingsError.value = true;
    pushSettingsMessage.value = normalizeTelefuncError(error, "保存失败");
  } finally {
    savingPushSettings.value = false;
  }
}

async function handleSaveConfig(channel: "API" | "SMTP" | "CLOUDFLARE") {
  savingChannel.value = channel;
  channelMessages[channel] = "";
  channelErrors[channel] = false;

  try {
    const form = getChannelForm(channel) as any;
    const payload = {
      ...form,
      provider: channel,
      // 使用当前最新的推送设置
      customerSendOrderPaidEmail: pushSettings.customerSendOrderPaidEmail,
      customerSendDeliverySuccessEmail: pushSettings.customerSendDeliverySuccessEmail,
      customerSendDeliveryFailedEmail: pushSettings.customerSendDeliveryFailedEmail,
      adminSendOrderPaidEmail: pushSettings.adminSendOrderPaidEmail,
      adminSendDeliverySuccessEmail: pushSettings.adminSendDeliverySuccessEmail,
      adminSendDeliveryFailedEmail: pushSettings.adminSendDeliveryFailedEmail,
      cloudflareAllowedDestinationAddresses: channel === "CLOUDFLARE" ? cloudflareAllowedText.value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean) : undefined,
    };
    const result = await onSaveEmailConfig(payload);
    Object.assign(form, result);
    if (channel === "CLOUDFLARE") {
      cloudflareAllowedText.value = Array.isArray((result as any).cloudflareAllowedDestinationAddresses)
        ? (result as any).cloudflareAllowedDestinationAddresses.join("\n")
        : "";
    }
    channelMessages[channel] = "保存成功";
  } catch (error) {
    channelErrors[channel] = true;
    channelMessages[channel] = normalizeTelefuncError(error, "保存失败");
  } finally {
    savingChannel.value = "";
  }
}

function editProvider(channel: "API" | "SMTP" | "CLOUDFLARE") {
  activeProviderFormType.value = channel;
  document.getElementById("provider-form")?.scrollIntoView({ behavior: "smooth" });
}

async function handleActivateProvider(channel: "API" | "SMTP" | "CLOUDFLARE") {
  try {
    await onActivateEmailProvider(channel);
    apiForm.isEnabled = channel === "API";
    smtpForm.isEnabled = channel === "SMTP";
    cloudflareForm.isEnabled = channel === "CLOUDFLARE";
  } catch (error) {
    alert(normalizeTelefuncError(error, "激活失败"));
  }
}

function openTestModal(channel: "API" | "SMTP" | "CLOUDFLARE") {
  testingChannel.value = channel;
  showTestModal.value = true;
  testModalMessage.value = "";
  testModalError.value = false;
}

function closeTestModal() {
  showTestModal.value = false;
}

async function handleSendTest(channel: "API" | "SMTP" | "CLOUDFLARE") {
  isTesting.value = true;
  testModalMessage.value = "";
  testModalError.value = false;

  try {
    await handleSaveConfig(channel);
    await onSendTestEmail({ toEmail: testToEmail.value, customContent: testContent.value });
    testModalMessage.value = "测试邮件发送成功";
  } catch (error) {
    testModalError.value = true;
    testModalMessage.value = normalizeTelefuncError(error, "测试发送失败");
  } finally {
    isTesting.value = false;
  }
}

async function handleSaveTemplate(scene: "TEST" | "ORDER_PAID" | "DELIVERY_SUCCESS" | "DELIVERY_FAILED") {
  savingTemplate.value = scene;
  templateMessages[scene] = "";
  templateErrors[scene] = false;

  try {
    const target = templateList.find((item) => item.scene === scene);
    if (!target) return;
    const result = await onSaveEmailTemplate({ ...target });
    Object.assign(target, result);
    templateMessages[scene] = "保存成功";
  } catch (error) {
    templateErrors[scene] = true;
    templateMessages[scene] = normalizeTelefuncError(error, "保存失败");
  } finally {
    savingTemplate.value = "";
  }
}
</script>
