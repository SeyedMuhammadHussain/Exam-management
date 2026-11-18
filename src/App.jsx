import {Routes,Route,Navigate} from 'react-router-dom'
import {useApp} from './context/AppContext'
import Protect from './routes/Protect'
import DashboardLayout from './layouts/DashboardLayout'
import Auth from './pages/Auth'
import AdminDashboard from './pages/admin/AdminDashboard'
import {ExamsPage,QuestionsPage,StudentsPage,AdminResults} from './pages/admin/Manage'
import StudentDashboard from './pages/student/StudentDashboard'
import TakeExam from './pages/student/TakeExam'
import StudentResults from './pages/student/StudentResults'
import {LoadingState} from './components/ui'
export default function App(){
  const {user,loading}=useApp()
  if(loading)return <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f5f7fb]"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-800 text-lg font-bold text-white shadow-lg">E</div><LoadingState label="Restoring your ExamHub session…"/></div>
  return <Routes>
    <Route path="/login" element={<Auth mode="login"/>}/><Route path="/signup" element={<Auth mode="signup"/>}/>
    <Route path="/" element={<Navigate to={user?(user.role==='admin'?'/admin':'/student'):'/login'} replace/>}/>
    <Route element={<Protect role="admin"/>}><Route element={<DashboardLayout/>}>
      <Route path="/admin" element={<AdminDashboard/>}/><Route path="/admin/exams" element={<ExamsPage/>}/><Route path="/admin/questions" element={<QuestionsPage/>}/>
      <Route path="/admin/students" element={<StudentsPage/>}/><Route path="/admin/results" element={<AdminResults/>}/></Route></Route>
    <Route element={<Protect role="student"/>}><Route element={<DashboardLayout/>}>
      <Route path="/student" element={<StudentDashboard/>}/><Route path="/student/results" element={<StudentResults/>}/></Route>
      <Route path="/student/exam/:id" element={<TakeExam/>}/></Route>
    <Route path="*" element={<Navigate to="/" replace/>}/></Routes>
}
