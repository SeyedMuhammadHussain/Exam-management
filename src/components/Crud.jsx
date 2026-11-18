import {useState} from 'react'
import {Plus,Pencil,Trash2,Search} from 'lucide-react'
import {EmptyState,Modal} from './ui'
export default function Crud({title,addLabel,rows,columns,fields,blank,onSave,onDelete,searchKeys,toolbar,disableAdd=false}){
  const [q,setQ]=useState(''),[f,setF]=useState(null),[err,setErr]=useState(''),[success,setSuccess]=useState(''),[del,setDel]=useState(null),[busy,setBusy]=useState(false)
  const list=rows.filter(r=>!q||searchKeys.some(k=>String(r[k]??'').toLowerCase().includes(q.toLowerCase())))
  const save=async e=>{
    e.preventDefault()
    const miss=fields.find(x=>x.required!==false&&x.type!=='checkbox'&&String(f[x.name]??'').trim()==='')
    if(miss)return setErr(`${miss.label} is required.`)
    setBusy(true)
    try{const result=await onSave(f);if(result===false)return;if(typeof result==='string'&&result){setErr(result);return}setF(null);setErr('');setSuccess(`${title.replace(/s$/,'').replace(/ies$/,'y')} saved successfully.`);setTimeout(()=>setSuccess(''),3200)}
    catch(error){setErr(error.message||'Unable to save changes.')}
    finally{setBusy(false)}}
  const deleteRow=async()=>{
    setBusy(true)
    try{await onDelete(del.id);setDel(null);setErr('');setSuccess(`${title.replace(/s$/,'').replace(/ies$/,'y')} deleted successfully.`);setTimeout(()=>setSuccess(''),3200)}
    catch(error){setErr(error.message||'Unable to delete this item.')}
    finally{setBusy(false)}}
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="section-title text-lg">{title}</h1>
      <button type="button" className="btn-p" disabled={disableAdd} onClick={()=>{setF({...blank});setErr('')}}><Plus size={16}/>{addLabel}</button></div>
    {success&&<p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">{success}</p>}
    <div className="flex flex-wrap gap-3"><div className="relative min-w-[220px] flex-1"><Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
      <label htmlFor={`crud-search-${title}`} className="sr-only">Search {title.toLowerCase()}</label><input id={`crud-search-${title}`} type="search" className="inp pl-9" placeholder={`Search ${title.toLowerCase()}`} value={q} onChange={e=>setQ(e.target.value)}/></div>{toolbar}</div>
    <div className="card overflow-x-auto p-0"><table className="w-full"><thead className="border-b bg-slate-50"><tr>
      {columns.map(c=><th key={c.label} className="th">{c.label}</th>)}<th className="th text-right">Actions</th></tr></thead>
      <tbody className="divide-y">{list.map(r=><tr key={r.id} className="hover:bg-slate-50">
        {columns.map(c=><td key={c.label} className="td">{c.render?c.render(r):r[c.key]}</td>)}
        <td className="td whitespace-nowrap text-right"><button type="button" aria-label={`Edit ${title.toLowerCase()} item`} className="btn-g !min-h-9 !px-2" onClick={()=>{const edit={...r};fields.filter(x=>x.type==='datetime-local').forEach(x=>{if(edit[x.name]){const d=new Date(edit[x.name]);edit[x.name]=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}});setF(edit);setErr('')}}><Pencil size={14}/></button>{' '}
          <button type="button" aria-label={`Delete ${title.toLowerCase()} item`} className="btn-d !min-h-9 !px-2" onClick={()=>{setErr('');setDel(r)}}><Trash2 size={14}/></button></td></tr>)}
        {!list.length&&<tr><td colSpan={columns.length+1} className="p-4"><EmptyState title={q?'No matching records':`No ${title.toLowerCase()} yet`} description={q?'Try a different search term.':disableAdd?'Create an exam first, then add items here.':`Add your first ${title.toLowerCase().replace(/s$/,'')} to get started.`}/></td></tr>}</tbody></table></div>
    {f&&<Modal title={f.id?'Edit item':addLabel} onClose={()=>setF(null)}>
      <form onSubmit={save} className="space-y-3">{fields.map(x=><label key={x.name} className="block text-sm">
        {x.type==='checkbox'?<span className="flex min-h-10 items-center gap-2"><input id={`field-${x.name}`} type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600" checked={!!f[x.name]} onChange={e=>setF({...f,[x.name]:e.target.checked})}/><span className="font-medium text-slate-700">{x.label}</span></span>:<>
        <span className="mb-1.5 block font-semibold text-slate-700">{x.label}{x.required!==false&&<span className="ml-1 text-red-700" aria-hidden="true">*</span>}</span>
        {x.type==='select'?<select id={`field-${x.name}`} required={x.required!==false} className="inp" value={f[x.name]??''} onChange={e=>setF({...f,[x.name]:e.target.value})}><option value="">Select…</option>{x.options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select>
        :x.type==='textarea'?<textarea id={`field-${x.name}`} required={x.required!==false} minLength={x.minLength} maxLength={x.maxLength} rows={3} className="inp" value={f[x.name]??''} onChange={e=>setF({...f,[x.name]:e.target.value})}/>
        :<input id={`field-${x.name}`} required={x.required!==false} type={x.type||'text'} min={x.min??(x.type==='number'?0:undefined)} max={x.max} minLength={x.minLength} maxLength={x.maxLength} step={x.step} className="inp" value={f[x.name]??''} onChange={e=>setF({...f,[x.name]:e.target.value})}/>}</>}</label>)}
        {err&&<p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        <div className="flex justify-end gap-2 pt-2"><button type="button" className="btn-g" disabled={busy} onClick={()=>setF(null)}>Cancel</button><button className="btn-p" disabled={busy}>{busy?'Saving…':'Save changes'}</button></div></form></Modal>}
    {del&&<Modal title="Delete this item?" onClose={()=>setDel(null)}><p className="text-sm text-slate-600">This also removes related questions and results. It can’t be undone.</p>
      {err&&<p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
      <div className="mt-4 flex justify-end gap-2"><button className="btn-g" disabled={busy} onClick={()=>setDel(null)}>Cancel</button><button className="btn-p !bg-red-600" disabled={busy} onClick={deleteRow}>{busy?'Deleting…':'Delete'}</button></div></Modal>}
  </div>
}
