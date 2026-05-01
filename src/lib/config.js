/**
 * @file SDK configuration factory.
 *
 * Both server-side helpers and client-side hooks read this shape; keep it
 * free of browser-only types so it can be created in either environment.
 */

/**
 * @typedef {Object} CmsConfig
 * @property {string} baseUrl                  Backend root, no trailing slash.
 * @property {string|null} clientId            X-CMS-Client-Id header value.
 * @property {string|null} clientSecret        X-CMS-Client-Secret header value.
 */

/**
 * Normalize and freeze a config object.
 *
 * @param {Object} opts
 * @param {string} opts.baseUrl
 * @param {string} [opts.clientId]
 * @param {string} [opts.clientSecret]
 * @returns {CmsConfig}
 */

export function createCmsConfig({ baseUrl, clientId, clientSecret }) {
  if (!baseUrl || typeof baseUrl !== "string") {
    throw new Error("createCmsConfig: baseUrl is required");
  }
  return Object.freeze({
    baseUrl: baseUrl.replace(/\/+$/, ""),
    clientId: clientId ?? null,
    clientSecret: clientSecret ?? null,
  });
}