<template>
  <section class="card bg-base-100 shadow-sm">
    <div class="card-body space-y-4">
      <div class="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
        <div>
          <h1 class="text-2xl font-bold">商品管理</h1>
          <p class="text-sm text-base-content/70">管理商品价格、分类、上下架状态和购买限制。</p>
        </div>
        <AppButton href="/admin/products/new" variant="primary" size="sm">新建商品</AppButton>
      </div>

      <div class="overflow-x-auto">
        <table class="table table-zebra w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>商品</th>
              <th>分类</th>
              <th>价格</th>
              <th>限购</th>
              <th>状态</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!productList.length">
              <td colspan="7" class="text-center text-base-content/60">当前还没有商品，请先创建第一个商品。</td>
            </tr>
            <tr v-for="product in productList" :key="product.id">
              <td>{{ product.id }}</td>
              <td>
                <div class="font-medium">{{ product.name }}</div>
                <div class="text-xs text-base-content/60">{{ product.slug }}</div>
              </td>
              <td>{{ product.categoryName || "未分类" }}</td>
              <td>{{ formatCents(product.price) }}</td>
              <td>{{ product.minBuy }} - {{ product.maxBuy }}</td>
              <td>
                <StatusTag :type="product.status === 'ACTIVE' ? 'success' : 'default'">
                  {{ product.status === 'ACTIVE' ? '上架' : '下架' }}
                </StatusTag>
              </td>
              <td>
                <div class="flex gap-2">
                  <AppButton :href="`/admin/products/${product.id}/edit`" variant="outline" size="xs">编辑</AppButton>
                  <AppButton size="xs" variant="danger" @click="handleDelete(product)">删除</AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
  <ConfirmDialog ref="confirmRef" />
</template>

<script setup lang="ts">
import { normalizeTelefuncError } from "../../../lib/app-error";
import { ref, useTemplateRef } from "vue";
import AppButton from "../../../components/AppButton.vue";
import ConfirmDialog from "../../../components/ConfirmDialog.vue";
import { useData } from "vike-vue/useData";
import { formatCents } from "../../../lib/utils/money";
import StatusTag from "../../../components/StatusTag.vue";
import { onDeleteProduct } from "./deleteProduct.telefunc";
import type { Data } from "./+data";

const { products } = useData<Data>();
const productList = ref([...products]);
const confirmRef = useTemplateRef<InstanceType<typeof ConfirmDialog>>("confirmRef");

async function handleDelete(product: (typeof products)[number]) {
  if (!await confirmRef.value?.confirm({ title: "删除商品", message: `确认删除商品"${product.name}"吗？`, confirmText: "删除", danger: true })) {
    return;
  }

  try {
    await onDeleteProduct({ id: product.id });
    productList.value = productList.value.filter((item) => item.id !== product.id);
  } catch (error) {
    await confirmRef.value?.alert({ title: "错误", message: normalizeTelefuncError(error, "删除失败") });
  }
}
</script>