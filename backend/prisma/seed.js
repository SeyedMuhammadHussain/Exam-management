import 'dotenv/config'
import bcrypt from 'bcrypt'
import {PrismaClient} from '@prisma/client'
const prisma=new PrismaClient()
const need=k=>{if(!process.env[k])throw new Error(`${k} is required for seeding`);return process.env[k]}
const rounds=Number(process.env.BCRYPT_ROUNDS||12),t=h=>new Date(Date.now()+h*36e5)
async function main(){
  const adminEmail=need('SEED_ADMIN_EMAIL').toLowerCase()
  const admin=await prisma.user.upsert({where:{email:adminEmail},update:{},create:{fullName:'Dr. Elena Park',email:adminEmail,password:await bcrypt.hash(need('SEED_ADMIN_PASSWORD'),rounds),role:'admin'}})
  if(process.env.SEED_DEMO!=='true')return console.log('Admin ready.')
  const pw=await bcrypt.hash(need('SEED_DEMO_PASSWORD'),rounds)
  for(const [fullName,email,grade] of [['Sara Almeida','sara@school.edu','Year 11'],['Omar Hassan','omar@school.edu','Year 11'],['Lina Petrova','lina@school.edu','Year 12']])
    await prisma.user.upsert({where:{email},update:{},create:{fullName,email,grade,password:pw,role:'student'}})
  if(await prisma.exam.count())return console.log('Demo exams already exist.')
  const mk=(title,description,duration,s,e,pass,qs)=>prisma.exam.create({data:{title,description,duration,startTime:t(s),endTime:t(e),totalMarks:qs.reduce((a,q)=>a+q[2],0),passingMarks:pass,createdBy:admin.id,
    questions:{create:qs.map(([text,o,marks,c])=>({text,marks,options:{create:o.map((x,i)=>({text:x,position:i,isCorrect:i===c}))}}))}}})
  await mk('Algebra Midterm','Linear equations, factoring and functions.',20,-48,720,5,[['Solve: 2x + 6 = 14',['x = 2','x = 4','x = 6','x = 8'],3,1],['Factor x² − 9',['(x−3)(x+3)','(x−9)(x+1)','(x−3)²','x(x−9)'],3,0],['Slope of y = −3x + 5?',['5','3','−3','−5'],4,2]])
  await mk('World History Quiz','Modern history from 1900 to 1991.',15,-48,720,5,[['World War I began in…',['1905','1914','1918','1939'],4,1],['The Berlin Wall fell in…',['1961','1975','1989','1991'],3,2],['Which treaty ended World War I?',['Versailles','Paris','Vienna','Utrecht'],3,0]])
  await mk('Physics Final','Mechanics, energy and waves.',30,48,240,6,[['The SI unit of force is…',['Joule','Newton','Watt','Pascal'],3,1],['Kinetic energy depends on…',['Mass only','Velocity only','Mass and velocity','Height'],4,2],['Sound travels fastest in…',['Air','Water','Vacuum','Steel'],3,3]])
  console.log('Seeded demo data.')
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect())
