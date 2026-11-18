export const opts=q=>[q.a,q.b,q.c,q.d]
export const fmt=s=>new Date(s).toLocaleString([], {dateStyle:'medium',timeStyle:'short'})
export function examState(e,done){
  const n=Date.now()
  if(done)return 'completed'
  if(!e.active)return 'inactive'
  if(n<new Date(e.start))return 'upcoming'
  if(n>new Date(e.end))return 'expired'
  return 'available'
}
export function grade(exam,questions,answers){
  const total=questions.reduce((s,q)=>s+Number(q.marks),0)
  const obtained=questions.reduce((s,q)=>s+(answers[q.id]!==undefined&&Number(answers[q.id])===Number(q.correct)?Number(q.marks):0),0)
  return {obtained,total,percent:total?Math.round(obtained/total*100):0,passed:obtained>=Number(exam.passMarks)}
}
