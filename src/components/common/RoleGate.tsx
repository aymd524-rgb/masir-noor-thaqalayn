import { Link, useLocation } from "@tanstack/react-router";
import { Lock, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import type { Role, User } from "@/lib/domain/types";
import { dashboardPath } from "@/lib/nav";
import { EmptyState, LoadingState } from "./states";

/**
 * Renders children only for signed-in users whose role is allowed.
 * UI gate only — every mutation is also checked in the domain layer, and
 * a connected backend must enforce the same rules with row-level security.
 */
export function RoleGate({ allow, children }: { allow: Role[]; children: (user: User) => ReactNode }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <LoadingState rows={3} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <EmptyState
          icon={Lock}
          title="ورود لازم است"
          description="برای دیدن این بخش ابتدا وارد حساب کاربری خود شوید."
          action={
            <Button asChild>
              <Link to="/auth" search={{ redirect: location.pathname, mode: "signin" }}>
                ورود به حساب
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (!allow.includes(user.role)) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <EmptyState
          icon={ShieldAlert}
          title="دسترسی مجاز نیست"
          description="این بخش برای نقش کاربری شما در دسترس نیست."
          action={
            <Button asChild variant="outline">
              <Link to={dashboardPath(user.role)}>رفتن به پیشخوان من</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return <>{children(user)}</>;
}