export class ApiError extends Error{constructor(status,message,errors){super(message);this.status=status;this.errors=errors}}
export const asyncH=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next)
export const h=(fn,status=200)=>asyncH(async(req,res)=>res.status(status).json({success:true,data:await fn(req)}))
