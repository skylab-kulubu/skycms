"use client";

/**
 * @file Plain-text block editor. Uses a `<textarea>` so multi-line text
 * works out of the box; switch to `<input>` if you need a single line.
 */

/**
 * @param {Object} props
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange
 */
export function TextEditor({ value, onChange }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12, color: "#6b7280" }}>Text</span>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        style={{
          font: "inherit",
          padding: 8,
          border: "1px solid #d1d5db",
          borderRadius: 4,
          resize: "vertical",
        }}
      />
    </label>
  );
}
