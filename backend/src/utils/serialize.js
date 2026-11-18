export const user=u=>({id:u.id,fullName:u.fullName,name:u.fullName,email:u.email,role:u.role,grade:u.grade||'—'})
export const examState=(e,done,now=new Date())=>done?'completed':e.status!=='active'?'inactive':now<e.startTime?'upcoming':now>e.endTime?'expired':'available'
export const exam=(e,extra={})=>({id:e.id,title:e.title,description:e.description,duration:e.duration,start:e.startTime,end:e.endTime,totalMarks:e.totalMarks,passMarks:e.passingMarks,
  active:e.status==='active',questionCount:e._count?.questions,state:examState(e,false),...extra})
const sorted=q=>[...q.options].sort((a,b)=>a.position-b.position)
export const question=q=>{const o=sorted(q);return {id:q.id,examId:q.examId,text:q.text,marks:q.marks,a:o[0]?.text,b:o[1]?.text,c:o[2]?.text,d:o[3]?.text,correct:String(o.findIndex(x=>x.isCorrect))}}
// Students never receive the correct answer before submission.
export const studentQuestion=q=>{const {correct,examId,...rest}=question(q);return rest}
export const result=a=>({id:a.id,examId:a.examId,studentId:a.studentId,examTitle:a.exam?.title,studentName:a.student?.fullName,obtained:a.obtainedMarks,total:a.totalMarks,
  percent:Math.round(a.percentage??0),passed:!!a.passed,status:a.status,date:a.submittedAt||a.endTime})
export const reviewOf=(qs,sel)=>qs.map(q=>{const o=sorted(q),i=o.findIndex(x=>x.id===sel.get(q.id));return {id:q.id,text:q.text,marks:q.marks,options:o.map(x=>x.text),selected:i<0?null:i,correct:o.findIndex(x=>x.isCorrect)}})
