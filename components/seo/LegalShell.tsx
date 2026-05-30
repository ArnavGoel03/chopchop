import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";

interface LegalShellProps {
  eyebrow: string;
  title: ReactNode;
  meta: string;
  children: ReactNode;
}

/**
 * Shared wrapper for all legal pages.
 * Provides readable prose typography, consistent heading rhythm,
 * and respects the site's design tokens.
 */
export function LegalShell({ eyebrow, title, meta, children }: LegalShellProps) {
  return (
    <Container className="py-12 lg:py-20">
      <div className="mx-auto max-w-prose">
        {/* Eyebrow */}
        <p className="text-xs font-semibold uppercase tracking-widest text-tomato mb-3">
          {eyebrow}
        </p>

        {/* Headline */}
        <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight mb-3">
          {title}
        </h1>

        {/* Meta */}
        <p className="text-sm text-ink-soft mb-10">{meta}</p>

        {/* Body — all prose children */}
        <div className="prose-legal">{children}</div>
      </div>
    </Container>
  );
}

// ── Prose sub-components (keep copy modular, no JSX in page files) ────────────

export function LegalH2({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-2xl text-ink mt-10 mb-3">{children}</h2>
  );
}

export function LegalP({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-ink-soft leading-relaxed mb-4${className ? ` ${className}` : ""}`}>
      {children}
    </p>
  );
}

export function LegalUl({ children }: { children: ReactNode }) {
  return (
    <ul className="list-disc list-outside pl-5 mb-4 space-y-1 text-ink-soft">
      {children}
    </ul>
  );
}

export function LegalOl({ children }: { children: ReactNode }) {
  return (
    <ol className="list-decimal list-outside pl-5 mb-4 space-y-1 text-ink-soft">
      {children}
    </ol>
  );
}

export function LegalLi({ children }: { children: ReactNode }) {
  return <li className="leading-relaxed">{children}</li>;
}

export function LegalCallout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-paper-2 border border-line rounded-xl p-5 mb-6 text-ink-soft leading-relaxed">
      {children}
    </div>
  );
}

export function LegalDivider() {
  return <hr className="border-line my-8" />;
}
