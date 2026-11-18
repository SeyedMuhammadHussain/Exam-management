import {useEffect,useId,useRef} from 'react'
import {CheckCircle2,Clock3,X, XCircle} from 'lucide-react'
import {useApp} from '../context/AppContext'
import {opts,fmt} from '../utils/grade'

const tones={green:'bg-emerald-50 text-emerald-800 ring-emerald-600/15',red:'bg-red-50 text-red-800 ring-red-600/15',blue:'bg-blue-50 text-blue-800 ring-blue-600/15',amber:'bg-amber-50 text-amber-900 ring-amber-600/20',slate:'bg-slate-100 text-slate-700 ring-slate-500/15'}
export const Badge=({tone='slate',children,className=''})=><span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tones[tone]||tones.slate} ${className}`}>{children}</span>
export const stateTone={available:'green',upcoming:'amber',completed:'blue',inactive:'slate',expired:'red'}

export const Stat=({icon:I,label,value,detail,tone='blue'})=>{
  const colors={blue:'bg-blue-50 text-blue-700',green:'bg-emerald-50 text-emerald-700',amber:'bg-amber-50 text-amber-800',violet:'bg-violet-50 text-violet-700'}
  return <div className="card flex min-w-0 items-start gap-4 p-4 sm:p-5">
    <div className={`rounded-xl p-3 ${colors[tone]||colors.blue}`}><I size={21} aria-hidden="true"/></div>
    <div className="min-w-0"><div className="text-2xl font-bold tabular-nums text-slate-900">{value}</div><div className="mt-0.5 text-sm font-medium text-slate-600">{label}</div>{detail&&<div className="mt-1 text-xs text-slate-500">{detail}</div>}</div>
  </div>
}

export function EmptyState({icon:I=Clock3,title,description,action,className=''}){
  return <div className={`rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-8 text-center ${className}`}>
    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm"><I size={20} aria-hidden="true"/></div>
    <h3 className="mt-3 text-sm font-semibold text-slate-800">{title}</h3>
    {description&&<p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-600">{description}</p>}
    {action&&<div className="mt-4">{action}</div>}
  </div>
}

export function LoadingState({label='Loading…'}){
  return <div className="flex min-h-36 items-center justify-center gap-3 text-sm font-medium text-slate-600" role="status"><span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-700" aria-hidden="true"/>{label}</div>
}

export function Modal({title,onClose,children,wide}){
  const titleId=useId(),closeRef=useRef(null),onCloseRef=useRef(onClose),returnFocus=useRef(null)
  onCloseRef.current=onClose
  useEffect(()=>{
    returnFocus.current=document.activeElement
    closeRef.current?.focus()
    const handle=e=>{
      if(e.key==='Escape')onCloseRef.current?.()
      if(e.key==='Tab'){
        const nodes=[...document.querySelectorAll('[data-dialog] button:not(:disabled),[data-dialog] a[href],[data-dialog] input:not(:disabled),[data-dialog] select:not(:disabled),[data-dialog] textarea:not(:disabled)')]
        if(!nodes.length)return
        const first=nodes[0],last=nodes[nodes.length-1]
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
      }
    }
    document.addEventListener('keydown',handle)
    return()=>{document.removeEventListener('keydown',handle);returnFocus.current?.focus?.()}
  },[])
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={e=>{if(e.target===e.currentTarget)onClose?.()}}>
    <section data-dialog role="dialog" aria-modal="true" aria-labelledby={titleId} className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6 ${wide?'max-w-3xl':'max-w-xl'}`}>
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-4"><h2 id={titleId} className="text-lg font-bold text-slate-900">{title}</h2><button ref={closeRef} type="button" aria-label="Close dialog" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><X size={18}/></button></div>
      {children}
    </section>
  </div>
}

export function ResultDetail({r}){
  const {exams,questions}=useApp()
  const e=exams.find(x=>x.id===r.examId)
  const review=r.review||questions.filter(q=>q.examId===r.examId).map(q=>({
    id:q.id,text:q.text,marks:q.marks,options:opts(q),selected:r.answers?.[q.id]===undefined?null:Number(r.answers[q.id]),correct:Number(q.correct),
  }))
  const correct=review.filter(q=>q.selected!==null&&Number(q.selected)===Number(q.correct)).length
  return <div className="space-y-5">
    <div className="flex flex-col gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div><div className="font-semibold text-slate-900">{e?.title||r.examTitle||'Exam result'}</div><p className="mt-1 text-sm text-slate-600">{fmt(r.date)}{r.total?` · ${r.obtained}/${r.total} marks`:''}</p></div>
      <div className="flex items-center gap-2"><Badge tone={r.passed?'green':'red'}>{r.passed?'Passed':'Not passed'}</Badge><span className="text-2xl font-bold tabular-nums text-slate-900">{r.percent}%</span></div>
    </div>
    <div className="flex flex-wrap gap-3 text-sm text-slate-600"><span className="inline-flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-700"/>{correct} correct</span><span className="inline-flex items-center gap-1.5"><XCircle size={16} className="text-red-700"/>{Math.max(0,review.length-correct)} incorrect or unanswered</span></div>
    {review.length? <div className="space-y-3">{review.map((q,i)=>{
      const ok=q.selected!==null&&Number(q.selected)===Number(q.correct)
      return <article key={q.id} className={`rounded-xl border p-4 ${ok?'border-emerald-200 bg-emerald-50/40':'border-red-200 bg-red-50/40'}`}>
        <div className="flex items-start gap-3"><div className={`mt-0.5 ${ok?'text-emerald-700':'text-red-700'}`}>{ok?<CheckCircle2 size={18}/>:<XCircle size={18}/>}</div><div className="min-w-0 flex-1"><div className="font-semibold text-slate-900">{i+1}. {q.text}</div><div className="mt-2 grid gap-1 text-sm text-slate-700 sm:grid-cols-2"><p>Your answer: <strong>{q.selected===null?'Not answered':q.options?.[Number(q.selected)]??'Unknown option'}</strong></p>{!ok&&<p>Correct answer: <strong>{q.options?.[Number(q.correct)]??'Unavailable'}</strong></p>}</div><p className="mt-2 text-xs font-medium text-slate-500">{q.marks} {Number(q.marks)===1?'mark':'marks'}</p></div></div>
      </article>
    })}</div>:<EmptyState title="Answer review unavailable" description="This result does not include question-level review data."/>}
  </div>
}
