import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
};

const FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.ITF,
];

export const BarcodeScanner = ({ open, onClose, onDetected }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError(null);
    setStarting(true);

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, FORMATS);
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new BrowserMultiFormatReader(hints);

    (async () => {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        // Prefer back/environment camera
        const back = devices.find((d) => /back|rear|environment/i.test(d.label)) ?? devices[devices.length - 1];
        const deviceId = back?.deviceId;

        const controls = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current!,
          (result, _err, ctrl) => {
            if (result && !cancelled) {
              const text = result.getText();
              ctrl.stop();
              onDetected(text);
            }
          },
        );
        if (cancelled) controls.stop();
        else controlsRef.current = controls;
        setStarting(false);
      } catch (e: any) {
        console.error("Scanner error:", e);
        setError(e?.message || "Could not access camera. Please allow camera permission.");
        setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open, onDetected]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>Scan barcode</DialogTitle>
        </DialogHeader>
        <div className="relative aspect-[3/4] w-full bg-black">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          {/* Overlay frame */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-32 w-4/5 rounded-lg border-2 border-primary-glow shadow-glow" />
          </div>
          {starting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-primary-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Starting camera…</p>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 p-6 text-center text-primary-foreground">
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 p-3">
          <p className="text-xs text-muted-foreground">Point at a barcode and hold steady</p>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="mr-1 h-4 w-4" /> Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
