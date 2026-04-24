<template>
  <div class="grid gap-4 md:grid-cols-2">
    <label class="flex flex-col gap-1.5">
      <span class="label-text font-medium">App ID</span>
      <input v-model="modelValue.appId" class="input input-bordered w-full" />
    </label>
    <label class="flex flex-col gap-1.5">
      <span class="label-text font-medium">App Secret</span>
      <input v-model="modelValue.appSecret" class="input input-bordered w-full" />
    </label>
  </div>
</template>

<script setup lang="ts">
defineProps<{ modelValue: Record<string, any> }>();
</script>