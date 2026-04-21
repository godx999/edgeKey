<template>
  <section class="card bg-base-100 shadow-sm">
    <div class="card-body space-y-4">
      <h1 class="text-2xl font-bold">订单管理</h1>
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>商品</th>
              <th>金额</th>
              <th>支付方式</th>
              <th>状态</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!orders.length">
              <td colspan="6" class="text-center text-base-content/60">当前还没有订单。</td>
            </tr>
            <tr v-for="order in orders" :key="order.id">
              <td>
                <div class="font-medium">{{ order.orderNo }}</div>
                <div class="text-xs text-base-content/60">{{ formatDate(order.createdAt) }}</div>
              </td>
              <td>{{ order.productName }}</td>
              <td>{{ formatCents(order.amount) }}</td>
              <td>{{ getPaymentProviderLabel(order.paymentProvider) }}</td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <span class="badge badge-outline">{{ getOrderStatusLabel(order.status) }}</span>
                  <span class="badge badge-outline">{{ getPaymentStatusLabel(order.paymentStatus) }}</span>
                  <span class="badge badge-outline">{{ getDeliveryStatusLabel(order.deliveryStatus) }}</span>
                </div>
              </td>
              <td>
                <a :href="`/admin/orders/${order.id}`" class="btn btn-xs btn-outline">详情</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useData } from "vike-vue/useData";
import { formatCents } from "../../../lib/utils/money";
import { getDeliveryStatusLabel, getOrderStatusLabel, getPaymentProviderLabel, getPaymentStatusLabel } from "../../../lib/utils/order-status";
import type { Data } from "./+data";

const { orders } = useData<Data>();

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}
</script>
