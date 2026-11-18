import {Link} from 'react-router-dom'
import {Award,ArrowRight,CalendarClock,CheckCircle2,FileText,Radio,Users} from 'lucide-react'
import {Bar,BarChart,CartesianGrid,Cell,Pie,PieChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts'
import {useApp} from '../../context/AppContext'
import {Badge,EmptyState,Stat} from '../../components/ui'
import {examState,fmt} from '../../utils/grade'

export default function AdminDashboard(){
  const {users,exams,results}=useApp()
  const students=users.filter(u=>u.role==='student')
  const states=exams.map(e=>[e,examState(e,false)])
  const openCount=states.filter(([,s])=>s==='available').length
  const upcoming=states.filter(([,s])=>s==='upcoming').map(([e])=>e).sort((a,b)=>new Date(a.start)-new Date(b.start)).slice(0,4)
  const byExam=exams.map(e=>{const rows=results.filter(r=>r.examId===e.id);return {name:e.title.length>18?`${e.title.slice(0,17)}…`:e.title,fullName:e.title,average:rows.length?Math.round(rows.reduce((n,r)=>n+r.percent,0)/rows.length):0,attempts:rows.length}}).filter(e=>e.attempts).slice(0,8)
  const passed=results.filter(r=>r.passed).length,failed=results.length-passed
  const pie=[{name:'Passed',value:passed,color:'#15803d'},{name:'Not passed',value:failed,color:'#c2414b'}]
  const recent=[...results].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5)
  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="eyebrow">Overview</div><h2 className="page-title">Good day, {users.find(u=>u.role==='admin')?.name?.split(' ')[1]||'Admin'}</h2><p className="page-subtitle">Track exam activity and keep your assessment program moving.</p></div><Link to="/admin/exams" className="btn-p w-fit">Manage exams<ArrowRight size={16}/></Link></div>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Exam system summary">
      <Stat icon={Users} label="Students" value={students.length} detail="Registered accounts" tone="blue"/>
      <Stat icon={FileText} label="Exams" value={exams.length} detail="In your workspace" tone="violet"/>
      <Stat icon={Radio} label="Open now" value={openCount} detail="Available to students" tone="green"/>
      <Stat icon={CheckCircle2} label="Attempts submitted" value={results.length} detail="Completed exam attempts" tone="amber"/>
    </section>

    <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
      <div className="card min-w-0"><div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="section-title">Average score by exam</h3><p className="mt-1 text-sm text-slate-600">Based on submitted attempts</p></div><Award size={19} className="text-blue-700"/></div>
        {byExam.length?<div className="h-[270px] min-w-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={byExam} margin={{top:8,right:8,bottom:8,left:-15}}><CartesianGrid stroke="#e8edf4" strokeDasharray="4 4" vertical={false}/><XAxis dataKey="name" tick={{fill:'#475569',fontSize:11}} axisLine={false} tickLine={false} interval={0}/><YAxis domain={[0,100]} tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false}/><Tooltip formatter={(v,n)=>[`${v}%`,n==='average'?'Average score':n]} labelFormatter={label=>byExam.find(x=>x.name===label)?.fullName||label} contentStyle={{borderRadius:12,borderColor:'#e2e8f0',fontSize:12}}/><Bar dataKey="average" fill="#1d4ed8" radius={[6,6,0,0]} maxBarSize={42}/></BarChart></ResponsiveContainer></div>:<EmptyState title="No exam scores yet" description="Submitted exam attempts will appear in this chart."/>}
      </div>
      <div className="card min-w-0"><div className="mb-3"><h3 className="section-title">Pass overview</h3><p className="mt-1 text-sm text-slate-600">Across all completed attempts</p></div>
        {results.length?<><div className="h-[210px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={4} stroke="none">{pie.map(p=><Cell key={p.name} fill={p.color}/>)}</Pie><Tooltip contentStyle={{borderRadius:12,borderColor:'#e2e8f0',fontSize:12}}/></PieChart></ResponsiveContainer></div><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-emerald-50 p-3"><div className="text-xl font-bold text-emerald-800">{passed}</div><div className="text-xs font-medium text-emerald-800">Passed</div></div><div className="rounded-xl bg-red-50 p-3"><div className="text-xl font-bold text-red-800">{failed}</div><div className="text-xs font-medium text-red-800">Not passed</div></div></div></>:<EmptyState title="No results to summarize" description="Pass statistics will appear once students submit exams."/>}
      </div>
    </section>

    <section className="grid gap-5 xl:grid-cols-2">
      <div className="card"><div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="section-title">Upcoming exams</h3><p className="mt-1 text-sm text-slate-600">Next scheduled assessments</p></div><Link to="/admin/exams" className="text-sm font-semibold text-blue-700 hover:text-blue-900">View all</Link></div>
        {upcoming.length?<ul className="divide-y divide-slate-100">{upcoming.map(e=><li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"><div className="min-w-0"><div className="truncate text-sm font-semibold text-slate-900">{e.title}</div><div className="mt-1 text-xs text-slate-600">Starts {fmt(e.start)} · {e.duration} min</div></div><Badge tone="amber">Upcoming</Badge></li>)}</ul>:<EmptyState icon={CalendarClock} title="No exams scheduled ahead" description="Create an exam and set its availability window." action={<Link to="/admin/exams" className="btn-g">Create an exam</Link>}/>}
      </div>
      <div className="card"><div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="section-title">Recent activity</h3><p className="mt-1 text-sm text-slate-600">Latest submitted results</p></div><Link to="/admin/results" className="text-sm font-semibold text-blue-700 hover:text-blue-900">All results</Link></div>
        {recent.length?<ul className="divide-y divide-slate-100">{recent.map(r=><li key={r.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"><div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-800">{(users.find(u=>u.id===r.studentId)?.name||'S').split(' ').map(s=>s[0]).slice(0,2).join('')}</span><div className="min-w-0"><div className="truncate text-sm font-semibold text-slate-900">{users.find(u=>u.id===r.studentId)?.name||r.studentName||'Student'}</div><div className="truncate text-xs text-slate-600">{exams.find(e=>e.id===r.examId)?.title||r.examTitle||'Exam'} · {fmt(r.date)}</div></div></div><Badge tone={r.passed?'green':'red'}>{r.percent}%</Badge></li>)}</ul>:<EmptyState title="No recent results" description="Student submissions will be shown here."/>}
      </div>
    </section>
  </div>
}
