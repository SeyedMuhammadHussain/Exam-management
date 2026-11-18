import {prisma} from '../config/db.js'
import {ApiError} from '../utils/http.js'
import * as S from '../utils/serialize.js'
import {finalize,sweepExpired,GRACE_MS} from './gradingService.js'
import {attemptDetail,statsOf} from './resultService.js'
const fin={status:{not:'in_progress'}},cnt={_count:{select:{questions:true}}}
const qOrder=[{createdAt:'asc'},{id:'asc'}]
async function overview(uid){
  await sweepExpired({studentId:uid})
  const [exams,attempts]=await Promise.all([prisma.exam.findMany({where:{status:'active'},orderBy:{startTime:'asc'},include:cnt}),
    prisma.examAttempt.findMany({where:{studentId:uid,...fin},include:{exam:true,student:true}})])
  const done=new Map(attempts.map(a=>[a.examId,a]))
  return exams.map(e=>{const a=done.get(e.id);return S.exam(e,{state:S.examState(e,!!a),result:a?S.result(a):undefined})})}
const finished=uid=>prisma.examAttempt.findMany({where:{studentId:uid,...fin},orderBy:{submittedAt:'desc'},include:{exam:true,student:true}})
export const profile=async uid=>S.user(await prisma.user.findUniqueOrThrow({where:{id:uid}}))
export const stats=async uid=>statsOf(await finished(uid))
export async function dashboard(uid){
  const [all,rs]=await Promise.all([overview(uid),finished(uid)])
  return {stats:statsOf(rs),available:all.filter(e=>e.state==='available'),upcoming:all.filter(e=>e.state==='upcoming'),completed:all.filter(e=>e.state==='completed')}}
export async function listExams(uid,state){const all=await overview(uid);return state?all.filter(e=>e.state===state):all}
export async function getExam(uid,id){const e=(await overview(uid)).find(x=>x.id===id);if(!e)throw new ApiError(404,'Exam not found.');return e}
async function payload(at){
  const [exam,qs,saved]=await Promise.all([prisma.exam.findUnique({where:{id:at.examId}}),prisma.question.findMany({where:{examId:at.examId},include:{options:true},orderBy:qOrder}),prisma.studentAnswer.findMany({where:{attemptId:at.id}})])
  const pos=new Map(qs.flatMap(q=>q.options.map(o=>[o.id,o.position])))
  return {attemptId:at.id,status:at.status,exam:{id:exam.id,title:exam.title,duration:exam.duration},remainingSeconds:Math.max(0,Math.ceil((at.endTime-Date.now())/1000)),
    questions:qs.map(S.studentQuestion),answers:Object.fromEntries(saved.filter(a=>a.selectedOptionId).map(a=>[a.questionId,pos.get(a.selectedOptionId)]))}}
export async function startAttempt(uid,examId){
  const exam=await prisma.exam.findUnique({where:{id:examId},include:cnt}),now=new Date()
  if(!exam||exam.status!=='active')throw new ApiError(404,'This exam is not available.')
  if(now<exam.startTime)throw new ApiError(403,'This exam has not started yet.')
  if(now>exam.endTime)throw new ApiError(403,'This exam has ended.')
  if(!exam._count.questions)throw new ApiError(409,'This exam has no questions yet.')
  const key={studentId_examId:{studentId:uid,examId}}
  let at=await prisma.examAttempt.findUnique({where:key})
  if(!at){
    const endTime=new Date(Math.min(now.getTime()+exam.duration*60000,exam.endTime.getTime()))
    try{at=await prisma.examAttempt.create({data:{studentId:uid,examId,endTime}})}
    catch(e){if(e.code!=='P2002')throw e;at=await prisma.examAttempt.findUnique({where:key})}} // concurrent start: the unique (student, exam) row wins
  if(at.status==='in_progress'&&Date.now()<=at.endTime.getTime())return payload(at) // resume after a refresh
  await sweepExpired({id:at.id})
  throw new ApiError(409,'You have already taken this exam.')}
async function lockInProgress(tx,uid,id){
  const at=await tx.examAttempt.findFirst({where:{id,studentId:uid}})
  if(!at)throw new ApiError(404,'Attempt not found.')
  // no-op update takes the row lock so answers, submit and expiry serialize; count 0 means already finalized
  const l=await tx.examAttempt.updateMany({where:{id,status:'in_progress'},data:{status:'in_progress'}})
  if(l.count!==1)throw new ApiError(409,'This exam was already submitted.')
  return at}
async function putAnswer(tx,at,questionId,optionIndex){
  const q=await tx.question.findFirst({where:{id:questionId,examId:at.examId},include:{options:true}})
  const o=q?.options.find(x=>x.position===optionIndex)
  if(!o)throw new ApiError(400,'Invalid question or option.')
  await tx.studentAnswer.upsert({where:{attemptId_questionId:{attemptId:at.id,questionId}},update:{selectedOptionId:o.id},create:{attemptId:at.id,questionId,selectedOptionId:o.id}})}
export const saveAnswer=(uid,id,{questionId,optionIndex})=>prisma.$transaction(async tx=>{
  const at=await lockInProgress(tx,uid,id)
  if(Date.now()>at.endTime.getTime()+GRACE_MS)throw new ApiError(403,'Time is up. Your exam is being submitted.')
  await putAnswer(tx,at,questionId,optionIndex);return {saved:true}})
export async function getAttempt(uid,id){
  await sweepExpired({id,studentId:uid})
  const at=await prisma.examAttempt.findFirst({where:{id,studentId:uid}})
  if(!at)throw new ApiError(404,'Attempt not found.')
  return at.status==='in_progress'?payload(at):{attemptId:id,status:at.status,remainingSeconds:0,resultId:id}}
export async function remaining(uid,id){const a=await getAttempt(uid,id);return {status:a.status,remainingSeconds:a.remainingSeconds}}
export const submit=(uid,id,answers)=>prisma.$transaction(async tx=>{
  const at=await lockInProgress(tx,uid,id)
  const late=Date.now()>at.endTime.getTime()+GRACE_MS // late submissions are graded on the saved answers only
  if(!late)for(const [qid,idx] of Object.entries(answers||{}))await putAnswer(tx,at,qid,idx)
  if(!(await finalize(tx,id,late?'expired':'submitted')))throw new ApiError(409,'This exam was already submitted.')
  return attemptDetail(tx,{id,studentId:uid})})
export const listResults=async uid=>(await finished(uid)).map(S.result)
export const getResult=(uid,id)=>attemptDetail(prisma,{id,studentId:uid}) // another student's result returns 404
