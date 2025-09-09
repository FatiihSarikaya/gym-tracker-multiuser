import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectMongo, disconnectMongo } from '../lib/mongo.js'
import Member from '../models/Member.js'
import Lesson from '../models/Lesson.js'
import Attendance from '../models/Attendance.js'
import Payment from '../models/Payment.js'
import LessonAttendance from '../models/LessonAttendance.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function migrate() {
  const dataPath = path.resolve(__dirname, '../../data/db.json')
  if (!fs.existsSync(dataPath)) {
    console.log('No db.json found. Skipping migration.')
    return
  }

  const raw = fs.readFileSync(dataPath, 'utf-8')
  const json = JSON.parse(raw)

  await connectMongo()

  const collections = [
    { name: 'members', model: Member, data: json.members || [] },
    { name: 'lessons', model: Lesson, data: json.lessons || [] },
    { name: 'attendances', model: Attendance, data: json.attendances || [] },
    { name: 'payments', model: Payment, data: json.payments || [] },
    { name: 'lessonAttendances', model: LessonAttendance, data: json.lessonAttendances || [] }
  ]

  for (const { name, model, data } of collections) {
    const count = await model.estimatedDocumentCount()
    if (count > 0) {
      console.log(`Skipping ${name}: already has ${count} docs.`)
      continue
    }
    if (data.length === 0) {
      console.log(`Skipping ${name}: no data in db.json`)
      continue
    }
    await model.insertMany(data)
    console.log(`Inserted ${data.length} docs into ${name}`)
  }
}

migrate()
  .catch(err => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await disconnectMongo()
  })


