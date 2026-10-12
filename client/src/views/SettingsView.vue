<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useTenant } from '../composables/useTenant'
import { changePassword } from '../api/auth'
import PasswordChangeForm from '../components/settings/PasswordChangeForm.vue'
import UserManagement from '../components/settings/UserManagement.vue'

const { t, locale } = useI18n()
const router = useRouter()
const { user, logout, hasPermission } = useAuth()
const { currentTenant, tenants, selectTenant, createTenant } = useTenant()

const showTenantForm = ref(false)
const newTenantName = ref('')
const passwordChangeLoading = ref(false)
const passwordChangeResetKey = ref(0)

function handleLocaleChange(lang: string) {
  locale.value = lang
  localStorage.setItem('locale', lang)
}

async function handleCreateTenant() {
  if (!newTenantName.value.trim()) {
    ElMessage.error(t('common.nameRequired'))
    return
  }
  try {
    await createTenant(newTenantName.value.trim())
    ElMessage.success(t('common.saveSuccess'))
    showTenantForm.value = false
    newTenantName.value = ''
  } catch {
    ElMessage.error(t('common.saveError'))
  }
}

async function handleChangePassword(currentPassword: string, newPassword: string) {
  passwordChangeLoading.value = true
  try {
    await changePassword(currentPassword, newPassword)
    ElMessage.success(t('common.passwordChanged'))
    passwordChangeResetKey.value += 1
  } catch (error) {
    console.error('變更密碼失敗:', error)
  } finally {
    passwordChangeLoading.value = false
  }
}

function handleLogout() {
  logout()
  router.push('/login')
}

</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">{{ t('common.settings') }}</h1>
    </div>

    <el-alert
      v-if="user && user.role !== 'admin' && !Object.values(user.permissions).some(Boolean)"
      :title="t('common.noModulePermissions')"
      type="warning"
      :closable="false"
      style="margin-bottom: 20px"
    />

    <el-card style="margin-bottom: 20px">
      <template #header>
        <span>{{ t('common.profile') }}</span>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item :label="t('common.username')">
          {{ user?.username }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('common.role')">
          {{ user?.role === 'admin' ? t('common.admin') : t('common.user') }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card style="margin-bottom: 20px">
      <template #header>
        <span>{{ t('common.tenant') }}</span>
      </template>
      <el-form :inline="true">
        <el-form-item :label="t('common.selectTenant')">
          <el-select
            :model-value="currentTenant?.id"
            @update:model-value="(val: number) => {
              const tenant = tenants.find(t => t.id === val)
              if (tenant) selectTenant(tenant)
            }"
            style="width: 200px"
          >
            <el-option
              v-for="tenant in tenants"
              :key="tenant.id"
              :label="tenant.name"
              :value="tenant.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="hasPermission('tenants')">
          <el-button type="primary" @click="showTenantForm = true">
            {{ t('common.createTenant') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card style="margin-bottom: 20px">
      <template #header>
        <span>{{ t('common.changePassword') }}</span>
      </template>
      <PasswordChangeForm
        :loading="passwordChangeLoading"
        :reset-key="passwordChangeResetKey"
        @change-password="handleChangePassword"
      />
    </el-card>

    <el-card v-if="hasPermission('users')" style="margin-bottom: 20px">
      <template #header>
        <span>{{ t('common.accountManagement') }}</span>
      </template>
      <UserManagement />
    </el-card>

    <el-card style="margin-bottom: 20px">
      <template #header>
        <span>{{ t('common.language') }}</span>
      </template>
      <el-radio-group :model-value="locale" @update:model-value="handleLocaleChange">
        <el-radio-button value="zh-TW">繁體中文</el-radio-button>
        <el-radio-button value="en">English</el-radio-button>
      </el-radio-group>
    </el-card>

    <el-card>
      <template #header>
        <span>{{ t('common.actions') }}</span>
      </template>
      <el-button type="danger" @click="handleLogout">
        {{ t('common.logout') }}
      </el-button>
    </el-card>

    <el-dialog v-model="showTenantForm" :title="t('common.createTenant')" width="400px">
      <el-form>
        <el-form-item :label="t('common.name')">
          <el-input v-model="newTenantName" :placeholder="t('common.nameRequired')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTenantForm = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleCreateTenant">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>
