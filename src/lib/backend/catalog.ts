import type { SupabaseClient } from "@supabase/supabase-js";

export type CatalogClass = {
  id: string;
  title: string;
  description: string | null;
  courseId: string | null;
  capacity: number | null;
  startsAt: string | null;
  endsAt: string | null;
  enrolledCount: number;
  remainingSeats: number | null;
};

export type CatalogCourse = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  classes: CatalogClass[];
};

export type CourseEnrollmentState = {
  classId: string;
  requestStatus: "pending" | "approved" | "rejected" | null;
  enrolled: boolean;
};

type CourseRow = { id: string; title: string; description: string | null; price: number | string | null };
type ClassRow = {
  id: string; title: string; description: string | null; course_id: string | null;
  capacity: number | null; starts_at: string | null; ends_at: string | null;
};
type AvailabilityRow = { class_id: string; enrolled_count: number | string; remaining_seats: number | null };
type RequestRow = { class_id: string; status: "pending" | "approved" | "rejected" };
type EnrollmentRow = { class_id: string };

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export function mapCourseCatalog(
  courseRows: CourseRow[],
  classRows: ClassRow[],
  availabilityRows: AvailabilityRow[],
): CatalogCourse[] {
  const availability = new Map(availabilityRows.map((row) => [row.class_id, row]));
  const classesByCourse = new Map<string, CatalogClass[]>();

  for (const row of classRows) {
    if (!row.course_id) continue;
    const summary = availability.get(row.id);
    const item: CatalogClass = {
      id: row.id,
      title: row.title,
      description: row.description,
      courseId: row.course_id,
      capacity: row.capacity,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      enrolledCount: Number(summary?.enrolled_count ?? 0),
      remainingSeats: summary?.remaining_seats ?? null,
    };
    const items = classesByCourse.get(row.course_id) ?? [];
    items.push(item);
    classesByCourse.set(row.course_id, items);
  }

  return courseRows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price ?? 0),
    classes: classesByCourse.get(row.id) ?? [],
  }));
}

/** Uses the signed-in user's RLS-scoped Supabase session; no privileged key. */
export async function loadBackendCourseCatalog(sb: SupabaseClient): Promise<CatalogCourse[]> {
  const [coursesResult, classesResult, availabilityResult] = await Promise.all([
    sb.from("courses").select("id,title,description,price").eq("is_active", true).order("created_at", { ascending: false }),
    sb.from("classes").select("id,title,description,course_id,capacity,starts_at,ends_at").eq("is_active", true).order("created_at", { ascending: false }),
    sb.rpc("get_active_class_availability"),
  ]);

  throwIfError(coursesResult.error);
  throwIfError(classesResult.error);
  throwIfError(availabilityResult.error);

  return mapCourseCatalog(
    (coursesResult.data ?? []) as CourseRow[],
    (classesResult.data ?? []) as ClassRow[],
    (availabilityResult.data ?? []) as AvailabilityRow[],
  );
}

export async function loadBackendCourseEnrollmentStates(
  sb: SupabaseClient,
  course: CatalogCourse,
  studentId: string,
): Promise<CourseEnrollmentState[]> {
  const classIds = course.classes.map((item) => item.id);
  if (!classIds.length) return [];

  const [requestsResult, enrollmentsResult] = await Promise.all([
    sb.from("enrollment_requests").select("class_id,status").eq("student_id", studentId).in("class_id", classIds).order("created_at", { ascending: false }),
    sb.from("enrollments").select("class_id").eq("student_id", studentId).in("class_id", classIds),
  ]);
  throwIfError(requestsResult.error);
  throwIfError(enrollmentsResult.error);

  const latestRequest = new Map<string, RequestRow>();
  for (const row of (requestsResult.data ?? []) as RequestRow[]) {
    if (!latestRequest.has(row.class_id)) latestRequest.set(row.class_id, row);
  }
  const enrolled = new Set(((enrollmentsResult.data ?? []) as EnrollmentRow[]).map((row) => row.class_id));

  return classIds.map((classId) => ({
    classId,
    requestStatus: latestRequest.get(classId)?.status ?? null,
    enrolled: enrolled.has(classId),
  }));
}
