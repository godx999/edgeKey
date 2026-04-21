<template>
  <section class="space-y-6">
    <div class="grid gap-4 md:grid-cols-3">
      <article class="card bg-base-100 shadow-sm"><div class="card-body"><div class="text-sm text-base-content/60">总卡密</div><div class="text-3xl font-bold">{{ overview.total }}</div></div></article>
      <article class="card bg-base-100 shadow-sm"><div class="card-body"><div class="text-sm text-base-content/60">可用库存</div><div class="text-3xl font-bold text-success">{{ overview.available }}</div></div></article>
      <article class="card bg-base-100 shadow-sm"><div class="card-body"><div class="text-sm text-base-content/60">已售出</div><div class="text-3xl font-bold text-secondary">{{ overview.sold }}</div></div></article>
    </div>

    <section class="card bg-base-100 shadow-sm">
      <div class="card-body space-y-4">
        <div class="grid gap-6 lg:grid-cols-2">
          <div class="space-y-3">
            <h1 class="text-xl font-bold">单条新增</h1>
            <select v-model="singleForm.productId" class="select select-bordered w-full">
              <option value="">请选择商品</option>
              <option v-for="product in products" :key="product.id" :value="String(product.id)">
                {{ product.name }}
              </option>
            </select>
            <input v-model="singleForm.batchNo" class="input input-bordered w-full" placeholder="批次号（可选）" />
            <textarea v-model="singleForm.content" class="textarea textarea-bordered w-full" rows="4" placeholder="输入卡密内容"></textarea>
            <button class="btn btn-primary" @click="handleCreateCard">新增卡密</button>
          </div>

          <div class="space-y-3">
            <h2 class="text-xl font-bold">批量导入</h2>
            <select v-model="importForm.productId" class="select select-bordered w-full">
              <option value="">请选择商品</option>
              <option v-for="product in products" :key="product.id" :value="String(product.id)">
                {{ product.name }}
              </option>
            </select>
            <input v-model="importForm.batchNo" class="input input-bordered w-full" placeholder="批次号（可选）" />
            <textarea v-model="importForm.lines" class="textarea textarea-bordered w-full" rows="8" placeholder="每行一条卡密"></textarea>
            <div class="flex items-center gap-3">
              <button class="btn btn-primary" @click="handleImportCards">导入卡密</button>
              <button class="btn btn-ghost" :disabled="!importForm.productId" @click="handleDeleteUnused">清空该商品未售库存</button>
            </div>
          </div>
        </div>
        <p class="text-sm text-base-content/70">支持单条录入、批量导入和按商品清空未售库存。</p>
        <p v-if="message" class="text-sm text-base-content/70">{{ message }}</p>
        <p v-if="errorMessage" class="text-sm text-error">{{ errorMessage }}</p>
      </div>
    </section>

    <section class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h2 class="mb-4 text-xl font-bold">库存列表</h2>
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>ID</th>
                <th>商品</th>
                <th>卡密预览</th>
                <th>批次</th>
                <th>状态</th>
                <th>订单</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!cardList.length">
                <td colspan="7" class="text-center text-base-content/60">当前还没有库存卡密。</td>
              </tr>
              <tr v-for="card in cardList" :key="card.id">
                <td>{{ card.id }}</td>
                <td>{{ card.productName }}</td>
                <td><code>{{ card.contentPreview }}</code></td>
                <td>{{ card.batchNo || '-' }}</td>
                <td>
                  <span class="badge" :class="getStatusBadgeClass(card.status)">
                    {{ getStatusLabel(card.status) }}
                  </span>
                </td>
                <td>{{ card.orderId || '-' }}</td>
                <td>{{ formatDate(card.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { normalizeTelefuncError } from "../../../lib/app-error";
import { reactive, ref } from "vue";
import { useData } from "vike-vue/useData";
import { onCreateCard } from "./createCard.telefunc";
import { onDeleteUnusedCards } from "./deleteUnusedCards.telefunc";
import { onImportCards } from "./importCards.telefunc";
import type { Data } from "./+data";

const { cards, products, overview } = useData<Data>();

const cardList = ref([...cards]);
const message = ref("");
const errorMessage = ref("");

const singleForm = reactive({
  productId: "",
  content: "",
  batchNo: "",
});

const importForm = reactive({
  productId: "",
  lines: "",
  batchNo: "",
});

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function getStatusLabel(status: string) {
  return {
    UNUSED: "未售出",
    SOLD: "已售出",
    LOCKED: "锁定中",
    INVALID: "已失效"
  }[status] || status;
}

function getStatusBadgeClass(status: string) {
  return {
    UNUSED: "badge-success",
    SOLD: "badge-ghost",
    LOCKED: "badge-warning",
    INVALID: "badge-error"
  }[status] || "badge-ghost";
}

async function handleCreateCard() {
  message.value = "";
  errorMessage.value = "";

  try {
    const result = await onCreateCard({
      productId: Number(singleForm.productId),
      content: singleForm.content,
      batchNo: singleForm.batchNo,
    });
    cardList.value.unshift(result);
    singleForm.content = "";
    singleForm.batchNo = "";
    message.value = `已新增卡密 #${result.id}`;
  } catch (error) {
    errorMessage.value = normalizeTelefuncError(error, "新增失败");
  }
}

async function handleImportCards() {
  message.value = "";
  errorMessage.value = "";

  try {
    const result = await onImportCards({
      productId: Number(importForm.productId),
      lines: importForm.lines,
      batchNo: importForm.batchNo,
    });
    importForm.lines = "";
    importForm.batchNo = "";
    message.value = `已导入 ${result.count} 条卡密，请刷新页面查看最新列表。`;
  } catch (error) {
    errorMessage.value = normalizeTelefuncError(error, "导入失败");
  }
}

async function handleDeleteUnused() {
  message.value = "";
  errorMessage.value = "";

  try {
    const result = await onDeleteUnusedCards({
      productId: Number(importForm.productId),
    });
    cardList.value = cardList.value.filter((card) => !(card.productId === Number(importForm.productId) && card.status === 'UNUSED'));
    message.value = `已删除 ${result.count} 条未售卡密。`;
  } catch (error) {
    errorMessage.value = normalizeTelefuncError(error, "删除失败");
  }
}
</script>
