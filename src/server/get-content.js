/**
 * @file Server-side content fetchers for Next.js App Router.
 *
 * SERVER ONLY - this module deliberately omits the `"use client"`
 * directive and is published under the `@skylab/cms/server` subpath.
 * Pull it from React Server Components (`app/**\/page.jsx`, layouts,
 * route handlers); never import it from a client component.
 *
 * Caching: every request is tagged `cms-{slug}`, so consumers can call
 * `revalidateTag("cms-/gecekodu")` after a save to invalidate ISR
 * without dropping the rest of the page.
 */

import {
  fetchContent,
  fetchDataSources,
  fetchSource,
  syncManifest,
} from "../lib/api-client.js";

/**
 * @import { CmsConfig } from "../lib/config.js"
 * @import {
 *   ContentResponse,
 *   SyncManifestRequest,
 *   SyncResultResponse,
 * } from "../lib/schemas.js"
 */

/**
 * `POST /cms/sync` - register or update the block manifest for a page.
 *
 * Idempotent: blocks present in the manifest are created or kept;
 * blocks already in the DB but absent from the manifest are deleted.
 * Intended for build-time / deploy-time pipelines (e.g. `prebuild`
 * scripts), not user-facing flows.
 *
 * @param {CmsConfig} config
 * @param {SyncManifestRequest} request
 * @returns {Promise<SyncResultResponse>}
 */
export function syncCmsManifest(config, request) {
  return syncManifest(config, request);
}

/**
 * @typedef {Object} GetCmsContentOptions
 * @property {number | false} [revalidate]   ISR window in seconds, or `false` for tag-only invalidation. Default `false` - the cache is held indefinitely and only dropped when an admin save fires `revalidateTag(cmsCacheTag(slug))`. Set a number if you also want a wall-clock safety net (useful in multi-instance deploys where in-process tag invalidation may not fan out).
 * @property {string[]} [tags]               Extra cache tags (the `cms-{slug}` tag is always added).
 */

/**
 * @typedef {Object} GetCmsDataSourcesOptions
 * @property {number | false} [revalidate]   ISR window in seconds, `false` for tag-only, or omit to bypass the cache entirely (default). DataSource payloads are resolved per-request from upstream services (news, events, ...); caching them defeats the purpose unless the consumer explicitly opts in.
 * @property {string[]} [tags]               Extra cache tags. Only applied when `revalidate` is set.
 */

/**
 * @param {string} slug
 * @returns {string}
 */
export function cmsCacheTag(slug) {
  return `cms-${slug}`;
}

/**
 * Fetch a page's blocks from a Server Component.
 *
 * @param {CmsConfig} config
 * @param {string} slug
 * @param {GetCmsContentOptions} [options]
 * @returns {Promise<ContentResponse>}
 */
export function getCmsContent(config, slug, options) {
  return fetchContent(config, slug, buildContentCacheInit(slug, options));
}

/**
 * Fetch only the DataSource-typed blocks for a page.
 *
 * Defaults to `cache: "no-store"` so every render hits the backend, which
 * in turn re-resolves each DataSource against its upstream service. Pass
 * `{ revalidate }` to opt into ISR caching when the upstream tolerates it.
 *
 * @param {CmsConfig} config
 * @param {string} slug
 * @param {GetCmsDataSourcesOptions} [options]
 * @returns {Promise<ContentResponse>}
 */
export function getCmsDataSources(config, slug, options) {
  return fetchDataSources(config, slug, buildDataSourceCacheInit(slug, options));
}

/**
 * @param {string} slug
 * @param {GetCmsContentOptions} [options]
 * @returns {RequestInit}
 */
function buildContentCacheInit(slug, options) {
  // Default: tag-only invalidation. The cache lives until `revalidateTag`
  // is called (wired through `<CmsProvider onAfterSave={...}>`), which
  // makes a hard time-based revalidate window unnecessary on a single
  // instance. Consumers can still pass `revalidate` for multi-instance
  // safety nets.
  const revalidate = options?.revalidate ?? false;
  const tags = [cmsCacheTag(slug), ...(options?.tags ?? [])];
  return /** @type {RequestInit} */ ({
    next: { revalidate, tags },
  });
}

/**
 * @param {string} slug
 * @param {GetCmsDataSourcesOptions} [options]
 * @returns {RequestInit}
 */
function buildDataSourceCacheInit(slug, options) {
  // Opt-in caching: if the consumer didn't ask for ISR, bypass the cache
  // entirely so the response is always fresh.
  if (options?.revalidate === undefined) {
    return /** @type {RequestInit} */ ({ cache: "no-store" });
  }
  const tags = [cmsCacheTag(slug), ...(options.tags ?? [])];
  return /** @type {RequestInit} */ ({
    next: { revalidate: options.revalidate, tags },
  });
}

/**
 * @typedef {Object} GetCmsSourceOptions
 * @property {number | false} [revalidate]   ISR window in seconds, or `false` for tag-only invalidation. Omit to bypass the cache (default - matches `getCmsDataSources`).
 * @property {string[]} [tags]               Cache tags. Only applied when `revalidate` is set. The default `cms-source-{name}` tag is always added so a single `revalidateTag("cms-source-events")` call drops every page that consumes that source.
 */

/**
 * @param {string} sourceName
 * @returns {string}
 */
export function cmsSourceCacheTag(sourceName) {
  return `cms-source-${sourceName}`;
}

/**
 * Resolve a single named data source from a Server Component.
 *
 * Defaults to `cache: "no-store"` for the same reason as
 * `getCmsDataSources` - upstream payloads (news, events, members)
 * are typically not safe to cache without an explicit policy. Pass
 * `{ revalidate }` to opt in.
 *
 * @template T
 * @param {CmsConfig} config
 * @param {string} sourceName
 * @param {Record<string, *>} [query]
 * @param {GetCmsSourceOptions} [options]
 * @returns {Promise<T>}
 */
export function getCmsSource(config, sourceName, query, options) {
  return /** @type {Promise<T>} */ (
    fetchSource(config, sourceName, query, buildSourceCacheInit(sourceName, options))
  );
}

/**
 * @param {string} sourceName
 * @param {GetCmsSourceOptions} [options]
 * @returns {RequestInit}
 */
function buildSourceCacheInit(sourceName, options) {
  if (options?.revalidate === undefined) {
    return /** @type {RequestInit} */ ({ cache: "no-store" });
  }
  const tags = [cmsSourceCacheTag(sourceName), ...(options.tags ?? [])];
  return /** @type {RequestInit} */ ({
    next: { revalidate: options.revalidate, tags },
  });
}
