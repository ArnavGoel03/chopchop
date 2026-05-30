import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import type { Region } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { CartCount } from "./CartCount";
import { RegionSwitcher } from "./RegionSwitcher";

export function Header({ region }: { region: Region }) {
  const base = `/${region.segment}`;
  const nav = [
    { href: `${base}/shop`, label: "Shop" },
    { href: `${base}/shop/choppers`, label: "Choppers" },
    { href: `${base}/shop/prep`, label: "Prep" },
    { href: `${base}/shop/cookware`, label: "Cookware" },
  ];
  return (
    <>
      <div className="bg-ink px-3 py-2 text-center text-[13px] text-paper">
        {region.shippingCopy}
      </div>
      <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-md">
        <Container className="flex h-16 items-center justify-between">
          <Link
            href={base}
            className="font-display inline-flex items-center gap-2 text-2xl font-bold tracking-tight"
          >
            <span className="block h-2.5 w-2.5 rotate-45 rounded-[2px] bg-tomato" />
            CHOP.
          </Link>
          <nav className="hidden gap-7 text-sm md:flex">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="text-ink-soft transition-colors hover:text-tomato"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <RegionSwitcher />
            <Link
              href={`${base}/cart`}
              aria-label="Cart"
              className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-paper-2"
            >
              <ShoppingBag size={20} />
              <CartCount />
            </Link>
          </div>
        </Container>
      </header>
    </>
  );
}
