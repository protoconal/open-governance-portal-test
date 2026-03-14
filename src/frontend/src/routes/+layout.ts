/**
 * routes/+layout.ts — Root layout module.
 *
 * Disables server-side rendering so that SvelteKit operates as a pure
 * client-side rendered (CSR) single-page application.  All data is
 * fetched at runtime via the REST API and WebSockets.
 *
 * Traceability: ADR-004, ADR-005
 */

export const ssr = false;
export const prerender = false;
