"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Square, Loader2, RotateCcw } from "lucide-react";

function normalizePlate(text: string): string {
  const cleaned = text
    .replace(/\s/g, "")
    .replace(/[O]/gi, "0")
    .replace(/[I]/gi, "1")
    .toUpperCase();
  const match = cleaned.match(/[A-Z]{2}\d{1,2}[A-Z]{1,2}\d{1,4}/);
  return match ? match[0] : cleaned.slice(0, 12);
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

  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [autoScanning, setAutoScanning] = useState(false);
  const [confidence, setConfidence] = useState(0);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
    setAutoScanning(false);
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
      }
    } catch {
      setResult("Camera access denied or not available.");
    }
  }, []);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.srcObject) return null;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
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

  // ── Auto-scan: captures a frame every 2 seconds ──────────────────────
  const startAutoScan = useCallback(() => {
    if (intervalRef.current) return;
    setAutoScanning(true);

    intervalRef.current = setInterval(async () => {
      const frame = captureFrame();
      if (!frame) return;

      setScanning(true);
      const scanResult = await processFrame(frame);
      setScanning(false);

      if (scanResult?.plate && scanResult.confidence > 0.7) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setAutoScanning(false);
        setResult(scanResult.plate);
        setConfidence(scanResult.confidence);
        await handlePlateFound(scanResult.plate);
      } else if (scanResult?.fallback) {
        // No API key — fall back to single manual capture with client OCR
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setAutoScanning(false);
        await fallbackClientOCR(frame);
      }
    }, 2000);
  }, [captureFrame, processFrame, handlePlateFound]);

  // ── Fallback: lazy-load Tesseract for client-side OCR ────────────────
  const fallbackClientOCR = useCallback(
    async (dataUrl: string) => {
      setScanning(true);
      setResult(null);
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

  const captureAndScan = useCallback(async () => {
    const frame = captureFrame();
    if (!frame) return;

    setScanning(true);
    setResult(null);

    const scanResult = await processFrame(frame);

    if (scanResult?.plate) {
      setResult(scanResult.plate);
      setConfidence(scanResult.confidence);
      setScanning(false);
      await handlePlateFound(scanResult.plate);
    } else if (scanResult?.fallback) {
      await fallbackClientOCR(frame);
    } else {
      setResult("No plate detected. Try again.");
      setScanning(false);
    }
  }, [captureFrame, processFrame, handlePlateFound, fallbackClientOCR]);

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
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            Camera off
          </div>
        )}
        {autoScanning && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1 text-xs font-medium text-white">
            <Loader2 className="size-3 animate-spin" />
            Auto-scanning…
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
        {!cameraActive ? (
          <Button size="lg" onClick={startCamera} className="min-h-[44px]">
            <Camera className="mr-2 size-5" />
            Open camera
          </Button>
        ) : (
          <>
            {!autoScanning && (
              <Button
                size="lg"
                onClick={startAutoScan}
                className="min-h-[44px] bg-green-600 hover:bg-green-700"
              >
                <Loader2 className="mr-2 size-5" />
                Start auto-scan
              </Button>
            )}
            <Button
              size="lg"
              onClick={captureAndScan}
              disabled={scanning}
              className="min-h-[44px]"
            >
              <Square className="mr-2 size-5" />
              {scanning ? "Scanning…" : "Capture & scan"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={stopCamera}
              className="min-h-[44px]"
            >
              Stop camera
            </Button>
          </>
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
                startAutoScan();
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
