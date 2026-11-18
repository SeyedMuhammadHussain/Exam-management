import {ApiError} from '../utils/http.js'
import * as S from '../utils/serialize.js'
export async function attemptDetail(db,where){
  const at=await db.examAttempt.findFirst({where:{...where,status:{not:'in_progress'}},include:{exam:true,student:true,answers:true}})
  if(!at)throw new ApiError(404,'Result not found.')
  const qs=await db.question.findMany({where:{examId:at.examId},include:{options:true},orderBy:[{createdAt:'asc'},{id:'asc'}]})
  return {...S.result(at),review:S.reviewOf(qs,new Map(at.answers.map(a=>[a.questionId,a.selectedOptionId])))}}
export const statsOf=rs=>({completed:rs.length,average:rs.length?Math.round(rs.reduce((s,r)=>s+r.percentage,0)/rs.length):0,passed:rs.filter(r=>r.passed).length,failed:rs.filter(r=>!r.passed).length,best:rs.length?Math.round(Math.max(...rs.map(r=>r.percentage))):0})
