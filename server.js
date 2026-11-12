const dns = require('dns')
dns.setServers(['8.8.8.8', '8.8.4.4'])

const express = require('express')
const path = require('path')
const cors = require('cors')
require('dotenv').config()

const connectDB = require('./config/db')
const { notFound, errorHandler } = require('./middleware/error')
const { seedDefaultAdmin } = require('./controllers/authController')
const { seedDefaultCategories } = require('./controllers/categoryController')
const { startPostScheduler } = require('./utils/scheduler')

const authRoutes = require('./routes/auth')
const categoryRoutes = require('./routes/categoryRoutes')
const authorRoutes = require('./routes/authorRoutes')
const postRoutes = require('./routes/postRoutes')
const articleRoutes = require('./routes/articleRoutes')
const uploadRoutes = require('./routes/uploadRoutes')
const seoRoutes = require('./routes/seoRoutes')

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/authors', authorRoutes)
app.use('/api/users', authorRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/articles', articleRoutes)
app.use('/api/upload', uploadRoutes)

app.use('/', seoRoutes)

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() })
})

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

const startServer = async () => {
  ;['ADMIN_USERNAME', 'ADMIN_PASSWORD_HASH', 'JWT_SECRET'].forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing ${key} in server/.env`)
    }
  })

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`)
  })

  try {
    await connectDB()
    if (typeof seedDefaultAdmin === 'function') await seedDefaultAdmin()
    if (typeof seedDefaultCategories === 'function') await seedDefaultCategories()
    if (typeof startPostScheduler === 'function') startPostScheduler()
  } catch (error) {
    console.error('Database initialization note:', error.message)
  }
}

startServer()
