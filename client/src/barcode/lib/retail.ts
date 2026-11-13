// Money on labels and in the scan box: the store currency with up to 2 decimals (prices come in as dollars, not cents).
export const formatCurrency = (value: number) => {
  const n = Math.round((Number(value) || 0) * 100) / 100
  return 'S$' + (Number.isInteger(n) ? n.toLocaleString('en-SG') : n.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
}
