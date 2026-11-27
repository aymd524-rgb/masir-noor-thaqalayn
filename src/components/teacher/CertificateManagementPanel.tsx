import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getSupabase } from "@/lib/backend/supabase";
import type { User } from "@/lib/domain/types";
import type { TeacherClass, TeacherEnrollment } from "@/lib/backend/teacher";

type CertificateRow = {
  id: string;
  certificate_number: string;
  student_name_snapshot: string;
  class_title_snapshot: string;
  status: "issued" | "revoked";
  issued_at: string;
};

export function CertificateManagementPanel({
  user,
  classInfo,
  enrollments,
}: {
  user: User;
  classInfo: TeacherClass | undefined;
  enrollments: TeacherEnrollment[];
}) {
  const [heading, setHeading] = useState("گواهی پایان دوره");
  const [body, setBody] = useState("بدین‌وسیله گواهی می‌شود که");
  const [signaturePath, setSignaturePath] = useState("");
  const [certificates, setCertificates] = useState<CertificateRow[]>([]);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState("");
  const [includeSignature, setIncludeSignature] = useState(true);
  const [completionConfirmed, setCompletionConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  const selectedEnrollment = useMemo(
    () => enrollments.find((item) => item.id === selectedEnrollmentId) ?? enrollments[0],
    [enrollments, selectedEnrollmentId],
  );

  const reload = async () => {
    const sb = getSupabase();
    if (!sb || !classInfo?.instituteId || !classInfo.id) return;
    const [settingsResult, signatureResult, certificateResult] = await Promise.all([
      sb.from("institute_certificate_settings")
        .select("certificate_heading,default_body")
        .eq("institute_id", classInfo.instituteId)
        .maybeSingle(),
      classInfo.teacherId
        ? sb.from("teacher_signatures").select("storage_path").eq("teacher_id", classInfo.teacherId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      sb.from("issued_certificates")
        .select("id,certificate_number,student_name_snapshot,class_title_snapshot,status,issued_at")
        .eq("class_id", classInfo.id)
        .order("issued_at", { ascending: false }),
    ]);
    if (settingsResult.error) throw new Error(settingsResult.error.message);
    if (signatureResult.error) throw new Error(signatureResult.error.message);
    if (certificateResult.error) throw new Error(certificateResult.error.message);
    setHeading(settingsResult.data?.certificate_heading ?? "گواهی پایان دوره");
    setBody(settingsResult.data?.default_body ?? "بدین‌وسیله گواهی می‌شود که");
    setSignaturePath(signatureResult.data?.storage_path ?? "");
    setCertificates((certificateResult.data ?? []) as CertificateRow[]);
    setSelectedEnrollmentId((current) =>
      enrollments.some((item) => item.id === current) ? current : enrollments[0]?.id ?? "",
    );
  };

  useEffect(() => {
    let active = true;
    void reload().catch((error) => {
      if (active) toast.error(error instanceof Error ? error.message : "دریافت گواهی‌ها انجام نشد.");
    });
    return () => { active = false; };
  }, [classInfo?.id, classInfo?.instituteId, classInfo?.teacherId, enrollments]);

  const saveSettings = async () => {
    const sb = getSupabase();
    if (!sb || !classInfo?.instituteId) return;
    if (heading.trim().length < 2 || heading.trim().length > 180 || body.trim().length < 2 || body.trim().length > 1000) {
      toast.error("عنوان یا متن سربرگ معتبر نیست.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await sb.from("institute_certificate_settings").upsert({
        institute_id: classInfo.instituteId,
        certificate_heading: heading.trim(),
        default_body: body.trim(),
        updated_by: user.id,
      }, { onConflict: "institute_id" });
      if (error) throw error;
      toast.success("سربرگ گواهی ذخیره شد.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ذخیره سربرگ انجام نشد.");
    } finally {
      setBusy(false);
    }
  };

  const uploadSignature = async (file?: File) => {
    const sb = getSupabase();
    if (!sb || !file || classInfo?.teacherId !== user.id || user.role !== "teacher") return;
    const extensionByType: Record<string, string> = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
    };
    const extension = extensionByType[file.type];
    if (!extension || file.size > 524288) {
      toast.error("فقط تصویر PNG، JPG یا WebP تا حجم ۵۱۲ کیلوبایت پذیرفته می‌شود.");
      return;
    }
    setBusy(true);
    try {
      const path = `${user.id}/signature/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await sb.storage.from("teacher-signatures").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) throw uploadError;
      const { error: pointerError } = await sb.from("teacher_signatures").upsert({
        teacher_id: user.id,
        storage_path: path,
      }, { onConflict: "teacher_id" });
      if (pointerError) throw pointerError;
      await reload();
      toast.success("امضای جدید ثبت شد. نسخه‌های قبلی دست‌نخورده باقی می‌مانند.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "بارگذاری امضا انجام نشد.");
    } finally {
      setBusy(false);
    }
  };

  const issue = async () => {
    const sb = getSupabase();
    if (!sb || !classInfo?.id || !selectedEnrollment || !completionConfirmed) return;
    setBusy(true);
    try {
      const { data, error } = await sb.rpc("issue_course_certificate", {
        p_enrollment_id: selectedEnrollment.id,
        p_completion_confirmed: true,
        p_include_signature: includeSignature,
      });
      if (error) throw error;
      await reload();
      const row = Array.isArray(data) ? data[0] : data;
      toast.success(row?.certificate_number
        ? `گواهی صادر شد: ${row.certificate_number}`
        : "گواهی صادر شد.");
      setCompletionConfirmed(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "صدور گواهی انجام نشد.");
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (certificate: CertificateRow) => {
    const sb = getSupabase();
    if (!sb || certificate.status !== "issued") return;
    if (!window.confirm(`گواهی ${certificate.certificate_number} باطل شود؟`)) return;
    const reason = window.prompt("علت ابطال (اختیاری):") ?? "";
    setBusy(true);
    try {
      const { error } = await sb.rpc("revoke_course_certificate", {
        p_certificate_id: certificate.id,
        p_reason: reason,
      });
      if (error) throw error;
      await reload();
      toast.success("گواهی باطل شد.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ابطال گواهی انجام نشد.");
    } finally {
      setBusy(false);
    }
  };

  if (!classInfo?.instituteId) {
    return <section className="rounded-2xl border bg-card p-5"><h2 className="font-extrabold">گواهی پایان دوره</h2><p className="mt-2 text-sm text-muted-foreground">این کلاس هنوز به مؤسسه‌ای متصل نیست؛ برای صدور گواهی باید ابتدا مؤسسهٔ کلاس مشخص باشد.</p></section>;
  }

  return <section className="rounded-2xl border bg-card p-5 space-y-4">
    <div>
      <h2 className="font-extrabold">گواهی پایان دوره</h2>
      <p className="mt-1 text-sm text-muted-foreground">صدور گواهی، تأیید رسمی استاد/مدیر دربارهٔ تکمیل دوره است. پایگاه داده دسترسی و عضویت را دوباره بررسی می‌کند.</p>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block text-sm"><span className="mb-1 block font-semibold">عنوان سربرگ</span><input value={heading} onChange={(event) => setHeading(event.target.value)} maxLength={180} className="w-full rounded-lg border bg-background px-3 py-2"/></label>
      <label className="block text-sm"><span className="mb-1 block font-semibold">متن گواهی</span><textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={1000} rows={2} className="w-full rounded-lg border bg-background px-3 py-2"/></label>
    </div>
    <button type="button" disabled={busy} onClick={() => void saveSettings()} className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50">ذخیره عنوان و متن</button>

    {classInfo.teacherId === user.id && user.role === "teacher" ? <div className="rounded-xl bg-muted/40 p-3">
      <label className="block text-sm font-semibold">تصویر امضای شخصی استاد</label>
      <p className="mt-1 text-xs text-muted-foreground">{signaturePath ? "امضای فعلی ثبت شده است. بارگذاری فایل جدید نسخهٔ تازه‌ای می‌سازد." : "هنوز امضایی ثبت نشده است."}</p>
      <input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={(event) => void uploadSignature(event.target.files?.[0])} className="mt-2 block w-full text-sm"/>
    </div> : <p className="text-xs text-muted-foreground">بارگذاری امضا فقط برای استادِ اختصاص‌یافته به همین کلاس فعال است.</p>}

    <div className="space-y-3 rounded-xl border p-3">
      <label className="block text-sm"><span className="mb-1 block font-semibold">دانش‌پژوه</span><select value={selectedEnrollment?.id ?? ""} onChange={(event) => setSelectedEnrollmentId(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2" disabled={!enrollments.length}><option value="">انتخاب ثبت‌نام</option>{enrollments.map((item) => <option key={item.id} value={item.id}>{item.studentName}</option>)}</select></label>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={completionConfirmed} onChange={(event) => setCompletionConfirmed(event.target.checked)} className="mt-1"/><span>تکمیل دوره و استحقاق دریافت گواهی را تأیید می‌کنم.</span></label>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={includeSignature} onChange={(event) => setIncludeSignature(event.target.checked)} className="mt-1"/><span>در صورت وجود، امضای استادِ همین کلاس روی گواهی ثبت شود.</span></label>
      <button type="button" disabled={busy || !selectedEnrollment || !completionConfirmed} onClick={() => void issue()} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50">صدور گواهی</button>
    </div>

    <div>
      <h3 className="font-bold">گواهی‌های صادرشده برای این کلاس</h3>
      {certificates.length ? <ul className="mt-2 divide-y">{certificates.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
        <div><b>{item.student_name_snapshot}</b><p className="mt-1 text-xs text-muted-foreground">{item.certificate_number} · {item.status === "issued" ? "صادرشده" : "باطل‌شده"}</p></div>
        {item.status === "issued" && <button type="button" disabled={busy} onClick={() => void revoke(item)} className="rounded-lg border px-3 py-2 text-xs font-semibold text-destructive disabled:opacity-50">ابطال</button>}
      </li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">هنوز گواهی‌ای برای این کلاس صادر نشده است.</p>}
    </div>
    <p className="text-xs text-muted-foreground">فعلاً صدور و ثبت امن گواهی آماده می‌شود؛ فایل PDF و دانلود نهایی پس از تکمیل بخش نمایش و چاپ اضافه خواهد شد.</p>
  </section>;
}
