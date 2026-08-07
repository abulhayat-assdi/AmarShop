/**
 * Next.js instrumentation hook. `register` runs once when the server process
 * starts, before handling any request.
 *
 * We use it to validate environment variables at boot (fail fast with a clear
 * error) rather than discovering a missing/invalid variable mid-request. The
 * dynamic import keeps `@/lib/env` (which throws on invalid config at module
 * evaluation) out of the build graph and off the Edge runtime.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("@/lib/env");
  }
}
