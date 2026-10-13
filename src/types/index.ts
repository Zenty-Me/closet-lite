export const CATEGORIES = [
  '上衣',
  '裤子',
  '连衣裙',
  '裙子',
  '外套',
  '鞋子',
  '包',
  '配饰',
  '其他',
] as const

export type Category = (typeof CATEGORIES)[number]

/** Display labels closer to 无忧衣橱 grouping (storage keys stay CATEGORIES) */
export const CATEGORY_LABEL: Record<Category, string> = {
  上衣: '上装',
  裤子: '下装',
  连衣裙: '连衣裙',
  裙子: '半身裙',
  外套: '外套',
  鞋子: '鞋子',
  包: '包',
  配饰: '配饰',
  其他: '其他',
}

/** Core sections always shown on 分组 view */
export const CORE_CATEGORIES: Category[] = ['上衣', '裤子', '连衣裙', '外套']

export const SEASONS = ['春', '夏', '秋', '冬', '四季'] as const
export type Season = (typeof SEASONS)[number]

export const SEASON_FILTERS = ['春', '夏', '秋', '冬'] as const
export type SeasonFilter = (typeof SEASON_FILTERS)[number]

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

export const COLOR_HEX: Record<ColorName, string> = {
  黑: '#1c1916',
  白: '#f5f2eb',
  灰: '#8a8580',
  米: '#d4c4a8',
  棕: '#6b4a2e',
  红: '#a63d3d',
  橙: '#c4783a',
  黄: '#c9a227',
  绿: '#3d4a2e',
  蓝: '#3a4f6f',
  紫: '#5c4a6e',
  粉: '#c48a9a',
  多色: '#6e675e',
  其他: '#bbb5a8',
}

export const ITEM_STATUSES = ['使用中', '闲置', '收纳中', '已淘汰'] as const
export type ItemStatus = (typeof ITEM_STATUSES)[number]

export interface ClothingItem {
  id: string
  name: string
  category: Category
  /** User-defined under main category; empty = 未分子类 */
  subcategory: string
  color: ColorName
  season: Season
  notes: string
  brand: string
  price: number | null
  size: string
  location: string
  tags: string[]
  purchaseDate: string
  imageBlob: Blob
  originalBlob?: Blob
  /** Additional gallery images */
  extraImages: Blob[]
  tempMin: number | null
  tempMax: number | null
  status: ItemStatus
  createdAt: number
  updatedAt: number
  deletedAt?: number | null
}

export interface Outfit {
  id: string
  name: string
  occasion: string
  itemIds: string[]
  coverBlob?: Blob
  createdAt: number
  updatedAt: number
  deletedAt?: number | null
}

export interface WearLog {
  id: string
  date: string
  outfitId?: string
  itemIds: string[]
  note: string
  weather: string
  photoBlob?: Blob
  createdAt: number
}

export interface Inspiration {
  id: string
  imageBlob: Blob
  note: string
  tags: string[]
  relatedItemIds: string[]
  createdAt: number
  updatedAt: number
  deletedAt?: number | null
}

export type BackupItemV4 = Omit<ClothingItem, 'imageBlob' | 'originalBlob' | 'extraImages'> & {
  imageBase64: string
  originalBase64?: string
  extraImagesBase64?: string[]
}
export type BackupWearLogV4 = Omit<WearLog, 'photoBlob'> & { photoBase64?: string }
export type BackupInspirationV4 = Omit<Inspiration, 'imageBlob'> & { imageBase64: string }
export type BackupOutfitV4 = Omit<Outfit, 'coverBlob'> & { coverBase64?: string }

export interface BackupDataV1 {
  version: 1
  exportedAt: string
  items: Array<{
    id: string
    name: string
    category: Category
    color: ColorName
    season: Season
    notes: string
    imageBase64: string
    createdAt: number
    updatedAt: number
    brand?: string
    price?: number | null
    size?: string
    location?: string
    tags?: string[]
    purchaseDate?: string
  }>
  outfits: Outfit[]
  wearLogs: Array<Omit<WearLog, 'photoBlob' | 'weather'> & { weather?: string; photoBase64?: string }>
}

