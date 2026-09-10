import React, { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Camera, Search, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'

interface GateScannerProps {
  onScanSuccess: (tokenOrBookingNumber: string) => void
  isLoading?: boolean
}

export const GateScanner: React.FC<GateScannerProps> = ({ onScanSuccess, isLoading = false }) => {
  const [manualInput, setManualInput] = useState('')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const elementId = 'gate-qr-reader'

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualInput.trim()) return
    onScanSuccess(manualInput.trim())
    setManualInput('')
  }

  const startCamera = async () => {
    setCameraError(null)
    setCameraActive(true)

    // Delay briefly to allow DOM element to render
    setTimeout(async () => {
      try {
        const qrCode = new Html5Qrcode(elementId)
        scannerRef.current = qrCode

        await qrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Process scanned text
            setScannedFeedback(decodedText)
            try {
              // Parse JSON if encoded
              const parsed = JSON.parse(decodedText)
              if (parsed.tokenNumber) {
                onScanSuccess(parsed.tokenNumber)
              } else if (parsed.bookingNumber) {
                onScanSuccess(parsed.bookingNumber)
              } else {
                onScanSuccess(decodedText)
              }
            } catch {
              onScanSuccess(decodedText)
            }
            stopCamera()
          },
          () => {
            // Frame parse error (expected when no QR in frame)
          }
        )
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Camera access denied or unavailable'
        setCameraError(errMsg)
        setCameraActive(false)
      }
    }, 200)
  }

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch {
        // Ignore stop error
      }
    }
    setCameraActive(false)
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Gate Verification & Check-In</h3>
          <p className="text-xs text-slate-500">Scan farmer token QR or enter token number</p>
        </div>
        {!cameraActive ? (
          <Button
            size="sm"
            variant="outline"
            onClick={startCamera}
            leftIcon={<Camera className="w-4 h-4 text-emerald-700" />}
          >
            Start Camera Scanner
          </Button>
        ) : (
          <Button size="sm" variant="danger" onClick={stopCamera}>
            Stop Camera
          </Button>
        )}
      </div>

      {/* Camera Viewport */}
      {cameraActive && (
        <div className="mb-4 relative rounded-xl overflow-hidden border-2 border-emerald-500 bg-black flex flex-col items-center justify-center min-h-[260px]">
          <div id={elementId} className="w-full max-w-sm"></div>
          <div className="absolute top-2 right-2 z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Scanning
            </span>
          </div>
        </div>
      )}

      {cameraError && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{cameraError} (Use manual input below instead)</span>
        </div>
      )}

      {/* Manual Input Fallback */}
      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="e.g. T-001 or MS-2026-1001"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={!manualInput.trim()}
          leftIcon={<CheckCircle2 className="w-4 h-4" />}
        >
          Verify & Admit
        </Button>
      </form>

      {scannedFeedback && (
        <p className="mt-2 text-[11px] text-slate-500 truncate font-mono">
          Last scanned: {scannedFeedback}
        </p>
      )}
    </div>
  )
}
