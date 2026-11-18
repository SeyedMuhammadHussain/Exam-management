import {h} from '../utils/http.js'
import * as auth from '../services/authService.js'
import * as admin from '../services/adminService.js'
import * as stu from '../services/studentService.js'
export const A={register:h(r=>auth.register(r.body),201),login:h(r=>auth.login(r.body)),logout:h(()=>({loggedOut:true})),me:h(r=>auth.me(r.user.id))}
export const AD={
  dashboard:h(()=>admin.dashboard()),
  exams:{list:h(()=>admin.listExams()),get:h(r=>admin.getExam(r.params.id)),create:h(r=>admin.createExam(r.body,r.user.id),201),update:h(r=>admin.updateExam(r.params.id,r.body)),
    status:h(r=>admin.setStatus(r.params.id,r.body.active)),remove:h(r=>admin.deleteExam(r.params.id))},
  questions:{list:h(r=>admin.listQuestions(r.query)),get:h(r=>admin.getQuestion(r.params.id)),create:h(r=>admin.createQuestion(r.body),201),update:h(r=>admin.updateQuestion(r.params.id,r.body)),remove:h(r=>admin.deleteQuestion(r.params.id))},
  students:{list:h(r=>admin.listStudents(r.query)),get:h(r=>admin.getStudent(r.params.id)),create:h(r=>admin.createStudent(r.body),201),update:h(r=>admin.updateStudent(r.params.id,r.body)),remove:h(r=>admin.deleteStudent(r.params.id))},
  results:{list:h(r=>admin.listResults(r.query)),byExam:h(r=>admin.listResults({examId:r.params.examId})),byStudent:h(r=>admin.studentPerformance(r.params.studentId)),get:h(r=>admin.getResult(r.params.id))}}
export const ST={
  dashboard:h(r=>stu.dashboard(r.user.id)),profile:h(r=>stu.profile(r.user.id)),stats:h(r=>stu.stats(r.user.id)),
  exams:{list:h(r=>stu.listExams(r.user.id,r.query.state)),get:h(r=>stu.getExam(r.user.id,r.params.id))},
  attempts:{start:h(r=>stu.startAttempt(r.user.id,r.body.examId),201),get:h(r=>stu.getAttempt(r.user.id,r.params.id)),remaining:h(r=>stu.remaining(r.user.id,r.params.id)),
    answer:h(r=>stu.saveAnswer(r.user.id,r.params.id,r.body)),submit:h(r=>stu.submit(r.user.id,r.params.id,r.body.answers))},
  results:{list:h(r=>stu.listResults(r.user.id)),get:h(r=>stu.getResult(r.user.id,r.params.id))}}
