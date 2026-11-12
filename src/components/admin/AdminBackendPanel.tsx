import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getSupabase } from "@/lib/backend/supabase";
import { AdminCourseClassManager } from "./AdminCourseClassManager";

type AdminData = {
  profiles: { id: string; full_name: string | null; phone: string | null; role: string | null; created_at: string | null }[];
  courses: { id: string; title: string; is_active: boolean }[];
  classes: { id: string; title: string; is_active: boolean; teacher_id: string | null; course_id: string | null; capacity: number | null }[];
  requests: { id: string; student_id: string; class_id: string; status: string; payment_status: string; created_at: string }[];
  enrollments: { id: string; student_id: string; class_id: string; created_at: string }[];
  attendance: { id: string; enrollment_id: string; session_date: string; status: string }[];
  grades: { id: string; enrollment_id: string; title: string; score: number }[];
  hifzRecords: { id: string; enrollment_id: string; record_type: string; assessment: string; ayah_start: number; ayah_end: number }[];
  hifzAssignments: { id: string; enrollment_id: string; due_date: string }[];
  hifzCompletions: { id: string; assignment_id: string; student_id: string; status: string }[];
};


async function readAllPages<T>(
 makeQuery:(from:number,to:number)=>PromiseLike<{data:T[]|null;error:{message:string}|null}>,
 pageSize=500,
):Promise<T[]>{
 const rows:T[]=[];
 for(let from=0;;from+=pageSize){
  const {data,error}=await makeQuery(from,from+pageSize-1);
  if(error)throw new Error(error.message);
  const page=data??[];
  rows.push(...page);
  if(page.length<pageSize)return rows;
 }
}

