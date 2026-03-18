import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Kabengo Safaris - Unforgettable African Safari Experiences";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1a0f00 0%, #3d2200 40%, #5a3300 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <div
            style={{
              fontSize: "72px",
              fontWeight: 700,
              color: "#ffffff",
              textAlign: "center",
              lineHeight: 1.1,
              letterSpacing: "-1px",
            }}
          >
            Kabengo Safaris
          </div>
          <div
            style={{
              width: "80px",
              height: "4px",
              background: "#c17f24",
              borderRadius: "2px",
            }}
          />
          <div
            style={{
              fontSize: "28px",
              color: "#d4a574",
              textAlign: "center",
              lineHeight: 1.4,
              maxWidth: "800px",
            }}
          >
            Unforgettable African Safari Experiences
          </div>
          <div
            style={{
              fontSize: "18px",
              color: "#a08060",
              textAlign: "center",
              marginTop: "16px",
            }}
          >
            Tanzania &bull; Serengeti &bull; Ngorongoro &bull; Kilimanjaro &bull; Zanzibar
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            fontSize: "14px",
            color: "#806040",
          }}
        >
          kabengosafaris.com
        </div>
      </div>
    ),
    { ...size }
  );
}
