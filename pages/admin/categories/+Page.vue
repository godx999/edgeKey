<template>
  <section class="card bg-base-100 shadow-sm">
    <div class="card-body space-y-4">
      <div class="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
        <div>
          <h1 class="text-2xl font-bold">分类管理</h1>
          <p class="text-sm text-base-content/70">管理前台商品分类、排序和启用状态。</p>
        </div>
        <button class="btn btn-primary btn-sm" @click="resetForm">新增分类</button>
      </div>

      <div class="grid gap-6 lg:grid-cols-[1.2fr_2fr]">
        <section class="rounded-box border border-base-300 p-4">
          <h2 class="mb-3 text-lg font-semibold">{{ form.id ? `编辑 #${form.id}` : "新增分类" }}</h2>
          <div class="space-y-3">
            <label class="flex flex-col gap-1.5">
              <span class="label-text font-medium">名称</span>
              <input v-model="form.name" class="input input-bordered w-full" />
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="label-text font-medium">Slug</span>
              <input v-model="form.slug" class="input input-bordered w-full" placeholder="留空则自动生成" />
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="label-text font-medium">描述</span>
              <textarea v-model="form.description" class="textarea textarea-bordered w-full" rows="3"></textarea>
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="label-text font-medium">排序</span>
              <input v-model.number="form.sort" type="number" class="input input-bordered w-full" />
            </label>
            <div class="flex items-center gap-3">
              <button class="btn btn-primary" :disabled="saving" @click="handleSave">
                {{ saving ? "保存中..." : "保存分类" }}
              </button>
              <button class="btn btn-ghost" @click="resetForm">重置</button>
            </div>
            <p v-if="errorMessage" class="text-sm text-error">{{ errorMessage }}</p>
          </div>
        </section>

        <section class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>名称</th>
                <th>Slug</th>
                <th>排序</th>
                <th>状态</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!categoryList.length">
                <td colspan="6" class="text-center text-base-content/60">当前还没有分类，先创建第一条。</td>
              </tr>
              <tr v-for="category in categoryList" :key="category.id">
                <td>{{ category.id }}</td>
                <td>
                  <div class="font-medium">{{ category.name }}</div>
                  <div v-if="category.description" class="text-xs text-base-content/60">{{ category.description }}</div>
                </td>
                <td>{{ category.slug }}</td>
                <td>{{ category.sort }}</td>
                <td>
                  <span class="badge" :class="category.status === 'ACTIVE' ? 'badge-success' : 'badge-ghost'">
                    {{ category.status === 'ACTIVE' ? '启用' : '停用' }}
                  </span>
                </td>
                <td>
                  <div class="flex gap-2">
                    <button class="btn btn-xs btn-outline" @click="startEdit(category)">编辑</button>
                    <button class="btn btn-xs" @click="handleToggle(category)">
                      {{ category.status === 'ACTIVE' ? '停用' : '启用' }}
                    </button>
                    <button class="btn btn-xs btn-error btn-outline" @click="handleDelete(category)">删除</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { normalizeTelefuncError } from "../../../lib/app-error";
import { reactive, ref } from "vue";
import { useData } from "vike-vue/useData";
import { onDeleteCategory } from "./deleteCategory.telefunc";
import { onSaveCategory } from "./saveCategory.telefunc";
import { onToggleCategory } from "./toggleCategory.telefunc";
import type { Data } from "./+data";

const { categories } = useData<Data>();

const categoryList = ref([...categories]);
const saving = ref(false);
const errorMessage = ref("");

const form = reactive({
  id: undefined as number | undefined,
  name: "",
  slug: "",
  description: "",
  sort: 0,
});

function resetForm() {
  form.id = undefined;
  form.name = "";
  form.slug = "";
  form.description = "";
  form.sort = 0;
  errorMessage.value = "";
}

function startEdit(category: (typeof categories)[number]) {
  form.id = category.id;
  form.name = category.name;
  form.slug = category.slug;
  form.description = category.description ?? "";
  form.sort = category.sort;
  errorMessage.value = "";
}

async function handleSave() {
  saving.value = true;
  errorMessage.value = "";

  try {
    const result = await onSaveCategory({
      id: form.id,
      name: form.name,
      slug: form.slug,
      description: form.description,
      sort: form.sort,
    });

    const index = categoryList.value.findIndex((item) => item.id === result.id);
    if (index >= 0) {
      categoryList.value[index] = result;
    } else {
      categoryList.value.unshift(result);
    }

    categoryList.value = [...categoryList.value].sort((left, right) => {
      if (left.sort !== right.sort) return left.sort - right.sort;
      return right.id - left.id;
    });

    resetForm();
  } catch (error) {
    errorMessage.value = normalizeTelefuncError(error, "保存失败");
  } finally {
    saving.value = false;
  }
}

async function handleToggle(category: (typeof categories)[number]) {
  const nextStatus = category.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
  const result = await onToggleCategory({
    id: category.id,
    status: nextStatus,
  });

  categoryList.value = categoryList.value.map((item) => {
    if (item.id !== result.id) return item;
    return {
      ...item,
      status: result.status,
    };
  });
}

async function handleDelete(category: (typeof categories)[number]) {
  if (!window.confirm(`确认删除分类“${category.name}”吗？`)) {
    return;
  }

  errorMessage.value = "";

  try {
    await onDeleteCategory({ id: category.id });
    categoryList.value = categoryList.value.filter((item) => item.id !== category.id);
    if (form.id === category.id) {
      resetForm();
    }
  } catch (error) {
    errorMessage.value = normalizeTelefuncError(error, "删除失败");
  }
}
</script>
