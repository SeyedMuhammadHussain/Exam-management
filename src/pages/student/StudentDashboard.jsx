import {useMemo,useState} from 'react'
import {Link} from 'react-router-dom'
import {Award,CalendarClock,CheckCircle2,Clock3,Percent,Play,Search} from 'lucide-react'
import {useApp} from '../../context/AppContext'
import {Badge,EmptyState,Stat} from '../../components/ui'
import {examState,fmt} from '../../utils/grade'

export default function StudentDashboard(){
  const {user,exams,results,questions}=useApp(),[query,setQuery]=useState('')
  const mine=results.filter(r=>r.studentId===user.id)
  const rows=useMemo(()=>exams.map(e=>({e,s:examState(e,mine.some(r=>r.examId===e.id)),r:mine.find(r=>r.examId===e.id)})),[exams,mine])
  const avg=mine.length?Math.round(mine.reduce((a,b)=>a+b.percent,0)/mine.length):0
  const filtered=rows.filter(({e})=>`${e.title} ${e.description}`.toLowerCase().includes(query.toLowerCase()))
  const upcoming=rows.filter(x=>x.s==='upcoming').sort((a,b)=>new Date(a.e.start)-new Date(b.e.start))[0]
  const recent=[...mine].sort((a,b)=>new Date(b.date)-new Date(a.date))[0]
  const sections=[['available','Available now','No exams are open right now.'],['upcoming','Coming up','No upcoming exams are scheduled.'],['completed','Completed','Your completed exams will appear here.']]

  return <div className="space-y-6">
    <section className="relative overflow-hidden rounded-2xl bg-[#10254a] px-5 py-6 text-white sm:px-8 sm:py-8"><div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10"/><div className="absolute -right-4 -top-8 h-40 w-40 rounded-full border border-white/10"/>
      <div className="relative max-w-2xl"><div className="text-xs font-semibold uppercase tracking-[.14em] text-blue-200">Student workspace</div><h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Welcome back, {user.name.split(' ')[0]}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/80">Check your schedule, prepare for upcoming exams, and follow your progress.</p>{upcoming&&<div className="mt-5 inline-flex flex-wrap items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm"><CalendarClock size={16} className="text-blue-200"/><span>Next up: <strong>{upcoming.e.title}</strong></span><span className="text-blue-100/75">· {fmt(upcoming.e.start)}</span></div>}</div>
    </section>
    <section className="grid gap-3 sm:grid-cols-3" aria-label="Your exam summary"><Stat icon={CheckCircle2} label="Exams completed" value={mine.length} tone="blue"/><Stat icon={Percent} label="Average score" value={`${avg}%`} detail={mine.length?'Across completed exams':'Scores appear after you submit'} tone="violet"/><Stat icon={Award} label="Exams passed" value={mine.filter(r=>r.passed).length} tone="green"/></section>

    {recent&&<section className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="min-w-0"><div className="text-xs font-semibold uppercase tracking-wide text-blue-800">Latest result</div><div className="mt-1 truncate font-semibold text-slate-900">{exams.find(e=>e.id===recent.examId)?.title||recent.examTitle||'Exam'}</div><div className="mt-1 text-xs text-slate-600">{recent.obtained}/{recent.total} marks · {fmt(recent.date)}</div></div><div className="flex items-center gap-3"><Badge tone={recent.passed?'green':'red'}>{recent.passed?'Passed':'Not passed'}</Badge><Link to="/student/results" className="text-sm font-semibold text-blue-800 underline-offset-4 hover:underline">Review result</Link></div></section>}

    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="section-title text-lg">Your exam schedule</h2><p className="mt-1 text-sm text-slate-600">Review availability and open an exam when you’re ready.</p></div><div className="relative w-full sm:max-w-xs"><Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><label htmlFor="exam-search" className="sr-only">Search exams</label><input id="exam-search" type="search" className="inp pl-9" placeholder="Search exams" value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
      {sections.map(([status,title,empty])=>{
        const list=filtered.filter(x=>x.s===status)
        return <div key={status}><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-800">{title}</h3><span className="text-xs text-slate-500">{list.length}</span></div>
          {list.length?<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{list.map(({e,s,r})=><article key={e.id} className="card flex min-h-[220px] flex-col gap-3 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3"><h4 className="font-bold leading-5 text-slate-900">{e.title}</h4><Badge tone={r?(r.passed?'green':'red'):s==='available'?'green':'amber'}>{r?`${r.percent}%`:s==='available'?'Open':'Upcoming'}</Badge></div>
            <p className="line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{e.description||'Exam details and instructions will be shown before you begin.'}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-slate-600"><span className="inline-flex items-center gap-1.5"><Clock3 size={14}/>{e.duration} minutes</span><span>{e.questionCount??questions.filter(q=>q.examId===e.id).length} questions</span></div>
            <div className="mt-auto border-t border-slate-100 pt-3 text-xs text-slate-600">{s==='upcoming'?`Opens ${fmt(e.start)}`:r?`Submitted ${fmt(r.date)}`:`Closes ${fmt(e.end)}`}</div>
            {s==='available'&&<Link to={`/student/exam/${e.id}`} className="btn-p w-full"><Play size={15}/>Start exam</Link>}
          </article>)}</div>:!query&&(status==='available'||status==='upcoming')?<EmptyState icon={status==='upcoming'?CalendarClock:Clock3} title={empty} description="Your schedule will update when an exam is assigned to you."/>:null}
        </div>
      })}
      {query&&filtered.length===0&&<EmptyState icon={Search} title="No exams found" description="Try another title or keyword."/>}
    </section>
  </div>
}
