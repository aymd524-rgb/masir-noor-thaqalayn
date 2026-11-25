import { describe, expect, it } from "vitest";
import { mapCourseCatalog } from "./catalog";

describe("mapCourseCatalog", () => {
  it("groups active classes under their course and maps capacity summaries", () => {
    const result = mapCourseCatalog(
      [
        { id: "course-1", title: "حفظ قرآن", description: "دوره حفظ", price: 0 },
        { id: "course-2", title: "تجوید", description: null, price: "12.5" },
      ],
      [
        { id: "class-1", title: "گروه صبح", description: null, course_id: "course-1", capacity: 20, starts_at: null, ends_at: null },
        { id: "class-2", title: "گروه عصر", description: "سطح مقدماتی", course_id: "course-1", capacity: 12, starts_at: "2026-12-01T08:00:00Z", ends_at: null },
        { id: "orphan", title: "بدون دوره", description: null, course_id: null, capacity: null, starts_at: null, ends_at: null },
      ],
      [
        { class_id: "class-1", enrolled_count: "7", remaining_seats: 13 },
      ],
    );

    expect(result).toHaveLength(2);
    expect(result[0].classes).toHaveLength(2);
    expect(result[0].classes[0].enrolledCount).toBe(7);
    expect(result[0].classes[0].remainingSeats).toBe(13);
    expect(result[0].classes[1].enrolledCount).toBe(0);
    expect(result[1].price).toBe(12.5);
    expect(result[1].classes).toEqual([]);
  });

  it("returns an empty catalog when no active courses are available", () => {
    expect(mapCourseCatalog([], [], [])).toEqual([]);
  });
});
