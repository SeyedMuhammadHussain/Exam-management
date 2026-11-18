import {useState} from 'react'
import {Eye,HelpCircle} from 'lucide-react'
import {useApp} from '../../context/AppContext'
import Crud from '../../components/Crud'
import ResultsTable from '../../components/ResultsTable'
import {Badge,EmptyState,Modal,stateTone} from '../../components/ui'
import {examState,fmt,opts} from '../../utils/grade'

export function ExamsPage(){
  const {exams,questions,upsert,remove,setExamStatus}=useApp(),[preview,setPreview]=useState(null),[statusError,setStatusError]=useState('')
  const fields=[
    {name:'title',label:'Exam title',maxLength:200,minLength:3},
    {name:'description',label:'Description',type:'textarea',required:false,maxLength:2000},
    {name:'duration',label:'Duration (minutes)',type:'number',min:1,max:600,step:1},
    {name:'start',label:'Start date and time',type:'datetime-local'},
    {name:'end',label:'End date and time',type:'datetime-local'},
    {name:'totalMarks',label:'Total marks',type:'number',min:1,step:1},
    {name:'passMarks',label:'Passing marks',type:'number',min:0,step:1},
    {name:'active',label:'Visible to students',type:'checkbox'},
  ]
  const save=e=>{
    const start=new Date(e.start),end=new Date(e.end)
    if(Number.isNaN(start.getTime())||Number.isNaN(end.getTime()))return 'Enter a valid start and end date.'
    if(end<=start)return 'End date must be after the start date.'
    if(Number(e.passMarks)>Number(e.totalMarks))return 'Passing marks cannot exceed total marks.'
    return upsert('exams',{...e,start:start.toISOString(),end:end.toISOString(),duration:Number(e.duration),totalMarks:Number(e.totalMarks),passMarks:Number(e.passMarks)})
  }
  const toggle=async e=>{
    setStatusError('')
    try{await setExamStatus(e.id,!e.active)}catch(error){setStatusError(error.message||'Unable to update exam visibility.')}
  }
  const examQuestions=preview?questions.filter(q=>q.examId===preview.id):[]
  return <div className="space-y-5">
    <div><div className="eyebrow">Assessments</div><h2 className="page-title">Exam management</h2><p className="page-subtitle">Create an exam, set its availability window, and review its question set.</p></div>
    {statusError&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{statusError}</p>}
    <Crud title="Exams" addLabel="Create exam" rows={exams} searchKeys={['title','description']} fields={fields}
      blank={{title:'',description:'',duration:30,start:'',end:'',totalMarks:10,passMarks:5,active:true}} onSave={save} onDelete={id=>remove('exams',id)}
      columns={[{label:'Exam',render:e=><div className="min-w-44"><div className="font-semibold text-slate-900">{e.title}</div><div className="mt-0.5 line-clamp-2 max-w-sm text-xs leading-5 text-slate-600">{e.description}</div></div>},
        {label:'Duration',render:e=><span className="whitespace-nowrap">{e.duration} min</span>},
        {label:'Schedule',render:e=><span className="whitespace-nowrap text-xs leading-5 text-slate-600">{fmt(e.start)}<br/>{fmt(e.end)}</span>},
        {label:'Questions',render:e=>e.questionCount??questions.filter(q=>q.examId===e.id).length},
        {label:'Marks',render:e=><span className="whitespace-nowrap">{e.totalMarks} total <span className="text-slate-500">· pass {e.passMarks}</span></span>},
        {label:'Preview',render:e=><button type="button" className="btn-g min-h-9 px-3" aria-label={`Preview ${e.title}`} onClick={()=>setPreview(e)}><Eye size={15}/>Preview</button>},
        {label:'Status',render:e=>{const s=examState(e,false);return <div className="flex min-w-32 flex-col items-start gap-1.5"><Badge tone={stateTone[s]}>{s}</Badge><button type="button" className="text-xs font-semibold text-blue-800 underline-offset-4 hover:underline" onClick={()=>toggle(e)}>{e.active?'Deactivate':'Activate'}</button></div>}}]}/>
    {preview&&<Modal title="Exam preview" wide onClose={()=>setPreview(null)}><div className="space-y-5">
      <div className="rounded-xl bg-slate-50 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-bold text-slate-900">{preview.title}</h3><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{preview.description||'No description provided.'}</p></div><Badge tone={stateTone[examState(preview,false)]}>{examState(preview,false)}</Badge></div><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-600"><span>{preview.duration} minutes</span><span>{preview.totalMarks} marks · pass {preview.passMarks}</span><span>Opens {fmt(preview.start)}</span><span>Closes {fmt(preview.end)}</span></div></div>
      <div><h4 className="section-title">Question set <span className="font-normal text-slate-500">({examQuestions.length})</span></h4>{examQuestions.length?<ol className="mt-3 space-y-3">{examQuestions.map((q,i)=><li key={q.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><p className="font-semibold text-slate-900">{i+1}. {q.text}</p><span className="shrink-0 text-xs font-medium text-slate-500">{q.marks} marks</span></div><ul className="mt-3 grid gap-2 sm:grid-cols-2">{opts(q).map((option,k)=><li key={k} className={`rounded-lg border px-3 py-2 text-sm ${Number(q.correct)===k?'border-emerald-300 bg-emerald-50 font-semibold text-emerald-900':'border-slate-200 text-slate-700'}`}><span className="mr-2 text-xs font-bold text-slate-500">{'ABCD'[k]}</span>{option}{Number(q.correct)===k&&<span className="ml-2 text-xs font-semibold">Correct answer</span>}</li>)}</ul></li>)}</ol>:<EmptyState icon={HelpCircle} title="No questions added yet" description="Add questions to this exam before students begin taking it."/>}</div>
    </div></Modal>}
  </div>
}

export function QuestionsPage(){
  const {exams,questions,upsert,remove}=useApp(),[ex,setEx]=useState('')
  const labels=['A','B','C','D']
  const fields=[{name:'examId',label:'Exam',type:'select',options:exams.map(e=>({v:e.id,l:e.title}))},{name:'text',label:'Question',type:'textarea',minLength:3,maxLength:2000},
    ...labels.map(l=>({name:l.toLowerCase(),label:`Option ${l}`,maxLength:500})),{name:'correct',label:'Correct answer',type:'select',options:labels.map((l,i)=>({v:String(i),l:`Option ${l}`}))},{name:'marks',label:'Marks',type:'number',min:1,max:100,step:1}]
  const filtered=questions.filter(q=>!ex||q.examId===ex)
  return <div className="space-y-5">
    <div><div className="eyebrow">Assessment content</div><h2 className="page-title">Question bank</h2><p className="page-subtitle">Build and maintain the multiple-choice questions used in your exams.</p></div>
    {!exams.length&&<div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">Create an exam before adding questions.</div>}
    <Crud title="Questions" addLabel="Add question" rows={filtered} searchKeys={['text']} fields={fields} disableAdd={!exams.length}
      blank={{examId:ex||exams[0]?.id||'',text:'',a:'',b:'',c:'',d:'',correct:'',marks:1}} onSave={q=>upsert('questions',{...q,correct:Number(q.correct),marks:Number(q.marks)})} onDelete={id=>remove('questions',id)}
      toolbar={<div className="min-w-48"><label className="sr-only" htmlFor="question-exam-filter">Filter questions by exam</label><select id="question-exam-filter" className="inp" value={ex} onChange={e=>setEx(e.target.value)}><option value="">All exams</option>{exams.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}</select></div>}
      columns={[{label:'Question',render:q=><div className="min-w-48"><div className="font-semibold text-slate-900">{q.text}</div><div className="mt-1 text-xs text-slate-600">Correct: {['A','B','C','D'][Number(q.correct)]}: {opts(q)[Number(q.correct)]}</div></div>},{label:'Exam',render:q=>exams.find(e=>e.id===q.examId)?.title||'—'},{label:'Marks',key:'marks'}]}/>
  </div>
}

export function StudentsPage(){
  const {users,results,upsert,remove}=useApp()
  const fields=[{name:'name',label:'Full name',maxLength:100,minLength:2},{name:'email',label:'Email',type:'email'},{name:'grade',label:'Class or year',required:false,maxLength:50},{name:'password',label:'Initial password',type:'password',required:false,minLength:8}]
  const save=s=>{
    if(users.some(u=>u.email.toLowerCase()===s.email.toLowerCase()&&u.id!==s.id))return 'That email address is already in use.'
    return upsert('users',s.id?s:{...s,role:'student',password:s.password||'student123'})
  }
  const students=users.filter(u=>u.role==='student')
  return <div className="space-y-5">
    <div><div className="eyebrow">People</div><h2 className="page-title">Student directory</h2><p className="page-subtitle">Search student records and check participation at a glance.</p></div>
    <Crud title="Students" addLabel="Add student" rows={students} searchKeys={['name','email','grade']} fields={fields}
      blank={{name:'',email:'',grade:'',password:'student123'}} onSave={save} onDelete={id=>remove('users',id)}
      columns={[{label:'Student',render:s=><div className="min-w-44"><div className="font-semibold text-slate-900">{s.name}</div><div className="mt-0.5 text-xs text-slate-600">{s.email}</div></div>},{label:'Class',render:s=>s.grade||'—'},
        {label:'Exams taken',render:s=>results.filter(r=>r.studentId===s.id).length},
        {label:'Average score',render:s=>{const r=results.filter(x=>x.studentId===s.id);return r.length?<span className="font-semibold text-slate-900">{Math.round(r.reduce((a,b)=>a+b.percent,0)/r.length)}%</span>:'—'}}]}/>
  </div>
}

export const AdminResults=()=>{const {results}=useApp();return <div className="space-y-5"><div><div className="eyebrow">Assessment analytics</div><h2 className="page-title">Exam results</h2><p className="page-subtitle">Search attempts, compare outcomes, and review answer details.</p></div><ResultsTable results={results} showStudent/></div>}
