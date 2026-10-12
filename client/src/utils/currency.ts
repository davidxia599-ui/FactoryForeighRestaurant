const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
})

export function formatCurrency(amount: number): string {
  return idrFormatter.format(amount)
}
