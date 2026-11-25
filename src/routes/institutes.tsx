import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Building2, CheckCircle2, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/backend/supabase";

export const Route = createFileRoute("/institutes")({ component: InstitutesPage });

type Institute = { id: string; name: string; slug: string; is_active: boolean };
type Membership = { id: string; institute_id: string; user_id: string; role: string; status: string; requested_at: string };

const roleName: Record<string,string> = { owner: "مالک", manager: "مدیر مؤسسه", teacher: "استاد", student: "دانش‌پژوه" };
const statusName: Record<string,string> = { pending: "در انتظار تأیید", active: "فعال", suspended: "تعلیق‌شده" };

function InstitutesPage() {
  const { user, mode } = useAuth();
  const [institutes,setInstitutes] = useState<Institute[]>([]);
  const [memberships,setMemberships] = useState<Membership[]>([]);
  const [busy,setBusy] = useState(false);
  const [loading,setLoading] = useState(true);
  const [name,setName] = useState("");
  const [slug,setSlug] = useState("");
  const [selected,setSelected] = useState("");
  const admin = user?.role === "admin";

  const load = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) throw new Error("اتصال Supabase فعال نیست.");
    const [i,m] = await Promise.all([
      sb.from("institutions").select("id,name,slug,is_active").eq("is_active",true).order("name"),
      sb.from("institute_memberships").select("id,institute_id,user_id,role,status,requested_at").order("requested_at",{ascending:false}),
    ]);
    if(i.error) throw new Error(i.error.message);
    if(m.error) throw new Error(m.error.message);
    setInstitutes(i.data ?? []);
    setMemberships(m.data ?? []);
  },[]);

  useEffect(()=>{ let alive=true; void load().catch(e=>toast.error(e instanceof Error?e.message:"بارگذاری مؤسسه‌ها ناموفق بود.")).finally(()=>{if(alive)setLoading(false);}); return ()=>{alive=false;}; },[load]);

  const createInstitute = async (e:FormEvent) => {
    e.preventDefault();
    if(!admin) return;
    const cleanName=name.trim(), cleanSlug=slug.trim().toLowerCase();
    if(cleanName.length<2 || !/^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/.test(cleanSlug)) {
      toast.error("نام مؤسسه و شناسهٔ انگلیسی معتبر وارد کنید (شناسه حداقل ۳ حرف/عدد)."); return;
    }
    const sb=getSupabase(); if(!sb||!user)return;
    setBusy(true);
    try {
      const {error}=await sb.from("institutions").insert({name:cleanName,slug:cleanSlug});
      if(error)throw new Error(error.message);
      toast.success("مؤسسه ساخته شد و حساب مدیر به‌صورت خودکار و اتمیک مالک آن شد.");
      setName("");setSlug("");await load();
    } catch(e){toast.error(e instanceof Error?e.message:"ساخت مؤسسه انجام نشد.");}
    finally{setBusy(false);}
  };

  const requestJoin = async (e:FormEvent) => {
    e.preventDefault(); const sb=getSupabase(); if(!sb||!user||!selected)return;
    if(memberships.some(m=>m.institute_id===selected&&m.user_id===user.id)){toast.info("برای این مؤسسه قبلاً عضویت ثبت شده است.");return;}
    setBusy(true);
    try{
      const {error}=await sb.from("institute_memberships").insert({institute_id:selected,user_id:user.id,role:"student",status:"pending"});
      if(error)throw new Error(error.message);
      toast.success("درخواست عضویت ارسال شد؛ تا تأیید مدیر، دسترسی فعال نمی‌شود.");
      await load();
    }catch(e){toast.error(e instanceof Error?e.message:"ارسال درخواست ناموفق بود.");}
    finally{setBusy(false);}
  };

  const review = async (membership:Membership, status:"active"|"suspended") => {
    const sb=getSupabase(); if(!sb)return; setBusy(true);
    try{
      const {error}=await sb.from("institute_memberships").update({status,reviewed_at:new Date().toISOString(),reviewed_by:user?.id}).eq("id",membership.id);
      if(error)throw new Error(error.message);
      toast.success(status==="active"?"عضویت تأیید شد.":"عضویت تعلیق شد."); await load();
    }catch(e){toast.error(e instanceof Error?e.message:"تغییر عضویت ناموفق بود.");}
    finally{setBusy(false);}
  };

  const setRole = async (membership:Membership, role:string) => {
    const sb=getSupabase(); if(!sb)return; setBusy(true);
    try{const {error}=await sb.from("institute_memberships").update({role}).eq("id",membership.id);if(error)throw new Error(error.message);toast.success("نقش عضویت تغییر کرد.");await load();}
    catch(e){toast.error(e instanceof Error?e.message:"تغییر نقش ناموفق بود.");}finally{setBusy(false);}
  };

  const canManage=(instituteId:string)=>admin||memberships.some(m=>m.institute_id===instituteId&&m.user_id===user?.id&&m.status==="active"&&(m.role==="owner"||m.role==="manager"));
  const instituteName=(id:string)=>institutes.find(i=>i.id===id)?.name??"مؤسسه";

  return <><PageHeader title="مؤسسه‌های آموزشی" subtitle="عضویت در مؤسسه و مدیریت اعضا" icon={Building2}/><div className="mx-auto max-w-4xl space-y-5 px-4 py-6">
    {!user?<div className="rounded-xl border p-4 text-sm">برای درخواست عضویت ابتدا وارد حساب خود شوید.</div>:mode!=="backend"?<div className="rounded-xl border p-4 text-sm">مدیریت مؤسسه‌ها فقط پس از اتصال پایگاه داده فعال می‌شود.</div>:<>
      {admin&&<section className="space-y-3 rounded-2xl border bg-card p-5"><h2 className="font-bold">ساخت مؤسسه (مدیر سامانه)</h2><form onSubmit={createInstitute} className="grid gap-3 sm:grid-cols-2"><Input aria-label="نام مؤسسه" placeholder="نام مؤسسه" value={name} onChange={e=>setName(e.target.value)} required/><Input aria-label="شناسه انگلیسی مؤسسه" dir="ltr" placeholder="slug-example" value={slug} onChange={e=>setSlug(e.target.value)} required/><div className="sm:col-span-2"><Button type="submit" disabled={busy}>ساخت مؤسسه و تعیین مالک</Button></div></form></section>}
      <section className="space-y-3 rounded-2xl border bg-card p-5"><h2 className="font-bold">درخواست عضویت</h2>{institutes.length?<form onSubmit={requestJoin} className="space-y-3"><select className="h-11 w-full rounded-xl border bg-card px-3 text-sm" value={selected} onChange={e=>setSelected(e.target.value)} required><option value="">انتخاب مؤسسه</option>{institutes.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select><Button type="submit" disabled={busy||!selected}>ارسال درخواست عضویت به‌عنوان دانش‌پژوه</Button></form>:<p className="text-sm text-muted-foreground">فعلاً مؤسسهٔ فعالی برای درخواست عضویت ثبت نشده است.</p>}</section>
      <section className="space-y-3 rounded-2xl border bg-card p-5"><h2 className="flex items-center gap-2 font-bold"><Users className="h-5 w-5"/>عضویت‌های من</h2>{memberships.filter(m=>m.user_id===user.id).length?<ul className="divide-y">{memberships.filter(m=>m.user_id===user.id).map(m=><li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><span>{instituteName(m.institute_id)} · {roleName[m.role]??m.role}</span><span className="rounded-full bg-muted px-3 py-1">{statusName[m.status]??m.status}</span></li>)}</ul>:<p className="text-sm text-muted-foreground">هنوز عضویتی ثبت نشده است.</p>}</section>
      {memberships.some(m=>canManage(m.institute_id))&&<section className="space-y-3 rounded-2xl border bg-card p-5"><h2 className="font-bold">مدیریت اعضای مؤسسه</h2>{memberships.filter(m=>canManage(m.institute_id)&&m.user_id!==user.id).map(m=><div key={m.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-3 text-sm"><div><p className="font-semibold">{instituteName(m.institute_id)}</p><p className="text-muted-foreground">{m.user_id.slice(0,8)}… · {roleName[m.role]} · {statusName[m.status]}</p></div><div className="flex flex-wrap gap-2">{m.status!=="active"&&<Button size="sm" disabled={busy} onClick={()=>review(m,"active")}><CheckCircle2 className="me-1 h-4 w-4"/>تأیید</Button>}{m.status==="active"&&<Button size="sm" variant="outline" disabled={busy} onClick={()=>review(m,"suspended")}>تعلیق</Button>}{m.status==="active"&&m.role==="student"&&<Button size="sm" variant="outline" disabled={busy} onClick={()=>setRole(m,"teacher")}>تعیین استاد</Button>}{m.status==="active"&&m.role==="teacher"&&<Button size="sm" variant="outline" disabled={busy} onClick={()=>setRole(m,"student")}>تبدیل به دانش‌پژوه</Button>}</div></div>)}</section>}
      {loading&&<p className="text-sm text-muted-foreground">در حال بارگذاری…</p>}
      <p className="text-xs text-muted-foreground">این بخش به migration مؤسسه‌ها وابسته است. تا اجرای migration روی Supabase، ممکن است خطای نبود جدول نمایش داده شود؛ هیچ تغییری در پایگاه داده زنده به‌صورت خودکار انجام نمی‌شود.</p>
    </>}
  </div></>;
}
