<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PermissionKey, Tenant, UserPermissions } from '../../types'

const props = defineProps<{
  visible: boolean
  tenants: Tenant[]
  defaultTenantId?: number
  loading: boolean
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  create: [input: {
    username: string
    password: string
    tenantId: number
    permissions: UserPermissions
  }]
}>()

const { t } = useI18n()
const permissionKeys: PermissionKey[] = ['dashboard', 'purchases', 'items', 'reports', 'tenants', 'users']
const form = reactive({
  username: '',
  password: '',
  tenantId: undefined as number | undefined,
  permissions: [] as PermissionKey[]
})

const canSubmit = computed(() =>
  form.username.trim().length > 0 &&
  form.username.trim().length <= 50 &&
  form.password.length >= 6 &&
  form.tenantId !== undefined
)

watch(() => props.visible, (visible) => {
  if (visible) {
    form.username = ''
    form.password = ''
    form.tenantId = props.defaultTenantId
    form.permissions = []
  }
})

function submit() {
  if (!canSubmit.value || form.tenantId === undefined) return
  const permissions: UserPermissions = {
    dashboard: false,
    purchases: false,
    items: false,
    reports: false,
    tenants: false,
    users: false
  }
  for (const key of form.permissions) permissions[key] = true
  emit('create', {
    username: form.username.trim(),
    password: form.password,
    tenantId: form.tenantId,
    permissions
  })
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="t('common.createAccount')"
    width="520px"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-form label-position="top">
      <el-form-item :label="t('common.username')">
        <el-input v-model="form.username" maxlength="50" autocomplete="off" />
      </el-form-item>
      <el-form-item :label="t('common.initialPassword')">
        <el-input
          v-model="form.password"
          type="password"
          show-password
          autocomplete="new-password"
          :placeholder="t('common.passwordMinLength')"
        />
      </el-form-item>
      <el-form-item :label="t('common.tenant')">
        <el-select v-model="form.tenantId" style="width: 100%">
          <el-option v-for="tenant in tenants" :key="tenant.id" :label="tenant.name" :value="tenant.id" />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('common.modulePermissions')">
        <el-checkbox-group v-model="form.permissions">
          <el-checkbox v-for="key in permissionKeys" :key="key" :value="key">
            {{ t(`common.permission_${key}`) }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:visible', false)">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="loading" :disabled="!canSubmit" @click="submit">
        {{ t('common.createAccount') }}
      </el-button>
    </template>
  </el-dialog>
</template>
