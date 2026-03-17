import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * POST /api/ocr
 * Accepts a base64 JPEG image and sends it to Plate Recognizer for ALPR.
 * Falls back to a simple regex-based extraction if the API key is missing.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { image } = await req.json();
    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Missing image data" }, { status: 400 });
    }

    const apiKey = process.env.PLATE_RECOGNIZER_API_KEY;

    if (apiKey) {
      // ── Plate Recognizer API ─────────────────────────────────────────
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const formData = new FormData();
      formData.append("upload", base64Data);
      formData.append("regions", "in"); // India plates

      const response = await fetch("https://api.platerecognizer.com/v1/plate-reader/", {
        method: "POST",
        headers: { Authorization: `Token ${apiKey}` },
        body: formData,
      });

      if (!response.ok) {
        console.error("Plate Recognizer error:", response.status, await response.text());
        return NextResponse.json({ error: "OCR service error" }, { status: 502 });
      }

      const data = await response.json();
      const results = data.results ?? [];

      if (results.length === 0) {
        return NextResponse.json({ plate: null, confidence: 0, vehicle: null });
      }

      const best = results[0];
      return NextResponse.json({
        plate: best.plate?.toUpperCase() ?? null,
        confidence: best.score ?? 0,
        vehicle: best.vehicle
          ? {
              make: best.vehicle.make?.[0]?.name ?? null,
              model: best.vehicle.model?.[0]?.name ?? null,
              color: best.vehicle.color?.[0]?.name ?? null,
            }
          : null,
        region: best.region?.code ?? null,
      });
    }

    // ── Fallback: client-side Tesseract (no server key configured) ────
    return NextResponse.json({
      plate: null,
      confidence: 0,
      vehicle: null,
      fallback: true,
      message: "PLATE_RECOGNIZER_API_KEY not configured — use client-side fallback.",
    });
  } catch (error) {
    console.error("OCR route error:", error);
    return NextResponse.json({ error: "OCR processing failed" }, { status: 500 });
  }
}
