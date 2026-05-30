import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
  tone = "paper",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "paper" | "ink" | "mint" | "tomato";
}) {
  const tones = {
    paper: "bg-paper-2 text-ink",
    ink: "bg-ink text-paper",
    mint: "bg-mint/15 text-mint",
    tomato: "bg-tomato/12 text-tomato",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
