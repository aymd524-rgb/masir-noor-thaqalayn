import { useCallback } from "react";
import { toast } from "sonner";
import { AppError } from "./domain/actions";
import type { Db } from "./domain/types";
import { commit } from "./store";

/** Run a domain update and report success/failure with a Persian toast. */
export function useAction() {
  return useCallback((update: (db: Db) => Db, success?: string): boolean => {
    try {
      commit(update);
      if (success) toast.success(success);
      return true;
    } catch (e) {
      toast.error(e instanceof AppError ? e.message : "خطایی رخ داد. دوباره تلاش کنید.");
      return false;
    }
  }, []);
}