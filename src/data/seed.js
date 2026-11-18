import {grade} from '../utils/grade'
const d=h=>new Date(Date.now()+h*36e5-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,16)
export function seed(){
  const pw='student123'
  const users=[
    {id:'u0',name:'Dr. Elena Park',email:'admin@school.edu',password:'admin123',role:'admin'},
    {id:'u1',name:'Sara Almeida',email:'sara@school.edu',password:pw,role:'student',grade:'Year 11'},
    {id:'u2',name:'Omar Hassan',email:'omar@school.edu',password:pw,role:'student',grade:'Year 11'},
    {id:'u3',name:'Lina Petrova',email:'lina@school.edu',password:pw,role:'student',grade:'Year 12'},
    {id:'u4',name:'Noah Bennett',email:'noah@school.edu',password:pw,role:'student',grade:'Year 12'}]
  const E=(id,title,description,duration,start,end,pass,active=true)=>({id,title,description,duration,start,end,totalMarks:10,passMarks:pass,active})
  const exams=[
    E('e1','Algebra Midterm','Linear equations, factoring and functions.',20,d(-48),d(720),5),
    E('e2','World History Quiz','Modern history from 1900 to 1991.',15,d(-48),d(720),5),
    E('e3','Physics Final','Mechanics, energy and waves.',30,d(48),d(240),6),
    E('e4','Intro to Biology','Cells, genetics and ecosystems.',15,d(-400),d(-100),5)]
  const Q=(id,examId,text,a,b,c,dd,correct,marks)=>({id,examId,text,a,b,c,d:dd,correct,marks})
  const questions=[
    Q('q1','e1','Solve: 2x + 6 = 14','x = 2','x = 4','x = 6','x = 8','1',3),
    Q('q2','e1','Factor x² − 9','(x−3)(x+3)','(x−9)(x+1)','(x−3)²','x(x−9)','0',3),
    Q('q3','e1','What is the slope of y = −3x + 5?','5','3','−3','−5','2',4),
    Q('q4','e2','In which year did World War I begin?','1905','1914','1918','1939','1',4),
    Q('q5','e2','The Berlin Wall fell in…','1961','1975','1989','1991','2',3),
    Q('q6','e2','Which treaty ended World War I?','Versailles','Paris','Vienna','Utrecht','0',3),
    Q('q7','e3','The SI unit of force is…','Joule','Newton','Watt','Pascal','1',3),
    Q('q8','e3','Kinetic energy depends on…','Mass only','Velocity only','Mass and velocity','Height','2',4),
    Q('q9','e3','Speed of sound is greatest in…','Air','Water','Vacuum','Steel','3',3),
    Q('q10','e4','Powerhouse of the cell?','Nucleus','Ribosome','Mitochondria','Golgi','2',4),
    Q('q11','e4','DNA stands for…','Deoxyribonucleic acid','Dinucleic acid','Deoxyribose nitrate','None','0',3),
    Q('q12','e4','Photosynthesis occurs in…','Mitochondria','Chloroplasts','Vacuoles','Nucleus','1',3)]
  const R=(id,examId,studentId,answers,h)=>({id,examId,studentId,answers,date:new Date(Date.now()+h*36e5).toISOString(),...grade(exams.find(e=>e.id===examId),questions.filter(q=>q.examId===examId),answers)})
  const results=[
    R('r1','e4','u1',{q10:'2',q11:'0',q12:'1'},-200),R('r2','e4','u2',{q10:'2',q11:'1',q12:'1'},-190),
    R('r3','e4','u3',{q10:'0',q11:'0',q12:'1'},-180),R('r4','e1','u2',{q1:'1',q2:'0',q3:'0'},-30),
    R('r5','e2','u3',{q4:'1',q5:'2',q6:'0'},-20),R('r6','e1','u4',{q1:'2',q2:'0',q3:'2'},-10)]
  return {users,exams,questions,results,session:null}
}
