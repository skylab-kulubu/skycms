"use client";

/**
 * @file `<EditableRegion>` declarative primitive for editable content.
 *
 * Server-component-safe: takes only serializable props (no render-prop
 * function), so a server `app/page.jsx` can drop one in next to a
 * `getCmsContent()` call. The element to render is chosen from the block's
 * `blockType`; consumers customise the wrapper element via `as` and forward
 * any additional HTML props (className, style, target, etc.).
 *
 * Empty / missing blocks render a single placeholder character ("-") inside
 * the chosen element so layout doesn't collapse and admins still have a
 * visible click target. There's deliberately no `fallback` prop - keeping
 * the empty state uniform across the app makes "this region has no content
 * yet" instantly recognisable.
 *
 * Public mode is a transparent passthrough - the rendered element is what
 * ships to the DOM. Admin mode adds a `data-block` attribute, click handler,
 * and hover/active outline so editors can find the region.
 *
 * Power users who need full control over rendering (conditional layouts,
 * derived values, etc.) should reach for `useCmsBlock(blockPath)` from a
 * client component instead - that hook still exposes the raw value.
 */

import { cloneElement, useState } from "react";

import { useCmsContext } from "../lib/context.js";

/**
 * @import { BlockType } from "../lib/schemas.js"
 */

/**
 * @typedef {Object} EditableRegionProps
 * @property {string} blockPath
 * @property {string} [as]   Wrapper tag for Text / RichText (default: "span" / "div"). Ignored for Image and Link when the block has a value.
 */

const ACTIVE_OUTLINE = "2px solid #3b82f6";
const HOVER_OUTLINE = "2px dashed #93c5fd";
const EMPTY_PLACEHOLDER = "-";

/**
 * @param {EditableRegionProps & Record<string, *>} props
 */
export function EditableRegion({ blockPath, as, ...rest }) {
  const { isAdmin, blocks, activeBlock, setActiveBlock } = useCmsContext();
  const [isHovered, setIsHovered] = useState(false);

  const block = blocks.get(blockPath);
  const value = block ? block.value : undefined;
  const blockType = block ? block.blockType : null;
  const empty = isValueEmpty(blockType, value);

  const rendered = empty
    ? renderPlaceholder(as, rest)
    : renderBlock(blockType, value, { as, ...rest });

  if (!isAdmin) return rendered;

  // Admin mode: layer click / hover / outline on top of whatever the
  // renderer produced (placeholder or real content). Cloning keeps the
  // DOM shape identical to public mode.
  const isActive = activeBlock === blockPath;
  /** @param {React.MouseEvent} e */
  const handleClick = (e) => {
    e.stopPropagation();
    setActiveBlock(blockPath);
  };
  const outline = isActive ? ACTIVE_OUTLINE : isHovered ? HOVER_OUTLINE : undefined;
  const adminProps = {
    "data-block": blockPath,
    "data-cms-active": isActive || undefined,
    onClick: handleClick,
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };
  const adminStyle = { outline, outlineOffset: 2, cursor: "pointer" };

  return wrapForAdmin(rendered, adminProps, adminStyle, handleClick);
}

/**
 * @param {BlockType|null} blockType
 * @param {*} value
 * @returns {boolean}
 */
function isValueEmpty(blockType, value) {
  if (value == null) return true;
  switch (blockType) {
    case "Text":
    case "RichText":
      return value === "";
    case "Image":
      return !value.src;
    case "Link":
      return !value.href;
    default:
      return false;
  }
}

/**
 * Render the block's value as the appropriate HTML element. `as` only
 * applies to Text / RichText - Image and Link have a fixed shape because
 * the editor side (AdminDrawer) saves a `{src,alt}` / `{href,label}`
 * payload that maps cleanly onto `<img>` / `<a>`.
 *
 * @param {BlockType|null} blockType
 * @param {*} value
 * @param {Record<string, *>} props
 */
function renderBlock(blockType, value, props) {
  const { as, ...rest } = props;
  switch (blockType) {
    case "Text": {
      const Tag = as ?? "span";
      return <Tag {...rest}>{value}</Tag>;
    }
    case "RichText": {
      const Tag = as ?? "div";
      // RichText values are HTML strings produced by the rich-text editor.
      return <Tag {...rest} dangerouslySetInnerHTML={{ __html: value }} />;
    }
    case "Image":
      return <img {...rest} src={value.src} alt={value.alt ?? ""} />;
    case "Link":
      return (
        <a {...rest} href={value.href}>
          {value.label ?? value.href}
        </a>
      );
    default: {
      // Group / DataSource have no inline rendering - those payloads are
      // consumed by code, not laid out here.
      const Tag = as ?? "span";
      return <Tag {...rest}>{typeof value === "string" ? value : null}</Tag>;
    }
  }
}

/**
 * Single placeholder shape for every empty / missing block. Always uses
 * `as` (or `<span>` if not provided) so img/anchor src-less rendering
 * is avoided - those would produce broken DOM nodes.
 *
 * @param {string|undefined} as
 * @param {Record<string, *>} rest
 */
function renderPlaceholder(as, rest) {
  const Tag = as ?? "span";
  return <Tag {...rest}>{EMPTY_PLACEHOLDER}</Tag>;
}

/**
 * Splice admin props (click, hover, outline) onto whatever the renderer
 * produced. Cloning a single React element keeps the DOM shape identical
 * to public mode.
 *
 * @param {React.ReactElement} node
 * @param {Record<string, *>} adminProps
 * @param {React.CSSProperties} adminStyle
 * @param {(e: React.MouseEvent) => void} handleClick
 */
function wrapForAdmin(node, adminProps, adminStyle, handleClick) {
  /** @type {Record<string, *>} */
  const childProps = node.props ?? {};
  const mergedOnClick = childProps.onClick
    ? /** @param {React.MouseEvent} e */ (e) => {
        childProps.onClick(e);
        if (!e.defaultPrevented) handleClick(e);
      }
    : handleClick;
  return cloneElement(node, {
    ...adminProps,
    onClick: mergedOnClick,
    style: { ...(childProps.style ?? {}), ...adminStyle },
  });
}
