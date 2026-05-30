"use client";

import { createContext, useContext } from "react";
import type { Region } from "./types";
import { REGIONS, DEFAULT_REGION } from "./regions";

const RegionContext = createContext<Region>(REGIONS[DEFAULT_REGION]);

export function RegionProvider({
  region,
  children,
}: {
  region: Region;
  children: React.ReactNode;
}) {
  return (
    <RegionContext.Provider value={region}>{children}</RegionContext.Provider>
  );
}

/** Active storefront region for client components. */
export function useRegion(): Region {
  return useContext(RegionContext);
}

/** Build a region-prefixed href, e.g. href("/shop") -> "/in/shop". */
export function useRegionHref() {
  const region = useRegion();
  return (path: string) => `/${region.segment}${path === "/" ? "" : path}`;
}
