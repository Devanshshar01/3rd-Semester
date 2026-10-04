import './env.ts'
import express from 'express'
import { clerkMiddleware } from '@clerk/express'
import { createServer as createViteServer } from 'vite'
import { api } from './api'
import { pool } from './db'

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '32kb' }))
if (process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY) app.use(clerkMiddleware())
app.use('/api', api)
app.use('/api', (_req,res)=>res.status(404).json({error:{code:'NOT_FOUND',message:'The requested API endpoint does not exist.',details:{}}}))
app.use((error: unknown,_req: express.Request,res: express.Response,_next: express.NextFunction)=>{
  const err=error as {status?:number;code?:string}
  const status=err.status===503?503:500
  if(status===500) console.error('Request failed')
  res.status(status).json({error:{code:status===503?'SERVICE_UNAVAILABLE':'INTERNAL_ERROR',message:status===503?'A required service is not configured.':'An unexpected error occurred.',details:{}}})
})
const start=async()=>{
  if(process.env.NODE_ENV!=='production'){
    const vite=await createViteServer({server:{middlewareMode:true},appType:'spa'})
    app.use(vite.middlewares)
  }else{
    app.use(express.static('dist',{index:false,immutable:true,maxAge:'1y'}))
    app.get('*path',(_req,res)=>res.sendFile('index.html',{root:'dist'}))
  }
  const port=Number(process.env.PORT)||3000
  app.listen(port,()=>console.log(`studyspace server listening on http://localhost:${port}`))
}
void start().catch(error=>{console.error('Server startup failed',error);process.exitCode=1})
process.on('SIGTERM',()=>{void pool?.end()})
