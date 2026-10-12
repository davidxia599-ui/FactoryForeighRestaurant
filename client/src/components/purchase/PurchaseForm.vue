<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Item, Category, Purchase } from '../../types'

const props = defineProps<{
  visible: boolean
  purchase: Purchase | null
  items: Item[]
  categories: Category[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [data: Partial<Purchase>]
}>()

const { t } = useI18n()

const formRef = ref()
const form = reactive({
  item_id: undefined as number | undefined,
  quantity: 1,
  unit_price: 0,
  purchase_date: new Date().toISOString().split('T')[0],
  note: ''
})

const rules = {
  item_id: [{ required: true, message: () => t('common.itemRequired'), trigger: 'change' }],
  quantity: [{ required: true, message: () => t('common.quantityRequired'), trigger: 'blur' }],
  unit_price: [{ required: true, message: () => t('common.priceRequired'), trigger: 'blur' }],
  purchase_date: [{ required: true, message: () => t('common.dateRequired'), trigger: 'change' }]
}

const filteredItems = ref<Item[]>([])

watch(() => props.visible, (val) => {
  if (val) {
    if (props.purchase) {
      form.item_id = props.purchase.item_id
      form.quantity = props.purchase.quantity
      form.unit_price = props.purchase.unit_price
      form.purchase_date = props.purchase.purchase_date
      form.note = props.purchase.note || ''
    } else {
      form.item_id = undefined
      form.quantity = 1
      form.unit_price = 0
      form.purchase_date = new Date().toISOString().split('T')[0]
      form.note = ''
    }
    filteredItems.value = props.items
  }
})

watch(() => form.item_id, (itemId) => {
  const item = props.items.find(i => i.id === itemId)
  if (item) {
    filteredItems.value = props.items.filter(i => i.category_id === item.category_id)
  }
})

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    emit('submit', { ...form })
  })
}

function handleClose() {
  emit('update:visible', false)
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="purchase ? t('common.editPurchase') : t('common.addNewPurchase')"
    width="500px"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item :label="t('common.item')" prop="item_id">
        <el-select v-model="form.item_id" :placeholder="t('common.itemRequired')" filterable style="width: 100%">
          <el-option
            v-for="item in filteredItems"
            :key="item.id"
            :label="`${item.name_zh} (${item.unit || ''})`"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('common.quantity')" prop="quantity">
        <el-input-number v-model="form.quantity" :min="0.01" :precision="2" style="width: 100%" />
      </el-form-item>
      <el-form-item :label="t('common.unitPrice')" prop="unit_price">
        <el-input-number v-model="form.unit_price" :min="0" :precision="0" style="width: 100%">
          <template #prefix>{{ t('common.currencySymbol') }}</template>
        </el-input-number>
      </el-form-item>
      <el-form-item :label="t('common.date')" prop="purchase_date">
        <el-date-picker v-model="form.purchase_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>
      <el-form-item :label="t('common.note')">
        <el-input v-model="form.note" type="textarea" :rows="2" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" @click="handleSubmit">{{ t('common.save') }}</el-button>
    </template>
  </el-dialog>
</template>
