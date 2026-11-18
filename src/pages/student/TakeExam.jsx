import {useCallback,useEffect,useRef,useState} from 'react'
import {useNavigate,useParams} from 'react-router-dom'
import {ArrowLeft,Check,ChevronLeft,ChevronRight,Clock3,Send,Timer} from 'lucide-react'
import {useApp} from '../../context/AppContext'
import {EmptyState,LoadingState,Modal} from '../../components/ui'

export default function TakeExam(){
  const {id}=useParams(),nav=useNavigate(),{startAttempt,saveAnswer,submit,storageMode}=useApp()
  const [session,setSession]=useState(null),[index,setIndex]=useState(0),[answers,setAnswers]=useState({}),[confirm,setConfirm]=useState(false)
  const [left,setLeft]=useState(0),[busy,setBusy]=useState(false),[saving,setSaving]=useState(false),[saveMessage,setSaveMessage]=useState(''),[error,setError]=useState('')
  const deadline=useRef(0),done=useRef(false),latest=useRef(null)

  useEffect(()=>{
    let live=true
    startAttempt(id).then(data=>{
      if(!live)return
      const questions=data.questions.map(q=>{const options=q.options||[q.a,q.b,q.c,q.d];return {...q,a:options[0],b:options[1],c:options[2],d:options[3]}})
      setSession({...data,questions})
      setAnswers(Object.fromEntries(Object.entries(data.answers||{}).map(([qid,n])=>[qid,String(n)])))
      deadline.current=Date.now()+data.remainingSeconds*1000
      setLeft(data.remainingSeconds*1000)
    }).catch(e=>{if(live)setError(e.message||'Unable to start this exam.')})
    return()=>{live=false}
  },[id])

  const finish=useCallback(async()=>{
    if(done.current||!session)return
    done.current=true;setBusy(true);setError('')
    try{
      const payload=Object.fromEntries(Object.entries(answers).map(([qid,n])=>[qid,Number(n)]))
      const resultId=await submit(session.attemptId,payload)
      nav('/student/results',{state:{open:resultId},replace:true})
    }catch(e){done.current=false;setError(e.message||'Your exam could not be submitted. Please try again.');setBusy(false)}
  },[answers,nav,session,submit])
  latest.current=finish

  useEffect(()=>{
    if(!session)return
    const timer=setInterval(()=>{
      const remaining=Math.max(0,deadline.current-Date.now())
      setLeft(remaining)
      if(remaining===0){clearInterval(timer);latest.current?.()}
    },500)
    return()=>clearInterval(timer)
  },[session])

  useEffect(()=>{
    if(!session)return
    const warn=e=>{if(!done.current){e.preventDefault();e.returnValue='Your exam is in progress.'}}
    const pop=e=>{
      if(done.current)return
      const leave=window.confirm('Your exam is still in progress. Your saved answers will remain, but the timer will continue. Leave this exam?')
      if(!leave){e.stopImmediatePropagation();window.history.pushState({...window.history.state,examGuard:true},'',window.location.href)}
    }
    window.addEventListener('beforeunload',warn)
    window.history.pushState({...window.history.state,examGuard:true},'',window.location.href)
    window.addEventListener('popstate',pop,true)
    return()=>{window.removeEventListener('beforeunload',warn);window.removeEventListener('popstate',pop,true)}
  },[session])

  const choose=async(optionIndex)=>{
    if(saving||busy)return
    const question=session.questions[index]
    setSaving(true);setError('');setSaveMessage('Saving answer…')
    try{
      await saveAnswer(session.attemptId,question.id,optionIndex)
      setAnswers(previous=>({...previous,[question.id]:String(optionIndex)}))
      setSaveMessage(storageMode==='local'?'Saved in this browser':'Answer saved')
    }catch(e){setSaveMessage('');setError(e.message||'Your answer could not be saved. Try again.')}
    finally{setSaving(false)}
  }

  if(error&&!session)return <div className="mx-auto max-w-xl px-4 py-12"><EmptyState title="Could not open this exam" description={error} action={<button type="button" className="btn-g" onClick={()=>nav('/student')}><ArrowLeft size={16}/>Back to dashboard</button>}/></div>
  if(!session)return <LoadingState label="Preparing your exam…"/>

  const questions=session.questions,question=questions[index],answered=Object.keys(answers).length
  const minutes=String(Math.floor(left/60000)).padStart(2,'0'),seconds=String(Math.floor(left/1000)%60).padStart(2,'0')
  const choices=[question.a,question.b,question.c,question.d]
  return <div className="min-h-screen bg-[#f5f7fb]">
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
      <div className="min-w-0"><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Exam in progress</div><h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">{session.exam.title}</h1></div>
      <div role="timer" aria-label={`Time remaining: ${Number(minutes)} minutes and ${Number(seconds)} seconds`} className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 font-mono text-sm font-bold tabular-nums ${left<60000?'border-red-200 bg-red-50 text-red-800':'border-blue-100 bg-blue-50 text-blue-900'}`}><Timer size={17} aria-hidden="true"/><span>{minutes}:{seconds}</span></div>
    </div></header>
    <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-slate-900">Your answers are saved as you go.</p><p className="mt-1 text-xs text-slate-600">You can move between questions before submitting.</p></div><span className="text-xs font-semibold tabular-nums text-slate-600">{answered} / {questions.length} answered</span></div>
      <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label="Exam completion" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={answered}><div className="h-full rounded-full bg-blue-700 transition-[width]" style={{width:`${Math.round(answered/questions.length*100)}%`}}/></div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_250px]">
        <section className="card space-y-5 p-4 sm:p-7" aria-labelledby="question-heading">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Question {index+1} of {questions.length}</span><span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{question.marks} {Number(question.marks)===1?'mark':'marks'}</span></div>
          <h2 id="question-heading" className="text-xl font-bold leading-7 text-slate-900 sm:text-2xl">{question.text}</h2>
          <div role="group" aria-label="Answer choices" className="space-y-2.5">{choices.map((choice,k)=><button type="button" key={k} disabled={busy||saving} aria-pressed={answers[question.id]===String(k)} onClick={()=>choose(k)} className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-sm font-medium transition sm:px-4 ${answers[question.id]===String(k)?'border-blue-700 bg-blue-50 text-blue-950 ring-2 ring-blue-100':'border-slate-200 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50'}`}>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${answers[question.id]===String(k)?'bg-blue-700 text-white':'bg-slate-100 text-slate-700'}`}>{'ABCD'[k]}</span><span className="flex-1">{choice}</span>{answers[question.id]===String(k)&&<Check size={17} aria-label="Selected" className="text-blue-800"/>}</button>)}</div>
          <div className="flex min-h-6 items-center justify-between gap-2 text-xs text-slate-600" aria-live="polite">{saveMessage?<span className="inline-flex items-center gap-1.5"><Check size={14} className="text-emerald-700"/>{saveMessage}</span>:<span>{storageMode==='local'?'Saved in this browser':'Saved to your exam attempt'}</span>}<span>{saving?'Saving…':''}</span></div>
          {error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4"><button type="button" className="btn-g" disabled={index===0||busy||saving} onClick={()=>setIndex(index-1)}><ChevronLeft size={16}/>Previous</button><div className="flex items-center gap-2">{index<questions.length-1?<button type="button" className="btn-p" disabled={busy||saving} onClick={()=>setIndex(index+1)}>Next question<ChevronRight size={16}/></button>:<button type="button" className="btn-p" disabled={busy||saving} onClick={()=>setConfirm(true)}><Send size={15}/>Review and submit</button>}</div></div>
        </section>
        <aside className="card p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><h2 className="section-title">Question list</h2><span className="text-xs text-slate-600">{answered} done</span></div><p className="mt-1 text-xs text-slate-600">Select a number to jump to it.</p>
          <div className="mt-4 grid grid-cols-5 gap-2">{questions.map((q,k)=><button type="button" key={q.id} disabled={busy||saving} aria-label={`Question ${k+1}${answers[q.id]!==undefined?', answered':', unanswered'}`} aria-current={k===index?'step':undefined} onClick={()=>setIndex(k)} className={`h-10 rounded-lg border text-sm font-semibold transition ${k===index?'border-blue-800 bg-blue-800 text-white':'border-slate-200 bg-white text-slate-700 hover:border-blue-500'} ${answers[q.id]!==undefined&&k!==index?'!border-emerald-300 !bg-emerald-50 !text-emerald-900':''}`}>{k+1}</button>)}</div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600"><span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-600"/>Answered</span><span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-slate-400 bg-white"/>Unanswered</span></div>
          <button type="button" className="btn-p mt-5 w-full" disabled={busy||saving} onClick={()=>setConfirm(true)}><Send size={15}/>Submit exam</button>
          <p className="mt-3 text-center text-xs leading-5 text-slate-600">Your exam submits automatically when the timer reaches zero.</p>
        </aside>
      </div>
    </main>
    {confirm&&<Modal title="Submit this exam?" onClose={()=>!busy&&setConfirm(false)}><div className="space-y-4"><p className="text-sm leading-6 text-slate-700">You have answered <strong>{answered} of {questions.length}</strong> questions. After submission, you cannot change your answers or retake this exam.</p><div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700"><span className="font-semibold">Unanswered:</span> {questions.length-answered}</div>{error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" className="btn-g" disabled={busy} onClick={()=>setConfirm(false)}>Continue exam</button><button type="button" className="btn-p" disabled={busy} onClick={finish}>{busy?'Submitting…':'Submit now'}</button></div></div></Modal>}
  </div>
}
