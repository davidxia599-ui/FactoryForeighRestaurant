<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useTenant } from '../composables/useTenant'
import { getPurchases, createPurchase, updatePurchase, deletePurchase } from '../api/purchase'
import { getItems, getCategories } from '../api/item'
import type { Purchase, Item, Category } from '../types'
import PurchaseForm from '../components/purchase/PurchaseForm.vue'
import PurchaseList from '../components/purchase/PurchaseList.vue'

const { t } = useI18n()
const { hasTenant } = useTenant()

const loading = ref(false)
const purchases = ref<Purchase[]>([])
const items = ref<Item[]>([])
const categories = ref<Category[]>([])
const showForm = ref(false)
const editingPurchase = ref<Purchase | null>(null)

const filter = ref({
  start_date: '',
  end_date: '',
  category_id: undefined as number | undefined
})

async function fetchPurchases() {
  if (!hasTenant.value) return
  loading.value = true
  try {
    purchases.value = await getPurchases({
      start_date: filter.value.start_date || undefined,
      end_date: filter.value.end_date || undefined,
      category_id: filter.value.category_id
    })
  } catch {
    ElMessage.error(t('common.loadError'))
  } finally {
    loading.value = false
  }
}

async function fetchItems() {
  try {
    const [itemData, categoryData] = await Promise.all([getItems(), getCategories()])
    items.value = itemData
    categories.value = categoryData
  } catch {
    ElMessage.error(t('common.loadError'))
  }
}

function handleAdd() {
  editingPurchase.value = null
  showForm.value = true
}

function handleEdit(purchase: Purchase) {
  editingPurchase.value = purchase
  showForm.value = true
}

async function handleDelete(purchase: Purchase) {
  try {
    await ElMessageBox.confirm(t('common.confirmDelete'), t('common.warning'), {
      type: 'warning'
    })
    await deletePurchase(purchase.id)
    ElMessage.success(t('common.deleteSuccess'))
    fetchPurchases()
  } catch {
    // cancelled
  }
}

async function handleSubmit(data: Partial<Purchase>) {
  try {
    if (editingPurchase.value) {
      await updatePurchase(editingPurchase.value.id, data)
    } else {
      await createPurchase(data)
    }
    ElMessage.success(t('common.saveSuccess'))
    showForm.value = false
    fetchPurchases()
  } catch {
    ElMessage.error(t('common.saveError'))
  }
}

function handleFilter() {
  fetchPurchases()
}

function handleReset() {
  filter.value = { start_date: '', end_date: '', category_id: undefined }
  fetchPurchases()
}

onMounted(() => {
  fetchItems()
  fetchPurchases()
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">{{ t('common.purchase') }}</h1>
    </div>

    <el-alert
      v-if="!hasTenant"
      :title="t('common.noTenantSelected')"
      type="warning"
      :closable="false"
      style="margin-bottom: 20px"
    />

    <el-card style="margin-bottom: 20px">
      <el-form :inline="true" @submit.prevent="handleFilter">
        <el-form-item :label="t('common.startDate')">
          <el-date-picker v-model="filter.start_date" type="date" :placeholder="t('common.startDate')" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item :label="t('common.endDate')">
          <el-date-picker v-model="filter.end_date" type="date" :placeholder="t('common.endDate')" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item :label="t('common.category')">
          <el-select v-model="filter.category_id" :placeholder="t('common.all')" clearable style="width: 150px">
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name_zh"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleFilter">{{ t('common.search') }}</el-button>
          <el-button @click="handleReset">{{ t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <template #header>
        <div class="action-bar">
          <span>{{ t('common.purchaseList') }}</span>
          <el-button type="primary" @click="handleAdd">{{ t('common.addNewPurchase') }}</el-button>
        </div>
      </template>
      <PurchaseList
        :purchases="purchases"
        :loading="loading"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </el-card>

    <PurchaseForm
      v-model:visible="showForm"
      :purchase="editingPurchase"
      :items="items"
      :categories="categories"
      @submit="handleSubmit"
    />
  </div>
</template>
