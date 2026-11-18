import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import {env} from './config/env.js'
import {prisma} from './config/db.js'
import {authRoutes,adminRoutes,studentRoutes} from './routes/index.js'
import {notFound,errorHandler} from './middlewares/errors.js'
const app=express()
app.set('trust proxy',env.TRUST_PROXY)
app.use(helmet())
app.use(cors({origin:env.CORS_ORIGIN.split(',').map(s=>s.trim()),methods:['GET','POST','PUT','PATCH','DELETE'],allowedHeaders:['Content-Type','Authorization']}))
app.use(express.json({limit:'100kb'}))
app.get('/health',async(req,res)=>{try{await prisma.$queryRaw`SELECT 1`;res.json({status:'ok'})}catch{res.status(503).json({status:'database unavailable'})}})
app.use('/api',rateLimit({windowMs:15*60*1000,limit:1000,standardHeaders:true,legacyHeaders:false}))
app.use('/api/auth',authRoutes)
app.use('/api/admin',adminRoutes)
app.use('/api/student',studentRoutes)
app.use(notFound)
app.use(errorHandler)
export default app
