"use client";

/**
 * @file Image block editor. URL-only for now - upload UI lands later;
 * value shape: `{ src: string, alt: string }`.
 */

import { fieldStyle, labelStyle, labelTextStyle } from "./styles.js";

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
      <label style={labelStyle}>
        <span style={labelTextStyle}>Görsel URL</span>
        <input
          type="url"
          value={src}
          onChange={(e) => patch({ src: e.target.value })}
          placeholder="https://..."
          className="skylab-cms-field"
          style={fieldStyle}
        />
      </label>
      <label style={labelStyle}>
        <span style={labelTextStyle}>Alt Metin</span>
        <input
          type="text"
          value={alt}
          onChange={(e) => patch({ alt: e.target.value })}
          className="skylab-cms-field"
          style={fieldStyle}
        />
      </label>
      {src ? (
        <img
          src={src}
          alt={alt}
          style={{
            maxWidth: "100%",
            maxHeight: 180,
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            objectFit: "contain",
            background: "rgba(255,255,255,0.03)",
          }}
        />
      ) : (
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            height: 90,
            background:
              "repeating-linear-gradient(45deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03) 6px, rgba(255,255,255,0.05) 6px, rgba(255,255,255,0.05) 12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontFamily:
              "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          görsel önizlemesi
        </div>
      )}
    </div>
  );
}
