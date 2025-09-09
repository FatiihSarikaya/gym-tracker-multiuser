import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { createDb } from './lib/db.js'
import { connectMongo } from './lib/mongo.js'
import membersRouter from './routes/members.js'
import path from 'path'
import attendanceRouter from './routes/attendance.js'
import paymentsRouter from './routes/payments.js'
import lessonsRouter from './routes/lessons.js'
import lessonAttendancesRouter from './routes/lessonAttendances.js'
import packagesRouter from './routes/packages.js'
import memberPackagesRouter from './routes/memberPackages.js'
import memberLessonsRouter from './routes/memberLessons.js'
import uploadsRouter from './routes/uploads.js'

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

// Initialize DB and attach to request
app.use(async (req, res, next) => {
  try {
    // keep LowDB for now until routes are refactored; ensure Mongo connection is established
    req.db = await createDb()
    await connectMongo()
    next()
  } catch (err) {
    next(err)
  }
})

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'GymTracker API' })
})

app.use('/api/Members', membersRouter)
app.use('/api/Attendance', attendanceRouter)
app.use('/api/Payments', paymentsRouter)
app.use('/api/Lessons', lessonsRouter)
app.use('/api/LessonAttendances', lessonAttendancesRouter)
app.use('/api/Packages', packagesRouter)
app.use('/api/MemberPackages', memberPackagesRouter)
app.use('/api/MemberLessons', memberLessonsRouter)
app.use('/api/Uploads', uploadsRouter)

// Serve uploaded files statically
app.use('/uploads', express.static(path.resolve(process.cwd(), 'public', 'uploads')))

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ message: 'Internal Server Error' })
})

app.listen(PORT, () => {
  console.log(`GymTracker API listening on http://localhost:${PORT}`)
})

// Prevent process from exiting on unexpected errors; log and keep alive
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('[unhandledRejection]', reason)
})



