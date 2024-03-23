import esbuildServe from "esbuild-serve";

esbuildServe(
  {
    logLevel: "info",
    entryPoints: ["src/index.ts"],
    bundle: true,
    format: "esm",
    outfile: "example/lib/bifrost-pulse-web.js",
  },
  { root: "example" }
);