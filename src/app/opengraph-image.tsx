import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "THE CONTROL SYSTEM by Krystian Ćwik";

/** Obrazek Open Graph (sekcja 22) — spójny z design systemem, bez stocków. */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0d0f12",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #c6a05a",
              borderRadius: 10,
            }}
          >
            <div style={{ width: 18, height: 18, background: "#c6a05a", borderRadius: 3 }} />
          </div>
          <div style={{ color: "#ffffff", fontSize: 24, fontWeight: 700, letterSpacing: 6 }}>
            THE CONTROL SYSTEM
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: "#ffffff", fontSize: 62, fontWeight: 800, lineHeight: 1.1 }}>
            Odzyskaj kontrolę nad ciałem,
          </div>
          <div style={{ color: "#ffffff", fontSize: 62, fontWeight: 800, lineHeight: 1.1 }}>
            energią i codziennym życiem
          </div>
          <div style={{ color: "#aeb7c2", fontSize: 28, marginTop: 24 }}>
            Prywatny mentoring premium · 90 dni
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 60, height: 3, background: "#c6a05a" }} />
          <div style={{ color: "#c6a05a", fontSize: 22, letterSpacing: 3 }}>
            KRYSTIAN ĆWIK
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
