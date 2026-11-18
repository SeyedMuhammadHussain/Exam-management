import 'dotenv/config'
import {z} from 'zod'
const schema=z.object({
  NODE_ENV:z.enum(['development','production','test']).default('development'),
  PORT:z.coerce.number().default(4000),DATABASE_URL:z.string().min(1),
  JWT_SECRET:z.string().min(32,'JWT_SECRET must be at least 32 characters'),JWT_EXPIRES_IN:z.string().default('2h'),
  CORS_ORIGIN:z.string().default('http://localhost:5173'),BCRYPT_ROUNDS:z.coerce.number().int().min(10).default(12),TRUST_PROXY:z.coerce.number().default(0)})
const r=schema.safeParse(process.env)
if(!r.success){console.error('Invalid environment:',r.error.issues.map(i=>`${i.path}: ${i.message}`).join('; '));process.exit(1)}
export const env=r.data
