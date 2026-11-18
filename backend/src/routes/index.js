import {Router} from 'express'
import rateLimit from 'express-rate-limit'
import {authenticate,requireRole,validate} from '../middlewares/auth.js'
import {A,AD,ST} from '../controllers/index.js'
import * as V from '../validators/schemas.js'
const authLimit=rateLimit({windowMs:15*60*1000,limit:20,standardHeaders:true,legacyHeaders:false,message:{success:false,message:'Too many attempts. Try again in a few minutes.'}})
export const authRoutes=Router()
authRoutes.post('/register',authLimit,validate(V.register),A.register)
authRoutes.post('/login',authLimit,validate(V.login),A.login)
authRoutes.post('/logout',authenticate,A.logout)
authRoutes.get('/me',authenticate,A.me)

export const adminRoutes=Router()
adminRoutes.use(authenticate,requireRole('admin'))
adminRoutes.get('/dashboard',AD.dashboard)
adminRoutes.get('/exams',AD.exams.list).post('/exams',validate(V.exam),AD.exams.create)
adminRoutes.get('/exams/:id',AD.exams.get).put('/exams/:id',validate(V.exam),AD.exams.update).delete('/exams/:id',AD.exams.remove)
adminRoutes.patch('/exams/:id/status',validate(V.status),AD.exams.status)
adminRoutes.get('/questions',AD.questions.list).post('/questions',validate(V.question),AD.questions.create)
adminRoutes.get('/questions/:id',AD.questions.get).put('/questions/:id',validate(V.question),AD.questions.update).delete('/questions/:id',AD.questions.remove)
adminRoutes.get('/students',AD.students.list).post('/students',validate(V.studentCreate),AD.students.create)
adminRoutes.get('/students/:id',AD.students.get).put('/students/:id',validate(V.studentCreate),AD.students.update).delete('/students/:id',AD.students.remove)
adminRoutes.get('/results',AD.results.list)
adminRoutes.get('/results/exams/:examId',AD.results.byExam)
adminRoutes.get('/results/students/:studentId',AD.results.byStudent)
adminRoutes.get('/results/:id',AD.results.get)

export const studentRoutes=Router()
studentRoutes.use(authenticate,requireRole('student'))
studentRoutes.get('/dashboard',ST.dashboard).get('/dashboard/profile',ST.profile).get('/dashboard/stats',ST.stats)
studentRoutes.get('/exams',ST.exams.list).get('/exams/:id',ST.exams.get)
studentRoutes.post('/attempts',validate(V.start),ST.attempts.start)
studentRoutes.get('/attempts/:id',ST.attempts.get).get('/attempts/:id/remaining',ST.attempts.remaining)
studentRoutes.put('/attempts/:id/answers',validate(V.answer),ST.attempts.answer)
studentRoutes.post('/attempts/:id/submit',validate(V.submit),ST.attempts.submit)
studentRoutes.get('/results',ST.results.list).get('/results/:id',ST.results.get)
