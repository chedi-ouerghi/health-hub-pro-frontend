import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig(({ command, mode }) => {
  const loadedEnv = loadEnv(mode, process.cwd(), "VITE_");
  const envDefine = Object.fromEntries(
    Object.entries(loadedEnv).map(([key, value]) => [
      `import.meta.env.${key}`,
      JSON.stringify(value),
    ]),
  );

  const plugins = [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" },
    }),
  ];

  if (command === "build") {
    plugins.push(
      nitro({
        defaultPreset: "vercel",
        // Workaround for Nitro/Rolldown chunk-cycle in TanStack SSR output.
        // See https://github.com/nitrojs/nitro/issues/4533 and
        // https://github.com/rolldown/rolldown/issues/10734
        inlineDynamicImports: true,
      }),
    );
  }

  plugins.push(viteReact());

  return {
    define: envDefine,
    css: { transformer: "lightningcss" },
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    // ▼▼▼ AJOUTEZ CE BLOC ICI ▼▼▼
    ssr: {
      optimizeDeps: {
        include: [
          "@tanstack/react-start",
          "@tanstack/start-client-core",
        ],
      },
    },
    // ▲▲▲ FIN DU BLOC ▲▲▲
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },
    plugins,
    server: {
      host: "0.0.0.0",
      port: 8080,
    },
  };
});