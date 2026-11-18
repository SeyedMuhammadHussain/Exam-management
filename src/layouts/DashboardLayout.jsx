import {useMemo,useState} from 'react'
import {NavLink,Outlet,useLocation,useNavigate} from 'react-router-dom'
import {Activity,BarChart3,BookOpenCheck,ChevronDown,ClipboardCheck,FileText,GraduationCap,HelpCircle,LayoutDashboard,LogOut,Menu,Users,Bell,X} from 'lucide-react'
import {useApp} from '../context/AppContext'
import {examState,fmt} from '../utils/grade'
import {Badge,EmptyState} from '../components/ui'

const NAV={admin:[['/admin','Dashboard',LayoutDashboard],['/admin/exams','Exams',FileText],['/admin/questions','Questions',HelpCircle],['/admin/students','Students',Users],['/admin/results','Results',BarChart3]],student:[['/student','Dashboard',LayoutDashboard],['/student/results','My results',ClipboardCheck]]}
const titles={'/admin':'Administrator overview','/admin/exams':'Exam management','/admin/questions':'Question bank','/admin/students':'Student directory','/admin/results':'Exam results','/student':'Student dashboard','/student/results':'My results'}

export default function DashboardLayout(){
  const {user,logout,exams,results,storageMode}=useApp(),nav=useNavigate(),loc=useLocation()
  const [side,setSide]=useState(false),[menu,setMenu]=useState(null)
  const notes=useMemo(()=>user.role==='admin'
    ?[...results].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,4).map(r=>({key:r.id,title:`${r.studentName||'A student'} submitted a result`,detail:`${r.examTitle||exams.find(e=>e.id===r.examId)?.title||'Exam'} · ${r.percent}%`,date:r.date}))
    :exams.filter(e=>examState(e,results.some(r=>r.examId===e.id&&r.studentId===user.id))==='available').slice(0,4).map(e=>({key:e.id,title:`${e.title} is open`,detail:`${e.duration} minutes · closes ${fmt(e.end)}`})),[user,results,exams])
  const pageTitle=titles[loc.pathname]||'ExamHub'
  const initials=(user.name||'U').trim().split(/\s+/).slice(0,2).map(p=>p[0]).join('').toUpperCase()

  return <div className="min-h-screen bg-[#f5f7fb] lg:flex">
    {side&&<button type="button" aria-label="Close navigation" className="fixed inset-0 z-30 cursor-default bg-slate-950/50 lg:hidden" onClick={()=>setSide(false)}/>}
    <aside id="primary-navigation" className={`fixed inset-y-0 left-0 z-40 flex w-[270px] flex-col bg-[#10254a] px-4 py-5 text-white shadow-2xl transition-transform duration-200 lg:static lg:z-auto lg:min-h-screen lg:translate-x-0 lg:shadow-none ${side?'translate-x-0':'-translate-x-full'}`} aria-label="Primary navigation">
      <div className="flex items-center justify-between px-2 pb-8"><NavLink to={user.role==='admin'?'/admin':'/student'} className="inline-flex items-center gap-3 text-lg font-bold" onClick={()=>setSide(false)}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white"><GraduationCap size={23}/></span>ExamHub</NavLink><button type="button" className="rounded-lg p-2 text-blue-100 hover:bg-white/10 lg:hidden" aria-label="Close navigation" onClick={()=>setSide(false)}><X size={19}/></button></div>
      <div className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[.16em] text-blue-200/60">Workspace</div>
      <nav className="space-y-1" aria-label="Workspace pages">{NAV[user.role].map(([to,label,Icon])=><NavLink key={to} to={to} end onClick={()=>setSide(false)} className={({isActive})=>`group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${isActive?'bg-blue-500 text-white shadow-sm':'text-blue-100/75 hover:bg-white/10 hover:text-white'}`}><Icon size={18} aria-hidden="true"/><span>{label}</span></NavLink>)}</nav>
      <div className="mt-auto rounded-2xl border border-white/10 bg-white/[.06] p-4"><div className="flex items-center gap-2 text-xs font-semibold text-blue-100"><BookOpenCheck size={16}/>Online assessments</div><p className="mt-2 text-xs leading-5 text-blue-100/60">Keep your exams, students, and results organized in one place.</p></div>
    </aside>

    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3"><button type="button" aria-label="Open navigation" aria-expanded={side} aria-controls="primary-navigation" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={()=>setSide(true)}><Menu size={20}/></button><div className="min-w-0"><div className="hidden text-xs font-semibold uppercase tracking-[.12em] text-slate-500 sm:block">{user.role==='admin'?'Administrator':'Student'} workspace</div><h1 className="truncate text-base font-bold text-slate-900 sm:mt-0.5 sm:text-lg">{pageTitle}</h1></div></div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Badge tone={storageMode==='local'?'amber':'green'}><span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current"/>{storageMode==='local'?'Local demo':'Backend'}</Badge>
            <div className="relative"><button type="button" aria-label="Notifications" aria-expanded={menu==='n'} aria-controls="notification-menu" className="relative rounded-xl p-2.5 text-slate-600 hover:bg-slate-100" onClick={()=>setMenu(menu==='n'?null:'n')}><Bell size={19}/>{notes.length>0&&<span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-600 ring-2 ring-white"/>}</button>
              {menu==='n'&&<div id="notification-menu" role="region" aria-label="Recent activity" className="absolute right-0 top-12 z-50 w-[min(21rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl"><div className="flex items-center justify-between px-2 pb-2"><h2 className="text-sm font-bold text-slate-900">Recent activity</h2><Activity size={16} className="text-slate-500"/></div>{notes.length?notes.map(note=><div key={note.key} className="rounded-xl px-3 py-2.5 hover:bg-slate-50"><div className="text-sm font-semibold text-slate-800">{note.title}</div><div className="mt-0.5 text-xs leading-5 text-slate-600">{note.detail}{note.date?` · ${fmt(note.date)}`:''}</div></div>):<EmptyState title="You're all caught up" description="New exam activity will appear here."/>}</div>}
            </div>
            <div className="relative"><button type="button" aria-label={`Account menu for ${user.name}`} aria-expanded={menu==='u'} aria-controls="account-menu" className="flex min-h-10 items-center gap-2 rounded-xl p-1.5 text-left hover:bg-slate-100" onClick={()=>setMenu(menu==='u'?null:'u')}>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-xs font-bold text-white">{initials}</span><span className="hidden max-w-36 truncate text-sm font-semibold text-slate-800 md:block">{user.name}</span><ChevronDown size={15} className="text-slate-500"/></button>
              {menu==='u'&&<div id="account-menu" className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"><div className="border-b border-slate-100 px-3 py-2.5"><div className="truncate text-sm font-semibold text-slate-900">{user.name}</div><div className="mt-0.5 truncate text-xs text-slate-600">{user.email}</div></div><button type="button" className="mt-1 flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-sm font-semibold text-red-700 hover:bg-red-50" onClick={()=>{setMenu(null);logout();nav('/login')}}><LogOut size={16}/>Sign out</button></div>}
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] space-y-5 px-4 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-8"><Outlet/></main>
    </div>
  </div>
}
