import path from "path";
import { defineConfig } from "vitest/config";

// Ensure path alias '@' -> './src' works in Vitest
const alias = {
  "@": path.resolve(process.cwd(), "src"),
};

export default defineConfig({
  resolve: { alias },
  test: {
    include: ["**/*.eval.?(c|m)[jt]s"],
    reporters: ["langsmith/vitest/reporter"],
    setupFiles: ["dotenv/config"],
  },
});
