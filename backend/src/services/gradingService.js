import {prisma} from '../config/db.js'
export const GRACE_MS=5000
// Atomically claims an in-progress attempt, grades it from the database and stores the result.
// Returns false if another request already finalized it (prevents double submission).
export async function finalize(tx,attemptId,status){
  const claimed=await tx.examAttempt.updateMany({where:{id:attemptId,status:'in_progress'},data:{status}})
  if(claimed.count!==1)return false
  const at=await tx.examAttempt.findUnique({where:{id:attemptId},include:{answers:true,exam:true}})
  const qs=await tx.question.findMany({where:{examId:at.examId},include:{options:true}})
  const byQ=new Map(at.answers.map(a=>[a.questionId,a]))
  let obtained=0,total=0
  for(const q of qs){
    total+=q.marks
    const a=byQ.get(q.id),correct=!!a&&q.options.find(o=>o.id===a.selectedOptionId)?.isCorrect===true
    if(correct)obtained+=q.marks
    if(a)await tx.studentAnswer.update({where:{id:a.id},data:{isCorrect:correct,marksObtained:correct?q.marks:0}})}
  await tx.examAttempt.update({where:{id:attemptId},data:{obtainedMarks:obtained,totalMarks:total,percentage:total?Math.round(obtained/total*10000)/100:0,passed:obtained>=at.exam.passingMarks,submittedAt:new Date()}})
  return true}
export async function sweepExpired(where={}){
  const list=await prisma.examAttempt.findMany({where:{...where,status:'in_progress',endTime:{lt:new Date(Date.now()-GRACE_MS)}},select:{id:true}})
  for(const a of list)await prisma.$transaction(tx=>finalize(tx,a.id,'expired')).catch(e=>console.error('sweep failed',a.id,e.message))
  return list.length}
