import app from './app.js'
import {env} from './config/env.js'
import {prisma} from './config/db.js'
import {sweepExpired} from './services/gradingService.js'
const server=app.listen(env.PORT,()=>console.log(`API listening on :${env.PORT}`))
const sweeper=setInterval(()=>sweepExpired().catch(e=>console.error('sweep error',e.message)),30000) // auto-finalize abandoned attempts
const stop=()=>{clearInterval(sweeper);server.close(async()=>{await prisma.$disconnect();process.exit(0)})}
process.on('SIGTERM',stop);process.on('SIGINT',stop)
