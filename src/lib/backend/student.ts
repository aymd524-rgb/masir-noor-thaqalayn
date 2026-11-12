import type { SupabaseClient } from "@supabase/supabase-js";

export type StudentClass = { id: string; title: string; courseId: string | null; courseTitle: string; description: string | null; capacity: number | null; enrolledCount: number; remainingSeats: number | null };
export type StudentRequest = { id: string; classId: string; classTitle: string; courseTitle: string; status: "pending" | "approved" | "rejected"; createdAt: string };
export type StudentAttendance = { id: string; enrollmentId: string; sessionDate: string; status: "present" | "absent" | "late" | "excused" };
export type StudentGrade = { id: string; enrollmentId: string; title: string; score: number; createdAt: string };

function fail(error: { message: string } | null) { if (error) throw new Error(error.message); }

/** Student reads are scoped by Supabase RLS to auth.uid(); no privileged key is used. */
export async function loadStudentWorkspace(sb: SupabaseClient, userId: string) {
  const [courseResult, classResult, requestResult, enrollmentResult, availabilityResult] = await Promise.all([
    sb.from("courses").select("id,title,description").eq("is_active", true).order("created_at", { ascending: false }),
    sb.from("classes").select("id,title,course_id,description,capacity").eq("is_active", true).order("created_at", { ascending: false }),
    sb.from("enrollment_requests").select("id,class_id,status,created_at").eq("student_id", userId).order("created_at", { ascending: false }),
    sb.from("enrollments").select("id,class_id,created_at").eq("student_id", userId).order("created_at", { ascending: false }),
    sb.rpc("get_active_class_availability"),
  ]);
  fail(courseResult.error); fail(classResult.error); fail(requestResult.error); fail(enrollmentResult.error); fail(availabilityResult.error);
  const availability = new Map((availabilityResult.data ?? []).map((row) => [row.class_id, row]));
  const courses = new Map((courseResult.data ?? []).map((row) => [row.id, row.title]));
  const classes: StudentClass[] = (classResult.data ?? []).map((row) => ({
    id: row.id, title: row.title, courseId: row.course_id,
    courseTitle: row.course_id ? courses.get(row.course_id) ?? "دوره آموزشی" : "دوره آموزشی",
    description: row.description, capacity: row.capacity,
    enrolledCount: Number(availability.get(row.id)?.enrolled_count ?? 0),
    remainingSeats: availability.get(row.id)?.remaining_seats ?? null,
  }));
  const classMap = new Map(classes.map((row) => [row.id, row]));
  const requests: StudentRequest[] = (requestResult.data ?? []).map((row) => {
    const cls = classMap.get(row.class_id);
    return { id: row.id, classId: row.class_id, classTitle: cls?.title ?? "کلاس", courseTitle: cls?.courseTitle ?? "دوره", status: row.status, createdAt: row.created_at };
  });
  const enrollments = (enrollmentResult.data ?? []).map((row) => ({
    id: row.id, classId: row.class_id, classTitle: classMap.get(row.class_id)?.title ?? "کلاس",
    courseTitle: classMap.get(row.class_id)?.courseTitle ?? "دوره", createdAt: row.created_at,
  }));
  const enrollmentIds = enrollments.map((row) => row.id);
  const [attendanceResult, gradeResult] = await Promise.all([
    enrollmentIds.length ? sb.from("attendance").select("id,enrollment_id,session_date,status").in("enrollment_id", enrollmentIds) : Promise.resolve({ data: [], error: null }),
    enrollmentIds.length ? sb.from("grades").select("id,enrollment_id,title,score,created_at").in("enrollment_id", enrollmentIds) : Promise.resolve({ data: [], error: null }),
  ]);
  fail(attendanceResult.error); fail(gradeResult.error);
  const attendance: StudentAttendance[] = (attendanceResult.data ?? []).map((row) => ({
    id: row.id, enrollmentId: row.enrollment_id, sessionDate: row.session_date, status: row.status,
  }));
  const grades: StudentGrade[] = (gradeResult.data ?? []).map((row) => ({
    id: row.id, enrollmentId: row.enrollment_id, title: row.title, score: Number(row.score), createdAt: row.created_at,
  }));
  return { classes, requests, enrollments, attendance, grades };
}

/** RLS permits students to create only their own pending requests for active classes. */
export async function requestStudentEnrollment(sb: SupabaseClient, userId: string, classId: string) {
  const { data: existing, error: lookupError } = await sb.from("enrollment_requests")
    .select("id,status").eq("student_id", userId).eq("class_id", classId).eq("status", "pending").maybeSingle();
  fail(lookupError);
  if (existing) throw new Error("برای این کلاس درخواست در حال بررسی دارید.");
  const { data: enrolled, error: enrollmentError } = await sb.from("enrollments")
    .select("id").eq("student_id", userId).eq("class_id", classId).maybeSingle();
  fail(enrollmentError);
  if (enrolled) throw new Error("در این کلاس ثبت‌نام قطعی دارید.");
  const { error } = await sb.from("enrollment_requests").insert({
    student_id: userId, class_id: classId, status: "pending", payment_status: "pending",
  });
  fail(error);
}
