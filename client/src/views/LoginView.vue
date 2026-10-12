<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../composables/useAuth'

const { t } = useI18n()
const router = useRouter()
const { login } = useAuth()

const formRef = ref()
const loading = ref(false)
const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: () => t('common.usernameRequired'), trigger: 'blur' }],
  password: [{ required: true, message: () => t('common.passwordRequired'), trigger: 'blur' }]
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    loading.value = true
    try {
      await login(form.username, form.password)
      ElMessage.success(t('common.loginSuccess'))
      router.push('/')
    } catch {
      ElMessage.error(t('common.loginError'))
    } finally {
      loading.value = false
    }
  })
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">{{ t('common.loginTitle') }}</h1>
      <p class="login-subtitle">{{ t('common.loginSubtitle') }}</p>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleSubmit"
      >
        <el-form-item :label="t('common.username')" prop="username">
          <el-input v-model="form.username" :placeholder="t('common.username')" />
        </el-form-item>
        <el-form-item :label="t('common.password')" prop="password">
          <el-input v-model="form.password" type="password" :placeholder="t('common.password')" show-password @keyup.enter="handleSubmit" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit" style="width: 100%">
            {{ t('common.login') }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 8px;
  color: #303133;
}

.login-subtitle {
  text-align: center;
  color: #909399;
  margin-bottom: 32px;
}
</style>
