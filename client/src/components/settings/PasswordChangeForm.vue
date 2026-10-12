<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  loading: boolean
  resetKey: number
}>()

const emit = defineEmits<{
  changePassword: [currentPassword: string, newPassword: string]
}>()

const { t } = useI18n()
const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const canSubmit = computed(() =>
  form.currentPassword.length > 0 &&
  form.newPassword.length >= 6 &&
  form.newPassword === form.confirmPassword
)

watch(() => props.resetKey, () => {
  form.currentPassword = ''
  form.newPassword = ''
  form.confirmPassword = ''
})

function submit() {
  if (!canSubmit.value || props.loading) return
  emit('changePassword', form.currentPassword, form.newPassword)
}
</script>

<template>
  <el-form label-position="top" class="password-form" @submit.prevent="submit">
    <el-form-item :label="t('common.currentPassword')">
      <el-input v-model="form.currentPassword" type="password" show-password autocomplete="current-password" />
    </el-form-item>
    <el-form-item :label="t('common.newPassword')">
      <el-input
        v-model="form.newPassword"
        type="password"
        show-password
        autocomplete="new-password"
        :placeholder="t('common.passwordMinLength')"
      />
    </el-form-item>
    <el-form-item :label="t('common.confirmNewPassword')">
      <el-input v-model="form.confirmPassword" type="password" show-password autocomplete="new-password" />
      <div v-if="form.confirmPassword && form.newPassword !== form.confirmPassword" class="form-error">
        {{ t('common.passwordMismatch') }}
      </div>
    </el-form-item>
    <el-button type="primary" native-type="submit" :loading="loading" :disabled="!canSubmit">
      {{ t('common.changePassword') }}
    </el-button>
  </el-form>
</template>

<style scoped>
.password-form {
  max-width: 420px;
}

.form-error {
  color: var(--el-color-danger);
  font-size: 12px;
  line-height: 1.5;
}
</style>
