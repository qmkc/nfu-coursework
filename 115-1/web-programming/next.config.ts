import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ["10.0.20.15"],
  sassOptions: {
    // Bootstrap's own partials import each other relative to its scss/ root
    // (`@import "mixins/banner"`). Under Turbopack those relative lookups fail
    // once the file is reached through pnpm's node_modules/.pnpm junction, so
    // give Sass the scss/ root as an explicit fallback.
    loadPaths: [path.join(process.cwd(), "node_modules/bootstrap/scss")],
  },
};

export default nextConfig;
