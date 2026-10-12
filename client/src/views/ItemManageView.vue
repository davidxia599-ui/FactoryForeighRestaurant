<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useTenant } from '../composables/useTenant'
import { getItems, createItem, updateItem, deleteItem, getCategories, createCategory, updateCategory, deleteCategory } from '../api/item'
import type { Item, Category } from '../types'

const { t } = useI18n()
const { hasTenant } = useTenant()

const loading = ref(false)
const items = ref<Item[]>([])
const categories = ref<Category[]>([])
const showItemForm = ref(false)
const showCategoryForm = ref(false)
const editingItem = ref<Item | null>(null)
const editingCategory = ref<Category | null>(null)
const activeTab = ref('items')

const itemForm = reactive({
  category_id: undefined as number | undefined,
  name_zh: '',
  name_en: '',
  unit: ''
})

const categoryForm = reactive({
  name_zh: '',
  name_en: '',
  sort_order: 0
})

const filteredItems = computed(() => {
  if (!selectedCategory.value) return items.value
  return items.value.filter(i => i.category_id === selectedCategory.value)
})

const selectedCategory = ref<number | null>(null)

async function fetchData() {
  if (!hasTenant.value) return
  loading.value = true
  try {
    const [itemData, categoryData] = await Promise.all([getItems(), getCategories()])
    items.value = itemData
    categories.value = categoryData
  } catch {
    ElMessage.error(t('common.loadError'))
  } finally {
    loading.value = false
  }
}

function handleAddItem() {
  editingItem.value = null
  itemForm.category_id = selectedCategory.value || undefined
  itemForm.name_zh = ''
  itemForm.name_en = ''
  itemForm.unit = ''
  showItemForm.value = true
}

function handleEditItem(item: Item) {
  editingItem.value = item
  itemForm.category_id = item.category_id
  itemForm.name_zh = item.name_zh
  itemForm.name_en = item.name_en
  itemForm.unit = item.unit
  showItemForm.value = true
}

async function handleDeleteItem(item: Item) {
  try {
    await ElMessageBox.confirm(t('common.confirmDelete'), t('common.warning'), { type: 'warning' })
    await deleteItem(item.id)
    ElMessage.success(t('common.deleteSuccess'))
    fetchData()
  } catch { /* cancelled */ }
}

async function handleSubmitItem() {
  try {
    if (editingItem.value) {
      await updateItem(editingItem.value.id, itemForm)
    } else {
      await createItem(itemForm)
    }
    ElMessage.success(t('common.saveSuccess'))
    showItemForm.value = false
    fetchData()
  } catch {
    ElMessage.error(t('common.saveError'))
  }
}

function handleAddCategory() {
  editingCategory.value = null
  categoryForm.name_zh = ''
  categoryForm.name_en = ''
  categoryForm.sort_order = categories.value.length + 1
  showCategoryForm.value = true
}

function handleEditCategory(category: Category) {
  editingCategory.value = category
  categoryForm.name_zh = category.name_zh
  categoryForm.name_en = category.name_en
  categoryForm.sort_order = category.sort_order
  showCategoryForm.value = true
}

async function handleDeleteCategory(category: Category) {
  try {
    await ElMessageBox.confirm(t('common.confirmDelete'), t('common.warning'), { type: 'warning' })
    await deleteCategory(category.id)
    ElMessage.success(t('common.deleteSuccess'))
    fetchData()
  } catch { /* cancelled */ }
}

async function handleSubmitCategory() {
  try {
    if (editingCategory.value) {
      await updateCategory(
        editingCategory.value.id,
        categoryForm.name_zh,
        categoryForm.name_en,
        categoryForm.sort_order
      )
    } else {
      await createCategory(categoryForm.name_zh, categoryForm.name_en, categoryForm.sort_order)
    }
    ElMessage.success(t('common.saveSuccess'))
    showCategoryForm.value = false
    fetchData()
  } catch {
    ElMessage.error(t('common.saveError'))
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">{{ t('common.items') }}</h1>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane :label="t('common.itemList')" name="items">
        <el-card>
          <template #header>
            <div class="action-bar">
              <el-select v-model="selectedCategory" :placeholder="t('common.all')" clearable style="width: 200px">
                <el-option v-for="cat in categories" :key="cat.id" :label="cat.name_zh" :value="cat.id" />
              </el-select>
              <el-button type="primary" @click="handleAddItem">{{ t('common.addNewItem') }}</el-button>
            </div>
          </template>
          <el-table :data="filteredItems" v-loading="loading" stripe>
            <el-table-column :label="t('common.category')" prop="category_name_zh" width="150" />
            <el-table-column :label="t('common.name')" prop="name_zh" />
            <el-table-column label="English" prop="name_en" />
            <el-table-column :label="t('common.unit')" prop="unit" width="100" />
            <el-table-column :label="t('common.actions')" width="150">
              <template #default="{ row }">
                <el-button size="small" @click="handleEditItem(row)">{{ t('common.edit') }}</el-button>
                <el-button size="small" type="danger" @click="handleDeleteItem(row)">{{ t('common.delete') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane :label="t('common.categoryList')" name="categories">
        <el-card>
          <template #header>
            <div class="action-bar">
              <span>{{ t('common.categoryList') }}</span>
              <el-button type="primary" @click="handleAddCategory">{{ t('common.addNewCategory') }}</el-button>
            </div>
          </template>
          <el-table :data="categories" v-loading="loading" stripe>
            <el-table-column :label="t('common.name')" prop="name_zh" />
            <el-table-column label="English" prop="name_en" />
            <el-table-column :label="t('common.sort_order')" prop="sort_order" width="100" />
            <el-table-column :label="t('common.actions')" width="150">
              <template #default="{ row }">
                <el-button size="small" @click="handleEditCategory(row)">{{ t('common.edit') }}</el-button>
                <el-button size="small" type="danger" @click="handleDeleteCategory(row)">{{ t('common.delete') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showItemForm" :title="editingItem ? t('common.editItem') : t('common.addNewItem')" width="500px">
      <el-form :model="itemForm" label-width="100px">
        <el-form-item :label="t('common.category')">
          <el-select v-model="itemForm.category_id" :placeholder="t('common.category')" clearable>
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name_zh" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('common.name')">
          <el-input v-model="itemForm.name_zh" />
        </el-form-item>
        <el-form-item label="English">
          <el-input v-model="itemForm.name_en" />
        </el-form-item>
        <el-form-item :label="t('common.unit')">
          <el-input v-model="itemForm.unit" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showItemForm = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSubmitItem">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showCategoryForm" :title="editingCategory ? t('common.editCategory') : t('common.addNewCategory')" width="500px">
      <el-form :model="categoryForm" label-width="100px">
        <el-form-item :label="t('common.name')">
          <el-input v-model="categoryForm.name_zh" />
        </el-form-item>
        <el-form-item label="English">
          <el-input v-model="categoryForm.name_en" />
        </el-form-item>
        <el-form-item :label="t('common.sort_order')">
          <el-input-number v-model="categoryForm.sort_order" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCategoryForm = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSubmitCategory">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>
