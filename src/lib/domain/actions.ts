/**
 * Pure domain operations. Every mutation takes the acting user and enforces
 * role rules here, so the UI can never perform an operation the actor is not
 * allowed to do. When a real backend is connected, the same rules must also be
 * enforced by row-level security on the server — client checks are not security.
 */
import type {
  AttendanceStatus,
  ContentItem,
  Course,
  Db,
  EnrollmentStatus,
  Lesson,
  Material,
  Quiz,
  Role,
  User,
} from "./types";

export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppError";
  }
}

export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const nowIso = () => new Date().toISOString();

function requireActive(actor: User | null | undefined): asserts actor is User {
  if (!actor) throw new AppError("برای این کار ابتدا وارد حساب کاربری شوید.");
  if (!actor.active) throw new AppError("حساب کاربری شما غیرفعال است.");
}

function requireRole(actor: User | null | undefined, roles: Role[]): asserts actor is User {
  requireActive(actor);
  if (!roles.includes(actor.role)) throw new AppError("شما اجازه انجام این کار را ندارید.");
}

function getCourse(db: Db, courseId: string): Course {
  const c = db.courses.find((x) => x.id === courseId);
  if (!c) throw new AppError("دوره موردنظر یافت نشد.");
  return c;
}

/** Admin, or the teacher who owns the course. */
export function canManageCourse(actor: User | null | undefined, course: Course): boolean {
  if (!actor || !actor.active) return false;
  if (actor.role === "admin") return true;
  return actor.role === "teacher" && course.teacherId === actor.id;
}

function requireCourseManager(db: Db, actor: User | null | undefined, courseId: string): Course {
  requireActive(actor);
  const course = getCourse(db, courseId);
  if (!canManageCourse(actor, course)) throw new AppError("فقط استاد همین دوره یا مدیر سامانه مجاز است.");
  return course;
}

function requireApprovedStudent(db: Db, courseId: string, studentId: string) {
  const ok = db.enrollments.some(
    (e) => e.courseId === courseId && e.studentId === studentId && e.status === "approved",
  );
  if (!ok) throw new AppError("این دانش‌پژوه در دوره ثبت‌نام قطعی ندارد.");
}

export function approvedCount(db: Db, courseId: string) {
  return db.enrollments.filter((e) => e.courseId === courseId && e.status === "approved").length;
}

// ---------- Users ----------

export function registerStudent(
  db: Db,
  input: { fullName: string; email: string; password: string },
): { db: Db; user: User } {
  const email = input.email.trim().toLowerCase();
  if (db.users.some((u) => u.email.toLowerCase() === email))
    throw new AppError("این ایمیل قبلاً ثبت شده است.");
  if (input.password.length < 8) throw new AppError("رمز عبور باید حداقل ۸ نویسه باشد.");
  // Self sign-up always creates a student. Roles are only granted by an admin.
  const user: User = {
    id: uid("u"),
    fullName: input.fullName.trim(),
    email,
    role: "student",
    active: true,
    joinedAt: nowIso(),
  };
  return {
    user,
    db: {
      ...db,
      users: [...db.users, user],
      demoCredentials: { ...db.demoCredentials, [email]: input.password },
    },
  };
}

/** Mirror an identity verified by the real backend into the local cache. */
export function upsertVerifiedUser(db: Db, user: User): Db {
  const exists = db.users.some((u) => u.id === user.id);
  return {
    ...db,
    users: exists ? db.users.map((u) => (u.id === user.id ? { ...u, ...user } : u)) : [...db.users, user],
  };
}

export function updateOwnProfile(
  db: Db,
  actor: User | null,
  patch: Pick<User, "fullName"> & Partial<Pick<User, "phone" | "bio" | "city">>,
): Db {
  requireActive(actor);
  if (!patch.fullName.trim()) throw new AppError("نام و نام خانوادگی الزامی است.");
  return {
    ...db,
    users: db.users.map((u) =>
      u.id === actor.id
        ? { ...u, fullName: patch.fullName.trim(), phone: patch.phone, bio: patch.bio, city: patch.city }
        : u,
    ),
  };
}

