import {useApp} from '../../context/AppContext'
import ResultsTable from '../../components/ResultsTable'
export default function StudentResults(){
  const {user,results}=useApp()
  return <div className="space-y-5"><div><div className="eyebrow">Performance</div><h2 className="page-title">My results</h2><p className="page-subtitle">Review your scores, outcomes, and question-by-question feedback.</p></div><ResultsTable results={results.filter(r=>r.studentId===user.id)}/></div>
}
