import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { ClothingItem, Outfit, WearLog } from '../types'

interface WardrobeDB extends DBSchema {
  items: {
    key: string
    value: ClothingItem
    indexes: { 'by-category': string; 'by-created': number }
  }
  outfits: {
    key: string
    value: Outfit
    indexes: { 'by-created': number }
  }
  wearLogs: {
    key: string
    value: WearLog
    indexes: { 'by-date': string }
  }
}

const DB_NAME = 'qing-yichu'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<WardrobeDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<WardrobeDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const items = db.createObjectStore('items', { keyPath: 'id' })
        items.createIndex('by-category', 'category')
        items.createIndex('by-created', 'createdAt')

        const outfits = db.createObjectStore('outfits', { keyPath: 'id' })
        outfits.createIndex('by-created', 'createdAt')

        const logs = db.createObjectStore('wearLogs', { keyPath: 'id' })
        logs.createIndex('by-date', 'date')
      },
    })
  }
  return dbPromise
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

// —— Items ——
export async function getAllItems(): Promise<ClothingItem[]> {
  const db = await getDB()
  const items = await db.getAllFromIndex('items', 'by-created')
  return items.reverse()
}

export async function getItem(id: string): Promise<ClothingItem | undefined> {
  const db = await getDB()
  return db.get('items', id)
}

export async function getItemsByIds(ids: string[]): Promise<ClothingItem[]> {
  const db = await getDB()
  const result: ClothingItem[] = []
  for (const id of ids) {
    const item = await db.get('items', id)
    if (item) result.push(item)
  }
  return result
}

export async function saveItem(item: ClothingItem): Promise<void> {
  const db = await getDB()
  await db.put('items', item)
}

export async function deleteItem(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('items', id)
  // clean refs in outfits
  const outfits = await db.getAll('outfits')
  for (const o of outfits) {
    if (o.itemIds.includes(id)) {
      o.itemIds = o.itemIds.filter((x) => x !== id)
      o.updatedAt = Date.now()
      await db.put('outfits', o)
    }
  }
}

export async function countItems(): Promise<number> {
  const db = await getDB()
  return db.count('items')
}

// —— Outfits ——
export async function getAllOutfits(): Promise<Outfit[]> {
  const db = await getDB()
  const list = await db.getAllFromIndex('outfits', 'by-created')
  return list.reverse()
}

export async function getOutfit(id: string): Promise<Outfit | undefined> {
  const db = await getDB()
  return db.get('outfits', id)
}

export async function saveOutfit(outfit: Outfit): Promise<void> {
  const db = await getDB()
  await db.put('outfits', outfit)
}

export async function deleteOutfit(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('outfits', id)
}

export async function countOutfits(): Promise<number> {
  const db = await getDB()
  return db.count('outfits')
}

// —— Wear logs ——
export async function getAllWearLogs(): Promise<WearLog[]> {
  const db = await getDB()
  return db.getAllFromIndex('wearLogs', 'by-date')
}

export async function getWearLogByDate(date: string): Promise<WearLog | undefined> {
  const db = await getDB()
  const logs = await db.getAllFromIndex('wearLogs', 'by-date', date)
  return logs[0]
}

export async function getWearLogsInMonth(year: number, month: number): Promise<WearLog[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('wearLogs', 'by-date')
  const prefix = `${year}-${String(month).padStart(2, '0')}`
  return all.filter((l) => l.date.startsWith(prefix))
}

export async function saveWearLog(log: WearLog): Promise<void> {
  const db = await getDB()
  // one log per day: replace existing
  const existing = await getWearLogByDate(log.date)
  if (existing && existing.id !== log.id) {
    await db.delete('wearLogs', existing.id)
  }
  await db.put('wearLogs', log)
}

export async function deleteWearLog(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('wearLogs', id)
}

export async function countWearLogs(): Promise<number> {
  const db = await getDB()
  return db.count('wearLogs')
}

export async function clearAllData(): Promise<void> {
  const db = await getDB()
  await db.clear('items')
  await db.clear('outfits')
  await db.clear('wearLogs')
}

export async function importAllData(
  items: ClothingItem[],
  outfits: Outfit[],
  wearLogs: WearLog[],
): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['items', 'outfits', 'wearLogs'], 'readwrite')
  await Promise.all([
    ...items.map((i) => tx.objectStore('items').put(i)),
    ...outfits.map((o) => tx.objectStore('outfits').put(o)),
    ...wearLogs.map((l) => tx.objectStore('wearLogs').put(l)),
    tx.done,
  ])
}
