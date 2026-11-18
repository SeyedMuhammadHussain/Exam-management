import {createContext,useContext,useEffect,useState} from 'react'
import {seed} from '../data/seed'
import {examState,grade} from '../utils/grade'

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
const attemptKey=(userId,examId)=>`${userId}:${examId}`

export function AppProvider({children}){
  const [data,setData]=useState(readLocal)
  const [user,setUser]=useState(()=>{
    const saved=readLocal()
    return saved.sessionUser||saved.users.find(u=>u.id===saved.session)||null
  })

  useEffect(()=>{try{localStorage.setItem('oes',JSON.stringify(data))}catch{}},[data])

  const login=async(email,password)=>{
    const found=data.users.find(u=>u.email?.toLowerCase()===email.toLowerCase()&&u.password===password)
    if(!found)return 'Invalid email or password. Local demo: admin@school.edu / admin123 or sara@school.edu / student123.'
    setUser(found);setData(previous=>({...previous,session:found.id,sessionUser:found}))
    return null
  }
  const signup=async details=>{
    if(data.users.some(u=>u.email.toLowerCase()===details.email.toLowerCase()))return 'This email is already registered.'
    const created={...details,id:makeId(),role:'student',grade:'Year 11'}
    setUser(created);setData(previous=>({...previous,users:[...previous.users,created],session:created.id,sessionUser:created}))
    return null
  }
  const logout=async()=>{
    setUser(null);setData(previous=>({...previous,session:null,sessionUser:null}))
  }

  const upsert=async(kind,item)=>setData(previous=>{
    const rows=previous[kind]||[]
    const updated=item.id?rows.map(row=>row.id===item.id?{...row,...item}:row):[...rows,{...item,id:makeId()}]
    return {...previous,[kind]:updated}
  })
  const setExamStatus=async(id,active)=>upsert('exams',{...data.exams.find(e=>e.id===id),active})
  const remove=async(kind,id)=>setData(previous=>{
    const next={...previous,[kind]:previous[kind].filter(row=>row.id!==id)}
    if(kind==='exams'){next.questions=previous.questions.filter(q=>q.examId!==id);next.results=previous.results.filter(r=>r.examId!==id)}
    if(kind==='users')next.results=previous.results.filter(r=>r.studentId!==id)
    return next
  })

  const startAttempt=async examId=>{
    const exam=data.exams.find(e=>e.id===examId)
    const done=data.results.some(r=>r.examId===examId&&r.studentId===user?.id)
    if(!exam||examState(exam,done)!=='available')throw new Error('This exam is not available.')
    const questions=data.questions.filter(q=>q.examId===examId)
    if(!questions.length)throw new Error('This exam has no questions yet.')
    const key=attemptKey(user.id,examId)
    let attempt=data.attempts?.[key]
    if(attempt&&attempt.deadline<=Date.now())throw new Error('Time is up for this attempt.')
    if(!attempt){
      const deadline=Math.min(Date.now()+exam.duration*60000,new Date(exam.end).getTime())
      attempt={attemptId:`local-${makeId()}`,examId,deadline,answers:{}}
      setData(previous=>({...previous,attempts:{...previous.attempts,[key]:attempt}}))
    }
    return {attemptId:attempt.attemptId,exam:{id:exam.id,title:exam.title,duration:exam.duration},remainingSeconds:Math.max(0,Math.ceil((attempt.deadline-Date.now())/1000)),questions:questions.map(q=>({...q,options:[q.a,q.b,q.c,q.d]})),answers:attempt.answers}
  }
  const saveAnswer=async(attemptId,questionId,optionIndex)=>{
    const found=Object.entries(data.attempts||{}).find(([,attempt])=>attempt.attemptId===attemptId)
    if(!found)throw new Error('This exam attempt has expired.')
    const [key,attempt]=found
    if(Date.now()>attempt.deadline)throw new Error('Time is up.')
    const updated={...attempt,answers:{...attempt.answers,[questionId]:String(optionIndex)}}
    setData(previous=>({...previous,attempts:{...previous.attempts,[key]:updated}}))
    return {saved:true}
  }
  const submit=async(attemptId,answers)=>{
    const found=Object.entries(data.attempts||{}).find(([,item])=>item.attemptId===attemptId)
    if(!found)throw new Error('This exam attempt has expired.')
    const [key,attempt]=found
    const exam=data.exams.find(e=>e.id===attempt.examId)
    const questions=data.questions.filter(q=>q.examId===attempt.examId)
    const finalAnswers={...attempt.answers,...Object.fromEntries(Object.entries(answers||{}).map(([id,n])=>[id,String(n)]))}
    const result={id:attemptId,examId:exam.id,studentId:user.id,answers:finalAnswers,date:new Date().toISOString(),...grade(exam,questions,finalAnswers)}
    setData(previous=>{const attempts={...previous.attempts};delete attempts[key];return {...previous,results:[...previous.results,result],attempts}})
    return result.id
  }
  const getResult=async id=>data.results.find(r=>r.id===id)||null

  return <C.Provider value={{...data,user,loading:false,login,signup,logout,upsert,remove,setExamStatus,startAttempt,saveAnswer,submit,getResult}}>{children}</C.Provider>
}
