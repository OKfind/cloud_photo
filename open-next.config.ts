// default open-next.config.ts file created by @opennextjs/cloudflare
import type { OpenNextConfig } from "@opennextjs/cloudflare";
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

const config = defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
}) satisfies OpenNextConfig;

export default {
  ...config,
  middleware:
    config.middleware?.external === true
      ? {
          ...config.middleware,
          runtime: "edge",
        }
      : config.middleware,
} satisfies OpenNextConfig;
