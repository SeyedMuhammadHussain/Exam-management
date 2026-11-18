import {z} from 'zod'
const email=z.string().trim().toLowerCase().email('Enter a valid email address.')
const password=z.string().min(8,'Password must be at least 8 characters.').max(72)
const fullName=z.string().trim().min(2,'Full name is too short.').max(100)
export const register=z.object({fullName,email,password}).strict() // rejects any "role" field
export const login=z.object({email,password:z.string().min(1)})
export const exam=z.object({title:z.string().trim().min(3).max(200),description:z.string().trim().max(2000).default(''),duration:z.coerce.number().int().min(1).max(600),
  start:z.coerce.date(),end:z.coerce.date(),totalMarks:z.coerce.number().int().min(1),passMarks:z.coerce.number().int().min(0),active:z.boolean().default(true)})
  .refine(d=>d.end>d.start,{message:'End time must be after start time.',path:['end']}).refine(d=>d.passMarks<=d.totalMarks,{message:'Passing marks cannot exceed total marks.',path:['passMarks']})
export const status=z.object({active:z.boolean()})
const opt=z.string().trim().min(1,'All four options are required.').max(500)
export const question=z.object({examId:z.string().min(1),text:z.string().trim().min(3).max(2000),a:opt,b:opt,c:opt,d:opt,
  correct:z.coerce.number().int().min(0).max(3),marks:z.coerce.number().int().min(1).max(100)})
export const studentCreate=z.object({fullName,email,grade:z.string().trim().max(50).optional(),password:password.optional().or(z.literal('').transform(()=>undefined))})
export const start=z.object({examId:z.string().min(1)})
export const answer=z.object({questionId:z.string().min(1),optionIndex:z.number().int().min(0).max(3)})
export const submit=z.object({answers:z.record(z.number().int().min(0).max(3)).optional()})