export function setUserRole(db: Db, actor: User | null, userId: string, role: Role): Db {
  requireRole(actor, ["admin"]);
  if (userId === actor.id) throw new AppError("مدیر نمی‌تواند نقش خودش را تغییر دهد.");
  return { ...db, users: db.users.map((u) => (u.id === userId ? { ...u, role } : u)) };
}

export function setUserActive(db: Db, actor: User | null, userId: string, active: boolean): Db {
  requireRole(actor, ["admin"]);
  if (userId === actor.id) throw new AppError("نمی‌توانید حساب خودتان را غیرفعال کنید.");
  return { ...db, users: db.users.map((u) => (u.id === userId ? { ...u, active } : u)) };
}

// ---------- Courses ----------

export type CourseInput = Omit<Course, "id" | "createdAt" | "teacherId"> & { teacherId?: string };

export function createCourse(db: Db, actor: User | null, input: CourseInput): { db: Db; course: Course } {
  requireRole(actor, ["teacher", "admin"]);
  if (!input.title.trim()) throw new AppError("عنوان دوره الزامی است.");
  if (input.capacity < 1) throw new AppError("ظرفیت باید حداقل ۱ نفر باشد.");
  let teacherId = actor.id;
  if (actor.role === "admin") {
    const t = db.users.find((u) => u.id === input.teacherId && u.role === "teacher");
    if (!t) throw new AppError("لطفاً استاد دوره را انتخاب کنید.");
    teacherId = t.id;
  }
  const course: Course = { ...input, title: input.title.trim(), teacherId, id: uid("c"), createdAt: nowIso() };
  return { course, db: { ...db, courses: [...db.courses, course] } };
}

export function updateCourse(db: Db, actor: User | null, courseId: string, patch: Partial<CourseInput>): Db {
  const course = requireCourseManager(db, actor, courseId);
  const next: Course = { ...course, ...patch, teacherId: course.teacherId };
  if (patch.teacherId && patch.teacherId !== course.teacherId) {
    if (actor!.role !== "admin") throw new AppError("فقط مدیر می‌تواند استاد دوره را تغییر دهد.");
    if (!db.users.some((u) => u.id === patch.teacherId && u.role === "teacher"))
      throw new AppError("استاد انتخاب‌شده معتبر نیست.");
    next.teacherId = patch.teacherId;
  }
  return { ...db, courses: db.courses.map((c) => (c.id === courseId ? next : c)) };
}

export function deleteCourse(db: Db, actor: User | null, courseId: string): Db {
  requireRole(actor, ["admin"]);
  getCourse(db, courseId);
  const keep = <T extends { courseId?: string }>(arr: T[]) => arr.filter((x) => x.courseId !== courseId);
  return {
    ...db,
    courses: db.courses.filter((c) => c.id !== courseId),
    lessons: keep(db.lessons),
    materials: keep(db.materials),
    enrollments: keep(db.enrollments),
    attendance: keep(db.attendance),
    grades: keep(db.grades),
    certificates: keep(db.certificates),
    quizzes: db.quizzes.map((q) => (q.courseId === courseId ? { ...q, courseId: undefined } : q)),
  };
}

// ---------- Lessons & materials ----------

export function addLesson(db: Db, actor: User | null, input: Omit<Lesson, "id" | "order">): Db {
  requireCourseManager(db, actor, input.courseId);
  if (!input.title.trim()) throw new AppError("عنوان جلسه الزامی است.");
  const order = db.lessons.filter((l) => l.courseId === input.courseId).length + 1;
  return { ...db, lessons: [...db.lessons, { ...input, id: uid("l"), order }] };
}

