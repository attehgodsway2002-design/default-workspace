import type { CategoryId } from "@/lib/types";

/**
 * QuickBook's service menu for the categories it covers. Prices are joined to
 * the merchant's price band — band 1 is budget, band 3 is premium — so a
 * premium clinic quotes more than a neighbourhood one.
 */
export interface ServiceOption {
  name: string;
  priceCedis: number;
}

const MENUS: Record<string, { name: string; price: number }[]> = {
  beauty: [
    { name: "Skin fade + beard", price: 120 },
    { name: "Gel manicure", price: 180 },
    { name: "Braids (12-week set)", price: 450 },
    { name: "Silk press + trim", price: 280 },
    { name: "Facial (45 min)", price: 320 },
  ],
  health: [
    { name: "GP consultation", price: 250 },
    { name: "Dental cleaning", price: 300 },
    { name: "Blood panel + review", price: 420 },
    { name: "Physio session (45 min)", price: 350 },
  ],
  fitness: [
    { name: "Day pass + induction", price: 80 },
    { name: "Small-group strength class", price: 120 },
    { name: "1:1 coaching session", price: 260 },
    { name: "Spin class (45 min)", price: 90 },
  ],
};

export const QUICKBOOK_CATEGORIES: CategoryId[] = ["beauty", "health", "fitness"];

export function servicesFor(categoryId: CategoryId, priceBand: 1 | 2 | 3): ServiceOption[] {
  const menu = MENUS[categoryId] ?? [{ name: "Standard appointment", price: 150 }];
  const factor = priceBand === 1 ? 0.8 : priceBand === 3 ? 1.4 : 1;
  return menu.map((item) => ({
    name: item.name,
    priceCedis: Math.max(20, Math.round((item.price * factor) / 5) * 5),
  }));
}
