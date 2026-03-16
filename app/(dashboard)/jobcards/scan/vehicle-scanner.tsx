"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Square } from "lucide-react";

function normalizePlate(text: string): string {
  const cleaned = text
    .replace(/\s/g, "")
    .replace(/[O]/gi, "0")
    .replace(/[I]/gi, "1")
    .toUpperCase();
  const match = cleaned.match(/[A-Z]{2}\d{1,2}[A-Z]{1,2}\d{1,4}/);
  return match ? match[0] : cleaned.slice(0, 12);
}

export function VehicleScanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
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

  const captureAndScan = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.srcObject) return;

    setScanning(true);
    setResult(null);

    try {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

      // FIX: lazy-import the Tesseract module directly inside the async function.
      // next/dynamic() wraps React components — it cannot be used for raw JS modules.
      const Tesseract = await import("tesseract.js");
      const {
        data: { text },
      } = await Tesseract.recognize(dataUrl, "eng", { logger: () => {} });

      const plate = normalizePlate(text);
      setResult(plate || "No plate text detected. Try again.");

      if (plate) {
        const res = await fetch(`/api/vehicles/lookup?plate=${encodeURIComponent(plate)}`);
        const data = await res.json();
        if (data?.customerId && data?.vehicleId) {
          router.push(
            `/jobcards/new?customerId=${data.customerId}&vehicleId=${data.vehicleId}&plate=${encodeURIComponent(plate)}`
          );
          return;
        }
        router.push(`/jobcards/new?plate=${encodeURIComponent(plate)}`);
      }
    } catch {
      setResult("Scan failed. Try again.");
    } finally {
      setScanning(false);
    }
  }, [router]);

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
      </div>
      <div className="flex flex-wrap gap-2">
        {!cameraActive ? (
          <Button size="lg" onClick={startCamera} className="min-h-[44px]">
            <Camera className="mr-2 size-5" />
            Open camera
          </Button>
        ) : (
          <>
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
            <p className="mt-1 text-xs text-muted-foreground">
              If a match was found, you were redirected to the new job card form with details
              prefilled.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

