<script setup lang="ts">
</script>

<template>
  <aside class="app-sidebar">
    <slot />
  </aside>
</template>

<style scoped>
.app-sidebar {
  width: 200px;
  background: #fff;
  min-height: calc(100vh - 60px);
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .app-sidebar {
    display: none;
  }
}
</style>
