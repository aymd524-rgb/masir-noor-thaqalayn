import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getSupabase } from "@/lib/backend/supabase";
import type { User } from "@/lib/domain/types";

type StudentCertificate = {
  id: string;
  certificate_number: string;
  student_name_snapshot: string;
  class_title_snapshot: string;
  heading_snapshot: string;
  body_snapshot: string;
  signature_storage_path_snapshot: string | null;
  status: "issued" | "revoked";
  issued_at: string;
};

function escapeHtml(value: string) {
  const replacements: Record<string, string> = {
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (char) => replacements[char] ?? char);
}

export function StudentCertificatesPanel({ user }: { user: User }) {
  const [certificates, setCertificates] = useState<StudentCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      const sb = getSupabase();
      if (!sb) throw new Error("اتصال پایگاه داده در دسترس نیست.");
      const { data, error } = await sb.from("issued_certificates")
        .select("id,certificate_number,student_name_snapshot,class_title_snapshot,heading_snapshot,body_snapshot,signature_storage_path_snapshot,status,issued_at")
        .eq("student_id", user.id)
        .order("issued_at", { ascending: false });
      if (error) throw error;
      if (active) setCertificates((data ?? []) as StudentCertificate[]);
    };
    void load().catch((error) => {
      if (active) toast.error(error instanceof Error ? error.message : "گواهی‌ها بارگذاری نشدند.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user.id]);

  const printCertificate = async (certificate: StudentCertificate) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("پنجرهٔ چاپ باز نشد؛ اجازهٔ بازشدن پنجره را برای این صفحه بررسی کنید.");
      return;
    }
    setBusyId(certificate.id);
    try {
      let signatureUrl = "";
      if (certificate.status === "issued" && certificate.signature_storage_path_snapshot) {
        const sb = getSupabase();
        if (!sb) throw new Error("اتصال پایگاه داده در دسترس نیست.");
        const { data, error } = await sb.storage.from("teacher-signatures")
          .createSignedUrl(certificate.signature_storage_path_snapshot, 120);
        if (error) throw error;
        signatureUrl = data.signedUrl;
      }
      const dateText = new Date(certificate.issued_at).toLocaleDateString("fa-IR");
      const statusText = certificate.status === "issued" ? "گواهی معتبر و صادرشده" : "این گواهی باطل شده است";
      const signatureMarkup = signatureUrl
        ? `<div class="signature"><img src="${escapeHtml(signatureUrl)}" alt="امضای استاد"><p>امضای استاد</p></div>`
        : "";
      const html = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(certificate.heading_snapshot)}</title>
<style>
@page{size:A4;margin:16mm}
*{box-sizing:border-box}
body{margin:0;font-family:"Noto Naskh Arabic","Noto Sans Arabic",Tahoma,serif;color:#172033}
.sheet{min-height:255mm;border:5px double #b79a52;padding:18mm 14mm;position:relative;text-align:center}
h1{font-size:28px;margin:0 0 22px}
.rule{height:1px;background:#b79a52;margin:14px 0 28px}
.body{font-size:20px;line-height:2.1;margin:24px 0}
.name{font-size:28px;font-weight:700;margin:14px 0}
.class{font-size:22px;font-weight:600;margin:16px 0}
.status{font-size:14px;margin-top:24px;color:${certificate.status === "issued" ? "#26734d" : "#b42318"};font-weight:700}
.footer{display:flex;justify-content:space-between;align-items:end;margin-top:40px;font-size:14px}
.signature img{max-width:160px;max-height:75px;object-fit:contain}
.number{font-size:12px;color:#555;margin-top:16px}
@media screen{body{background:#f1f2f5;padding:20px}.sheet{background:white;max-width:210mm;margin:auto}}
</style>
</head>
<body>
<main class="sheet">
<h1>${escapeHtml(certificate.heading_snapshot)}</h1>
<div class="rule"></div>
<p class="body">${escapeHtml(certificate.body_snapshot)}</p>
<p class="name">${escapeHtml(certificate.student_name_snapshot)}</p>
<p>با موفقیت دورهٔ آموزشی زیر را به پایان رسانده است:</p>
<p class="class">${escapeHtml(certificate.class_title_snapshot)}</p>
<p class="status">${statusText}</p>
<div class="footer"><div><p>تاریخ صدور</p><b>${escapeHtml(dateText)}</b></div>${signatureMarkup}</div>
<p class="number">شمارهٔ گواهی: ${escapeHtml(certificate.certificate_number)}</p>
</main>

</body>
</html>`;
      const printDocument = printWindow.document;
      printDocument.open();
      printDocument.write(html);
      printDocument.close();

      const printWhenReady = () => {
        void printDocument.fonts.ready
          .then(() => printWindow.print())
          .catch(() => printWindow.print());
      };
      const signatureImage = printDocument.querySelector("img");
      if (signatureImage && !signatureImage.complete) {
        signatureImage.addEventListener("load", printWhenReady, { once: true });
        signatureImage.addEventListener("error", printWhenReady, { once: true });
      } else {
        printWhenReady();
      }
    } catch (error) {
      printWindow.close();
      toast.error(error instanceof Error ? error.message : "آماده‌سازی گواهی برای چاپ انجام نشد.");
    } finally {
      setBusyId("");
    }
  };

  return <section className="rounded-2xl border bg-card p-5">
    <h2 className="font-extrabold">گواهی‌های پایان دوره</h2>
    {loading ? <p className="mt-3 text-sm text-muted-foreground">در حال دریافت گواهی‌ها…</p>
      : certificates.length ? <ul className="mt-3 divide-y">{certificates.map((certificate) => <li key={certificate.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div><b>{certificate.class_title_snapshot}</b><p className="mt-1 text-xs text-muted-foreground">{certificate.certificate_number} · {certificate.status === "issued" ? "معتبر" : "باطل‌شده"}</p></div>
        <button type="button" disabled={busyId === certificate.id} onClick={() => void printCertificate(certificate)} className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50">{busyId === certificate.id ? "آماده‌سازی…" : certificate.status === "issued" ? "چاپ / ذخیره PDF" : "چاپ نسخهٔ باطل‌شده"}</button>
      </li>)}</ul>
      : <p className="mt-3 text-sm text-muted-foreground">هنوز گواهی پایان دوره‌ای برای حساب شما صادر نشده است.</p>}
    <p className="mt-2 text-xs text-muted-foreground">برای ذخیره به‌صورت PDF، در پنجرهٔ چاپ مرورگر گزینهٔ «ذخیره به‌صورت PDF» را انتخاب کنید.</p>
  </section>;
}
