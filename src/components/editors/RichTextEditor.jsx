"use client";

/**
 * @file Placeholder rich-text editor. Real WYSIWYG (Tiptap/Slate) lands
 * later; for now this is a labeled textarea so the save pipeline can be
 * exercised end-to-end.
 */

import { fieldStyle, labelStyle, labelTextStyle } from "./styles.js";

/**
 * @param {Object} props
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange
 */
export function RichTextEditor({ value, onChange }) {
  return (
    <label style={labelStyle}>
      <span style={labelTextStyle}>Zengin Metin · HTML</span>
      <textarea
        className="skylab-cms-field"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={8}
        style={{
          ...fieldStyle,
          fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 12,
          lineHeight: 1.6,
          resize: "vertical",
          minHeight: 140,
        }}
      />
    </label>
  );
}
