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
import './utils/cleanupScheduler.js'

const app = express()
const PORT = process.env.PORT || 5000

// ✅ CORS ayarlarını genişlet
const allowedOrigins = [
  
  'https://gym-tracker-hiwo.vercel.app', // frontend adresin
  'http://localhost:3000'                // geliştirme için
]

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Preflight için
app.options('*', cors())

app.use(express.json())
app.use(morgan('dev'))

// Initialize DB
app.use(async (req, res, next) => {
  try {
    req.db = await createDb()
    await connectMongo()
    next()
  } catch (err) {
    next(err)
  }
})

// ✅ Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'GymTracker API', time: new Date() })
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

// Serve uploaded files
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

// Prevent process exit
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err)
})

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason)
})
