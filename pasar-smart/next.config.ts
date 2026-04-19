import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const configDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // When `npm run dev` is invoked from the repo root, avoid picking the parent folder as Turbopack root.
  turbopack: {
    root: configDir,
  },
};

export default nextConfig;
