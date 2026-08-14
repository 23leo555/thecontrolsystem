import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Favicon generowany z tokenów marki (sekcja 22). */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d0f12",
          border: "2px solid #c6a05a",
          borderRadius: 7,
        }}
      >
        <div style={{ width: 12, height: 12, background: "#c6a05a", borderRadius: 2 }} />
      </div>
    ),
    { ...size },
  );
}