export function deleteLesson(db: Db, actor: User | null, lessonId: string): Db {
  const lesson = db.lessons.find((l) => l.id === lessonId);
  if (!lesson) throw new AppError("جلسه یافت نشد.");
  requireCourseManager(db, actor, lesson.courseId);
  return {
    ...db,
    lessons: db.lessons.filter((l) => l.id !== lessonId),
    attendance: db.attendance.filter((a) => a.lessonId !== lessonId),
  };
}

export function addMaterial(
  db: Db,
  actor: User | null,
  input: Omit<Material, "id" | "uploadedAt" | "uploadedBy">,
): Db {
  requireCourseManager(db, actor, input.courseId);
  if (!input.title.trim()) throw new AppError("عنوان محتوا الزامی است.");
  if (!input.fileName && !input.url) throw new AppError("یک فایل انتخاب کنید یا پیوند وارد کنید.");
  return {
    ...db,
    materials: [...db.materials, { ...input, id: uid("m"), uploadedAt: nowIso(), uploadedBy: actor!.id }],
  };
}

export function deleteMaterial(db: Db, actor: User | null, materialId: string): Db {
  const m = db.materials.find((x) => x.id === materialId);
  if (!m) throw new AppError("محتوا یافت نشد.");
  requireCourseManager(db, actor, m.courseId);
  return { ...db, materials: db.materials.filter((x) => x.id !== materialId) };
}

// ---------- Enrollment ----------

export function requestEnrollment(db: Db, actor: User | null, courseId: string, note?: string): Db {
  requireRole(actor, ["student"]);
  const course = getCourse(db, courseId);
  if (!course.published) throw new AppError("ثبت‌نام این دوره هنوز باز نشده است.");
  const existing = db.enrollments.find(
    (e) => e.courseId === courseId && e.studentId === actor.id && e.status !== "rejected",
  );
  if (existing) throw new AppError("شما قبلاً برای این دوره درخواست داده‌اید.");
  if (approvedCount(db, courseId) >= course.capacity) throw new AppError("ظرفیت این دوره تکمیل است.");
  return {
    ...db,
    enrollments: [
      ...db.enrollments,
      { id: uid("e"), courseId, studentId: actor.id, status: "pending", requestedAt: nowIso(), progress: 0, note },
    ],
  };
}

export function decideEnrollment(
  db: Db,
  actor: User | null,
  enrollmentId: string,
  status: EnrollmentStatus,
  note?: string,
): Db {
  const enr = db.enrollments.find((e) => e.id === enrollmentId);
  if (!enr) throw new AppError("درخواست ثبت‌نام یافت نشد.");
  const course = requireCourseManager(db, actor, enr.courseId);
  if (status === "approved" && enr.status !== "approved" && approvedCount(db, course.id) >= course.capacity)
    throw new AppError("ظرفیت دوره تکمیل است.");
  return {
    ...db,
    enrollments: db.enrollments.map((e) =>
      e.id === enrollmentId ? { ...e, status, decidedAt: nowIso(), note: note ?? e.note } : e,
    ),
  };
}

export function setProgress(db: Db, actor: User | null, enrollmentId: string, progress: number): Db {
  const enr = db.enrollments.find((e) => e.id === enrollmentId);
  if (!enr) throw new AppError("ثبت‌نام یافت نشد.");
  requireCourseManager(db, actor, enr.courseId);
  const p = Math.max(0, Math.min(100, Math.round(progress)));
  return { ...db, enrollments: db.enrollments.map((e) => (e.id === enrollmentId ? { ...e, progress: p } : e)) };
}

// ---------- Attendance & grades ----------

