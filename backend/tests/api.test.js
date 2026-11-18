// Integration tests against a running API with seeded data.
// Usage: npm run dev (another terminal) then ADMIN_EMAIL=... ADMIN_PASSWORD=... npm test
import test from 'node:test'
import assert from 'node:assert/strict'
const BASE=process.env.API_URL||'http://localhost:4000/api'
const call=async(method,path,{body,token}={})=>{
  const r=await fetch(BASE+path,{method,headers:{'Content-Type':'application/json',...(token&&{Authorization:`Bearer ${token}`})},body:body&&JSON.stringify(body)})
  return {status:r.status,json:await r.json()}}
const email=`student${Date.now()}@test.edu`,password='Sup3r-secret-pw'
const ctx={}
test('health is ok',async()=>{assert.equal((await fetch(BASE.replace('/api','/health'))).status,200)})
test('register rejects role escalation',async()=>{assert.equal((await call('POST','/auth/register',{body:{fullName:'Eve Admin',email:'eve@test.edu',password,role:'admin'}})).status,400)})
test('register + login student',async()=>{
  const r=await call('POST','/auth/register',{body:{fullName:'Test Student',email,password}});assert.equal(r.status,201);assert.equal(r.json.data.user.role,'student')
  assert.equal((await call('POST','/auth/register',{body:{fullName:'Test Student',email,password}})).status,409)
  assert.equal((await call('POST','/auth/login',{body:{email,password:'wrong-password'}})).status,401)
  ctx.student=(await call('POST','/auth/login',{body:{email,password}})).json.data.token})
test('admin login',async()=>{const r=await call('POST','/auth/login',{body:{email:process.env.ADMIN_EMAIL,password:process.env.ADMIN_PASSWORD}});assert.equal(r.status,200);ctx.admin=r.json.data.token})
test('authorization boundaries',async()=>{
  assert.equal((await call('GET','/admin/exams')).status,401)
  assert.equal((await call('GET','/admin/exams',{token:ctx.student})).status,403)
  assert.equal((await call('GET','/student/dashboard',{token:ctx.admin})).status,403)})
test('exam + question CRUD',async()=>{
  const now=Date.now(),exam={title:'API Test Exam',description:'x',duration:5,start:new Date(now-6e4).toISOString(),end:new Date(now+36e5).toISOString(),totalMarks:5,passMarks:3,active:true}
  assert.equal((await call('POST','/admin/exams',{token:ctx.admin,body:{...exam,passMarks:9}})).status,400)
  const e=await call('POST','/admin/exams',{token:ctx.admin,body:exam});assert.equal(e.status,201);ctx.exam=e.json.data.id
  const q=await call('POST','/admin/questions',{token:ctx.admin,body:{examId:ctx.exam,text:'2+2?',a:'3',b:'4',c:'5',d:'6',correct:1,marks:5}});assert.equal(q.status,201);ctx.q=q.json.data.id})
test('exam flow hides answers, grades server-side, blocks retakes',async()=>{
  const s=await call('POST','/student/attempts',{token:ctx.student,body:{examId:ctx.exam}});assert.equal(s.status,201)
  assert.ok(!JSON.stringify(s.json).includes('correct'),'answers must not leak before submission')
  const id=s.json.data.attemptId
  assert.equal((await call('PUT',`/student/attempts/${id}/answers`,{token:ctx.student,body:{questionId:ctx.q,optionIndex:1}})).status,200)
  const sub=await call('POST',`/student/attempts/${id}/submit`,{token:ctx.student,body:{answers:{[ctx.q]:1},percent:0,score:0}});assert.equal(sub.status,200)
  assert.equal(sub.json.data.obtained,5);assert.equal(sub.json.data.percent,100);assert.equal(sub.json.data.passed,true)
  assert.equal((await call('POST',`/student/attempts/${id}/submit`,{token:ctx.student,body:{}})).status,409)
  assert.equal((await call('PUT',`/student/attempts/${id}/answers`,{token:ctx.student,body:{questionId:ctx.q,optionIndex:0}})).status,409)
  assert.equal((await call('POST','/student/attempts',{token:ctx.student,body:{examId:ctx.exam}})).status,409)})
test("students cannot read others' results",async()=>{
  const other=await call('POST','/auth/register',{body:{fullName:'Other Student',email:`o${Date.now()}@test.edu`,password}})
  const rid=(await call('GET','/student/results',{token:ctx.student})).json.data[0].id
  assert.equal((await call('GET',`/student/results/${rid}`,{token:other.json.data.token})).status,404)})
test('cleanup',async()=>{assert.equal((await call('DELETE',`/admin/exams/${ctx.exam}`,{token:ctx.admin})).status,200)})
