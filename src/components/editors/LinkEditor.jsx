"use client";

/**
 * @file Link block editor. Value shape: `{ href: string, label: string }`.
 */

/**
 * @typedef {Object} LinkValue
 * @property {string} href
 * @property {string} label
 */

/**
 * @param {Object} props
 * @param {LinkValue|null|undefined} props.value
 * @param {(value: LinkValue) => void} props.onChange
 */
export function LinkEditor({ value, onChange }) {
  const href = value?.href ?? "";
  const label = value?.label ?? "";

  /** @param {Partial<LinkValue>} patch */
  const patch = (p) => onChange({ href, label, ...p });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 12, color: "#6b7280" }}>Label</span>
        <input type="text" value={label} onChange={(e) => patch({ label: e.target.value })} style={inputStyle}/>
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 12, color: "#6b7280" }}>URL</span>
        <input type="url" value={href} onChange={(e) => patch({ href: e.target.value })} placeholder="https://..." style={inputStyle}/>
      </label>
    </div>
  );
}

const inputStyle = {
  font: "inherit",
  padding: 8,
  border: "1px solid #d1d5db",
  borderRadius: 4,
};