export function recordAttendance(
  db: Db,
  actor: User | null,
  lessonId: string,
  studentId: string,
  status: AttendanceStatus,
): Db {
  const lesson = db.lessons.find((l) => l.id === lessonId);
  if (!lesson) throw new AppError("جلسه یافت نشد.");
  requireCourseManager(db, actor, lesson.courseId);
  requireApprovedStudent(db, lesson.courseId, studentId);
  const existing = db.attendance.find((a) => a.lessonId === lessonId && a.studentId === studentId);
  return {
    ...db,
    attendance: existing
      ? db.attendance.map((a) => (a.id === existing.id ? { ...a, status } : a))
      : [...db.attendance, { id: uid("a"), courseId: lesson.courseId, lessonId, studentId, status }],
  };
}

export function addGrade(
  db: Db,
  actor: User | null,
  input: { courseId: string; studentId: string; title: string; score: number; max: number },
): Db {
  requireCourseManager(db, actor, input.courseId);
  requireApprovedStudent(db, input.courseId, input.studentId);
  if (!input.title.trim()) throw new AppError("عنوان ارزشیابی الزامی است.");
  if (!(input.max > 0)) throw new AppError("نمره کل باید بزرگ‌تر از صفر باشد.");
  if (input.score < 0 || input.score > input.max) throw new AppError("نمره باید بین صفر و نمره کل باشد.");
  return { ...db, grades: [...db.grades, { ...input, id: uid("g"), date: nowIso() }] };
}

export function deleteGrade(db: Db, actor: User | null, gradeId: string): Db {
  const g = db.grades.find((x) => x.id === gradeId);
  if (!g) throw new AppError("نمره یافت نشد.");
  requireCourseManager(db, actor, g.courseId);
  return { ...db, grades: db.grades.filter((x) => x.id !== gradeId) };
}

