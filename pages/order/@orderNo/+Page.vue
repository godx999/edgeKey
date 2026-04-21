<template>
  <div v-if="!order" class="alert alert-warning">订单不存在，或查询凭证无效。</div>
  <div v-else class="space-y-6">
    <section class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <div class="flex items-start justify-between gap-4 max-md:flex-col">
          <div>
            <p class="text-sm uppercase tracking-[0.2em] text-primary">Order</p>
            <h1 class="text-2xl font-bold">{{ order.orderNo }}</h1>
          </div>
          <div class="flex gap-2">
            <span class="badge badge-outline">{{ getOrderStatusLabel(order.status) }}</span>
            <span class="badge badge-outline">{{ getPaymentStatusLabel(order.paymentStatus) }}</span>
            <span class="badge badge-outline">{{ getDeliveryStatusLabel(order.deliveryStatus) }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="grid gap-6 lg:grid-cols-2">
      <article class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">订单信息</h2>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span>商品</span><span>{{ order.productName }}</span></div>
            <div class="flex justify-between"><span>数量</span><span>{{ order.quantity }}</span></div>
            <div class="flex justify-between"><span>金额</span><span>{{ formatCents(order.amount) }}</span></div>
            <div class="flex justify-between"><span>支付方式</span><span>{{ getPaymentProviderLabel(order.paymentProvider) }}</span></div>
          </div>
          <div v-if="order.paymentStatus === 'UNPAID'" class="mt-4">
            <button class="btn btn-primary btn-sm" :disabled="paying" @click="handleContinuePay">
              {{ paying ? '拉起中...' : '继续支付' }}
            </button>
            <p v-if="paymentError" class="mt-2 text-sm text-error">{{ paymentError }}</p>
          </div>
        </div>
      </article>

      <article class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">发货内容</h2>
          <div v-if="order.deliveryContents.length" class="space-y-2">
            <pre v-for="content in order.deliveryContents" :key="content" class="rounded-box bg-base-200 p-3 text-sm">{{ content }}</pre>
          </div>
          <p v-else class="text-sm text-base-content/60">当前订单尚未支付或尚未自动发货。</p>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { normalizeTelefuncError } from "../../../lib/app-error";
import { ref } from "vue";
import { useData } from "vike-vue/useData";
import { formatCents } from "../../../lib/utils/money";
import { getDeliveryStatusLabel, getOrderStatusLabel, getPaymentProviderLabel, getPaymentStatusLabel } from "../../../lib/utils/order-status";
import { onCreatePayment } from "./createPayment.telefunc";
import type { Data } from "./+data";

const { order } = useData<Data>();
const paying = ref(false);
const paymentError = ref("");

async function handleContinuePay() {
  if (!order) return;

  paying.value = true;
  paymentError.value = "";

  try {
    const result = await onCreatePayment({ orderId: order.id });
    if (result.payUrl) {
      window.location.href = result.payUrl;
      return;
    }
    paymentError.value = "未获取到支付链接";
  } catch (error) {
    paymentError.value = normalizeTelefuncError(error, "拉起支付失败");
  } finally {
    paying.value = false;
  }
}
</script>
