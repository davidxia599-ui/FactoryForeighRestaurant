<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import AppHeader from './components/layout/AppHeader.vue'

const route = useRoute()
</script>

<template>
  <div class="app-shell">
    <AppHeader v-if="route.meta.requiresAuth" />
    <RouterView />
  </div>
</template>
