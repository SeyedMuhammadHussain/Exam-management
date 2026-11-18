import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import {prisma} from '../config/db.js'
import {env} from '../config/env.js'
import {ApiError} from '../utils/http.js'
import * as S from '../utils/serialize.js'
const dummy=bcrypt.hashSync('timing-equalizer',10)
const sign=u=>jwt.sign({role:u.role},env.JWT_SECRET,{subject:u.id,expiresIn:env.JWT_EXPIRES_IN,algorithm:'HS256'})
export async function register({fullName,email,password}){
  if(await prisma.user.findUnique({where:{email}}))throw new ApiError(409,'This email is already registered.')
  const u=await prisma.user.create({data:{fullName,email,password:await bcrypt.hash(password,env.BCRYPT_ROUNDS),role:'student'}})
  return {user:S.user(u),token:sign(u)}}
export async function login({email,password}){
  const u=await prisma.user.findUnique({where:{email}})
  const ok=await bcrypt.compare(password,u?.password||dummy)
  if(!u||!ok)throw new ApiError(401,'Invalid email or password.')
  return {user:S.user(u),token:sign(u)}}
export const me=async id=>S.user(await prisma.user.findUniqueOrThrow({where:{id}}))
