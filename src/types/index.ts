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

/** Preset color labels (UI only). Stored value on items is always hex. */
export const COLOR_PRESETS = [
  { label: '黑', hex: '#1c1916' },
  { label: '白', hex: '#f5f2eb' },
  { label: '灰', hex: '#8a8580' },
  { label: '米', hex: '#d4c4a8' },
  { label: '棕', hex: '#6b4a2e' },
  { label: '红', hex: '#a63d3d' },
  { label: '橙', hex: '#c4783a' },
  { label: '黄', hex: '#c9a227' },
  { label: '绿', hex: '#3d4a2e' },
  { label: '蓝', hex: '#3a4f6f' },
  { label: '紫', hex: '#5c4a6e' },
  { label: '粉', hex: '#c48a9a' },
  { label: '多色', hex: '#6e675e' },
  { label: '其他', hex: '#bbb5a8' },
] as const

/** @deprecated use COLOR_PRESETS — kept for migration maps */
export const COLORS = COLOR_PRESETS.map((p) => p.label)
export type ColorName = (typeof COLOR_PRESETS)[number]['label']

export const COLOR_HEX: Record<ColorName, string> = Object.fromEntries(
  COLOR_PRESETS.map((p) => [p.label, p.hex]),
) as Record<ColorName, string>

const LEGACY_COLOR_TO_HEX: Record<string, string> = { ...COLOR_HEX }

/** Normalize any legacy Chinese name or hex to `#rrggbb` */
export function normalizeColorHex(raw: unknown): string {
  if (typeof raw !== 'string' || !raw.trim()) return COLOR_HEX['其他']
  const s = raw.trim()
  if (LEGACY_COLOR_TO_HEX[s]) return LEGACY_COLOR_TO_HEX[s]
  const m = s.match(/^#?([0-9a-fA-F]{6})$/)
  if (m) return `#${m[1].toLowerCase()}`
  const m3 = s.match(/^#?([0-9a-fA-F]{3})$/)
  if (m3) {
    const [a, b, c] = m3[1]
    return `#${a}${a}${b}${b}${c}${c}`.toLowerCase()
  }
  return COLOR_HEX['其他']
}

export function colorLabel(hex: string): string {
  const h = normalizeColorHex(hex)
  const hit = COLOR_PRESETS.find((p) => p.hex === h)
  return hit ? hit.label : h.toUpperCase()
}

export const OCCASIONS = ['日常', '通勤', '约会', '正式', '运动', '居家', '旅行', '派对'] as const
export type Occasion = (typeof OCCASIONS)[number]

export const ITEM_STATUSES = ['使用中', '闲置', '收纳中', '已淘汰'] as const
export type ItemStatus = (typeof ITEM_STATUSES)[number]

export interface ClothingItem {
  id: string
  name: string
  category: Category
  /** User-defined under main category; empty = 未分子类 */
  subcategory: string
  /** Hex `#rrggbb` (legacy Chinese names migrated in normalizeItem) */
  color: string
  season: Season
  notes: string
  brand: string
  price: number | null
  size: string
  location: string
  tags: string[]
  purchaseDate: string
  /** 购买链接（淘宝/拼多多等） */
  purchaseLink: string
  imageBlob: Blob
  originalBlob?: Blob
  /** Additional gallery images */
  extraImages: Blob[]
  tempMin: number | null
  tempMax: number | null
  status: ItemStatus
  /** 待洗 / 脏衣 */
  needsWash: boolean
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


export interface WishlistItem {
  id: string
  name: string
  priceNote: string
  link: string
  note: string
  imageBlob?: Blob
  bought: boolean
  createdAt: number
  updatedAt: number
}

export function normalizeWishlist(raw: Partial<WishlistItem> & Pick<WishlistItem, 'id' | 'createdAt' | 'updatedAt'>): WishlistItem {
  return {
    id: raw.id,
    name: raw.name ?? '',
    priceNote: raw.priceNote ?? '',
    link: raw.link ?? '',
    note: raw.note ?? '',
    imageBlob: raw.imageBlob,
    bought: Boolean(raw.bought),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
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
    /** Hex `#rrggbb` (legacy Chinese names migrated in normalizeItem) */
  color: string
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

export type BackupWishlistV6 = Omit<WishlistItem, 'imageBlob'> & { imageBase64?: string }

export interface BackupDataV6 {
  version: 6
  exportedAt: string
  items: BackupItemV4[]
  outfits: BackupOutfitV4[]
  wearLogs: BackupWearLogV4[]
  inspirations: BackupInspirationV4[]
  subcategoryTaxonomy?: Partial<Record<Category, string[]>>
  wishlist?: BackupWishlistV6[]
}

export type BackupData = BackupDataV1 | BackupDataV2 | BackupDataV3 | BackupDataV4 | BackupDataV5 | BackupDataV6

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
    color: normalizeColorHex(raw.color),
    season: raw.season,
    notes: raw.notes ?? '',
    brand: raw.brand ?? '',
    price: raw.price ?? null,
    size: raw.size ?? '',
    location: raw.location ?? '',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    purchaseDate: raw.purchaseDate ?? '',
    purchaseLink: typeof raw.purchaseLink === 'string' ? raw.purchaseLink.trim() : '',
    imageBlob: raw.imageBlob,
    originalBlob: raw.originalBlob,
    extraImages: Array.isArray(raw.extraImages) ? raw.extraImages : [],
    tempMin: raw.tempMin ?? null,
    tempMax: raw.tempMax ?? null,
    status: (ITEM_STATUSES as readonly string[]).includes(raw.status as string)
      ? (raw.status as ItemStatus)
      : '使用中',
    needsWash: Boolean(raw.needsWash),
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
