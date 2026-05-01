"use client";

/**
 * @file Placeholder rich-text editor. Real WYSIWYG (Tiptap/Slate) lands
 * later; for now this is a labeled textarea so the save pipeline can be
 * exercised end-to-end.
 */

/**
 * @param {Object} props
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange
 */
export function RichTextEditor({ value, onChange }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12, color: "#6b7280" }}>
        Rich text (HTML - WYSIWYG coming soon)
      </span>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={8}
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 13,
          padding: 8,
          border: "1px solid #d1d5db",
          borderRadius: 4,
          resize: "vertical",
        }}
      />
    </label>
  );
}
