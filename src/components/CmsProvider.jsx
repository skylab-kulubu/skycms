"use client";

/**
 * @file Top-level provider that owns CMS context state.
 *
 * Mount once near the root (e.g. in `app/layout.jsx`). Holds the blocks
 * map, active-block selection, and the refetch token. Admin-only UI
 * (the drawer) is lazy-loaded so public visitors don't pay for it.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { CmsContext } from "../lib/context.js";
import { createCmsConfig } from "../lib/config.js";
import { indexBlocksByPath } from "../lib/blocks.js";
import { useCmsContent } from "../hooks/use-cms-content.js";

/**
 * @import { CmsConfig } from "../lib/config.js"
 * @import { BlockResponse } from "../lib/schemas.js"
 */

const AdminDrawer = dynamic(
  () => import("./AdminDrawer.jsx").then((m) => m.AdminDrawer),
  { ssr: false },
);

/**
 * @param {Object} props
 * @param {CmsConfig | { baseUrl: string, clientId?: string, clientSecret?: string }} props.config
 * @param {string|null} [props.userSub]
 * @param {boolean} [props.isAdmin]
 * @param {BlockResponse[]} [props.initialBlocks]   Server-fetched blocks for the active page; eliminates the SSR fallback flicker by seeding the blocks map before first paint.
 * @param {(slug: string) => void | Promise<void>} [props.onAfterSave]   Server Action invoked after a successful save (typically calls `revalidateTag(cmsCacheTag(slug))` to drop stale ISR data).
 * @param {React.ReactNode} props.children
 */
export function CmsProvider({
  config,
  userSub = null,
  isAdmin = false,
  initialBlocks,
  onAfterSave,
  children,
}) {
  // Accept either a raw `{ baseUrl }` shape or a pre-built CmsConfig.
  const normalizedConfig = useMemo(
    () => "baseUrl" in config && Object.isFrozen(config) ? /** @type {CmsConfig} */ (config) : createCmsConfig(config),
    [config],
  );

  // Seed the blocks map from `initialBlocks` so EditableRegion has real
  // values to render during SSR and on first client paint. Subsequent
  // updates flow through `useCmsContent` (refetch on mount) and saves.
  const [blocks, setBlocksState] = useState(
    /** @returns {Map<string, BlockResponse>} */
    () => indexBlocksByPath(initialBlocks ?? []),
  );
  const [activeBlock, setActiveBlock] = useState(
    /** @type {string|null} */ (null),
  );
  const [refetchToken, setRefetchToken] = useState(0);

  // Stash `onAfterSave` in a ref so changes to the prop don't bust the
  // memoised context value (server actions are stable references in
  // practice, but the ref guarantees no spurious re-renders).
  const onAfterSaveRef = useRef(onAfterSave ?? null);
  onAfterSaveRef.current = onAfterSave ?? null;

  const setBlocks = useCallback(
    /**
     * @param {(prev: Map<string, BlockResponse>) => Map<string, BlockResponse>} updater
     */
    (updater) => {
      setBlocksState((prev) => updater(prev));
    },
    [],
  );

  const triggerRefetch = useCallback(() => {
    setRefetchToken((n) => n + 1);
  }, []);

  // Public-mode visitors should not be able to enter edit state at all.
  const setActiveBlockGuarded = useCallback(
    /** @param {string|null} blockPath */
    (blockPath) => {
      if (!isAdmin) return;
      setActiveBlock(blockPath);
    },
    [isAdmin],
  );

  const stableOnAfterSave = useCallback(
    /** @param {string} slug */
    async (slug) => {
      const fn = onAfterSaveRef.current;
      if (!fn) return;
      await fn(slug);
    },
    [],
  );

  const value = useMemo(
    () => ({
      config: normalizedConfig,
      isAdmin,
      userSub,
      blocks,
      setBlocks,
      activeBlock,
      setActiveBlock: setActiveBlockGuarded,
      refetchToken,
      triggerRefetch,
      onAfterSave: stableOnAfterSave,
    }),
    [
      normalizedConfig,
      isAdmin,
      userSub,
      blocks,
      setBlocks,
      activeBlock,
      setActiveBlockGuarded,
      refetchToken,
      triggerRefetch,
      stableOnAfterSave,
    ],
  );

  return (
    <CmsContext.Provider value={value}>
      <ContentLoader />
      {children}
      {isAdmin ? <AdminDrawer /> : null}
    </CmsContext.Provider>
  );
}

/**
 * Internal: kicks off the client-side `GET /cms/content` for the active
 * route and writes the result into the provider's blocks map. Mounted
 * unconditionally inside `CmsProvider` so consumers don't have to remember
 * to call `useCmsContent()` themselves - without this, `EditableRegion`
 * would only ever see an empty map and fall back to placeholders, and
 * `AdminDrawer` would think every block is missing.
 *
 * `useCmsContent` is still exported for callers that want the loading /
 * error state or the raw blocks array.
 */
function ContentLoader() {
  useCmsContent();
  return null;
}
