import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "ink" | "marigold";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[transform,background-color] duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato";

const variants: Record<Variant, string> = {
  primary: "bg-tomato text-white hover:bg-tomato-d hover:-translate-y-0.5",
  ghost: "border-[1.5px] border-ink text-ink hover:bg-ink hover:text-paper",
  ink: "bg-ink text-paper hover:opacity-90",
  marigold: "bg-marigold text-ink hover:brightness-105",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-3 text-[15px]",
  lg: "px-6 py-4 text-base",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...rest
}: CommonProps & { href: string } & Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "href"
  >) {
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {children}
    </Link>
  );
}
