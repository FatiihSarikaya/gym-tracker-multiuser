import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.resolve(__dirname, '../../data')
const dbFile = path.join(dataDir, 'db.json')

const defaultData = {
  members: [],
  attendances: [],
  payments: [],
  lessons: [],
  lessonAttendances: []
}

export async function createDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  const adapter = new JSONFile(dbFile)
  const db = new Low(adapter, defaultData)
  await db.read()
  db.data ||= structuredClone(defaultData)
  return db
}

export function nextId(collection) {
  if (!Array.isArray(collection) || collection.length === 0) return 1
  return Math.max(...collection.map(x => x.id || 0)) + 1
}



