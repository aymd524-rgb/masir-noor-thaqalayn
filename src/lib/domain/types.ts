export type Role = "student" | "teacher" | "admin";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  phone?: string;
  bio?: string;
  city?: string;
  active: boolean;
  joinedAt: string;
}

export type CourseCategory = "quran" | "ahlulbayt" | "nahj" | "sahifa" | "akhlagh";
export type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface Course {
  id: string;
  title: string;
  category: CourseCategory;
  description: string;
  teacherId: string;
  level: CourseLevel;
  schedule: string;
  capacity: number;
  durationWeeks: number;
  startDate: string;
  published: boolean;
  createdAt: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  summary: string;
  order: number;
  date: string;
  durationMin: number;
}

export type MaterialType = "pdf" | "audio" | "video" | "link" | "doc";

export interface Material {
  id: string;
  courseId: string;
  title: string;
  type: MaterialType;
  url?: string;
  fileName?: string;
  sizeKb?: number;
  uploadedAt: string;
  uploadedBy: string;
}

export type EnrollmentStatus = "pending" | "approved" | "rejected";

export interface Enrollment {
  id: string;
  courseId: string;
  studentId: string;
  status: EnrollmentStatus;
  requestedAt: string;
  decidedAt?: string;
  note?: string;
  progress: number;
}

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface AttendanceRecord {
  id: string;
  courseId: string;
  lessonId: string;
  studentId: string;
  status: AttendanceStatus;
}

export interface Grade {
  id: string;
  courseId: string;
  studentId: string;
  title: string;
  score: number;
  max: number;
  date: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  answerIndex: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  courseId?: string;
  createdBy: string;
  timeLimitMin: number;
  open: boolean;
  isCompetition: boolean;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  total: number;
  at: string;
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  subject: string;
  body: string;
  at: string;
  read: boolean;
}

export interface Certificate {
  id: string;
  courseId: string;
  studentId: string;
  issuedAt: string;
  code: string;
}

export type ContentSection = "quran" | "ahlulbayt" | "nahj" | "sahifa" | "library" | "duas";

export interface ContentItem {
  id: string;
  section: ContentSection;
  title: string;
  subtitle?: string;
  tag?: string;
  author?: string;
  arabic?: string;
  body: string;
  published: boolean;
  createdAt: string;
}

export interface Db {
  version: number;
  users: User[];
  courses: Course[];
  lessons: Lesson[];
  materials: Material[];
  enrollments: Enrollment[];
  attendance: AttendanceRecord[];
  grades: Grade[];
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  messages: Message[];
  certificates: Certificate[];
  content: ContentItem[];
  /** Demo-mode credentials only. Never used when a real backend is connected. */
  demoCredentials: Record<string, string>;
}