export function AdminBackendPanel() {
 const [data,setData]=useState<AdminData|null>(null);
 const [loading,setLoading]=useState(true);
 const [savingId,setSavingId]=useState<string|null>(null);
 const [paymentChoices,setPaymentChoices]=useState<Record<string,"paid"|"waived"|"">>({});
 const [enrollmentClassFilter,setEnrollmentClassFilter]=useState("");
 const [enrollmentSearch,setEnrollmentSearch]=useState("");
 const [userSearch,setUserSearch]=useState("");
 const [userRoleFilter,setUserRoleFilter]=useState("all");
 const [currentUserId,setCurrentUserId]=useState<string|null>(null);
 const [profilesTotal,setProfilesTotal]=useState(0);
 const [loadingMoreUsers,setLoadingMoreUsers]=useState(false);
 const [enrollmentsTotal,setEnrollmentsTotal]=useState(0);
 const [loadingMoreEnrollments,setLoadingMoreEnrollments]=useState(false);

 const loadData=useCallback(async()=>{
  const sb=getSupabase();
  if(!sb) throw new Error("اتصال Supabase هنوز در تنظیمات محیط اجرا فعال نشده است.");
  const [{data:userResult,error:userError},p,c,cl,r,e,a,g,h,ha,hc]=await Promise.all([
   sb.auth.getUser(),
   readAllPages((from,to)=>sb.from("profiles").select("id,full_name,phone,role,created_at").order("created_at",{ascending:false}).range(from,to)),
   readAllPages((from,to)=>sb.from("courses").select("id,title,is_active").order("created_at",{ascending:false}).range(from,to)),
   readAllPages((from,to)=>sb.from("classes").select("id,title,is_active,teacher_id,course_id,capacity").order("created_at",{ascending:false}).range(from,to)),
   readAllPages((from,to)=>sb.from("enrollment_requests").select("id,student_id,class_id,status,payment_status,created_at").order("created_at",{ascending:false}).range(from,to)),
   readAllPages((from,to)=>sb.from("enrollments").select("id,student_id,class_id,created_at").order("created_at",{ascending:false}).range(from,to)),
   readAllPages((from,to)=>sb.from("attendance").select("id,enrollment_id,session_date,status").order("session_date",{ascending:false}).range(from,to)),
   readAllPages((from,to)=>sb.from("grades").select("id,enrollment_id,title,score").order("created_at",{ascending:false}).range(from,to)),
   readAllPages((from,to)=>sb.from("hifz_records").select("id,enrollment_id,record_type,assessment,ayah_start,ayah_end").order("session_date",{ascending:false}).range(from,to)),
   readAllPages((from,to)=>sb.from("hifz_assignments").select("id,enrollment_id,due_date").order("created_at",{ascending:false}).range(from,to)),
   readAllPages((from,to)=>sb.from("hifz_assignment_completions").select("id,assignment_id,student_id,status").range(from,to)),
  ]);
  if(userError) throw new Error(userError.message);
  setCurrentUserId(userResult.user?.id??null);
  setProfilesTotal(p.length);
  setEnrollmentsTotal(e.length);
  for(const result of [p,c,cl,r,e,a,g,h,ha,hc]) if(result.error) throw new Error(result.error.message);
  setData({profiles:p,courses:c,classes:cl,requests:r,enrollments:e,attendance:a,grades:g,hifzRecords:h,hifzAssignments:ha,hifzCompletions:hc});
 },[]);

 useEffect(()=>{
  let active=true;
  void loadData().catch(error=>{if(active) toast.error(error instanceof Error?error.message:"بارگذاری اطلاعات مدیر انجام نشد.");})
   .finally(()=>{if(active) setLoading(false);});
  return ()=>{active=false;};
 },[loadData]);

 const loadMoreUsers=async()=>{
  const sb=getSupabase();
  if(!sb||loadingMoreUsers||data===null||data.profiles.length>=profilesTotal)return;
  setLoadingMoreUsers(true);
  try{
   const {data:rows,error}=await sb.from("profiles").select("id,full_name,phone,role,created_at").order("created_at",{ascending:false}).range(data.profiles.length,data.profiles.length+199);
   if(error)throw new Error(error.message);
   setData(current=>current?{...current,profiles:[...current.profiles,...(rows??[])]}:current);
  }catch(error){toast.error(error instanceof Error?error.message:"دریافت کاربران بیشتر انجام نشد.");}
  finally{setLoadingMoreUsers(false);}
 };

 const updateUserRole=async(profile:{id:string;full_name:string|null;role:string|null},nextRole:"student"|"teacher"|"admin")=>{
  if(profile.id===currentUserId){toast.error("برای جلوگیری از قفل‌شدن دسترسی، نقش حساب مدیر فعلی از این بخش تغییر نمی‌کند.");return;}
  if(profile.role===nextRole)return;
  const label=(role:string|null)=>role==="admin"?"مدیر":role==="teacher"?"استاد":"دانش‌پژوه";
  const name=profile.full_name||"این کاربر";
  if(!window.confirm("نقش «"+name+"» از "+label(profile.role)+" به "+label(nextRole)+" تغییر کند؟"))return;
  const sb=getSupabase();
  if(!sb)return;
  setSavingId(profile.id);
  try{
   const {data:updated,error}=await sb.from("profiles").update({role:nextRole}).eq("id",profile.id).select("id").maybeSingle();
   if(error)throw new Error(error.message);
   if(!updated)throw new Error("تغییر نقش انجام نشد؛ مجوز مدیر یا وضعیت حساب را بررسی کنید.");
   await loadData();
   toast.success("نقش کاربر تغییر کرد.");
  }catch(error){toast.error(error instanceof Error?error.message:"تغییر نقش انجام نشد.");}
  finally{setSavingId(null);}
 };

 const loadMoreEnrollments=async()=>{
  const sb=getSupabase();
  if(!sb||loadingMoreEnrollments||data===null||data.enrollments.length>=enrollmentsTotal)return;
  setLoadingMoreEnrollments(true);
  try{
   const start=data.enrollments.length;
   const {data:rows,error}=await sb.from("enrollments").select("id,student_id,class_id,created_at").order("created_at",{ascending:false}).range(start,start+199);
   if(error)throw new Error(error.message);
   const knownProfiles=new Set(data.profiles.map(item=>item.id));
   const missingIds=[...new Set((rows??[]).map(item=>item.student_id).filter(id=>!knownProfiles.has(id)))];
   let extraProfiles:AdminData["profiles"]=[];
   if(missingIds.length){
    const {data:profileRows,error:profileError}=await sb.from("profiles").select("id,full_name,phone,role,created_at").in("id",missingIds);
    if(profileError)throw new Error(profileError.message);
    extraProfiles=profileRows??[];
   }
   setData(current=>current?{...current,enrollments:[...current.enrollments,...(rows??[])],profiles:[...current.profiles,...extraProfiles.filter(item=>!current.profiles.some(existing=>existing.id===item.id))]}:current);
  }catch(error){toast.error(error instanceof Error?error.message:"دریافت ثبت‌نام‌های بیشتر انجام نشد.");}
  finally{setLoadingMoreEnrollments(false);}
 };

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
  <section className="rounded-2xl border bg-card p-5">
   <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-extrabold">مدیریت کاربران و نقش‌ها</h2><p className="mt-1 text-xs text-muted-foreground">جست‌وجو، اطلاعات تماس، ارتباط با کلاس‌ها و تغییر نقش امن حساب‌ها.</p></div><b>{data.profiles.length.toLocaleString("fa-IR")} از {profilesTotal.toLocaleString("fa-IR")} حساب</b></div>
   <div className="mt-3 grid gap-2 sm:grid-cols-2">
    <label className="text-sm font-semibold">جست‌وجوی کاربر<input value={userSearch} onChange={event=>setUserSearch(event.target.value)} placeholder="نام یا شناسه حساب" className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal"/></label>
    <label className="text-sm font-semibold">فیلتر نقش<select value={userRoleFilter} onChange={event=>setUserRoleFilter(event.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal"><option value="all">همه نقش‌ها</option><option value="student">دانش‌پژوه</option><option value="teacher">استاد</option><option value="admin">مدیر</option></select></label>
   </div>
   {(()=>{const term=userSearch.trim().toLocaleLowerCase();const rows=data.profiles.filter(profile=>(userRoleFilter==="all"||profile.role===userRoleFilter)&&((profile.full_name||"").toLocaleLowerCase().includes(term)||profile.id.toLocaleLowerCase().includes(term)));return rows.length?<ul className="mt-3 divide-y">{rows.map(profile=><li key={profile.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-semibold">{profile.full_name||"کاربر بدون نام"}{profile.id===currentUserId?<span className="mr-2 text-xs text-muted-foreground">(حساب فعلی)</span>:null}</p><p className="break-all text-xs text-muted-foreground">{profile.id}</p><p className="text-xs text-muted-foreground">تلفن: {profile.phone||"ثبت نشده"} · عضویت: {profile.created_at?new Date(profile.created_at).toLocaleDateString("fa-IR"):"نامشخص"}</p><p className="text-xs text-muted-foreground">ثبت‌نام قطعی: {data.enrollments.filter(item=>item.student_id===profile.id).length} · درخواست ثبت‌نام: {data.requests.filter(item=>item.student_id===profile.id).length}</p><p className="text-xs text-muted-foreground">کلاس‌ها: {[...new Set(data.enrollments.filter(item=>item.student_id===profile.id).map(item=>classNames.get(item.class_id)).filter(Boolean))].join("، ")||"در داده‌های بارگذاری‌شده یافت نشد"}</p></div><div className="flex items-center gap-2"><select aria-label={"نقش "+(profile.full_name||"کاربر")} disabled={profile.id===currentUserId||savingId===profile.id} value={profile.role||"student"} onChange={event=>void updateUserRole(profile,event.target.value as "student"|"teacher"|"admin")} className="rounded-lg border bg-background px-3 py-2 text-sm disabled:opacity-60"><option value="student">دانش‌پژوه</option><option value="teacher">استاد</option><option value="admin">مدیر</option></select>{savingId===profile.id?<span className="text-xs text-muted-foreground">در حال ذخیره…</span>:null}</div></li>)}</ul>:<p className="mt-3 text-sm text-muted-foreground">کاربری با این جست‌وجو پیدا نشد.</p>})()}
   {data.profiles.length<profilesTotal?<button type="button" onClick={()=>void loadMoreUsers()} disabled={loadingMoreUsers} className="mt-3 w-full rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-60">{loadingMoreUsers?"در حال دریافت…":"بارگذاری ۲۰۰ کاربر بعدی"}</button>:null}
   <p className="mt-2 text-xs text-muted-foreground">اطلاعات ثبت‌نام و کلاس در این ردیف بر اساس حداکثر ۲۰۰ ثبت‌نام و ۲۰۰ درخواست اخیر بارگذاری‌شده در همین گزارش است؛ تعدادها ممکن است کل تاریخچه نباشد. ایجاد و حذف حساب از این پنل انجام نمی‌شود.</p>
  </section>
  <section className="rounded-2xl border bg-card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-extrabold">گزارش ثبت‌نام‌های قطعی</h2><p className="mt-1 text-xs text-muted-foreground">{data.enrollments.length.toLocaleString("fa-IR")} از {enrollmentsTotal.toLocaleString("fa-IR")} ثبت‌نام بارگذاری‌شده</p></div><b className="text-2xl">{enrollmentsTotal.toLocaleString("fa-IR")}</b></div>
   <div className="mt-3 grid gap-2 sm:grid-cols-2">
    <label className="text-sm font-semibold">فیلتر کلاس<select value={enrollmentClassFilter} onChange={event=>setEnrollmentClassFilter(event.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal"><option value="">همهٔ کلاس‌ها</option>{data.classes.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
    <label className="text-sm font-semibold">جست‌وجوی نام دانش‌پژوه<input value={enrollmentSearch} onChange={event=>setEnrollmentSearch(event.target.value)} placeholder="نام یا بخشی از نام" className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal"/></label>
   </div>
   {(()=>{const rows=data.enrollments.filter(item=>(!enrollmentClassFilter||item.class_id===enrollmentClassFilter)&&((profileNames.get(item.student_id)??"دانش‌پژوه").toLocaleLowerCase().includes(enrollmentSearch.trim().toLocaleLowerCase())));return rows.length?<ul className="mt-3 divide-y">{rows.map(item=><li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><div><p className="font-semibold">{profileNames.get(item.student_id)??"دانش‌پژوه"}</p><p className="text-xs text-muted-foreground">{classNames.get(item.class_id)??"کلاس نامشخص"}</p></div><span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString("fa-IR")}</span></li>)}</ul>:<p className="mt-3 text-sm text-muted-foreground">ثبت‌نامی با این فیلتر پیدا نشد.</p>})()}
   {data.enrollments.length<enrollmentsTotal?<button type="button" onClick={()=>void loadMoreEnrollments()} disabled={loadingMoreEnrollments} className="mt-3 w-full rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-60">{loadingMoreEnrollments?"در حال دریافت…":"بارگذاری ۲۰۰ ثبت‌نام بعدی"}</button>:null}
   <p className="mt-2 text-xs text-muted-foreground">فیلترها و جست‌وجو روی ثبت‌نام‌های بارگذاری‌شده اعمال می‌شوند؛ برای مشاهده موارد قدیمی‌تر، صفحه‌های بعدی را بارگذاری کنید.</p>
  </section>
  <section className="rounded-2xl border bg-card p-5"><div><h2 className="font-extrabold">گزارش حضور و نمرات</h2><p className="mt-1 text-xs text-muted-foreground">خلاصهٔ اطلاعات ثبت‌شده برای حداکثر ۲۰۰ ثبت‌نام اخیر</p></div>
   {(()=>{const ids=new Set(data.enrollments.map(item=>item.id));const records=data.attendance.filter(item=>ids.has(item.enrollment_id));const grades=data.grades.filter(item=>ids.has(item.enrollment_id));const present=records.filter(item=>item.status==="present").length;const absent=records.filter(item=>item.status==="absent").length;const late=records.filter(item=>item.status==="late").length;const excused=records.filter(item=>item.status==="excused").length;const average=grades.length?grades.reduce((sum,item)=>sum+Number(item.score),0)/grades.length:null;return <><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="حضور" value={present}/><Metric label="غیبت" value={absent}/><Metric label="تأخیر" value={late}/><Metric label="موجه" value={excused}/></div><div className="mt-3 flex flex-wrap justify-between gap-2 rounded-xl bg-muted/40 p-3 text-sm"><span>تعداد نمرات ثبت‌شده: <b>{grades.length}</b></span><span>میانگین نمرات: <b>{average===null?"—":average.toLocaleString("fa-IR",{maximumFractionDigits:2})}</b></span></div></>})()}
   <p className="mt-2 text-xs text-muted-foreground">این آمار فقط ثبت‌نام‌های اخیر بارگذاری‌شده در این پنل را پوشش می‌دهد و گزارش کل تاریخچهٔ سامانه نیست.</p>
  </section>
  <section className="rounded-2xl border bg-card p-5"><div><h2 className="font-extrabold">گزارش تفصیلی کلاس‌ها</h2><p className="mt-1 text-xs text-muted-foreground">فهرست دانش‌پژوهان قطعی، وضعیت حضور و میانگین نمرات هر کلاس</p></div>
   {data.classes.length?<div className="mt-3 divide-y">{data.classes.map(cls=>{const classEnrollments=data.enrollments.filter(item=>item.class_id===cls.id);const enrollmentIds=new Set(classEnrollments.map(item=>item.id));const classAttendance=data.attendance.filter(item=>enrollmentIds.has(item.enrollment_id));const classGrades=data.grades.filter(item=>enrollmentIds.has(item.enrollment_id));const avg=classGrades.length?classGrades.reduce((sum,item)=>sum+Number(item.score),0)/classGrades.length:null;const count=(status:string)=>classAttendance.filter(item=>item.status===status).length;return <details key={cls.id} className="py-3"><summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2"><span className="font-semibold">{cls.title}</span><span className="text-xs text-muted-foreground">{classEnrollments.length} دانش‌پژوه · {cls.is_active?"فعال":"غیرفعال"}</span></summary><div className="mt-3 rounded-xl bg-muted/30 p-3"><div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4"><span>حضور: <b>{count("present")}</b></span><span>غیبت: <b>{count("absent")}</b></span><span>تأخیر: <b>{count("late")}</b></span><span>موجه: <b>{count("excused")}</b></span></div><p className="mt-2 text-xs">نمرات ثبت‌شده: <b>{classGrades.length}</b> · میانگین: <b>{avg===null?"—":avg.toLocaleString("fa-IR",{maximumFractionDigits:2})}</b></p>{classEnrollments.length?<ul className="mt-3 divide-y border-t">{classEnrollments.map(enrollment=><li key={enrollment.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"><span>{profileNames.get(enrollment.student_id)??"دانش‌پژوه"}</span><span className="text-xs text-muted-foreground">{classAttendance.filter(item=>item.enrollment_id===enrollment.id).length} رکورد حضور · {classGrades.filter(item=>item.enrollment_id===enrollment.id).length} نمره</span></li>)}</ul>:<p className="mt-3 text-xs text-muted-foreground">هنوز ثبت‌نام قطعی ندارد.</p>}</div></details>})}</div>:<p className="mt-3 text-sm text-muted-foreground">کلاسی ثبت نشده است.</p>}
   <p className="mt-2 text-xs text-muted-foreground">گزارش بر اساس حداکثر ۲۰۰ ثبت‌نام، ۱۰۰۰ رکورد حضور و ۱۰۰۰ نمرهٔ اخیر بارگذاری‌شده است؛ برای گزارش حسابرسی کامل باید صفحه‌بندی جداگانه اضافه شود.</p>
  </section>
  <section className="rounded-2xl border bg-card p-5">
   <div><h2 className="font-extrabold">داشبورد عملکرد دوره‌ها و کلاس‌ها</h2><p className="mt-1 text-xs text-muted-foreground">مقایسه ثبت‌نام، حضور مؤثر، میانگین نمرات و فعالیت‌های حفظ قرآن در هر دوره؛ فقط بر اساس داده‌های بارگذاری‌شده.</p></div>
   {data.courses.length?<div className="mt-3 divide-y">{data.courses.map(course=>{
    const courseClasses=data.classes.filter(item=>item.course_id===course.id);
    const classIds=new Set(courseClasses.map(item=>item.id));
    const courseEnrollments=data.enrollments.filter(item=>classIds.has(item.class_id));
    const enrollmentIds=new Set(courseEnrollments.map(item=>item.id));
    const attendance=data.attendance.filter(item=>enrollmentIds.has(item.enrollment_id));
    const present=attendance.filter(item=>item.status==="present"||item.status==="late").length;
    const grades=data.grades.filter(item=>enrollmentIds.has(item.enrollment_id));
    const average=grades.length?grades.reduce((sum,item)=>sum+Number(item.score),0)/grades.length:null;
    const records=data.hifzRecords.filter(item=>enrollmentIds.has(item.enrollment_id));
    const memorization=records.filter(item=>item.record_type==="memorization");
    const reviews=records.filter(item=>item.record_type==="review");
    const assignments=data.hifzAssignments.filter(item=>enrollmentIds.has(item.enrollment_id));
    const assignmentIds=new Set(assignments.map(item=>item.id));
    const completions=data.hifzCompletions.filter(item=>assignmentIds.has(item.assignment_id));
    const completedIds=new Set(completions.filter(item=>item.status==="completed").map(item=>item.assignment_id+"|"+item.student_id));
    const completed=completedIds.size;
    const assignmentTotal=assignments.length;
    return <details key={course.id} className="py-3">
     <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2"><span className="font-semibold">{course.title}</span><span className="text-xs text-muted-foreground">{courseClasses.length} کلاس · {courseEnrollments.length} ثبت‌نام</span></summary>
     <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div className="rounded-lg bg-muted/40 p-3"><b>{courseClasses.filter(item=>item.is_active).length}</b><p className="text-xs text-muted-foreground">کلاس فعال</p></div>
      <div className="rounded-lg bg-muted/40 p-3"><b>{new Set(courseEnrollments.map(item=>item.student_id)).size}</b><p className="text-xs text-muted-foreground">دانش‌پژوه یکتا</p></div>
      <div className="rounded-lg bg-muted/40 p-3"><b>{attendance.length?Math.round(present/attendance.length*100)+"٪":"—"}</b><p className="text-xs text-muted-foreground">حضور مؤثر</p></div>
      <div className="rounded-lg bg-muted/40 p-3"><b>{average===null?"—":average.toLocaleString("fa-IR",{maximumFractionDigits:2})}</b><p className="text-xs text-muted-foreground">میانگین نمرات</p></div>
      <div className="rounded-lg bg-muted/40 p-3"><b>{memorization.length}</b><p className="text-xs text-muted-foreground">رکورد حفظ جدید</p></div>
      <div className="rounded-lg bg-muted/40 p-3"><b>{reviews.length}</b><p className="text-xs text-muted-foreground">رکورد مرور</p></div>
      <div className="rounded-lg bg-muted/40 p-3"><b>{records.filter(item=>item.assessment==="excellent").length}</b><p className="text-xs text-muted-foreground">ارزیابی عالی</p></div>
      <div className="rounded-lg bg-muted/40 p-3"><b>{assignmentTotal?Math.round(completed/assignmentTotal*100)+"٪":"—"}</b><p className="text-xs text-muted-foreground">تکمیل برنامه‌ها</p></div>
     </div>
     {courseClasses.length?<ul className="mt-3 divide-y border-t">{courseClasses.map(cls=>{
      const rows=courseEnrollments.filter(item=>item.class_id===cls.id);
      const used=rows.length;
      const capacityLabel=cls.capacity===null?"ظرفیت نامحدود":used+" از "+cls.capacity+" نفر";
      const teacher=data.profiles.find(item=>item.id===cls.teacher_id);
      return <li key={cls.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"><span>{cls.title} <span className="text-xs text-muted-foreground">· {teacher?.full_name||"بدون استاد"}</span></span><span className="text-xs text-muted-foreground">{capacityLabel} · {cls.is_active?"فعال":"غیرفعال"}</span></li>
     })}</ul>:<p className="mt-2 text-xs text-muted-foreground">هنوز کلاسی برای این دوره ساخته نشده است.</p>}
    </details>
   })}</div>:<p className="mt-3 text-sm text-muted-foreground">دوره‌ای برای گزارش وجود ندارد.</p>}
   <p className="mt-3 text-xs text-muted-foreground">محدودیت داده: حداکثر ۲۰۰ دوره/کلاس/ثبت‌نام، ۱۰۰۰ حضور و نمره، ۲۰۰۰ رکورد حفظ و تکمیل برنامه و ۱۰۰۰ برنامه اخیر. این اعداد گزارش کامل تاریخی نیستند. درصد تکمیل برنامه از رکوردهای تکمیل‌شده برای هر دانش‌پژوه/برنامه محاسبه می‌شود.</p>
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
   {(()=>{const teachers=data.profiles.filter(item=>item.role==="teacher");return teachers.length?<ul className="mt-3 divide-y">{teachers.map(teacher=>{const assigned=data.classes.filter(item=>item.teacher_id===teacher.id);const active=assigned.filter(item=>item.is_active);const teacherEnrollments=data.enrollments.filter(enrollment=>assigned.some(item=>item.id===enrollment.class_id));const studentCount=new Set(teacherEnrollments.map(item=>item.student_id)).size;const enrollmentIds=new Set(teacherEnrollments.map(item=>item.id));const teacherAttendance=data.attendance.filter(item=>enrollmentIds.has(item.enrollment_id));const effective=teacherAttendance.filter(item=>item.status==="present"||item.status==="late").length;const teacherGrades=data.grades.filter(item=>enrollmentIds.has(item.enrollment_id));const teacherAverage=teacherGrades.length?teacherGrades.reduce((sum,item)=>sum+Number(item.score),0)/teacherGrades.length:null;const teacherHifz=data.hifzRecords.filter(item=>enrollmentIds.has(item.enrollment_id));const teacherAssignments=data.hifzAssignments.filter(item=>enrollmentIds.has(item.enrollment_id));const teacherAssignmentIds=new Set(teacherAssignments.map(item=>item.id));const teacherCompleted=new Set(data.hifzCompletions.filter(item=>teacherAssignmentIds.has(item.assignment_id)&&item.status==="completed").map(item=>item.assignment_id+"|"+item.student_id)).size;return <li key={teacher.id} className="py-3"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{teacher.full_name||"استاد بدون نام"}</span><span className="text-xs text-muted-foreground">{active.length} کلاس فعال · {studentCount} دانش‌پژوه</span></div><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4"><div className="rounded-lg bg-muted/40 p-2 text-sm"><b>{teacherAttendance.length?Math.round(effective/teacherAttendance.length*100)+"٪":"—"}</b><p className="text-xs text-muted-foreground">حضور مؤثر</p></div><div className="rounded-lg bg-muted/40 p-2 text-sm"><b>{teacherAverage===null?"—":teacherAverage.toLocaleString("fa-IR",{maximumFractionDigits:2})}</b><p className="text-xs text-muted-foreground">میانگین نمرات</p></div><div className="rounded-lg bg-muted/40 p-2 text-sm"><b>{teacherHifz.length}</b><p className="text-xs text-muted-foreground">ارزیابی حفظ</p></div><div className="rounded-lg bg-muted/40 p-2 text-sm"><b>{teacherAssignments.length?Math.round(teacherCompleted/teacherAssignments.length*100)+"٪":"—"}</b><p className="text-xs text-muted-foreground">تکمیل برنامه‌ها</p></div></div>{assigned.length?<ul className="mt-2 space-y-1 border-r-2 pr-3 text-sm">{assigned.map(item=><li key={item.id} className="flex flex-wrap justify-between gap-2"><span>{item.title}</span><span className="text-xs text-muted-foreground">{data.enrollments.filter(enrollment=>enrollment.class_id===item.id).length} ثبت‌نام · {item.is_active?"فعال":"غیرفعال"}</span></li>)}</ul>:<p className="mt-2 text-xs text-muted-foreground">هنوز کلاسی به این استاد تخصیص داده نشده است.</p>}</li>})}</ul>:<p className="mt-3 text-sm text-muted-foreground">حسابی با نقش استاد پیدا نشد.</p>})()}
   <p className="mt-2 text-xs text-muted-foreground">آمار بر اساس حداکثر ۲۰۰ کلاس و ۲۰۰ ثبت‌نام اخیر بارگذاری‌شده در این پنل محاسبه می‌شود.</p>
  </section>
  <section className="rounded-2xl border bg-card p-5"><h2 className="font-extrabold">کلاس‌های بدون استاد</h2>{(()=>{const unassigned=data.classes.filter(item=>!item.teacher_id);return unassigned.length?<ul className="mt-2 divide-y">{unassigned.map(item=><li key={item.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm"><span>{item.title}</span><span className="text-xs text-muted-foreground">{item.is_active?"فعال":"غیرفعال"}</span></li>)}</ul>:<p className="mt-2 text-sm text-muted-foreground">همهٔ کلاس‌ها استاد دارند.</p>})()}</section>
  <AdminCourseClassManager />
  <p className="text-xs text-muted-foreground">این پنل گزارش‌ها را می‌خواند و درخواست‌ها را بررسی می‌کند؛ مدیریت نقش کاربران و سیاست‌های امنیتی از اینجا انجام نمی‌شود.</p>
 </div>;
}
function Metric({label,value}:{label:string;value:number}){return <div className="rounded-2xl border bg-card p-4"><p className="text-xl font-extrabold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>}
