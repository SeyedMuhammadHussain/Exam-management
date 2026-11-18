import {ZodError} from 'zod'
import {env} from '../config/env.js'
export const notFound=(req,res)=>res.status(404).json({success:false,message:'Route not found.'})
export function errorHandler(err,req,res,next){
  if(err instanceof ZodError){const errors=err.issues.map(i=>({field:i.path.join('.'),message:i.message}))
    return res.status(400).json({success:false,message:errors[0]?.message||'Invalid input.',errors})}
  if(err.status)return res.status(err.status).json({success:false,message:err.message,errors:err.errors})
  if(err.code==='P2002')return res.status(409).json({success:false,message:'That value already exists.'})
  if(err.code==='P2025')return res.status(404).json({success:false,message:'Record not found.'})
  if(err.code==='P2003')return res.status(400).json({success:false,message:'A related record does not exist.'})
  if(err.type==='entity.parse.failed')return res.status(400).json({success:false,message:'Malformed JSON body.'})
  console.error(err)
  res.status(500).json({success:false,message:'Something went wrong on our side.',...(env.NODE_ENV!=='production'&&{detail:err.message})})
}
