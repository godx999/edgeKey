# 公共组件文档

## StatusTag

状态标签组件，用于展示订单状态、支付状态、发货状态等。

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `"primary" \| "success" \| "danger" \| "warning" \| "default"` | `"default"` | 颜色类型 |
| `size` | `"sm" \| "md" \| "lg"` | `"sm"` | 大小 |
| `variant` | `"solid" \| "outline" \| "pill"` | `"solid"` | 样式风格 |

### 颜色对应

| type | 颜色 | 适用场景 |
|------|------|----------|
| `primary` | 蓝色 | 主要操作、信息 |
| `success` | 绿色 | 已完成、已支付、已发货 |
| `danger` | 红色 | 失败、错误 |
| `warning` | 橙色 | 待处理、未支付、未发货 |
| `default` | 灰色 | 已关闭、中性状态 |

### 基本用法

```components/StatusTag.vue#L1-3
<StatusTag type="success">已支付</StatusTag>
<StatusTag type="warning">待处理</StatusTag>
<StatusTag type="danger">发货失败</StatusTag>
```

### 配合 order-status 工具函数

`lib/utils/order-status.ts` 提供了对应的 type 辅助函数：

- `getOrderStatusType(status)` — 订单状态 → type
- `getPaymentStatusType(status)` — 支付状态 → type
- `getDeliveryStatusType(status)` — 发货状态 → type

```components/StatusTag.vue#L1-5
<StatusTag :type="getOrderStatusType(order.status)">
  {{ getOrderStatusLabel(order.status) }}
</StatusTag>
```


## SecretInput

带显示/隐藏切换的密钥输入框，用于密码、API Secret 等敏感字段。

### Props

| 属性 | 类型 | 说明 |
|------|------|------|
| `modelValue` | `string` | 输入值（v-model） |

支持透传所有原生 `input` 属性（如 `placeholder`、`disabled` 等）。

### 基本用法

```components/SecretInput.vue#L1-3
<SecretInput v-model="form.appSecret" placeholder="请输入 App Secret" />
```


## DataTable

通用带翻页的表格组件，基于 daisyUI `table` 样式。

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `columns` | `{ key: string; label: string }[]` | — | 列定义 |
| `rows` | `T[]` | — | 当前页数据 |
| `total` | `number` | — | 总条数 |
| `page` | `number` | — | 当前页码（从 1 开始） |
| `pageSize` | `number` | `20` | 每页条数 |
| `emptyText` | `string` | `"暂无数据"` | 空状态文案 |

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:page` | `page: number` | 用户切换页码时触发 |

### Slots

每一列都有一个以 `col.key` 命名的具名插槽，用于自定义单元格渲染。

插槽 props：

| 名称 | 类型 | 说明 |
|------|------|------|
| `row` | `T` | 当前行完整数据 |
| `value` | `any` | 当前列的值，等同于 `row[col.key]` |

不提供插槽时，默认渲染 `value`，值为 `null`/`undefined` 时显示 `-`。

### 基本用法

```components/DataTable.vue#L1-5
<DataTable
  :columns="columns"
  :rows="pageData.items"
  :total="pageData.total"
  :page="currentPage"
  :page-size="20"
  @update:page="handlePageChange"
/>
```

### 自定义列渲染

```components/DataTable.vue#L1-10
<DataTable :columns="columns" :rows="rows" :total="total" :page="page" @update:page="p => page = p">
  <!-- 自定义状态列 -->
  <template #status="{ value }">
    <span class="badge badge-success">{{ value }}</span>
  </template>
  <!-- 自定义时间列 -->
  <template #createdAt="{ value }">
    {{ new Date(value).toLocaleString() }}
  </template>
</DataTable>
```

### 完整示例

```pages/admin/cards/+Page.vue#L1-30
<script setup lang="ts">
import { ref, reactive } from "vue";
import DataTable from "../../../components/DataTable.vue";
import { onQueryCards } from "./queryCards.telefunc";

const PAGE_SIZE = 20;
const currentPage = ref(1);
const cardPage = ref({ items: [], total: 0 });

const columns = [
  { key: "id", label: "ID" },
  { key: "productName", label: "商品" },
  { key: "status", label: "状态" },
  { key: "createdAt", label: "创建时间" },
];

async function fetchPage(page: number) {
  cardPage.value = await onQueryCards({ page, pageSize: PAGE_SIZE });
  currentPage.value = page;
}
</script>

<template>
  <DataTable
    :columns="columns"
    :rows="cardPage.items"
    :total="cardPage.total"
    :page="currentPage"
    :page-size="PAGE_SIZE"
    @update:page="fetchPage"
  />
</template>
```

### 分页说明

- 总条数 `total <= pageSize` 时，分页控件自动隐藏
- 页码按钮最多显示 5 个，以当前页为中心滑动