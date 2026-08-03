import { cpSync, existsSync, mkdirSync, writeFileSync, rmSync, readdirSync, statSync } from "fs";
import { join } from "path";

const outDir = join(process.cwd(), "out");
const root = process.cwd();

if (!existsSync(outDir)) {
  console.error("No existe /out. Ejecuta primero: npm run build:pages");
  process.exit(1);
}

const skip = new Set([
  ".git",
  ".next",
  "node_modules",
  "out",
  "src",
  "data",
  "scripts",
  "public",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next.config.ts",
  "next-env.d.ts",
  "eslint.config.mjs",
  "README.md",
  ".gitignore",
  ".env.example",
  "tsconfig.tsbuildinfo",
]);

// Remove previous exported route folders at root (keep source dirs)
for (const name of readdirSync(root)) {
  if (skip.has(name) || name.startsWith(".")) continue;
  const full = join(root, name);
  // Clean previous static deploy artifacts that came from out/
  if (
    name === "_next" ||
    name === "404.html" ||
    name === "index.html" ||
    name === ".nojekyll" ||
    name.endsWith(".txt") ||
    (statSync(full).isDirectory() &&
      existsSync(join(full, "index.html")))
  ) {
    rmSync(full, { recursive: true, force: true });
  }
}

for (const name of readdirSync(outDir)) {
  cpSync(join(outDir, name), join(root, name), { recursive: true });
}

writeFileSync(join(root, ".nojekyll"), "");
console.log("Sitio estático publicado en la raíz del repo para GitHub Pages.");
