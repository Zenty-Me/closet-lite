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

export interface ClothingItem {
  id: string
  name: string
  category: Category
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
  createdAt: number
  updatedAt: number
  deletedAt?: number | null
}

export interface Outfit {
  id: string
  name: string
  occasion: string
  itemIds: string[]
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

export type BackupItemV2 = Omit<ClothingItem, 'imageBlob'> & { imageBase64: string }
export type BackupWearLogV2 = Omit<WearLog, 'photoBlob'> & { photoBase64?: string }
export type BackupInspirationV2 = Omit<Inspiration, 'imageBlob'> & { imageBase64: string }

export interface BackupDataV1 {
  version: 1
  exportedAt: string
  items: Array<Omit<ClothingItem, 'imageBlob' | 'brand' | 'price' | 'size' | 'location' | 'tags' | 'purchaseDate' | 'deletedAt'> & {
    imageBase64: string
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
  items: BackupItemV2[]
  outfits: Outfit[]
  wearLogs: BackupWearLogV2[]
  inspirations: BackupInspirationV2[]
}

export type BackupData = BackupDataV1 | BackupDataV2

/** Fill missing fields for records loaded from older IDB / backups. */
export function normalizeItem(
  raw: Partial<ClothingItem> & Pick<ClothingItem, 'id' | 'imageBlob' | 'category' | 'color' | 'season' | 'createdAt' | 'updatedAt'>,
): ClothingItem {
  return {
    id: raw.id,
    name: raw.name ?? '',
    category: raw.category,
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
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    deletedAt: raw.deletedAt ?? null,
  }
}

export function normalizeOutfit(raw: Outfit): Outfit {
  return { ...raw, deletedAt: raw.deletedAt ?? null }
}

export function normalizeWearLog(raw: Partial<WearLog> & Pick<WearLog, 'id' | 'date' | 'itemIds' | 'createdAt'>): WearLog {
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
