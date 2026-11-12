import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getSupabase } from "@/lib/backend/supabase";
import { AdminCourseClassManager } from "./AdminCourseClassManager";

type AdminData = {
  profiles: { id: string; full_name: string | null; role: string | null; created_at: string | null }[];
  courses: { id: string; title: string; is_active: boolean }[];
  classes: { id: string; title: string; is_active: boolean; teacher_id: string | null }[];
  requests: { id: string; student_id: string; class_id: string; status: string; payment_status: string; created_at: string }[];
  enrollments: { id: string; student_id: string; class_id: string; created_at: string }[];
  attendance: { id: string; enrollment_id: string; session_date: string; status: string }[];
  grades: { id: string; enrollment_id: string; title: string; score: number }[];
};

export function AdminBackendPanel() {
 const [data,setData]=useState<AdminData|null>(null);
 const [loading,setLoading]=useState(true);
 const [savingId,setSavingId]=useState<string|null>(null);
 const [paymentChoices,setPaymentChoices]=useState<Record<string,"paid"|"waived"|"">>({});
 const [enrollmentClassFilter,setEnrollmentClassFilter]=useState("");
 const [enrollmentSearch,setEnrollmentSearch]=useState("");

 const loadData=useCallback(async()=>{
  const sb=getSupabase();
  if(!sb) throw new Error("اتصال Supabase هنوز در تنظیمات محیط اجرا فعال نشده است.");
  const [p,c,cl,r,e,a,g]=await Promise.all([
   sb.from("profiles").select("id,full_name,role,created_at").order("created_at",{ascending:false}).limit(200),
   sb.from("courses").select("id,title,is_active").order("created_at",{ascending:false}).limit(200),
   sb.from("classes").select("id,title,is_active,teacher_id").order("created_at",{ascending:false}).limit(200),
   sb.from("enrollment_requests").select("id,student_id,class_id,status,payment_status,created_at").order("created_at",{ascending:false}).limit(200),
   sb.from("enrollments").select("id,student_id,class_id,created_at").order("created_at",{ascending:false}).limit(200),
   sb.from("attendance").select("id,enrollment_id,session_date,status").order("session_date",{ascending:false}).limit(1000),
   sb.from("grades").select("id,enrollment_id,title,score").order("created_at",{ascending:false}).limit(1000),
  ]);
  for(const result of [p,c,cl,r,e,a,g]) if(result.error) throw new Error(result.error.message);
  setData({profiles:p.data??[],courses:c.data??[],classes:cl.data??[],requests:r.data??[],enrollments:e.data??[],attendance:a.data??[],grades:g.data??[]});
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
  <section className="rounded-2xl border bg-card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-extrabold">گزارش ثبت‌نام‌های قطعی</h2><p className="mt-1 text-xs text-muted-foreground">آخرین {data.enrollments.length} ثبت‌نام قطعی ثبت‌شده در سامانه</p></div><b className="text-2xl">{data.enrollments.length}</b></div>
   <div className="mt-3 grid gap-2 sm:grid-cols-2">
    <label className="text-sm font-semibold">فیلتر کلاس<select value={enrollmentClassFilter} onChange={event=>setEnrollmentClassFilter(event.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal"><option value="">همهٔ کلاس‌ها</option>{data.classes.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
    <label className="text-sm font-semibold">جست‌وجوی نام دانش‌پژوه<input value={enrollmentSearch} onChange={event=>setEnrollmentSearch(event.target.value)} placeholder="نام یا بخشی از نام" className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal"/></label>
   </div>
   {(()=>{const rows=data.enrollments.filter(item=>(!enrollmentClassFilter||item.class_id===enrollmentClassFilter)&&((profileNames.get(item.student_id)??"دانش‌پژوه").toLocaleLowerCase().includes(enrollmentSearch.trim().toLocaleLowerCase())));return rows.length?<ul className="mt-3 divide-y">{rows.map(item=><li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><div><p className="font-semibold">{profileNames.get(item.student_id)??"دانش‌پژوه"}</p><p className="text-xs text-muted-foreground">{classNames.get(item.class_id)??"کلاس نامشخص"}</p></div><span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString("fa-IR")}</span></li>)}</ul>:<p className="mt-3 text-sm text-muted-foreground">ثبت‌نامی با این فیلتر پیدا نشد.</p>})()}
   <p className="mt-2 text-xs text-muted-foreground">این گزارش حداکثر ۲۰۰ ثبت‌نام اخیر را نشان می‌دهد.</p>
  </section>
  <section className="rounded-2xl border bg-card p-5"><div><h2 className="font-extrabold">گزارش حضور و نمرات</h2><p className="mt-1 text-xs text-muted-foreground">خلاصهٔ اطلاعات ثبت‌شده برای حداکثر ۲۰۰ ثبت‌نام اخیر</p></div>
   {(()=>{const ids=new Set(data.enrollments.map(item=>item.id));const records=data.attendance.filter(item=>ids.has(item.enrollment_id));const grades=data.grades.filter(item=>ids.has(item.enrollment_id));const present=records.filter(item=>item.status==="present").length;const absent=records.filter(item=>item.status==="absent").length;const late=records.filter(item=>item.status==="late").length;const excused=records.filter(item=>item.status==="excused").length;const average=grades.length?grades.reduce((sum,item)=>sum+Number(item.score),0)/grades.length:null;return <><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="حضور" value={present}/><Metric label="غیبت" value={absent}/><Metric label="تأخیر" value={late}/><Metric label="موجه" value={excused}/></div><div className="mt-3 flex flex-wrap justify-between gap-2 rounded-xl bg-muted/40 p-3 text-sm"><span>تعداد نمرات ثبت‌شده: <b>{grades.length}</b></span><span>میانگین نمرات: <b>{average===null?"—":average.toLocaleString("fa-IR",{maximumFractionDigits:2})}</b></span></div></>})()}
   <p className="mt-2 text-xs text-muted-foreground">این آمار فقط ثبت‌نام‌های اخیر بارگذاری‌شده در این پنل را پوشش می‌دهد و گزارش کل تاریخچهٔ سامانه نیست.</p>
  </section>
  <section className="rounded-2xl border bg-card p-5"><div><h2 className="font-extrabold">گزارش تفصیلی کلاس‌ها</h2><p className="mt-1 text-xs text-muted-foreground">فهرست دانش‌پژوهان قطعی، وضعیت حضور و میانگین نمرات هر کلاس</p></div>
   {data.classes.length?<div className="mt-3 divide-y">{data.classes.map(cls=>{const classEnrollments=data.enrollments.filter(item=>item.class_id===cls.id);const enrollmentIds=new Set(classEnrollments.map(item=>item.id));const classAttendance=data.attendance.filter(item=>enrollmentIds.has(item.enrollment_id));const classGrades=data.grades.filter(item=>enrollmentIds.has(item.enrollment_id));const avg=classGrades.length?classGrades.reduce((sum,item)=>sum+Number(item.score),0)/classGrades.length:null;const count=(status:string)=>classAttendance.filter(item=>item.status===status).length;return <details key={cls.id} className="py-3"><summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2"><span className="font-semibold">{cls.title}</span><span className="text-xs text-muted-foreground">{classEnrollments.length} دانش‌پژوه · {cls.is_active?"فعال":"غیرفعال"}</span></summary><div className="mt-3 rounded-xl bg-muted/30 p-3"><div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4"><span>حضور: <b>{count("present")}</b></span><span>غیبت: <b>{count("absent")}</b></span><span>تأخیر: <b>{count("late")}</b></span><span>موجه: <b>{count("excused")}</b></span></div><p className="mt-2 text-xs">نمرات ثبت‌شده: <b>{classGrades.length}</b> · میانگین: <b>{avg===null?"—":avg.toLocaleString("fa-IR",{maximumFractionDigits:2})}</b></p>{classEnrollments.length?<ul className="mt-3 divide-y border-t">{classEnrollments.map(enrollment=><li key={enrollment.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"><span>{profileNames.get(enrollment.student_id)??"دانش‌پژوه"}</span><span className="text-xs text-muted-foreground">{classAttendance.filter(item=>item.enrollment_id===enrollment.id).length} رکورد حضور · {classGrades.filter(item=>item.enrollment_id===enrollment.id).length} نمره</span></li>)}</ul>:<p className="mt-3 text-xs text-muted-foreground">هنوز ثبت‌نام قطعی ندارد.</p>}</div></details>})}</div>:<p className="mt-3 text-sm text-muted-foreground">کلاسی ثبت نشده است.</p>}
   <p className="mt-2 text-xs text-muted-foreground">گزارش بر اساس حداکثر ۲۰۰ ثبت‌نام، ۱۰۰۰ رکورد حضور و ۱۰۰۰ نمرهٔ اخیر بارگذاری‌شده است؛ برای گزارش حسابرسی کامل باید صفحه‌بندی جداگانه اضافه شود.</p>
  </section>
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
  <section className="rounded-2xl border bg-card p-5"><div><h2 className="font-extrabold">گزارش عملکرد استادان</h2><p className="mt-1 text-xs text-muted-foreground">کلاس‌های تخصیص‌یافته و تعداد ثبت‌نام‌های قطعی هر استاد</p></div>
   {(()=>{const teachers=data.profiles.filter(item=>item.role==="teacher");return teachers.length?<ul className="mt-3 divide-y">{teachers.map(teacher=>{const assigned=data.classes.filter(item=>item.teacher_id===teacher.id);const active=assigned.filter(item=>item.is_active);const studentCount=new Set(data.enrollments.filter(enrollment=>assigned.some(item=>item.id===enrollment.class_id)).map(enrollment=>enrollment.student_id)).size;return <li key={teacher.id} className="py-3"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{teacher.full_name||"استاد بدون نام"}</span><span className="text-xs text-muted-foreground">{active.length} کلاس فعال · {studentCount} دانش‌پژوه</span></div>{assigned.length?<ul className="mt-2 space-y-1 border-r-2 pr-3 text-sm">{assigned.map(item=><li key={item.id} className="flex flex-wrap justify-between gap-2"><span>{item.title}</span><span className="text-xs text-muted-foreground">{data.enrollments.filter(enrollment=>enrollment.class_id===item.id).length} ثبت‌نام · {item.is_active?"فعال":"غیرفعال"}</span></li>)}</ul>:<p className="mt-2 text-xs text-muted-foreground">هنوز کلاسی به این استاد تخصیص داده نشده است.</p>}</li>})}</ul>:<p className="mt-3 text-sm text-muted-foreground">حسابی با نقش استاد پیدا نشد.</p>})()}
   <p className="mt-2 text-xs text-muted-foreground">آمار بر اساس حداکثر ۲۰۰ کلاس و ۲۰۰ ثبت‌نام اخیر بارگذاری‌شده در این پنل محاسبه می‌شود.</p>
  </section>
  <section className="rounded-2xl border bg-card p-5"><h2 className="font-extrabold">کلاس‌های بدون استاد</h2>{(()=>{const unassigned=data.classes.filter(item=>!item.teacher_id);return unassigned.length?<ul className="mt-2 divide-y">{unassigned.map(item=><li key={item.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm"><span>{item.title}</span><span className="text-xs text-muted-foreground">{item.is_active?"فعال":"غیرفعال"}</span></li>)}</ul>:<p className="mt-2 text-sm text-muted-foreground">همهٔ کلاس‌ها استاد دارند.</p>})()}</section>
  <AdminCourseClassManager />
  <p className="text-xs text-muted-foreground">این پنل گزارش‌ها را می‌خواند و درخواست‌ها را بررسی می‌کند؛ مدیریت نقش کاربران و سیاست‌های امنیتی از اینجا انجام نمی‌شود.</p>
 </div>;
}
function Metric({label,value}:{label:string;value:number}){return <div className="rounded-2xl border bg-card p-4"><p className="text-xl font-extrabold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>}
