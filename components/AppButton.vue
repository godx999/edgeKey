<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline' | 'default'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  block?: boolean
}>()
</script>

<template>
  <button
    :type="type ?? 'button'"
    :disabled="disabled || loading"
    :class="[
      'btn',
      size === 'xs' ? 'btn-xs' : size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '',
      variant === 'primary' ? 'btn-primary'
        : variant === 'success' ? 'btn-success'
        : variant === 'danger' ? 'btn-error'
        : variant === 'warning' ? 'btn-warning'
        : variant === 'ghost' ? 'btn-ghost'
        : variant === 'outline' ? 'btn-outline'
        : '',
      block ? 'btn-block' : '',
    ]"
  >
    <svg
      v-if="loading"
      class="btn-spinner"
      viewBox="25 25 50 50"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="20" fill="none" />
    </svg>
    <slot />
  </button>
</template>

<style scoped>
.btn-spinner {
  width: 1em;
  height: 1em;
  stroke: currentColor;
  stroke-width: 4;
  stroke-linecap: round;
  animation: btn-spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes btn-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>