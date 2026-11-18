import {useState} from 'react'
import {Link,useNavigate} from 'react-router-dom'
import {ArrowRight,Eye,EyeOff,GraduationCap,ShieldCheck,Timer} from 'lucide-react'
import {useApp} from '../context/AppContext'

export default function Auth({mode}){
  const {login,signup,storageMode}=useApp(),nav=useNavigate(),su=mode==='signup'
  const [f,setF]=useState({name:'',email:'',password:''}),[show,setShow]=useState(false),[err,setErr]=useState(''),[ok,setOk]=useState(''),[busy,setBusy]=useState(false)
  const go=async e=>{
    e.preventDefault();setErr('');setOk('')
    if(su&&f.name.trim().length<2)return setErr('Enter your full name.')
    if(!/^\S+@\S+\.\S+$/.test(f.email))return setErr('Enter a valid email address.')
    if(f.password.length<(su?8:1))return setErr(su?'Password must be at least 8 characters.':'Enter your password.')
    setBusy(true)
    try{
      const m=await (su?signup({name:f.name.trim(),email:f.email,password:f.password}):login(f.email,f.password))
      if(m){setErr(m);return}
      setOk(su?'Account created. Redirecting…':'Welcome back! Redirecting…');setTimeout(()=>nav('/'),450)
    }catch(error){setErr(error.message||'Unable to sign in. Please try again.')}
    finally{setBusy(false)}
  }
  return <div className="min-h-screen bg-white lg:grid lg:grid-cols-[.95fr_1.05fr]">
    <aside className="relative hidden min-h-screen overflow-hidden bg-[#10254a] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
      <div className="absolute -right-28 top-24 h-80 w-80 rounded-full border border-blue-300/10"/><div className="absolute -right-12 top-40 h-48 w-48 rounded-full border border-blue-300/10"/>
      <Link to="/login" className="relative inline-flex w-fit items-center gap-3 text-lg font-bold"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white"><GraduationCap size={23}/></span>ExamHub</Link>
      <div className="relative max-w-lg space-y-8"><div><div className="eyebrow !text-blue-300">Assessment, made clear</div><h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight xl:text-5xl">A better way to run and take exams.</h1><p className="mt-5 max-w-md text-base leading-7 text-blue-100/80">A focused workspace for managing assessments, measuring progress, and helping students do their best work.</p></div>
        <div className="space-y-4"><div className="flex gap-3"><span className="mt-0.5 rounded-lg bg-white/10 p-2 text-blue-200"><Timer size={18}/></span><div><div className="font-semibold">Timed assessments</div><div className="mt-1 text-sm text-blue-100/70">Clear schedules and automatic submission when time ends.</div></div></div>
          <div className="flex gap-3"><span className="mt-0.5 rounded-lg bg-white/10 p-2 text-blue-200"><ShieldCheck size={18}/></span><div><div className="font-semibold">Results you can review</div><div className="mt-1 text-sm text-blue-100/70">Scores and answer feedback are easy to understand.</div></div></div></div></div>
      <div className="relative flex items-center justify-between border-t border-white/10 pt-5 text-xs text-blue-100/60"><span>ExamHub Online Examination System</span><span>For schools and learning teams</span></div>
    </aside>
    <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
      <form onSubmit={go} className="w-full max-w-md space-y-6">
        <div className="lg:hidden"><Link to="/login" className="inline-flex items-center gap-2 font-bold text-slate-900"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-white"><GraduationCap size={20}/></span>ExamHub</Link></div>
        <div><div className="eyebrow">{su?'Student account':'Welcome to ExamHub'}</div><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{su?'Create your account':'Sign in to your account'}</h1><p className="mt-2 text-sm leading-6 text-slate-600">{su?'Create a student account to see and take your scheduled exams.':'Enter your school email and password to continue.'}</p></div>
        <div className="space-y-4">
          {su&&<div><label htmlFor="auth-name" className="mb-1.5 block text-sm font-semibold text-slate-800">Full name</label><input id="auth-name" autoComplete="name" required minLength={2} className="inp" placeholder="Your full name" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></div>}
          <div><label htmlFor="auth-email" className="mb-1.5 block text-sm font-semibold text-slate-800">School email</label><input id="auth-email" type="email" autoComplete="email" required className="inp" placeholder="you@school.edu" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></div>
          <div><label htmlFor="auth-password" className="mb-1.5 block text-sm font-semibold text-slate-800">Password</label><div className="relative"><input id="auth-password" className="inp pr-12" type={show?'text':'password'} autoComplete={su?'new-password':'current-password'} minLength={su?8:undefined} required placeholder={su?'At least 8 characters':'Your password'} value={f.password} onChange={e=>setF({...f,password:e.target.value})}/><button type="button" aria-label={show?'Hide password':'Show password'} aria-pressed={show} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" onClick={()=>setShow(!show)}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></div>
        </div>
        {err&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</p>}
        {ok&&<p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{ok}</p>}
        <button className="btn-p w-full" disabled={busy}>{busy?'Please wait…':su?'Create student account':'Sign in'}{!busy&&<ArrowRight size={16}/>}</button>
        {!su&&<div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">{storageMode==='local'?<><strong className="text-slate-800">Local demo accounts</strong><br/>Admin: admin@school.edu / admin123<br/>Student: sara@school.edu / student123</>:'Demo account credentials are configured when the backend is seeded.'}</div>}
        <p className="text-center text-sm text-slate-600">{su?'Already registered?':'New student?'} <Link className="font-semibold text-blue-700 underline-offset-4 hover:text-blue-900 hover:underline" to={su?'/login':'/signup'}>{su?'Sign in':'Create an account'}</Link></p>
        <p className="text-center text-xs text-slate-500">{storageMode==='local'?'Local demo mode':'Secure school workspace'}</p>
      </form>
    </main>
  </div>
}