export function issueCertificate(db: Db, actor: User | null, enrollmentId: string): Db {
  const enr = db.enrollments.find((e) => e.id === enrollmentId);
  if (!enr) throw new AppError("ثبت‌نام یافت نشد.");
  requireCourseManager(db, actor, enr.courseId);
  if (enr.status !== "approved") throw new AppError("فقط برای ثبت‌نام‌های قطعی گواهی صادر می‌شود.");
  if (db.certificates.some((c) => c.courseId === enr.courseId && c.studentId === enr.studentId))
    throw new AppError("گواهی این دوره قبلاً صادر شده است.");
  const code = `MNS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  return {
    ...db,
    certificates: [
      ...db.certificates,
      { id: uid("cert"), courseId: enr.courseId, studentId: enr.studentId, issuedAt: nowIso(), code },
    ],
    enrollments: db.enrollments.map((e) => (e.id === enrollmentId ? { ...e, progress: 100 } : e)),
  };
}

// ---------- Quizzes ----------

export function createQuiz(db: Db, actor: User | null, input: Omit<Quiz, "id" | "createdBy" | "createdAt">): Db {
  requireRole(actor, ["teacher", "admin"]);
  if (!input.title.trim()) throw new AppError("عنوان آزمون الزامی است.");
  if (input.courseId) requireCourseManager(db, actor, input.courseId);
  if (input.questions.length === 0) throw new AppError("حداقل یک پرسش اضافه کنید.");
  for (const q of input.questions) {
    if (!q.text.trim()) throw new AppError("متن همه پرسش‌ها را وارد کنید.");
    if (q.options.length < 2 || q.options.some((o) => !o.trim()))
      throw new AppError("هر پرسش باید حداقل دو گزینه کامل داشته باشد.");
    if (q.answerIndex < 0 || q.answerIndex >= q.options.length) throw new AppError("پاسخ صحیح را مشخص کنید.");
  }
  return {
    ...db,
    quizzes: [...db.quizzes, { ...input, id: uid("q"), createdBy: actor.id, createdAt: nowIso() }],
  };
}

export function setQuizOpen(db: Db, actor: User | null, quizId: string, open: boolean): Db {
  requireRole(actor, ["teacher", "admin"]);
  const quiz = db.quizzes.find((q) => q.id === quizId);
  if (!quiz) throw new AppError("آزمون یافت نشد.");
  if (actor.role !== "admin" && quiz.createdBy !== actor.id) throw new AppError("فقط طراح آزمون مجاز است.");
  return { ...db, quizzes: db.quizzes.map((q) => (q.id === quizId ? { ...q, open } : q)) };
}

export function scoreQuiz(quiz: Quiz, answers: Record<string, number>) {
  return quiz.questions.reduce((s, q) => s + (answers[q.id] === q.answerIndex ? 1 : 0), 0);
}

export function submitAttempt(db: Db, actor: User | null, quizId: string, answers: Record<string, number>) {
  requireActive(actor);
  const quiz = db.quizzes.find((q) => q.id === quizId);
  if (!quiz) throw new AppError("آزمون یافت نشد.");
  if (!quiz.open) throw new AppError("مهلت این آزمون به پایان رسیده است.");
  const score = scoreQuiz(quiz, answers);
  const attempt = { id: uid("at"), quizId, userId: actor.id, score, total: quiz.questions.length, at: nowIso() };
  return { db: { ...db, attempts: [...db.attempts, attempt] }, attempt };
}

// ---------- Messages ----------

/** Who an actor is allowed to message. */
export function allowedRecipients(db: Db, actor: User | null): User[] {
  if (!actor || !actor.active) return [];
  const others = db.users.filter((u) => u.id !== actor.id && u.active);
  if (actor.role === "admin") return others;
  if (actor.role === "teacher") {
    const myCourses = new Set(db.courses.filter((c) => c.teacherId === actor.id).map((c) => c.id));
    const myStudents = new Set(
      db.enrollments.filter((e) => myCourses.has(e.courseId) && e.status !== "rejected").map((e) => e.studentId),
    );
    return others.filter((u) => u.role === "admin" || myStudents.has(u.id));
  }
  const myCourses = new Set(
    db.enrollments.filter((e) => e.studentId === actor.id && e.status !== "rejected").map((e) => e.courseId),
  );
  const myTeachers = new Set(db.courses.filter((c) => myCourses.has(c.id)).map((c) => c.teacherId));
  return others.filter((u) => u.role === "admin" || myTeachers.has(u.id));
}

export function sendMessage(
  db: Db,
  actor: User | null,
  input: { toId: string; subject: string; body: string },
): Db {
  requireActive(actor);
  if (!allowedRecipients(db, actor).some((u) => u.id === input.toId))
    throw new AppError("ارسال پیام به این کاربر مجاز نیست.");
  if (!input.subject.trim() || !input.body.trim()) throw new AppError("موضوع و متن پیام الزامی است.");
  return {
    ...db,
    messages: [
      ...db.messages,
      { id: uid("msg"), fromId: actor.id, toId: input.toId, subject: input.subject.trim(), body: input.body.trim(), at: nowIso(), read: false },
    ],
  };
}

export function markMessageRead(db: Db, actor: User | null, messageId: string): Db {
  requireActive(actor);
  return {
    ...db,
    messages: db.messages.map((m) => (m.id === messageId && m.toId === actor.id ? { ...m, read: true } : m)),
  };
}

// ---------- Content (admin) ----------

export function saveContent(
  db: Db,
  actor: User | null,
  input: Omit<ContentItem, "id" | "createdAt"> & { id?: string },
): Db {
  requireRole(actor, ["admin"]);
  if (!input.title.trim() || !input.body.trim()) throw new AppError("عنوان و متن محتوا الزامی است.");
  if (input.id) {
    return { ...db, content: db.content.map((c) => (c.id === input.id ? { ...c, ...input, id: c.id } : c)) };
  }
  return { ...db, content: [{ ...input, id: uid("ct"), createdAt: nowIso() }, ...db.content] };
}

export function deleteContent(db: Db, actor: User | null, id: string): Db {
  requireRole(actor, ["admin"]);
  return { ...db, content: db.content.filter((c) => c.id !== id) };
}