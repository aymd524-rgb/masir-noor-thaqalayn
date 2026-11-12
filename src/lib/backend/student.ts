import type { SupabaseClient } from "@supabase/supabase-js";

export type StudentClass = { id: string; title: string; courseId: string | null; courseTitle: string; description: string | null; capacity: number | null; enrolledCount: number; remainingSeats: number | null };
export type StudentRequest = { id: string; classId: string; classTitle: string; courseTitle: string; status: "pending" | "approved" | "rejected"; createdAt: string };
export type StudentAttendance = { id: string; enrollmentId: string; sessionDate: string; status: "present" | "absent" | "late" | "excused" };
export type StudentGrade = { id: string; enrollmentId: string; title: string; score: number; createdAt: string };
export type StudentHifzAssignment = { id: string; enrollmentId: string; classTitle: string; surahNumber: number; ayahStart: number; ayahEnd: number; assignmentType: "memorization" | "review"; dueDate: string; instructions: string | null; status: "in_progress" | "completed" | "needs_help" | null; note: string | null };
export type StudentHifzRecord = { id: string; enrollmentId: string; surahNumber: number; ayahStart: number; ayahEnd: number; recordType: "memorization" | "review"; assessment: "excellent" | "good" | "fair" | "needs_practice"; sessionDate: string; notes: string | null };

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
  const [attendanceResult, gradeResult, hifzResult, assignmentResult] = await Promise.all([
    enrollmentIds.length ? sb.from("attendance").select("id,enrollment_id,session_date,status").in("enrollment_id", enrollmentIds) : Promise.resolve({ data: [], error: null }),
    enrollmentIds.length ? sb.from("grades").select("id,enrollment_id,title,score,created_at").in("enrollment_id", enrollmentIds) : Promise.resolve({ data: [], error: null }),
    enrollmentIds.length ? sb.from("hifz_records").select("id,enrollment_id,surah_number,ayah_start,ayah_end,record_type,assessment,session_date,notes").in("enrollment_id", enrollmentIds).order("session_date", { ascending: false }) : Promise.resolve({ data: [], error: null }),
  ]);
  fail(attendanceResult.error); fail(gradeResult.error); fail(hifzResult.error); fail(assignmentResult.error);
  const attendance: StudentAttendance[] = (attendanceResult.data ?? []).map((row) => ({
    id: row.id, enrollmentId: row.enrollment_id, sessionDate: row.session_date, status: row.status,
  }));
  const grades: StudentGrade[] = (gradeResult.data ?? []).map((row) => ({
    id: row.id, enrollmentId: row.enrollment_id, title: row.title, score: Number(row.score), createdAt: row.created_at,
  }));
  const hifzRecords: StudentHifzRecord[] = (hifzResult.data ?? []).map((row) => ({
    id: row.id, enrollmentId: row.enrollment_id, surahNumber: row.surah_number,
    ayahStart: row.ayah_start, ayahEnd: row.ayah_end, recordType: row.record_type,
    assessment: row.assessment, sessionDate: row.session_date, notes: row.notes,
  }));
  const assignmentRows = assignmentResult.data ?? [];
  const assignmentIds = assignmentRows.map((row) => row.id);
  const completionResult = assignmentIds.length
    ? await sb.from("hifz_assignment_completions").select("assignment_id,status,note").in("assignment_id", assignmentIds).eq("student_id", userId)
    : { data: [], error: null };
  fail(completionResult.error);
  const completionMap = new Map((completionResult.data ?? []).map((row) => [row.assignment_id, row]));
  const enrollmentById = new Map(enrollments.map((row) => [row.id, row]));
  const hifzAssignments: StudentHifzAssignment[] = assignmentRows.map((row) => {
    const completion = completionMap.get(row.id);
    return {
      id: row.id, enrollmentId: row.enrollment_id,
      classTitle: enrollmentById.get(row.enrollment_id)?.classTitle ?? "کلاس",
      surahNumber: row.surah_number, ayahStart: row.ayah_start, ayahEnd: row.ayah_end,
      assignmentType: row.assignment_type, dueDate: row.due_date, instructions: row.instructions,
      status: completion?.status ?? null, note: completion?.note ?? null,
    };
  });
  return { classes, requests, enrollments, attendance, grades, hifzRecords, hifzAssignments };
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


export async function saveStudentHifzAssignmentStatus(
  sb: SupabaseClient,
  input: { assignmentId: string; studentId: string; status: "in_progress" | "completed" | "needs_help"; note: string },
) {
  if (!input.assignmentId || !input.studentId || input.note.length > 1000) throw new Error("اطلاعات وضعیت برنامه معتبر نیست.");
  const { data: existing, error: lookupError } = await sb.from("hifz_assignment_completions")
    .select("id").eq("assignment_id", input.assignmentId).eq("student_id", input.studentId).maybeSingle();
  fail(lookupError);
  if (existing?.id) {
    const { error } = await sb.from("hifz_assignment_completions").update({
      status: input.status, submitted_at: input.status === "completed" ? new Date().toISOString() : null,
      note: input.note.trim() || null,
    }).eq("id", existing.id);
    fail(error);
    return;
  }
  const { error } = await sb.from("hifz_assignment_completions").insert({
    assignment_id: input.assignmentId, student_id: input.studentId, status: input.status,
    submitted_at: input.status === "completed" ? new Date().toISOString() : null, note: input.note.trim() || null,
  });
  fail(error);
}