export interface BackupDataV2 {
  version: 2
  exportedAt: string
  items: Array<Omit<ClothingItem, 'imageBlob' | 'originalBlob' | 'extraImages' | 'tempMin' | 'tempMax' | 'status' | 'subcategory'> & {
    imageBase64: string
  }>
  outfits: Outfit[]
  wearLogs: BackupWearLogV4[]
  inspirations: BackupInspirationV4[]
}

export interface BackupDataV3 {
  version: 3
  exportedAt: string
  items: Array<Omit<ClothingItem, 'imageBlob' | 'originalBlob' | 'extraImages' | 'tempMin' | 'tempMax' | 'status' | 'subcategory'> & {
    imageBase64: string
    originalBase64?: string
  }>
  outfits: BackupOutfitV4[]
  wearLogs: BackupWearLogV4[]
  inspirations: BackupInspirationV4[]
}

export interface BackupDataV4 {
  version: 4
  exportedAt: string
  items: BackupItemV4[]
  outfits: BackupOutfitV4[]
  wearLogs: BackupWearLogV4[]
  inspirations: BackupInspirationV4[]
}

/** v5: subcategory on items + custom taxonomy map */
export interface BackupDataV5 {
  version: 5
  exportedAt: string
  items: BackupItemV4[]
  outfits: BackupOutfitV4[]
  wearLogs: BackupWearLogV4[]
  inspirations: BackupInspirationV4[]
  subcategoryTaxonomy?: Partial<Record<Category, string[]>>
}

export type BackupData = BackupDataV1 | BackupDataV2 | BackupDataV3 | BackupDataV4 | BackupDataV5

export function normalizeItem(
  raw: Partial<ClothingItem> &
    Pick<ClothingItem, 'id' | 'imageBlob' | 'category' | 'color' | 'season' | 'createdAt' | 'updatedAt'>,
): ClothingItem {
  // Migrate old "裙子" stays; unknown categories fall back carefully
  let category = raw.category
  if (!(CATEGORIES as readonly string[]).includes(category)) {
    category = '其他'
  }
  return {
    id: raw.id,
    name: raw.name ?? '',
    category,
    subcategory: typeof raw.subcategory === 'string' ? raw.subcategory.trim() : '',
    color: raw.color,
    season: raw.season,
    notes: raw.notes ?? '',
    brand: raw.brand ?? '',
    price: raw.price ?? null,
    size: raw.size ?? '',
    location: raw.location ?? '',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    purchaseDate: raw.purchaseDate ?? '',
    imageBlob: raw.imageBlob,
    originalBlob: raw.originalBlob,
    extraImages: Array.isArray(raw.extraImages) ? raw.extraImages : [],
    tempMin: raw.tempMin ?? null,
    tempMax: raw.tempMax ?? null,
    status: (ITEM_STATUSES as readonly string[]).includes(raw.status as string)
      ? (raw.status as ItemStatus)
      : '使用中',
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    deletedAt: raw.deletedAt ?? null,
  }
}

export function normalizeOutfit(raw: Outfit): Outfit {
  return {
    ...raw,
    deletedAt: raw.deletedAt ?? null,
    coverBlob: raw.coverBlob,
  }
}

export function normalizeWearLog(
  raw: Partial<WearLog> & Pick<WearLog, 'id' | 'date' | 'itemIds' | 'createdAt'>,
): WearLog {
  return {
    id: raw.id,
    date: raw.date,
    outfitId: raw.outfitId,
    itemIds: raw.itemIds ?? [],
    note: raw.note ?? '',
    weather: raw.weather ?? '',
    photoBlob: raw.photoBlob,
    createdAt: raw.createdAt,
  }
}

export function normalizeInspiration(
  raw: Partial<Inspiration> & Pick<Inspiration, 'id' | 'imageBlob' | 'createdAt' | 'updatedAt'>,
): Inspiration {
  return {
    id: raw.id,
    imageBlob: raw.imageBlob,
    note: raw.note ?? '',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    relatedItemIds: Array.isArray(raw.relatedItemIds) ? raw.relatedItemIds : [],
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    deletedAt: raw.deletedAt ?? null,
  }
}
