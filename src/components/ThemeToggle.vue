<script setup lang="ts">
import Button from 'primevue/button'
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useThemeStore, type ThemeMode } from '@/stores/themeStore'

const themeStore = useThemeStore()
const { isDark, themeMode } = storeToRefs(themeStore)

const toggle = () => {
  themeStore.toggleTheme()
}

const icon = computed(() => {
  if (themeMode.value === 'system') return 'pi pi-desktop'
  return isDark.value ? 'pi pi-sun' : 'pi pi-moon'
})

const labels: Record<ThemeMode, string> = {
  system: 'Tema del sistema (clic: oscuro)',
  dark: 'Tema oscuro (clic: claro)',
  light: 'Tema claro (clic: sistema)'
}

const ariaLabel = computed(() => labels[themeMode.value])
const title = computed(() => labels[themeMode.value])
</script>

<template>
  <Button
    type="button"
    class="theme-toggle"
    :class="{ 'theme-toggle--dark': isDark }"
    :icon="icon"
    severity="secondary"
    rounded
    text
    :aria-label="ariaLabel"
    :title="title"
    @click="toggle"
  />
</template>

<style scoped>
.theme-toggle {
  color: #1e293b;
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(15, 23, 42, 0.12);
}

.theme-toggle:hover {
  background-color: #ffffff;
}

.theme-toggle--dark {
  color: #f8fafc;
  background-color: rgba(30, 41, 59, 0.95);
  border-color: rgba(248, 250, 252, 0.2);
}

.theme-toggle--dark:hover {
  background-color: #1e293b;
}
</style>
