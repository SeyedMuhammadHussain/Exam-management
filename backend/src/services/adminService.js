import bcrypt from 'bcrypt'
import {prisma} from '../config/db.js'
import {env} from '../config/env.js'
import {ApiError} from '../utils/http.js'
import * as S from '../utils/serialize.js'
import {attemptDetail,statsOf} from './resultService.js'
const fin={status:{not:'in_progress'}},cnt={_count:{select:{questions:true}}},qInc={options:true}
export async function dashboard(){
  const now=new Date()
  const [totalStudents,totalExams,activeExams,completedExams,recent,exams]=await Promise.all([
    prisma.user.count({where:{role:'student'}}),prisma.exam.count(),
    prisma.exam.count({where:{status:'active',startTime:{lte:now},endTime:{gte:now}}}),prisma.exam.count({where:{endTime:{lt:now}}}),
    prisma.examAttempt.findMany({where:fin,orderBy:{submittedAt:'desc'},take:6,include:{exam:true,student:true}}),
    prisma.exam.findMany({select:{title:true,attempts:{where:fin,select:{percentage:true,passed:true}}}})])
  const all=exams.flatMap(e=>e.attempts),passed=all.filter(a=>a.passed).length
  return {totalStudents,totalExams,activeExams,completedExams,recent:recent.map(S.result),passRate:{passed,failed:all.length-passed},
    examStats:exams.map(e=>({name:e.title,attempts:e.attempts.length,avg:e.attempts.length?Math.round(e.attempts.reduce((s,a)=>s+a.percentage,0)/e.attempts.length):0}))}}
const examData=d=>({title:d.title,description:d.description,duration:d.duration,startTime:d.start,endTime:d.end,totalMarks:d.totalMarks,passingMarks:d.passMarks,status:d.active?'active':'inactive'})
export const listExams=async()=>(await prisma.exam.findMany({orderBy:{createdAt:'desc'},include:cnt})).map(e=>S.exam(e))
export const getExam=async id=>S.exam(await prisma.exam.findUniqueOrThrow({where:{id},include:cnt}))
export const createExam=async(d,uid)=>S.exam(await prisma.exam.create({data:{...examData(d),createdBy:uid},include:cnt}))
export const updateExam=async(id,d)=>S.exam(await prisma.exam.update({where:{id},data:examData(d),include:cnt}))
export const setStatus=async(id,active)=>S.exam(await prisma.exam.update({where:{id},data:{status:active?'active':'inactive'},include:cnt}))
export const deleteExam=async id=>{await prisma.exam.delete({where:{id}});return {deleted:true}}
const texts=d=>[d.a,d.b,d.c,d.d]
export const listQuestions=async({examId})=>(await prisma.question.findMany({where:examId?{examId}:{},include:qInc,orderBy:[{createdAt:'asc'},{id:'asc'}]})).map(S.question)
export const getQuestion=async id=>S.question(await prisma.question.findUniqueOrThrow({where:{id},include:qInc}))
export async function createQuestion(d){
  await prisma.exam.findUniqueOrThrow({where:{id:d.examId}})
  return S.question(await prisma.question.create({data:{examId:d.examId,text:d.text,marks:d.marks,options:{create:texts(d).map((text,position)=>({text,position,isCorrect:position===d.correct}))}},include:qInc}))}
export const updateQuestion=(id,d)=>prisma.$transaction(async tx=>{
  const q=await tx.question.update({where:{id},data:{text:d.text,marks:d.marks,examId:d.examId},include:qInc})
  for(const o of q.options)await tx.option.update({where:{id:o.id},data:{text:texts(d)[o.position],isCorrect:o.position===d.correct}})
  return S.question(await tx.question.findUnique({where:{id},include:qInc}))})
export const deleteQuestion=async id=>{await prisma.question.delete({where:{id}});return {deleted:true}}
const sel={id:true,fullName:true,email:true,role:true,grade:true,createdAt:true,attempts:{where:fin,select:{percentage:true}}}
const stu=u=>({...S.user(u),examsTaken:u.attempts.length,average:u.attempts.length?Math.round(u.attempts.reduce((s,a)=>s+a.percentage,0)/u.attempts.length):null,createdAt:u.createdAt})
export async function listStudents({search,grade}){
  const where={role:'student',...(grade&&{grade}),...(search&&{OR:[{fullName:{contains:search,mode:'insensitive'}},{email:{contains:search,mode:'insensitive'}}]})}
  return (await prisma.user.findMany({where,select:sel,orderBy:{createdAt:'desc'}})).map(stu)}
export const getStudent=async id=>stu(await prisma.user.findFirstOrThrow({where:{id,role:'student'},select:sel}))
export async function createStudent(d){
  if(!d.password)throw new ApiError(400,'A password is required for new students.')
  return stu(await prisma.user.create({data:{fullName:d.fullName,email:d.email,grade:d.grade,role:'student',password:await bcrypt.hash(d.password,env.BCRYPT_ROUNDS)},select:sel}))}
export async function updateStudent(id,d){
  await getStudent(id)
  return stu(await prisma.user.update({where:{id},select:sel,data:{fullName:d.fullName,email:d.email,grade:d.grade,...(d.password&&{password:await bcrypt.hash(d.password,env.BCRYPT_ROUNDS)})}}))}
export async function deleteStudent(id){await getStudent(id);await prisma.user.delete({where:{id}});return {deleted:true}}
export const listResults=async({examId,studentId})=>(await prisma.examAttempt.findMany({where:{...fin,...(examId&&{examId}),...(studentId&&{studentId})},orderBy:{submittedAt:'desc'},include:{exam:true,student:true}})).map(S.result)
export const getResult=id=>attemptDetail(prisma,{id})
export async function studentPerformance(id){
  const student=await getStudent(id)
  const rs=await prisma.examAttempt.findMany({where:{studentId:id,...fin},orderBy:{submittedAt:'desc'},include:{exam:true,student:true}})
  return {student,stats:statsOf(rs),results:rs.map(S.result)}}
