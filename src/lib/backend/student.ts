import type { SupabaseClient } from "@supabase/supabase-js";

export type StudentClass = { id: string; title: string; courseId: string | null; courseTitle: string; coursePrice: number; instituteId: string | null; instituteName: string; description: string | null; capacity: number | null; enrolledCount: number; remainingSeats: number | null };
export type StudentRequest = { id: string; classId: string; classTitle: string; courseTitle: string; status: "pending" | "approved" | "rejected"; createdAt: string };
export type StudentAttendance = { id: string; enrollmentId: string; sessionDate: string; status: "present" | "absent" | "late" | "excused" };
export type StudentGrade = { id: string; enrollmentId: string; title: string; score: number; createdAt: string };
export type StudentHifzAssignment = { id: string; enrollmentId: string; classTitle: string; surahNumber: number; ayahStart: number; ayahEnd: number; assignmentType: "memorization" | "review"; dueDate: string; instructions: string | null; status: "in_progress" | "completed" | "needs_help" | null; note: string | null };
export type StudentHifzRecord = { id: string; enrollmentId: string; surahNumber: number; ayahStart: number; ayahEnd: number; recordType: "memorization" | "review"; assessment: "excellent" | "good" | "fair" | "needs_practice"; sessionDate: string; notes: string | null };

/** Fail closed when the availability response is missing or malformed. Null means unlimited. */
export function assertClassHasAvailableSeat(remainingSeats: number | null | undefined) {
  if (remainingSeats === null) return;
  if (typeof remainingSeats !== "number" || !Number.isFinite(remainingSeats)) {
    throw new Error("ظرفیت کلاس در حال حاضر قابل بررسی نیست؛ دوباره تلاش کنید.");
  }
  if (remainingSeats <= 0) throw new Error("ظرفیت این کلاس تکمیل شده است.");
}

function fail(error: { message: string } | null) { if (error) throw new Error(error.message); }

