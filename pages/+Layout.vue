<template>
  <template v-if="isAdminRoute">
    <slot />
  </template>
  <div v-else class="min-h-screen bg-base-200 text-base-content flex flex-col">
    <header class="border-b border-base-300 bg-base-100/90 backdrop-blur sticky top-0 z-40 shadow-sm">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div class="flex items-center gap-2">
          <img :src="siteLogo" height="28" width="28" class="h-7 w-7 rounded object-cover" alt="logo" />
          <a href="/" class="text-2xl font-bold text-primary">{{ siteName }}</a>
          <!-- <p class="text-sm text-base-content/60">{{ siteSubtitle }}</p> -->
        </div>
        <nav class="flex items-center gap-2 text-sm">
          <AppButton href="/" variant="ghost" size="sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5">
              <path fill-rule="evenodd" d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z" clip-rule="evenodd" />
            </svg>
            首页
          </AppButton>
          <AppButton href="/query" variant="ghost" size="sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5">
              <path fill-rule="evenodd" d="M15.988 3.012A2.25 2.25 0 0 1 18 5.25v6.5A2.25 2.25 0 0 1 15.75 14H13.5v-3.379a3 3 0 0 0-.879-2.121l-3.12-3.121a3 3 0 0 0-1.402-.791 2.252 2.252 0 0 1 1.913-1.576A2.25 2.25 0 0 1 12.25 1h1.5a2.25 2.25 0 0 1 2.238 2.012ZM11.5 3.25a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v.25h-3v-.25Z" clip-rule="evenodd" />
              <path d="M3.5 6A1.5 1.5 0 0 0 2 7.5v9A1.5 1.5 0 0 0 3.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L8.44 6.439A1.5 1.5 0 0 0 7.378 6H3.5Z" />
            </svg>
            订单查询
          </AppButton>
          <!-- <a href="/admin" class="btn btn-primary btn-sm">后台</a> -->
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-6xl w-full px-4 py-8 flex-1">
      <slot />
    </main>

    <footer class="border-t border-base-300 bg-base-100 py-6 text-center text-sm text-base-content/60 mt-auto">
      <div class="flex justify-between items-center mx-auto max-w-6xl px-4 text-sm text-gray-500 tracking-wide">
        <span class="">
          <a href="https://github.com/" target="_blank">
            {{ footerText ? footerText : "&copy; 2026 designed" }} & developed by edgeKey 
          </a>
        </span>
        <p v-if="supportContact" class="flex items-center">
          <svg class="w-5 h-5 mr-2 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.079 6.839a3 3 0 0 0-4.255.1M13 20h1.083A3.916 3.916 0 0 0 18 16.083V9A6 6 0 1 0 6 9v7m7 4v-1a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1Zm-7-4v-6H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1Zm12-6h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1v-6Z"/>
          </svg>
          <p>{{ supportContact }}</p>
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AppButton from "../components/AppButton.vue";
import { usePageContext } from "vike-vue/usePageContext";

import logoUrl from "../assets/logo.svg";

const pageContext = usePageContext();
const siteName = computed(() => pageContext.site?.siteName);
const siteLogo = computed(() => pageContext.site?.logo || logoUrl);
const supportContact = computed(() => pageContext.site?.supportContact);
const footerText = computed(() => pageContext.site?.footerText || "");

const isAdminRoute = computed(() => pageContext.urlPathname?.startsWith("/admin"));
</script>

<style>
body {
  margin: 0;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

* {
  box-sizing: border-box;
}

a {
  color: inherit;
  text-decoration: none;
}
</style>
