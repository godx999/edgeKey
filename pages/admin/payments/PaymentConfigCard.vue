<template>
  <section class="card bg-base-100 shadow-sm">
    <div class="card-body space-y-4">
      <div class="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
        <div>
          <h1 class="text-2xl font-bold">{{ title }}</h1>
          <p class="text-sm text-base-content/70">配置支付网关参数并控制该支付方式是否在前台展示。</p>
        </div>
        <label class="label cursor-pointer gap-3">
          <span class="label-text font-medium">启用</span>
          <input v-model="form.isEnabled" type="checkbox" class="toggle toggle-primary" />
        </label>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">显示名称</span>
          <input v-model="form.name" class="input input-bordered w-full" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">网关地址</span>
          <input v-model="form.baseUrl" class="input input-bordered w-full" placeholder="https://example.com" />
        </label>
      </div>

      <div v-if="provider === 'BEPUSDT'" class="grid gap-4 md:grid-cols-2">
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">App ID</span>
          <input v-model="form.appId" class="input input-bordered w-full" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">App Secret</span>
          <input v-model="form.appSecret" class="input input-bordered w-full" />
        </label>
      </div>

      <div v-else class="grid gap-4 md:grid-cols-2">
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">PID</span>
          <input v-model="form.pid" class="input input-bordered w-full" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">Key</span>
          <input v-model="form.key" class="input input-bordered w-full" />
        </label>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">Notify URL</span>
          <input v-model="form.notifyUrl" class="input input-bordered w-full" placeholder="/api/payments/epay/notify" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">Return URL</span>
          <input v-model="form.returnUrl" class="input input-bordered w-full" placeholder="/order/{orderNo}?token={token}" />
        </label>
      </div>

      <p v-if="provider === 'EPAY'" class="text-xs text-base-content/60">
        `Notify URL` 和 `Return URL` 支持填写相对路径或完整 URL；`Return URL` 支持 `{orderNo}`、`{token}` 占位符。
      </p>

      <div class="flex items-center gap-3">
        <button class="btn btn-primary" :disabled="saving" @click="handleSave">
          {{ saving ? '保存中...' : '保存配置' }}
        </button>
        <span v-if="saved" class="badge badge-success">已保存</span>
        <span v-if="errorMessage" class="text-sm text-error">{{ errorMessage }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { normalizeTelefuncError } from "../../../lib/app-error";
import { reactive, ref } from "vue";
import { onSavePaymentConfig } from "./savePaymentConfig.telefunc";

const props = defineProps<{
  provider: "BEPUSDT" | "EPAY";
  title: string;
  initialValue: {
    provider: "BEPUSDT" | "EPAY";
    name: string;
    isEnabled: boolean;
    baseUrl: string;
    appId?: string;
    appSecret?: string;
    pid?: string;
    key?: string;
    notifyUrl?: string;
    returnUrl?: string;
  } | null;
}>();

const form = reactive({
  provider: props.provider,
  name: props.initialValue?.name ?? (props.provider === 'BEPUSDT' ? 'USDT' : '聚合支付'),
  isEnabled: props.initialValue?.isEnabled ?? false,
  baseUrl: props.initialValue?.baseUrl ?? '',
  appId: props.initialValue?.appId ?? '',
  appSecret: props.initialValue?.appSecret ?? '',
  pid: props.initialValue?.pid ?? '',
  key: props.initialValue?.key ?? '',
  notifyUrl: props.initialValue?.notifyUrl ?? '',
  returnUrl: props.initialValue?.returnUrl ?? '',
});

const saving = ref(false);
const saved = ref(false);
const errorMessage = ref('');

async function handleSave() {
  saving.value = true;
  saved.value = false;
  errorMessage.value = '';

  try {
    const result = await onSavePaymentConfig({ ...form });
    form.name = result.name;
    form.isEnabled = result.isEnabled;
    form.baseUrl = result.baseUrl;
    form.appId = result.appId ?? '';
    form.appSecret = result.appSecret ?? '';
    form.pid = result.pid ?? '';
    form.key = result.key ?? '';
    form.notifyUrl = result.notifyUrl ?? '';
    form.returnUrl = result.returnUrl ?? '';
    saved.value = true;
  } catch (error) {
    errorMessage.value = normalizeTelefuncError(error, '保存失败');
  } finally {
    saving.value = false;
  }
}
</script>
