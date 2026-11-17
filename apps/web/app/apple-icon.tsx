import { ImageResponse } from "next/og";

/** iOS ana ekran simgesi: kenardan kenara kobalt, iOS köşeyi kendisi yuvarlar. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", backgroundColor: "#1d3fa8" }}>
        <svg width="180" height="180" viewBox="0 0 24 24">
          <path d="M6 7.5h12M6 12h6.5M6 16.5h9" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="15.2" y="10.2" width="3.6" height="3.6" fill="#fff" />
        </svg>
      </div>
    ),
    size,
  );
}
