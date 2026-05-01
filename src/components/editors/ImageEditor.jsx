"use client";

/**
 * @file Image block editor. URL-only for now - upload UI lands later;
 * value shape: `{ src: string, alt: string }`.
 */

/**
 * @typedef {Object} ImageValue
 * @property {string} src
 * @property {string} alt
 */

/**
 * @param {Object} props
 * @param {ImageValue|null|undefined} props.value
 * @param {(value: ImageValue) => void} props.onChange
 */
export function ImageEditor({ value, onChange }) {
  const src = value?.src ?? "";
  const alt = value?.alt ?? "";

  /** @param {Partial<ImageValue>} patch */
  const patch = (p) => onChange({ src, alt, ...p });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 12, color: "#6b7280" }}>Image URL</span>
        <input type="url" value={src} onChange={(e) => patch({ src: e.target.value })} placeholder="https://..." style={inputStyle}/>
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 12, color: "#6b7280" }}>Alt text</span>
        <input
          type="text"
          value={alt}
          onChange={(e) => patch({ alt: e.target.value })}
          style={inputStyle}
        />
      </label>
      {src ? (
        <img
          src={src}
          alt={alt}
          style={{
            maxWidth: "100%",
            maxHeight: 160,
            border: "1px solid #e5e7eb",
            borderRadius: 4,
            objectFit: "contain",
          }}
        />
      ) : null}
    </div>
  );
}

const inputStyle = {
  font: "inherit",
  padding: 8,
  border: "1px solid #d1d5db",
  borderRadius: 4,
};
