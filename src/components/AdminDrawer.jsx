"use client";

/**
 * @file Side-panel editor that opens when an `EditableRegion` is clicked.
 *
 * Reads the active block from context, hosts a draft of its value, and
 * dispatches the save through `useCmsAdmin`. Handles 409 conflicts by
 * surfacing an inline message - the hook has already triggered a refetch
 * by the time this renders, so the user can simply re-apply their edit.
 */

import { useEffect, useState } from "react";

import { useCmsContext } from "../lib/context.js";
import { useCmsAdmin } from "../hooks/use-cms-admin.js";
import { CmsApiError } from "../lib/api-client.js";

import { TextEditor } from "./editors/TextEditor.jsx";
import { RichTextEditor } from "./editors/RichTextEditor.jsx";
import { ImageEditor } from "./editors/ImageEditor.jsx";
import { LinkEditor } from "./editors/LinkEditor.jsx";

/**
 * @import { BlockResponse, BlockType } from "../lib/schemas.js"
 */

export function AdminDrawer() {
  const { activeBlock, setActiveBlock, blocks } = useCmsContext();
  const { save, isSaving, error } = useCmsAdmin();

  const block = activeBlock ? (blocks.get(activeBlock) ?? null) : null;

  const [draft, setDraft] = useState(/** @type {*} */ (undefined));

  // Reset the draft whenever a different block becomes active.
  useEffect(() => {
    setDraft(block ? block.value : undefined);
  }, [activeBlock, block]);

  if (!activeBlock) return null;

  const close = () => setActiveBlock(null);

  const onSave = async () => {
    if (!block) return;
    try {
      await save(block.blockPath, draft, block.version);
      close();
    } catch {
      // Error state is exposed via `useCmsAdmin().error`; keep drawer open.
    }
  };

  const isConflict = error instanceof CmsApiError && error.isConflict;

  return (
    <>
      <div onClick={close} style={overlayStyle} />
      <aside style={panelStyle} role="dialog" aria-label="Edit block">
        <header style={headerStyle}>
          <div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              {block ? block.blockType : "Unknown"}
            </div>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 13 }}>
              {activeBlock}
            </div>
          </div>
          <button onClick={close} style={iconButtonStyle} aria-label="Close">
            ×
          </button>
        </header>

        <div style={bodyStyle}>
          {block ? (
            renderEditor(block, draft, setDraft)
          ) : (
            <p style={{ color: "#6b7280" }}>
              This block isn't in the current page yet. Run a sync to create it.
            </p>
          )}

          {error ? (
            <div style={isConflict ? conflictStyle : errorStyle}>
              {isConflict
                ? "Someone else updated this block. The latest version was loaded - review and try again."
                : (error.message ?? "Save failed")}
            </div>
          ) : null}
        </div>

        <footer style={footerStyle}>
          <button onClick={close} style={secondaryButtonStyle} disabled={isSaving}>
            Cancel
          </button>
          <button
            onClick={onSave}
            style={primaryButtonStyle}
            disabled={isSaving || !block}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </footer>
      </aside>
    </>
  );
}

/**
 * @param {BlockResponse} block
 * @param {*} draft
 * @param {(value: *) => void} setDraft
 */
function renderEditor(block, draft, setDraft) {
  switch (/** @type {BlockType} */ (block.blockType)) {
    case "Text":
      return <TextEditor value={draft ?? ""} onChange={setDraft} />;
    case "RichText":
      return <RichTextEditor value={draft ?? ""} onChange={setDraft} />;
    case "Image":
      return <ImageEditor value={draft} onChange={setDraft} />;
    case "Link":
      return <LinkEditor value={draft} onChange={setDraft} />;
    case "Group":
    case "DataSource":
    default:
      return (
        <div style={{ color: "#6b7280", fontSize: 13 }}>
          No inline editor for type <code>{block.blockType}</code> yet.
        </div>
      );
  }
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.2)",
  zIndex: 9998,
};

const panelStyle = {
  position: "fixed",
  top: 0,
  right: 0,
  bottom: 0,
  width: 380,
  background: "#fff",
  boxShadow: "-2px 0 12px rgba(0,0,0,0.1)",
  display: "flex",
  flexDirection: "column",
  zIndex: 9999,
  font: "14px/1.4 system-ui, sans-serif",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  padding: 16,
  borderBottom: "1px solid #e5e7eb",
};

const bodyStyle = {
  flex: 1,
  overflowY: "auto",
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const footerStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
  padding: 16,
  borderTop: "1px solid #e5e7eb",
};

const buttonBase = {
  font: "inherit",
  padding: "8px 14px",
  borderRadius: 4,
  border: "1px solid transparent",
  cursor: "pointer",
};

const primaryButtonStyle = {
  ...buttonBase,
  background: "#3b82f6",
  color: "#fff",
};

const secondaryButtonStyle = {
  ...buttonBase,
  background: "#fff",
  color: "#374151",
  borderColor: "#d1d5db",
};

const iconButtonStyle = {
  ...buttonBase,
  background: "transparent",
  fontSize: 20,
  lineHeight: 1,
  padding: "4px 8px",
};

const errorStyle = {
  padding: 8,
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#b91c1c",
  borderRadius: 4,
  fontSize: 13,
};

const conflictStyle = {
  ...errorStyle,
  background: "#fffbeb",
  border: "1px solid #fde68a",
  color: "#92400e",
};
