import {useEffect,useMemo,useState} from 'react'
import {useLocation} from 'react-router-dom'
import {Eye,Search} from 'lucide-react'
import {useApp} from '../context/AppContext'
import {Badge,EmptyState,Modal,ResultDetail} from './ui'
import {fmt} from '../utils/grade'

export default function ResultsTable({results,showStudent}){
  const {exams,users,getResult}=useApp(),loc=useLocation()
  const [q,setQ]=useState(''),[status,setStatus]=useState('all'),[open,setOpen]=useState(null),[opening,setOpening]=useState(''),[error,setError]=useState('')
  useEffect(()=>{if(loc.state?.open){getResult(loc.state.open).then(setOpen).catch(e=>setError(e.message||'Unable to load result details.'))}},[loc.state?.open,results])
  const rows=useMemo(()=>results.map(r=>({...r,exam:exams.find(e=>e.id===r.examId)?.title||r.examTitle||'Exam',student:users.find(u=>u.id===r.studentId)?.name||r.studentName||'Student'}))
    .filter(r=>(r.exam+' '+r.student).toLowerCase().includes(q.trim().toLowerCase()))
    .filter(r=>status==='all'||(status==='passed'?r.passed:!r.passed))
    .sort((a,b)=>new Date(b.date)-new Date(a.date)),[results,exams,users,q,status])
  const average=rows.length?Math.round(rows.reduce((n,r)=>n+Number(r.percent||0),0)/rows.length):0
  const view=async r=>{
    setOpening(r.id);setError('')
    try{setOpen(await getResult(r.id))}catch(e){setError(e.message||'Unable to load result details.')}
    finally{setOpening('')}
  }
  return <div className="space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600"><span><strong className="text-slate-900">{rows.length}</strong> result{rows.length===1?'':'s'}</span><span>Average <strong className="text-slate-900">{average}%</strong></span></div>
      <div className="flex flex-col gap-2 sm:flex-row"><div className="relative sm:w-72"><Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><label className="sr-only" htmlFor="result-search">Search results</label><input id="result-search" type="search" className="inp pl-9" placeholder={showStudent?'Search student or exam':'Search exam'} value={q} onChange={e=>setQ(e.target.value)}/></div><label className="sr-only" htmlFor="result-filter">Filter results by status</label><select id="result-filter" className="inp sm:w-40" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All statuses</option><option value="passed">Passed</option><option value="failed">Not passed</option></select></div>
    </div>
    {error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
    <div className="card overflow-x-auto p-0"><table className="w-full min-w-[690px]"><thead className="border-b border-slate-200"><tr>
      {showStudent&&<th scope="col" className="th">Student</th>}<th scope="col" className="th">Exam</th><th scope="col" className="th">Score</th><th scope="col" className="th">Percentage</th><th scope="col" className="th">Outcome</th><th scope="col" className="th">Submitted</th><th scope="col" className="th"><span className="sr-only">Review</span></th></tr></thead>
      <tbody className="divide-y divide-slate-100">{rows.map(r=><tr key={r.id} className="hover:bg-slate-50/80">
        {showStudent&&<td className="td font-semibold text-slate-900">{r.student}</td>}<td className="td font-medium">{r.exam}</td><td className="td tabular-nums">{r.obtained}/{r.total}</td>
        <td className="td"><div className="flex items-center gap-2"><span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200"><span className={`block h-full rounded-full ${r.passed?'bg-emerald-700':'bg-red-700'}`} style={{width:`${Math.min(100,Math.max(0,r.percent))}%`}}/></span><span className="font-semibold tabular-nums text-slate-900">{r.percent}%</span></div></td>
        <td className="td"><Badge tone={r.passed?'green':'red'}>{r.passed?'Passed':'Not passed'}</Badge></td><td className="td whitespace-nowrap text-slate-600">{fmt(r.date)}</td>
        <td className="td"><button type="button" className="btn-g min-h-9 px-3" disabled={opening===r.id} aria-label={`Review ${r.exam} result`} onClick={()=>view(r)}><Eye size={15}/>{opening===r.id?'Loading…':'Review'}</button></td></tr>)}
        {!rows.length&&<tr><td colSpan={showStudent?7:6} className="p-4"><EmptyState title={q||status!=='all'?'No matching results':'No exam results yet'} description={q||status!=='all'?'Adjust the search or status filter.':'Completed attempts and their scores will appear here.'}/></td></tr>}</tbody></table></div>
    {open&&<Modal wide title="Result review" onClose={()=>setOpen(null)}><ResultDetail r={open}/></Modal>}
  </div>
}
