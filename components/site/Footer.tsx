import Link from "next/link";
import type { Region } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { CATEGORIES } from "@/lib/catalog";

export function Footer({ region }: { region: Region }) {
  const base = `/${region.segment}`;
  const year = 2026;
  return (
    <footer className="bg-ink px-0 pb-12 pt-16 text-[14px] text-paper/70">
      <Container>
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="font-display inline-flex items-center gap-2 text-xl text-paper">
              <span className="block h-2.5 w-2.5 rotate-45 rounded-[2px] bg-tomato" />
              CHOP.
            </div>
            <p className="mt-3 max-w-[34ch]">
              Kitchen tools made for the way you cook. Designed in India, shipped{" "}
              {region.id === "in" ? "across India." : "worldwide."}
            </p>
          </div>
          <FootCol title="Shop">
            {CATEGORIES.filter((c) => c.id !== "bundles").map((c) => (
              <FootLink key={c.id} href={`${base}/shop/${c.id}`}>
                {c.label}
              </FootLink>
            ))}
          </FootCol>
          <FootCol title="Help">
            <FootLink href={`${base}/track`}>Track order</FootLink>
            <FootLink href={`${base}/returns`}>Returns</FootLink>
            <FootLink href={`${base}/shipping`}>Shipping</FootLink>
          </FootCol>
          <FootCol title="Company">
            <FootLink href={`${base}/privacy`}>Privacy</FootLink>
            <FootLink href={`${base}/terms`}>Terms</FootLink>
          </FootCol>
        </div>
        <div className="mt-12 flex flex-wrap justify-between gap-3 border-t border-paper/15 pt-6 text-[13px]">
          <div>© {year} CHOP Goods Pvt. Ltd.</div>
          <div>Made with sabzi in Bengaluru.</div>
        </div>
      </Container>
    </footer>
  );
}

function FootCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h5 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-paper">
        {title}
      </h5>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function FootLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="hover:text-marigold">
        {children}
      </Link>
    </li>
  );
}
