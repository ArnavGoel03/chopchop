import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Generate a human-friendly order id, e.g. CHOP-7K2Q9-4821. */
export function generateOrderCode(rand: () => number = Math.random): string {
  const part = Math.floor(rand() * 36 ** 5)
    .toString(36)
    .toUpperCase()
    .padStart(5, "0");
  const num = Math.floor(rand() * 9000 + 1000);
  return `CHOP-${part}-${num}`;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
