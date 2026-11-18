import {Navigate,Outlet} from 'react-router-dom'
import {useApp} from '../context/AppContext'
export default function Protect({role}){
  const {user}=useApp()
  if(!user)return <Navigate to="/login" replace/>
  if(user.role!==role)return <Navigate to={user.role==='admin'?'/admin':'/student'} replace/>
  return <Outlet/>
}
