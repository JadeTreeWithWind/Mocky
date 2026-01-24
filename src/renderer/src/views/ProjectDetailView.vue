<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="h-full p-6">
    <h1 class="text-2xl font-bold text-slate-100">Project Detail</h1>
    <p class="mt-4 text-slate-400">
      Project ID: <span class="font-mono text-blue-400">{{ route.params.id }}</span>
    </p>
  </div>
</template>
