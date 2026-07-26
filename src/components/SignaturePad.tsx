"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

type Props = {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  label?: string;
};

export default function SignaturePad({ value, onChange, label = "Signature" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dialogCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"draw" | "text">("draw");
  const [textValue, setTextValue] = useState("");

  // ensure Ballet font is available
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!document.getElementById("sig-font")) {
      const link = document.createElement("link");
      link.id = "sig-font";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Ballet&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;
    // render preview image or placeholder
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, c.width, c.height);
    if (value) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, c.width, c.height);
        const scale = Math.min(c.width / img.naturalWidth, c.height / img.naturalHeight);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        ctx.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h);
      };
      img.src = value;
    } else {
      ctx.strokeStyle = "#cbd5e1";
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1;
      ctx.strokeRect(2, 2, c.width - 4, c.height - 4);
      ctx.setLineDash([]);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px system-ui";
      ctx.fillText("Tap to sign", 10, c.height / 2 + 6);
    }
  }, [value]);

  function openDialog() {
    setOpen(true);
    // prepare dialog canvas shortly after open
    setTimeout(() => {
      const c = dialogCanvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctxRef.current = ctx;
      // white background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, c.width, c.height);
      // if we have a saved value, draw it into the dialog canvas
      if (value) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          ctx.clearRect(0, 0, c.width, c.height);
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, c.width, c.height);
          const scale = Math.min(c.width / img.naturalWidth, c.height / img.naturalHeight);
          const w = img.naturalWidth * scale;
          const h = img.naturalHeight * scale;
          ctx.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h);
        };
        img.src = value;
      }
    }, 50);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = dialogCanvasRef.current;
    const ctx = ctxRef.current;
    if (!c || !ctx) return;
    drawing.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    lastPoint.current = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
  }
  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const c = dialogCanvasRef.current;
    const ctx = ctxRef.current;
    if (!c || !ctx || !lastPoint.current) return;
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPoint.current = { x, y };
  }
  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = false;
    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
    lastPoint.current = null;
  }

  function clearCanvas() {
    const c = dialogCanvasRef.current;
    const ctx = ctxRef.current;
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, c.width, c.height);
    setTextValue("");
  }

  function saveCanvas() {
    const c = dialogCanvasRef.current;
    if (!c) return;
    const data = c.toDataURL("image/png");
    onChange(data);
    setOpen(false);
  }

  function renderTextToCanvas(text: string) {
    const c = dialogCanvasRef.current;
    const ctx = ctxRef.current;
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#111827";
    const fontSize = Math.min(140, Math.max(84, c.width / Math.max(4, text.length)));
    ctx.font = `${fontSize}px 'Ballet', cursive`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(text, c.width / 2, c.height / 2 + fontSize * 0.08);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "#111827";
    ctx.strokeText(text, c.width / 2, c.height / 2 + fontSize * 0.08);
  }

  return (
    <div>
      <div className="relative">
        <canvas
        ref={canvasRef}
        width={360}
        height={100}
        className="w-full h-24 rounded"
        style={{ fontVariationSettings: '"opsz" 144' }}
        onClick={openDialog}
      />
        {value ? (
          <button
            aria-label="Clear signature"
            className="absolute right-1 top-1 bg-white rounded-full p-1 shadow"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
          >
            <X className="h-3 w-3 text-red-600" />
          </button>
        ) : null}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <div style={{ display: "none" }} />
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>Draw your signature or type it as an alternative.</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="flex gap-2 mb-2">
              <Button variant={mode === "draw" ? "default" : "ghost"} size="sm" onClick={() => setMode("draw")}>Draw</Button>
              <Button variant={mode === "text" ? "default" : "ghost"} size="sm" onClick={() => setMode("text")}>Type</Button>
              <div className="ml-auto" />
              <Button variant="ghost" size="sm" onClick={clearCanvas}>Clear</Button>
            </div>
            <div className="rounded border bg-white p-2">
              <canvas
                ref={dialogCanvasRef}
                width={600}
                height={240}
                className="w-full touch-none"
                style={{ fontVariationSettings: '"opsz" 144' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              />
            </div>
            {mode === "text" && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                <Input value={textValue} onChange={(e) => setTextValue(e.target.value)} placeholder="Type name" />
                <Button onClick={() => renderTextToCanvas(textValue)}>Render</Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={saveCanvas}>Save signature</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
