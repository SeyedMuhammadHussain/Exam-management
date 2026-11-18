import {createContext,useContext,useEffect,useState} from 'react'
import {seed} from '../data/seed'
import {examState,grade} from '../utils/grade'
import {api,apiError,setToken} from '../utils/api'

const C=createContext(null)
export const useApp=()=>useContext(C)
const empty={users:[],exams:[],questions:[],results:[]}
const makeId=()=>Math.random().toString(36).slice(2,10)
const readLocal=()=>{
  try{
    const saved=JSON.parse(localStorage.getItem('oes'))
    if(saved&&Array.isArray(saved.users)&&Array.isArray(saved.exams))return {...empty,attempts:{},...saved}
  }catch{}
  return {...seed(),session:null,attempts:{}}
}
const offlineError=e=>!e?.status||e.status>=500
const localAttemptKey=(userId,examId)=>`${userId}:${examId}`

export function AppProvider({children}){
  const [localData,setLocalData]=useState(readLocal)
  const hasToken=Boolean(localStorage.getItem('oes-token'))
  const [mode,setMode]=useState(()=>hasToken?'api':(readLocal().session?'local':'connect'))
  const [data,setData]=useState(()=>hasToken?empty:readLocal())
  const [user,setUser]=useState(()=>{
    if(hasToken)return null
    const saved=readLocal()
    return saved.sessionUser||saved.users.find(u=>u.id===saved.session)||null
  })
  const [loading,setLoading]=useState(hasToken)
  const [connectionError,setConnectionError]=useState('')

  useEffect(()=>{
    try{localStorage.setItem('oes',JSON.stringify(localData))}catch{}
    if(mode==='local')setData(localData)
  },[localData,mode])

  const loadData=async current=>{
    if(current.role==='admin'){
      const [exams,questions,users,results]=await Promise.all([
        api('/admin/exams'),api('/admin/questions'),api('/admin/students'),api('/admin/results'),
      ])
      setData({exams,questions,users:[...users,current],results})
    }else{
      const [exams,results]=await Promise.all([api('/student/exams'),api('/student/results')])
      setData({exams,results,questions:[],users:[current]})
    }
  }

  const activateLocal=(current=null)=>{
    setToken(null);setMode('local');setConnectionError('Backend unavailable. Using local storage demo data.')
    if(current){
      const existing=localData.users.find(u=>u.email?.toLowerCase()===current.email?.toLowerCase())
      const fallback=existing||{...current,id:makeId()}
      setUser(fallback)
      setLocalData(previous=>({...previous,users:existing?previous.users:[...previous.users,fallback],session:fallback.id,sessionUser:fallback}))
    }else{
      setUser(null)
      setLocalData(previous=>({...previous,session:null,sessionUser:null}))
    }
  }

  useEffect(()=>{
    let live=true
    if(!localStorage.getItem('oes-token'))return
    Promise.resolve().then(async()=>{
      try{
        const current=await api('/auth/me')
        if(!live)return
        setUser(current);setMode('api');await loadData(current)
      }catch(e){
        if(live){
          setToken(null);setMode('local');setUser(null);setData(localData)
          setLocalData(previous=>({...previous,session:null,sessionUser:null}))
          setConnectionError(offlineError(e)?'Backend unavailable. Using local storage demo data.':apiError(e))
        }
      }finally{if(live)setLoading(false)}
    })
    return()=>{live=false}
  },[])

  const localLogin=(email,password)=>{
    const found=localData.users.find(u=>u.email?.toLowerCase()===email.toLowerCase()&&u.password===password)
    if(!found)return 'Invalid email or password. Local demo: admin@school.edu / admin123 or sara@school.edu / student123.'
    setUser(found);setMode('local');setLocalData(previous=>({...previous,session:found.id,sessionUser:found}))
    return null
  }
  const login=async(email,password)=>{
    if(mode==='local')return localLogin(email,password)
    try{
      const result=await api('/auth/login',{method:'POST',body:{email,password}})
      setToken(result.token);setUser(result.user);setMode('api');setConnectionError('')
      await loadData(result.user)
      return null
    }catch(e){
      if(!offlineError(e))return apiError(e)
      activateLocal()
      return localLogin(email,password)
    }
  }
  const signup=async details=>{
    if(mode==='local'){
      if(localData.users.some(u=>u.email.toLowerCase()===details.email.toLowerCase()))return 'This email is already registered.'
      const created={...details,id:makeId(),role:'student',grade:'—'}
      setUser(created);setMode('local');setLocalData(previous=>({...previous,users:[...previous.users,created],session:created.id,sessionUser:created}))
      return null
    }
    try{
      const result=await api('/auth/register',{method:'POST',body:{fullName:details.name,email:details.email,password:details.password}})
      setToken(result.token);setUser(result.user);setMode('api');setConnectionError('')
      await loadData(result.user)
      return null
    }catch(e){
      if(!offlineError(e))return apiError(e)
      activateLocal()
      if(localData.users.some(u=>u.email.toLowerCase()===details.email.toLowerCase()))return 'This email is already registered.'
      const created={...details,id:makeId(),role:'student',grade:'Year 11'}
      setUser(created);setLocalData(previous=>({...previous,users:[...previous.users,created],session:created.id,sessionUser:created}))
      return null
    }
  }
  const logout=async()=>{
    if(mode==='api')try{await api('/auth/logout',{method:'POST'})}catch{}
    setToken(null);setUser(null);setMode('connect');setConnectionError('')
    setLocalData(previous=>({...previous,session:null,sessionUser:null}))
  }

  const localUpsert=(kind,item)=>setLocalData(previous=>{
    const rows=previous[kind]||[]
    const updated=item.id?rows.map(row=>row.id===item.id?{...row,...item}:row):[...rows,{...item,id:makeId()}]
    return {...previous,[kind]:updated}
  })
  const upsert=async(kind,item)=>{
    if(mode==='local')return localUpsert(kind,item)
    const routes={exams:'/admin/exams',questions:'/admin/questions',users:'/admin/students'}
    const path=routes[kind]
    const body=kind==='users'?{...item,fullName:item.name||item.fullName,password:item.password||undefined}:item
    try{await api(`${path}${item.id?`/${item.id}`:''}`,{method:item.id?'PUT':'POST',body});await loadData(user)}
    catch(e){if(!offlineError(e))throw e;activateLocal(user);localUpsert(kind,item)}
  }
  const setExamStatus=async(id,active)=>{
    if(mode==='local')return localUpsert('exams',{...localData.exams.find(e=>e.id===id),active})
    try{await api(`/admin/exams/${id}/status`,{method:'PATCH',body:{active}});await loadData(user)}
    catch(e){if(!offlineError(e))throw e;activateLocal(user);localUpsert('exams',{...localData.exams.find(x=>x.id===id),active})}
  }
  const localRemove=(kind,id)=>setLocalData(previous=>{
    const next={...previous,[kind]:previous[kind].filter(row=>row.id!==id)}
    if(kind==='exams'){next.questions=previous.questions.filter(q=>q.examId!==id);next.results=previous.results.filter(r=>r.examId!==id)}
    if(kind==='users')next.results=previous.results.filter(r=>r.studentId!==id)
    return next
  })
  const remove=async(kind,id)=>{
    if(mode==='local')return localRemove(kind,id)
    const routes={exams:'/admin/exams',questions:'/admin/questions',users:'/admin/students'}
    try{await api(`${routes[kind]}/${id}`,{method:'DELETE'});await loadData(user)}
    catch(e){if(!offlineError(e))throw e;activateLocal(user);localRemove(kind,id)}
  }

  const localStartAttempt=examId=>{
    const exam=localData.exams.find(e=>e.id===examId)
    const done=localData.results.some(r=>r.examId===examId&&r.studentId===user?.id)
    if(!exam||examState(exam,done)!=='available')throw new Error('This exam is not available.')
    const questions=localData.questions.filter(q=>q.examId===examId)
    if(!questions.length)throw new Error('This exam has no questions yet.')
    const key=localAttemptKey(user.id,examId)
    let attempt=localData.attempts?.[key]
    if(attempt&&attempt.deadline<=Date.now())throw new Error('Time is up for this attempt.')
    if(!attempt){
      const deadline=Math.min(Date.now()+exam.duration*60000,new Date(exam.end).getTime())
      attempt={attemptId:`local-${makeId()}`,examId,deadline,answers:{}}
      setLocalData(previous=>({...previous,attempts:{...previous.attempts,[key]:attempt}}))
    }
    return {attemptId:attempt.attemptId,exam:{id:exam.id,title:exam.title,duration:exam.duration},remainingSeconds:Math.max(0,Math.ceil((attempt.deadline-Date.now())/1000)),questions:questions.map(q=>({...q,options:[q.a,q.b,q.c,q.d]})),answers:attempt.answers}
  }
  const startAttempt=async examId=>{
    if(mode==='local')return localStartAttempt(examId)
    try{return await api('/student/attempts',{method:'POST',body:{examId}})}
    catch(e){if(!offlineError(e))throw e;activateLocal(user);return localStartAttempt(examId)}
  }
  const saveAnswer=async(attemptId,questionId,optionIndex)=>{
    if(mode==='local'){
      const found=Object.entries(localData.attempts||{}).find(([,attempt])=>attempt.attemptId===attemptId)
      if(!found)throw new Error('This exam attempt has expired.')
      const [key,attempt]=found
      if(Date.now()>attempt.deadline)throw new Error('Time is up.')
      const updated={...attempt,answers:{...attempt.answers,[questionId]:String(optionIndex)}}
      setLocalData(previous=>({...previous,attempts:{...previous.attempts,[key]:updated}}));return {saved:true}
    }
    try{return await api(`/student/attempts/${attemptId}/answers`,{method:'PUT',body:{questionId,optionIndex}})}
    catch(e){if(!offlineError(e))throw e;activateLocal(user);return {saved:true}}
  }
  const localSubmit=(attemptId,answers)=>{
    const found=Object.entries(localData.attempts||{}).find(([,item])=>item.attemptId===attemptId)
    if(!found)throw new Error('This exam attempt has expired.')
    const [key,attempt]=found
    const exam=localData.exams.find(e=>e.id===attempt.examId)
    const questions=localData.questions.filter(q=>q.examId===attempt.examId)
    const result={id:attemptId,examId:exam.id,studentId:user.id,answers:{...attempt.answers,...Object.fromEntries(Object.entries(answers||{}).map(([id,n])=>[id,String(n)]))},date:new Date().toISOString(),...grade(exam,questions,{...attempt.answers,...Object.fromEntries(Object.entries(answers||{}).map(([id,n])=>[id,String(n)]))})}
    setLocalData(previous=>{const attempts={...previous.attempts};delete attempts[key];return {...previous,results:[...previous.results,result],attempts}})
    return result.id
  }
  const submit=async(attemptId,answers)=>{
    if(mode==='local')return localSubmit(attemptId,answers)
    try{const result=await api(`/student/attempts/${attemptId}/submit`,{method:'POST',body:{answers}});await loadData(user);return result.id}
    catch(e){if(!offlineError(e))throw e;activateLocal(user);return localSubmit(attemptId,answers)}
  }
  const getResult=async id=>{
    if(mode==='local')return localData.results.find(r=>r.id===id)||null
    return api(`${user?.role==='admin'?'/admin':'/student'}/results/${id}`)
  }

  return <C.Provider value={{...data,user,loading,connectionError,storageMode:mode,login,signup,logout,upsert,remove,setExamStatus,startAttempt,saveAnswer,submit,getResult}}>{children}</C.Provider>
}
