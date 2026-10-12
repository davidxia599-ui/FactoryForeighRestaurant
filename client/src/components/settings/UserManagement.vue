<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { createUser, getUsers, updateUserPermissions } from '../../api/users'
import { useTenant } from '../../composables/useTenant'
import type { UserAccount, UserPermissions } from '../../types'
import UserCreateForm from './UserCreateForm.vue'
import UserPermissionList from './UserPermissionList.vue'

const { t } = useI18n()
const { currentTenant, tenants } = useTenant()
const users = ref<UserAccount[]>([])
const showCreateForm = ref(false)
const creating = ref(false)
const savingUserId = ref<number | null>(null)

async function fetchUsers() {
  users.value = await getUsers()
}

async function handleCreate(input: {
  username: string
  password: string
  tenantId: number
  permissions: UserPermissions
}) {
  creating.value = true
  try {
    await createUser(input)
    await fetchUsers()
    showCreateForm.value = false
    ElMessage.success(t('common.accountCreated'))
  } catch (error) {
    console.error('建立帳號失敗:', error)
    ElMessage.error(t('common.saveError'))
  } finally {
    creating.value = false
  }
}

async function handleSavePermissions(id: number, permissions: UserPermissions) {
  savingUserId.value = id
  try {
    await updateUserPermissions(id, permissions)
    ElMessage.success(t('common.permissionsSaved'))
  } catch (error) {
    console.error('更新帳號權限失敗:', error)
    ElMessage.error(t('common.saveError'))
    try {
      await fetchUsers()
    } catch (reloadError) {
      console.error('重新載入帳號清單失敗:', reloadError)
    }
  } finally {
    savingUserId.value = null
  }
}

onMounted(async () => {
  try {
    await fetchUsers()
  } catch (error) {
    console.error('載入帳號清單失敗:', error)
    ElMessage.error(t('common.loadError'))
  }
})
</script>

<template>
  <div class="user-management">
    <div class="action-bar">
      <span>{{ t('common.permissionDefaultsOff') }}</span>
      <el-button type="primary" @click="showCreateForm = true">
        {{ t('common.createAccount') }}
      </el-button>
    </div>
    <UserPermissionList
      :users="users"
      :saving-user-id="savingUserId"
      @save="handleSavePermissions"
    />
    <UserCreateForm
      v-model:visible="showCreateForm"
      :tenants="tenants"
      :default-tenant-id="currentTenant?.id"
      :loading="creating"
      @create="handleCreate"
    />
  </div>
</template>

<style scoped>
.user-management {
  display: grid;
  gap: 16px;
}

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
</style>
