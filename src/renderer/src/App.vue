<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
import MainLayout from './components/MainLayout.vue'
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

// --- 4. 監聽器 (Watchers) ---
watch(locale, (newLocale) => {
  localStorage.setItem('user-locale', newLocale as string)
})
</script>

<template>
  <MainLayout>
    <RouterView />
  </MainLayout>
</template>
