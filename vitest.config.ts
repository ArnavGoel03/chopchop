import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      exclude: [
        "lib/cart/store.ts",       // Zustand store — needs jsdom
        "lib/region-context.tsx",  // React context — needs jsdom
        "lib/db/**",
        "lib/payments/**",
        "lib/orders.ts",
        "lib/checkout-client.ts",
        "lib/seo.ts",
        "lib/validation.ts",
        "lib/content.ts",
        "lib/auth.ts",
      ],
    },
  },
});
