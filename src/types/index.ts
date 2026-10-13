export const CATEGORIES = [
  '上衣',
  '裤子',
  '裙子',
  '外套',
  '鞋子',
  '包',
  '配饰',
  '其他',
] as const

export type Category = (typeof CATEGORIES)[number]

export const SEASONS = ['春', '夏', '秋', '冬', '四季'] as const
export type Season = (typeof SEASONS)[number]

export const COLORS = [
  '黑',
  '白',
  '灰',
  '米',
  '棕',
  '红',
  '橙',
  '黄',
  '绿',
  '蓝',
  '紫',
  '粉',
  '多色',
  '其他',
] as const

export type ColorName = (typeof COLORS)[number]

export interface ClothingItem {
  id: string
  name: string
  category: Category
  color: ColorName
  season: Season
  notes: string
  imageBlob: Blob
  createdAt: number
  updatedAt: number
}

export interface Outfit {
  id: string
  name: string
  occasion: string
  itemIds: string[]
  createdAt: number
  updatedAt: number
}

export interface WearLog {
  id: string
  date: string // YYYY-MM-DD
  outfitId?: string
  itemIds: string[]
  note: string
  createdAt: number
}

export interface BackupData {
  version: 1
  exportedAt: string
  items: Array<Omit<ClothingItem, 'imageBlob'> & { imageBase64: string }>
  outfits: Outfit[]
  wearLogs: WearLog[]
}
