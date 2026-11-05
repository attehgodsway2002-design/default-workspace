import "server-only";
import { searchMerchants } from "./queries";
import type { CategoryId, CorridorId } from "@/lib/types";

/**
 * Read-only facade for public pages. Re-exports the query layer so consumer
 * routes never import mutation helpers.
 */
export * from "./queries";

export function getMerchantsSafe(corridorId: CorridorId, categoryId: CategoryId, limit = 3) {
  return searchMerchants({ corridorId, categoryId, limit }).map((r) => r.merchant);
}
