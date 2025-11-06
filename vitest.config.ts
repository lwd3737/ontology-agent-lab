import path from "path";
import { defineConfig } from "vitest/config";

// Ensure path alias '@' -> './src' works in Vitest
const alias = {
  "@": path.resolve(process.cwd(), "src"),
};

export default defineConfig({
  resolve: { alias },
  test: {
    include: ["**/*.test.?(c|m)[jt]s", "**/__test__/**/*.ts"],
  },
});
