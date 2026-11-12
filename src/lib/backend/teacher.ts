import type { SupabaseClient } from "@supabase/supabase-js";
import { validateAttendanceInput, validateGradeInput } from "./validation";

export type TeacherClass = {
  id: string;
  title: string;
  courseId: string | null;
  teacherId: string | null;
  description: string | null;
  capacity: number | null;
};
export type TeacherEnrollment = {
  id: string;
  classId: string;
  studentId: string;
  studentName: string;
  createdAt: string;
};
export type TeacherAttendance = {
  id: string;
  enrollmentId: string;
  sessionDate: string;
  status: "present" | "absent" | "late" | "excused";
};
export type TeacherGrade = {
  id: string;
  enrollmentId: string;
  title: string;
  score: number;
  createdAt: string;
};
export type TeacherRequest = {
  id: string;
  classId: string;
  studentId: string;
  studentName: string;
  status: "pending" | "approved" | "rejected";
  paymentStatus: "pending" | "paid" | "waived" | "failed";
  createdAt: string;
};

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

/**
 * Reads only rows the current user is allowed to see. Database RLS is the
 * authority; this helper does not use privileged keys or bypass policies.
 */
export async function loadTeacherWorkspace(sb: SupabaseClient, userId: string, isAdmin: boolean) {
  let classQuery = sb
    .from("classes")
    .select("id,title,course_id,teacher_id,description,capacity")
    .eq("is_active", true);
  if (!isAdmin) classQuery = classQuery.eq("teacher_id", userId);

  const { data: classRows, error: classError } = await classQuery.order("created_at", { ascending: false });
  fail(classError);
  const classes: TeacherClass[] = (classRows ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    courseId: row.course_id,
    teacherId: row.teacher_id,
    description: row.description,
    capacity: row.capacity,
  }));
  const classIds = classes.map((item) => item.id);
  if (!classIds.length) {
    return { classes, enrollments: [] as TeacherEnrollment[], attendance: [] as TeacherAttendance[], grades: [] as TeacherGrade[], requests: [] as TeacherRequest[] };
  }

  const [enrollmentResult, requestResult] = await Promise.all([
    sb.from("enrollments").select("id,class_id,student_id,created_at").in("class_id", classIds),
    sb.from("enrollment_requests").select("id,class_id,student_id,status,payment_status,created_at").in("class_id", classIds).eq("status", "pending"),
  ]);
  fail(enrollmentResult.error);
  fail(requestResult.error);

  const enrollmentRows = enrollmentResult.data ?? [];
  const studentIds = [...new Set([
    ...enrollmentRows.map((row) => row.student_id),
    ...(requestResult.data ?? []).map((row) => row.student_id),
  ])];
  const enrollmentIds = enrollmentRows.map((row) => row.id);

  const [profileResult, attendanceResult, gradeResult] = await Promise.all([
    studentIds.length
      ? sb.from("profiles").select("id,full_name").in("id", studentIds)
      : Promise.resolve({ data: [], error: null }),
    enrollmentIds.length
      ? sb.from("attendance").select("id,enrollment_id,session_date,status").in("enrollment_id", enrollmentIds)
      : Promise.resolve({ data: [], error: null }),
    enrollmentIds.length
      ? sb.from("grades").select("id,enrollment_id,title,score,created_at").in("enrollment_id", enrollmentIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  fail(profileResult.error);
  fail(attendanceResult.error);
  fail(gradeResult.error);

  const names = new Map((profileResult.data ?? []).map((profile) => [profile.id, profile.full_name || "دانش‌پژوه"]));
  const enrollments: TeacherEnrollment[] = enrollmentRows.map((row) => ({
    id: row.id,
    classId: row.class_id,
    studentId: row.student_id,
    studentName: names.get(row.student_id) ?? "دانش‌پژوه",
    createdAt: row.created_at,
  }));
  const requests: TeacherRequest[] = (requestResult.data ?? []).map((row) => ({
    id: row.id,
    classId: row.class_id,
    studentId: row.student_id,
    studentName: names.get(row.student_id) ?? "دانش‌پژوه",
    status: row.status,
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
  }));
  const attendance: TeacherAttendance[] = (attendanceResult.data ?? []).map((row) => ({
    id: row.id,
    enrollmentId: row.enrollment_id,
    sessionDate: row.session_date,
    status: row.status,
  }));
  const grades: TeacherGrade[] = (gradeResult.data ?? []).map((row) => ({
    id: row.id,
    enrollmentId: row.enrollment_id,
    title: row.title,
    score: Number(row.score),
    createdAt: row.created_at,
  }));
  return { classes, enrollments, attendance, grades, requests };
}

export async function saveTeacherAttendance(
  sb: SupabaseClient,
  input: { enrollmentId: string; sessionDate: string; status: TeacherAttendance["status"] },
) {
  validateAttendanceInput(input);
  const { data: existing, error: findError } = await sb
    .from("attendance")
    .select("id")
    .eq("enrollment_id", input.enrollmentId)
    .eq("session_date", input.sessionDate)
    .maybeSingle();
  fail(findError);
  if (existing?.id) {
    const { error } = await sb.from("attendance").update({ status: input.status }).eq("id", existing.id);
    fail(error);
    return;
  }
  const { error } = await sb.from("attendance").insert({
    enrollment_id: input.enrollmentId,
    session_date: input.sessionDate,
    status: input.status,
  });
  fail(error);
}

export async function saveTeacherGrade(
  sb: SupabaseClient,
  input: { enrollmentId: string; title: string; score: number },
) {
  validateGradeInput(input);
  const { error } = await sb.from("grades").insert({
    enrollment_id: input.enrollmentId,
    title: input.title.trim(),
    score: input.score,
  });
  fail(error);
}
