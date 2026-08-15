import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` rzuca wyjątkiem przy imporcie poza Server Componentem,
      // co wysadza testy jednostkowe. Podmieniamy go na pustą atrapę — dzięki
      // temu moduły serwerowe (np. scoring) zachowują swoją ochronę w builcie
      // Next.js, a nadal dają się testować.
      "server-only": fileURLToPath(new URL("./src/test/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
