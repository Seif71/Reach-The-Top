import { ImageResponse } from "next/og";

export const alt = "Own the #1 Spot.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#ffffff",
          color: "#111827",
        }}
      >
        <div style={{ fontSize: 22, color: "#b91c1c" }}>ReachTheTop</div>
        <div style={{ fontSize: 72, marginTop: 20, fontWeight: 600 }}>Own the #1 spot.</div>
        <div style={{ fontSize: 28, marginTop: 16, color: "#6b7280" }}>
          Bid higher. Get seen. Get ahead.
        </div>
      </div>
    ),
    size,
  );
}
