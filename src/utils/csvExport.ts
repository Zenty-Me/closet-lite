import type { ClothingItem } from '../types'
import { CATEGORY_LABEL } from '../types'

function escapeCell(v: string): string {
  if (v.includes('"') || v.includes(',') || v.includes('\n') || v.includes('\r')) {
    return `"${v.replace(/"/g, '""')}"`
  }
  return v
}

export function itemsToCsv(items: ClothingItem[]): string {
  const header = ['名称', '分类', '子分类', '价格', '品牌', '状态', '季节', '待洗', '购买链接']
  const rows = items.map((it) =>
    [
      it.name,
      CATEGORY_LABEL[it.category] || it.category,
      it.subcategory,
      it.price != null ? String(it.price) : '',
      it.brand,
      it.status,
      it.season,
      it.needsWash ? '是' : '否',
      it.purchaseLink,
    ]
      .map((c) => escapeCell(String(c ?? '')))
      .join(','),
  )
  const bom = '\uFEFF'
  return bom + [header.join(','), ...rows].join('\n')
}

export function downloadTextFile(
  filename: string,
  content: string,
  mime = 'text/csv;charset=utf-8',
): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
