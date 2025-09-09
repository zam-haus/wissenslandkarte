import postcssGlobalData from "@csstools/postcss-global-data";
import { vitePlugin as remix } from "@remix-run/dev";
import postcssAutoprefixer from "autoprefixer";
import postcssCustomMedia from "postcss-custom-media";
import { flatRoutes } from "remix-flat-routes";
import { defineConfig } from "vite";
import { envOnlyMacros } from "vite-env-only";
import tsconfigPaths from "vite-tsconfig-paths";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
      routes(defineRoutes) {
        return flatRoutes("routes", defineRoutes, {
          ignoredRouteFiles: ["**/.*"], // ignore files with leading .
        });
      },
    }),
    tsconfigPaths(),
    envOnlyMacros(),
  ],
  css: {
    postcss: {
      plugins: [
        postcssAutoprefixer(),
        postcssGlobalData({
          files: ["./app/global.css"],
        }),
        postcssCustomMedia(),
      ],
    },
  },
});
