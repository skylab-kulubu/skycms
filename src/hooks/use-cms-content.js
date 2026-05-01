"use client";

/**
 * @file `useCmsContent()` - fetch the current page's blocks.
 *
 * Slug is resolved automatically from `usePathname()`; consumers don't pass
 * it. Result is also pushed into the shared `CmsContext` blocks map so
 * `useCmsBlock` and `EditableRegion` can read derived values without their
 * own fetches. Re-runs when `refetchToken` changes (bumped by saves).
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { useCmsContext } from "../lib/context.js";
import { fetchContent, CmsApiError } from "../lib/api-client.js";
import { indexBlocksByPath } from "../lib/blocks.js";

/**
 * @import { BlockResponse } from "../lib/schemas.js"
 */

/**
 * @typedef {Object} UseCmsContentResult
 * @property {BlockResponse[]} blocks       Current page's blocks (array form).
 * @property {boolean} isLoading
 * @property {CmsApiError|Error|null} error
 * @property {() => void} refetch
 * @property {string} slug
 */

/**
 * @returns {UseCmsContentResult}
 */

export function useCmsContent() {
  const { config, setBlocks, refetchToken, triggerRefetch } = useCmsContext();
  const slug = usePathname() ?? "/";

  const [state, setState] = useState(
    /** @type {{ blocks: BlockResponse[], isLoading: boolean, error: Error|null }} */ ({
      blocks: [],
      isLoading: true,
      error: null,
    }),
  );

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, isLoading: true, error: null }));

    fetchContent(config, slug)
      .then((response) => {
        if (cancelled) return;
        const indexed = indexBlocksByPath(response.blocks);
        setBlocks(() => indexed);
        setState({ blocks: response.blocks, isLoading: false, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        // Surface the failure - silent errors here mean every EditableRegion
        // falls back to its placeholder and AdminDrawer reports "block isn't
        // in the current page yet", which looks like missing data rather than
        // a network/CORS failure.
        // eslint-disable-next-line no-console
        console.error("[skylab-cms] fetchContent failed:", err);
        setState({ blocks: [], isLoading: false, error: err });
      });

    return () => {
      cancelled = true;
    };
  }, [config, slug, refetchToken, setBlocks]);

  return {
    blocks: state.blocks,
    isLoading: state.isLoading,
    error: state.error,
    refetch: triggerRefetch,
    slug,
  };
}