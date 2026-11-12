import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getSupabase } from "@/lib/backend/supabase";

type AdminData = {
  profiles: { id: string; full_name: string | null; role: string | null; created_at: string | null }[];
  courses: { id: string; title: string; is_active: boolean }[];
  classes: { id: string; title: string; is_active: boolean }[];
  requests: { id: string; student_id: string; class_id: string; status: string; payment_status: string; created_at: string }[];
  enrollments: { id: string; student_id: string; class_id: string; created_at: string }[];
};

export function AdminBackendPanel() {
 const [data,setData]=useState<AdminData|null>(null);
 const [loading,setLoading]=useState(true);
 const [savingId,setSavingId]=useState<string|null>(null);
 const [paymentChoices,setPaymentChoices]=useState<Record<string,"paid"|"waived"|"">>({});

 const loadData=useCallback(async()=>{
  const sb=getSupabase();
  if(!sb) throw new Error("اتصال Supabase هنوز در تنظیمات محیط اجرا فعال نشده است.");
  const [p,c,cl,r,e]=await Promise.all([
   sb.from("profiles").select("id,full_name,role,created_at").order("created_at",{ascending:false}).limit(200),
   sb.from("courses").select("id,title,is_active").order("created_at",{ascending:false}).limit(200),
   sb.from("classes").select("id,title,is_active").order("created_at",{ascending:false}).limit(200),
   sb.from("enrollment_requests").select("id,student_id,class_id,status,payment_status,created_at").order("created_at",{ascending:false}).limit(200),
   sb.from("enrollments").select("id,student_id,class_id,created_at").order("created_at",{ascending:false}).limit(200),
  ]);
  for(const result of [p,c,cl,r,e]) if(result.error) throw new Error(result.error.message);
  setData({profiles:p.data??[],courses:c.data??[],classes:cl.data??[],requests:r.data??[],enrollments:e.data??[]});
 },[]);

 useEffect(()=>{
  let active=true;
  void loadData().catch(error=>{if(active) toast.error(error instanceof Error?error.message:"بارگذاری اطلاعات مدیر انجام نشد.");})
   .finally(()=>{if(active) setLoading(false);});
  return ()=>{active=false;};
 },[loadData]);

 const reviewRequest=async(id:string,status:"approved"|"rejected")=>{
  const payment=status==="approved"?paymentChoices[id]:"";
  if(status==="approved"&&!payment){
   toast.error("برای تأیید، ابتدا وضعیت پرداخت را مشخص کنید.");
   return;
  }
  if(status==="approved"&&payment==="paid"&&!window.confirm("آیا پرداخت این دانش‌پژوه را خارج از برنامه بررسی و تأیید کرده‌اید؟")) return;
  if(status==="approved"&&payment==="waived"&&!window.confirm("آیا این ثبت‌نام واقعاً معاف از پرداخت است؟")) return;
  const sb=getSupabase();
  if(!sb) return;
  setSavingId(id);
  try{
   const update=status==="approved"
    ? {status,payment_status:payment}
    : {status};
   const {data:updated,error}=await sb.from("enrollment_requests").update(update).eq("id",id).eq("status","pending").select("id").maybeSingle();
   if(error) throw new Error(error.message);
   if(!updated) throw new Error("درخواست تغییر نکرد؛ ممکن است قبلاً بررسی شده باشد یا دسترسی کافی وجود نداشته باشد.");
   await loadData();
   toast.success(status==="approved"?"درخواست تأیید و ثبت‌نام قطعی شد.":"درخواست ثبت‌نام رد شد.");
  }catch(error){
   toast.error(error instanceof Error?error.message:"بررسی درخواست انجام نشد.");
  }finally{setSavingId(null);}
 };

 if(loading) return <p className="rounded-xl border p-4 text-sm text-muted-foreground">در حال دریافت آمار از پایگاه داده…</p>;
 if(!data) return <p className="rounded-xl border p-4 text-sm">اطلاعات بارگذاری نشد. فقط مدیر مجاز به مشاهده این داده‌هاست؛ اتصال و نقش حساب را بررسی کنید.</p>;
 const pending=data.requests.filter(x=>x.status==="pending");
 const classNames=new Map(data.classes.map(x=>[x.id,x.title]));
 const profileNames=new Map(data.profiles.map(x=>[x.id,x.full_name||"کاربر"]));
 const roleCount=(role:string)=>data.profiles.filter(x=>x.role===role).length;
 return <div className="space-y-5">
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
   <Metric label="حساب‌های کاربری" value={data.profiles.length}/>
   <Metric label="دوره‌های فعال" value={data.courses.filter(x=>x.is_active).length}/>
   <Metric label="کلاس‌های فعال" value={data.classes.filter(x=>x.is_active).length}/>
   <Metric label="درخواست‌های منتظر" value={pending.length}/>
  </div>
  <div className="grid gap-5 md:grid-cols-2">
   <section className="rounded-2xl border bg-card p-5"><h2 className="font-extrabold">ترکیب کاربران</h2><ul className="mt-3 space-y-3 text-sm"><li className="flex justify-between"><span>دانش‌پژوه</span><b>{roleCount("student")}</b></li><li className="flex justify-between"><span>استاد</span><b>{roleCount("teacher")}</b></li><li className="flex justify-between"><span>مدیر</span><b>{roleCount("admin")}</b></li></ul></section>
   <section className="rounded-2xl border bg-card p-5"><h2 className="font-extrabold">ثبت‌نام‌های قطعی</h2><p className="mt-3 text-3xl font-extrabold">{data.enrollments.length}</p><p className="mt-1 text-xs text-muted-foreground">بر اساس جدول ثبت‌نام‌های تأییدشده</p></section>
  </div>
  <section className="rounded-2xl border bg-card p-5"><h2 className="font-extrabold">درخواست‌های ثبت‌نام در انتظار بررسی</h2>
   {pending.length?<ul className="mt-3 divide-y">{pending.slice(0,30).map(req=><li key={req.id} className="space-y-3 py-3 text-sm">
    <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{profileNames.get(req.student_id)??"دانش‌پژوه"} — {classNames.get(req.class_id)??"کلاس"}</span><span className="text-xs text-muted-foreground">وضعیت پرداخت: {req.payment_status==="paid"?"پرداخت‌شده":req.payment_status==="waived"?"معاف":req.payment_status==="failed"?"ناموفق":"در انتظار"}</span></div>
    <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
     <select aria-label="وضعیت پرداخت برای تأیید" value={paymentChoices[req.id]??""} onChange={event=>setPaymentChoices(current=>({...current,[req.id]:event.target.value as "paid"|"waived"|""}))} className="min-w-0 rounded-lg border bg-background px-3 py-2">
      <option value="">وضعیت پرداخت برای تأیید</option><option value="paid">پرداخت بررسی و تأیید شده</option><option value="waived">معاف از پرداخت</option>
     </select>
     <button type="button" disabled={savingId===req.id} onClick={()=>void reviewRequest(req.id,"approved")} className="rounded-lg bg-primary px-3 py-2 font-semibold text-primary-foreground disabled:opacity-50">{savingId===req.id?"در حال ذخیره…":"تأیید و ثبت‌نام"}</button>
     <button type="button" disabled={savingId===req.id} onClick={()=>void reviewRequest(req.id,"rejected")} className="rounded-lg border px-3 py-2 font-semibold disabled:opacity-50">رد درخواست</button>
    </div>
   </li>)}</ul>:<p className="mt-3 text-sm text-muted-foreground">درخواست منتظر بررسی وجود ندارد.</p>}
   <p className="mt-3 text-xs text-muted-foreground">گزینه «پرداخت تأیید شده» را فقط پس از بررسی واقعی پرداخت انتخاب کنید. تأیید نهایی توسط سیاست امنیتی پایگاه داده کنترل می‌شود و ظرفیت کلاس نیز بررسی خواهد شد.</p>
  </section>
  <section className="rounded-2xl border bg-card p-5"><h2 className="font-extrabold">آخرین درخواست‌ها</h2>
   {data.requests.length?<ul className="mt-3 divide-y">{data.requests.slice(0,12).map(req=><li key={req.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><span>{profileNames.get(req.student_id)??"دانش‌پژوه"} — {classNames.get(req.class_id)??"کلاس"}</span><b>{req.status==="pending"?"در انتظار":req.status==="approved"?"تأیید شده":req.status==="rejected"?"رد شده":req.status}</b></li>)}</ul>:<p className="mt-3 text-sm text-muted-foreground">درخواستی ثبت نشده است.</p>}
  </section>
  <section className="rounded-2xl border bg-card p-5"><h2 className="font-extrabold">دوره‌ها</h2>{data.courses.length?<ul className="mt-3 divide-y">{data.courses.slice(0,12).map(c=><li key={c.id} className="flex justify-between gap-3 py-2 text-sm"><span>{c.title}</span><b>{c.is_active?"فعال":"غیرفعال"}</b></li>)}</ul>:<p className="mt-3 text-sm text-muted-foreground">دوره‌ای ثبت نشده است.</p>}</section>
  <p className="text-xs text-muted-foreground">این پنل گزارش‌ها را می‌خواند و درخواست‌ها را بررسی می‌کند؛ مدیریت نقش کاربران و سیاست‌های امنیتی از اینجا انجام نمی‌شود.</p>
 </div>;
}
function Metric({label,value}:{label:string;value:number}){return <div className="rounded-2xl border bg-card p-4"><p className="text-xl font-extrabold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>}
