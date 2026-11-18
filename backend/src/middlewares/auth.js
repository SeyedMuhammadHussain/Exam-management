import jwt from 'jsonwebtoken'
import {prisma} from '../config/db.js'
import {env} from '../config/env.js'
import {ApiError,asyncH} from '../utils/http.js'
export const authenticate=asyncH(async(req,res,next)=>{
  const t=(req.headers.authorization||'').replace(/^Bearer /,'')
  if(!t)throw new ApiError(401,'Authentication required.')
  let p;try{p=jwt.verify(t,env.JWT_SECRET,{algorithms:['HS256']})}catch{throw new ApiError(401,'Your session expired. Please sign in again.')}
  const u=await prisma.user.findUnique({where:{id:p.sub},select:{id:true,role:true,fullName:true,email:true}})
  if(!u)throw new ApiError(401,'This account no longer exists.')
  req.user=u;next()})
export const requireRole=role=>(req,res,next)=>req.user.role===role?next():next(new ApiError(403,'You do not have access to this resource.'))
export const validate=(schema,src='body')=>(req,res,next)=>{req[src]=schema.parse(req[src]);next()}
