<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PermissionKey, UserAccount, UserPermissions } from '../../types'

const props = defineProps<{
  users: UserAccount[]
  savingUserId: number | null
}>()

const editableUsers = ref<UserAccount[]>([])
watch(
  () => props.users,
  users => {
    editableUsers.value = users.map(user => ({
      ...user,
      permissions: { ...user.permissions }
    }))
  },
  { immediate: true }
)

const emit = defineEmits<{
  save: [id: number, permissions: UserPermissions]
}>()

const { t } = useI18n()
const permissionKeys: PermissionKey[] = ['dashboard', 'purchases', 'items', 'reports', 'tenants', 'users']

function save(user: UserAccount) {
  emit('save', user.id, { ...user.permissions })
}
</script>

<template>
  <el-table :data="editableUsers" row-key="id" stripe>
    <el-table-column prop="username" :label="t('common.username')" min-width="130" />
    <el-table-column prop="tenantName" :label="t('common.tenant')" min-width="140" />
    <el-table-column :label="t('common.role')" width="110">
      <template #default="{ row }">
        {{ row.role === 'admin' ? t('common.admin') : t('common.user') }}
      </template>
    </el-table-column>
    <el-table-column
      v-for="key in permissionKeys"
      :key="key"
      :label="t(`common.permission_${key}`)"
      min-width="125"
    >
      <template #default="{ row }">
        <el-checkbox v-model="row.permissions[key]" :disabled="row.role === 'admin'" />
      </template>
    </el-table-column>
    <el-table-column :label="t('common.actions')" width="110" fixed="right">
      <template #default="{ row }">
        <el-button
          size="small"
          type="primary"
          :loading="savingUserId === row.id"
          :disabled="row.role === 'admin'"
          @click="save(row)"
        >
          {{ t('common.save') }}
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</template>
