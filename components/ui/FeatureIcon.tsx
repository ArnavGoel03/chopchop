import {
  UtensilsCrossed,
  Leaf,
  Droplet,
  Zap,
  Hand,
  Shield,
  Package,
  Truck,
  IndianRupee,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  knife: UtensilsCrossed,
  leaf: Leaf,
  droplet: Droplet,
  zap: Zap,
  hand: Hand,
  shield: Shield,
  package: Package,
  truck: Truck,
  rupee: IndianRupee,
  returns: RotateCcw,
};

export function FeatureIcon({
  name,
  size = 24,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Icon = MAP[name] ?? Leaf;
  return <Icon size={size} className={className} aria-hidden />;
}
