import { getSession } from "@/lib/auth";
import { getDemoMerchant, getMerchantById } from "@/lib/db/queries";
import type { Merchant, Session } from "@/lib/types";

/** Session + safe merchant fallback used by merchant pages (never throws). */
export async function merchantContext(): Promise<{
  session: Session | null;
  merchant: Merchant;
}> {
  const session = await getSession();
  const merchant =
    (session?.merchantId ? getMerchantById(session.merchantId) : undefined) ?? getDemoMerchant();
  return { session, merchant };
}
