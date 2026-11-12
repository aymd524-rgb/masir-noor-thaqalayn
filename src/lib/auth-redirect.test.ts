import { safeAuthRedirect } from "./auth-redirect";

describe("safeAuthRedirect", () => {
  it("keeps valid same-origin app paths, query strings, and hashes", () => {
    expect(safeAuthRedirect("/student")).toBe("/student");
    expect(safeAuthRedirect("/courses?level=beginner#active")).toBe("/courses?level=beginner#active");
  });

  it("rejects external and protocol-relative destinations", () => {
    expect(safeAuthRedirect("https://example.com")).toBeUndefined();
    expect(safeAuthRedirect("//example.com/path")).toBeUndefined();
    expect(safeAuthRedirect("/\\\\example.com")).toBeUndefined();
  });

  it("rejects non-path values and control characters", () => {
    expect(safeAuthRedirect("student")).toBeUndefined();
    expect(safeAuthRedirect(null)).toBeUndefined();
    expect(safeAuthRedirect("/student\n")).toBeUndefined();
  });
});