async function readAllPages<T>(
  makeQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 500,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await makeQuery(from, from + pageSize - 1);
    fail(error);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

async function readRowsForIds<T>(
  makeQuery: (ids: string[]) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  ids: string[],
  chunkSize = 200,
): Promise<T[]> {
  const rows: T[] = [];
  for (let start = 0; start < ids.length; start += chunkSize) {
    const { data, error } = await makeQuery(ids.slice(start, start + chunkSize));
    fail(error);
    rows.push(...(data ?? []));
  }
  return rows;
}

/** Student reads are scoped by Supabase RLS to auth.uid(); no privileged key is used. */
export async function loadStudentWorkspace(sb: SupabaseClient, userId: string) {
  const [courseResult, classResult, requestResult, enrollmentResult, availabilityResult] = await Promise.all([
    readAllPages((from, to) => sb.from("courses").select("id,title,description,price").eq("is_active", true).order("created_at", { ascending: false }).range(from, to)),
    readAllPages((from, to) => sb.from("classes").select("id,title,course_id,description,capacity,institute_id").eq("is_active", true).order("created_at", { ascending: false }).range(from, to)),
    readAllPages((from, to) => sb.from("enrollment_requests").select("id,class_id,status,created_at").eq("student_id", userId).order("created_at", { ascending: false }).range(from, to)),
    readAllPages((from, to) => sb.from("enrollments").select("id,class_id,created_at").eq("student_id", userId).order("created_at", { ascending: false }).range(from, to)),
    sb.rpc("get_active_class_availability"),
  ]);
  fail(courseResult.error); fail(classResult.error); fail(requestResult.error); fail(enrollmentResult.error); fail(availabilityResult.error);
  const availability = new Map((availabilityResult.data ?? []).map((row) => [row.class_id, row]));
  const courses = new Map((courseResult.data ?? []).map((row) => [row.id, { title: row.title, price: Number(row.price ?? 0) }]));
  const instituteIds = [...new Set((classResult.data ?? []).map((row) => row.institute_id).filter((id): id is string => !!id))];
  const instituteResult = instituteIds.length
    ? await sb.from("institutions").select("id,name").in("id", instituteIds)
    : { data: [], error: null };
  fail(instituteResult.error);
  const instituteNames = new Map((instituteResult.data ?? []).map((row) => [row.id, row.name]));
  const classes: StudentClass[] = (classResult.data ?? []).map((row) => ({
    id: row.id, title: row.title, courseId: row.course_id,
    instituteId: row.institute_id, instituteName: row.institute_id ? instituteNames.get(row.institute_id) ?? "مؤسسه" : "بدون مؤسسه",
    courseTitle: row.course_id ? courses.get(row.course_id)?.title ?? "دوره آموزشی" : "دوره آموزشی",
    coursePrice: row.course_id ? courses.get(row.course_id)?.price ?? 0 : 0,
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
    courseTitle: classMap.get(row.class_id)?.courseTitle ?? "دوره",
    instituteId: classMap.get(row.class_id)?.instituteId ?? null,
    instituteName: classMap.get(row.class_id)?.instituteName ?? "مؤسسه",
    createdAt: row.created_at,
  }));
  const enrollmentIds = enrollments.map((row) => row.id);
  const [attendanceResult, gradeResult, hifzResult, assignmentResult] = await Promise.all([
    readRowsForIds((ids) => sb.from("attendance").select("id,enrollment_id,session_date,status").in("enrollment_id", ids), enrollmentIds),
    readRowsForIds((ids) => sb.from("grades").select("id,enrollment_id,title,score,created_at").in("enrollment_id", ids), enrollmentIds),
    readRowsForIds((ids) => sb.from("hifz_records").select("id,enrollment_id,surah_number,ayah_start,ayah_end,record_type,assessment,session_date,notes").in("enrollment_id", ids).order("session_date", { ascending: false }), enrollmentIds),
    readRowsForIds((ids) => sb.from("hifz_assignments").select("id,enrollment_id,surah_number,ayah_start,ayah_end,assignment_type,due_date,instructions").in("enrollment_id", ids).order("due_date", { ascending: true }), enrollmentIds),
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
  const completionRows = await readRowsForIds((ids) => sb.from("hifz_assignment_completions").select("assignment_id,status,note").in("assignment_id", ids).eq("student_id", userId), assignmentIds);
  const completionMap = new Map(completionRows.map((row) => [row.assignment_id, row]));
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
  // Match the supplied student ID to the authenticated session before any
  // institute or enrollment checks; RLS remains the database-level boundary.
  const { data: authData, error: authError } = await sb.auth.getUser();
  fail(authError);
  if (!authData.user || authData.user.id !== userId) {
    throw new Error("برای ارسال درخواست ثبت‌نام باید با حساب دانش‌پژوه خود وارد شوید.");
  }
  const { data: targetClass, error: classError } = await sb.from("classes")
    .select("course_id,institute_id").eq("id", classId).eq("is_active", true).maybeSingle();
  fail(classError);
  if (!targetClass?.institute_id) throw new Error("این کلاس فعال نیست یا به مؤسسه‌ای اختصاص ندارد.");

  // Guard the selected institute again at the point of enrollment so a stale
  // page or copied class link cannot submit a request to another institute.
  const { data: preference, error: preferenceError } = await sb
    .from("user_institute_preferences").select("institute_id").eq("user_id", userId).maybeSingle();
  fail(preferenceError);
  if (preference?.institute_id !== targetClass.institute_id) {
    throw new Error("این کلاس متعلق به مؤسسهٔ فعال شما نیست؛ ابتدا مؤسسهٔ درست را انتخاب کنید.");
  }
  const { data: activeMembership, error: membershipError } = await sb
    .from("institute_memberships").select("id").eq("user_id", userId)
    .eq("institute_id", targetClass.institute_id).eq("status", "active").maybeSingle();
  fail(membershipError);
  if (!activeMembership) throw new Error("برای ثبت‌نام در این کلاس باید عضویت فعال همین مؤسسه را داشته باشید.");
  // Refresh seat availability immediately before submitting; database policies must also enforce capacity atomically.
  const { data: availabilityRows, error: availabilityError } = await sb.rpc("get_active_class_availability");
  fail(availabilityError);
  const availability = (availabilityRows ?? []).find((row) => row.class_id === classId);
  if (!availability) throw new Error("ظرفیت کلاس در حال حاضر قابل بررسی نیست؛ دوباره تلاش کنید.");
  assertClassHasAvailableSeat(availability.remaining_seats);
  if (targetClass.course_id) {
    const { data: course, error: courseError } = await sb.from("courses")
      .select("price").eq("id", targetClass.course_id).eq("is_active", true).maybeSingle();
    fail(courseError);
    if (!course) throw new Error("دوره این کلاس فعال نیست یا پیدا نشد.");
    if (Number(course.price ?? 0) > 0) throw new Error("این دوره شهریه دارد؛ تا فعال‌شدن درگاه پرداخت، درخواست ثبت‌نام آنلاین ممکن نیست.");
  }
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
