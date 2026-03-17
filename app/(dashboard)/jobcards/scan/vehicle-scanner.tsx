"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RotateCcw, StopCircle } from "lucide-react";

const SCAN_INTERVAL_MS = 1500; // Scan every 1.5s for faster detection
const CONSENSUS_COUNT = 2;      // Require 2 matching reads before accepting

function normalizePlate(text: string): string {
  const cleaned = text
    .replace(/\s/g, "")
    .replace(/[O]/gi, "0")
    .replace(/[I]/gi, "1")
    .toUpperCase();
  const match = cleaned.match(/[A-Z]{2}\d{1,2}[A-Z]{1,2}\d{1,4}/);
  return match ? match[0] : cleaned.slice(0, 12);
}

/** Apply contrast enhancement to a canvas for better OCR accuracy */
function enhanceContrast(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  // Simple contrast stretch: boost contrast by 40%
  const factor = (259 * (128 + 100)) / (255 * (259 - 100));
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));     // R
    data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128)); // G
    data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128)); // B
  }
  ctx.putImageData(imageData, 0, 0);
}

type ScanResult = {
  plate: string | null;
  confidence: number;
  vehicle: { make: string | null; model: string | null; color: string | null } | null;
  fallback?: boolean;
};

export function VehicleScanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recentPlatesRef = useRef<string[]>([]); // Multi-frame consensus buffer

  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [autoScanning, setAutoScanning] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [statusText, setStatusText] = useState("Initializing camera…");

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
    setAutoScanning(false);
    recentPlatesRef.current = [];
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setStatusText("Requesting camera access…");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setStatusText("Camera active — scanning will begin automatically");
      }
    } catch {
      setResult("Camera access denied or not available.");
    }
  }, []);

  /** Capture a frame with contrast preprocessing */
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.srcObject || video.readyState < 2) return null;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    // Enhance contrast for better plate readability
    enhanceContrast(ctx, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  }, []);

  const processFrame = useCallback(
    async (dataUrl: string): Promise<ScanResult | null> => {
      try {
        const res = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl }),
        });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    },
    []
  );

  const handlePlateFound = useCallback(
    async (plate: string) => {
      // Look up vehicle in the database
      const res = await fetch(`/api/vehicles/lookup?plate=${encodeURIComponent(plate)}`);
      const data = await res.json();
      if (data?.customerId && data?.vehicleId) {
        router.push(
          `/jobcards/new?customerId=${data.customerId}&vehicleId=${data.vehicleId}&plate=${encodeURIComponent(plate)}`
        );
        return;
      }
      router.push(`/jobcards/new?plate=${encodeURIComponent(plate)}`);
    },
    [router]
  );

  // ── Fallback: lazy-load Tesseract for client-side OCR ────────────────
  const fallbackClientOCR = useCallback(
    async (dataUrl: string) => {
      setScanning(true);
      setResult(null);
      setStatusText("Running client-side OCR (Tesseract)…");
      try {
        const Tesseract = await import("tesseract.js");
        const {
          data: { text },
        } = await Tesseract.recognize(dataUrl, "eng", { logger: () => {} });
        const plate = normalizePlate(text);
        setResult(plate || "No plate detected. Try again.");
        if (plate) await handlePlateFound(plate);
      } catch {
        setResult("Scan failed. Try again.");
      } finally {
        setScanning(false);
      }
    },
    [handlePlateFound]
  );

  // ── Auto-scan: captures a frame every SCAN_INTERVAL_MS ──────────────
  const startAutoScan = useCallback(() => {
    if (intervalRef.current) return;
    setAutoScanning(true);
    recentPlatesRef.current = [];
    setStatusText("Scanning… point at the number plate");

    intervalRef.current = setInterval(async () => {
      const frame = captureFrame();
      if (!frame) return;

      setScanning(true);
      const scanResult = await processFrame(frame);
      setScanning(false);

      if (scanResult?.plate && scanResult.confidence > 0.6) {
        const normalizedPlate = scanResult.plate.replace(/\s/g, "").toUpperCase();
        recentPlatesRef.current.push(normalizedPlate);

        // Keep only the last 5 reads
        if (recentPlatesRef.current.length > 5) {
          recentPlatesRef.current = recentPlatesRef.current.slice(-5);
        }

        // Multi-frame consensus: accept only if the same plate appeared >= CONSENSUS_COUNT times
        const plateCount = recentPlatesRef.current.filter((p) => p === normalizedPlate).length;
        if (plateCount >= CONSENSUS_COUNT) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          setAutoScanning(false);
          setResult(normalizedPlate);
          setConfidence(scanResult.confidence);
          setStatusText(`Plate confirmed: ${normalizedPlate}`);
          await handlePlateFound(normalizedPlate);
        } else {
          setStatusText(`Detected "${normalizedPlate}" — confirming…`);
        }
      } else if (scanResult?.fallback) {
        // No API key — fall back to single manual capture with client OCR
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setAutoScanning(false);
        await fallbackClientOCR(frame);
      }
    }, SCAN_INTERVAL_MS);
  }, [captureFrame, processFrame, handlePlateFound, fallbackClientOCR]);

  // ── Auto-start camera on mount ──────────────────────────────────────
  useEffect(() => {
    startCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-start scanning when camera becomes active ──────────────────
  useEffect(() => {
    if (cameraActive && !autoScanning && !result) {
      // Small delay to let the video feed stabilize
      const timer = setTimeout(() => startAutoScan(), 800);
      return () => clearTimeout(timer);
    }
  }, [cameraActive, autoScanning, result, startAutoScan]);

  return (
    <div className="space-y-4">
      <div className="relative aspect-video max-w-lg overflow-hidden rounded-lg bg-muted">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
            <span className="text-sm">{statusText}</span>
          </div>
        )}
        {autoScanning && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1 text-xs font-medium text-white">
            <Loader2 className="size-3 animate-spin" />
            Auto-scanning…
          </div>
        )}
        {/* Status bar */}
        {cameraActive && (
          <div className="absolute bottom-0 inset-x-0 bg-black/60 px-3 py-1.5 text-xs text-white/90 text-center">
            {statusText}
          </div>
        )}
        {/* Viewfinder overlay */}
        {cameraActive && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-[10%] right-[10%] top-[30%] bottom-[30%] rounded-lg border-2 border-white/50" />
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {cameraActive && (
          <Button
            size="lg"
            variant="outline"
            onClick={stopCamera}
            className="min-h-[44px]"
          >
            <StopCircle className="mr-2 size-5" />
            Stop camera
          </Button>
        )}
      </div>
      {result && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm font-medium">Detected: {result}</p>
            {confidence > 0 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Confidence: {(confidence * 100).toFixed(1)}%
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              If a match was found, you were redirected to the new job card form with details
              prefilled.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => {
                setResult(null);
                setConfidence(0);
                recentPlatesRef.current = [];
                if (cameraActive) {
                  startAutoScan();
                } else {
                  startCamera();
                }
              }}
            >
              <RotateCcw className="mr-1.5 size-3.5" />
              Scan another
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
