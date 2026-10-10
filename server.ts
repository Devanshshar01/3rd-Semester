import './server/env'
import express from 'express'
import app from './server/app'

// Vercel's Express adapter requires the entrypoint itself to import Express.
const vercelApp = express()
vercelApp.use(app)

export default vercelApp
