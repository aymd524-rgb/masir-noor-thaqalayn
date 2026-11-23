import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type { User } from "./domain/types";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  onAuthStateChange: vi.fn(),
  resolveBackendUser: vi.fn(),
  commit: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock("./backend/config", () => ({
  isBackendConfigured: true,
  isDemoMode: false,
}));

vi.mock("./backend/supabase", () => ({
  getSupabase: () => ({
    auth: {
      getUser: mocks.getUser,
      onAuthStateChange: mocks.onAuthStateChange,
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  }),
  resolveBackendUser: mocks.resolveBackendUser,
}));

vi.mock("./store", () => ({
  useDb: () => ({ users: [] }),
  commit: mocks.commit,
  readDb: vi.fn(),
}));

vi.mock("./domain/actions", () => ({
  AppError: class AppError extends Error {},
  registerStudent: vi.fn(),
  updateOwnProfile: vi.fn(),
  upsertVerifiedUser: vi.fn(() => ({})),
}));

import { AuthProvider, useAuth } from "./auth";

function AuthState() {
  const { status, user, authError } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{user?.id ?? "none"}</span>
      {authError && <span role="alert">{authError}</span>}
    </div>
  );
}

function renderProvider(children: ReactNode = <AuthState />) {
  return render(<AuthProvider>{children}</AuthProvider>);
}

describe("AuthProvider session bootstrap", () => {
  beforeEach(() => {
    mocks.getUser.mockReset();
    mocks.onAuthStateChange.mockReset();
    mocks.resolveBackendUser.mockReset();
    mocks.commit.mockReset();
    mocks.unsubscribe.mockReset();
    mocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mocks.unsubscribe } },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("settles loading and shows a safe error when getUser rejects", async () => {
    mocks.getUser.mockRejectedValue(new Error("network failure"));

    renderProvider();

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("signed-out"));
    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(screen.getByRole("alert")).toHaveTextContent("امکان تأیید امن حساب وجود ندارد");
    expect(mocks.commit).not.toHaveBeenCalled();
  });

  it("does not create a local identity when profile resolution fails", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "auth-user-1", email: "person@example.test" } },
      error: null,
    });
    mocks.resolveBackendUser.mockRejectedValue(new Error("profile unavailable"));

    renderProvider();

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("signed-out"));
    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(screen.getByRole("alert")).toHaveTextContent("امکان تأیید امن حساب وجود ندارد");
    expect(mocks.commit).not.toHaveBeenCalled();
  });

  it("invalidates a pending identity lookup when SIGNED_OUT arrives", async () => {
    let authListener: ((event: string) => void) | undefined;
    mocks.onAuthStateChange.mockImplementation((callback: (event: string) => void) => {
      authListener = callback;
      return { data: { subscription: { unsubscribe: mocks.unsubscribe } } };
    });
    let finishResolution: ((value: User) => void) | undefined;
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "auth-user-1", email: "person@example.test" } },
      error: null,
    });
    mocks.resolveBackendUser.mockReturnValue(new Promise<User>((resolve) => {
      finishResolution = resolve;
    }));

    renderProvider();
    await waitFor(() => expect(mocks.resolveBackendUser).toHaveBeenCalled());

    act(() => authListener?.("SIGNED_OUT"));
    await act(async () => {
      finishResolution?.({
        id: "auth-user-1",
        active: true,
        fullName: "نام",
        email: "person@example.test",
        role: "student",
        joinedAt: "2026-01-01T00:00:00.000Z",
      });
    });

    expect(screen.getByTestId("status")).toHaveTextContent("signed-out");
    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(mocks.commit).not.toHaveBeenCalled();
  });
});
