<template>
  <section class="space-y-6">
    <div class="alert alert-info">
      <span>启用支付前，请先前往“站点设置”配置网站地址，否则无法获取支付结果。</span>
    </div>
    <PaymentConfigCard provider="BEPUSDT" title="BEpusdt / USDT" :initial-value="configs.BEPUSDT" />
    <PaymentConfigCard provider="EPAY" title="Epay / 聚合支付" :initial-value="configs.EPAY" />
  </section>
</template>

<script setup lang="ts">
import { useData } from "vike-vue/useData";
import PaymentConfigCard from "./PaymentConfigCard.vue";
import type { Data } from "./+data";

const { configs } = useData<Data>();
</script>
