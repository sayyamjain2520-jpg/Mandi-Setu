import React, { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Camera,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

interface GateScannerProps {
  onScanSuccess: (tokenOrBookingNumber: string) => void
  isLoading?: boolean
}

export const GateScanner: React.FC<GateScannerProps> = ({
  onScanSuccess,
  isLoading = false,
}) => {
  const [manualInput, setManualInput] = useState('')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const startingRef = useRef(false)
  const mountedRef = useRef(true)
  const scanHandledRef = useRef(false)

  const elementId = 'gate-qr-reader'

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const value = manualInput.trim()

    if (!value || isLoading) return

    onScanSuccess(value)
    setManualInput('')
  }

  const stopCamera = async () => {
    const scanner = scannerRef.current

    scannerRef.current = null
    startingRef.current = false

    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop()
        }
      } catch (error) {
        console.warn('QR scanner stop warning:', error)
      }

      try {
        scanner.clear()
      } catch (error) {
        console.warn('QR scanner clear warning:', error)
      }
    }

    if (mountedRef.current) {
      setCameraActive(false)
    }
  }

  const processScannedValue = (decodedText: string) => {
    if (scanHandledRef.current) return

    const decoded = decodedText.trim()

    if (!decoded) return

    scanHandledRef.current = true
    setScannedFeedback(decoded)

    let valueToSend = decoded

    /*
     * Our MANDI SETU QR contains JSON.
     *
     * Example:
     * {
     *   type: "MANDI_SETU_BOOKING",
     *   bookingId: "...",
     *   bookingNumber: "MS-2026-XXXX",
     *   tokenNumber: "T-003"
     * }
     *
     * Prefer tokenNumber because Gate Check-In accepts
     * token number directly.
     */
    try {
      const parsed = JSON.parse(decoded)

      if (
        parsed &&
        typeof parsed === 'object' &&
        typeof parsed.tokenNumber === 'string' &&
        parsed.tokenNumber.trim()
      ) {
        valueToSend = parsed.tokenNumber.trim()
      } else if (
        parsed &&
        typeof parsed === 'object' &&
        typeof parsed.bookingNumber === 'string' &&
        parsed.bookingNumber.trim()
      ) {
        valueToSend = parsed.bookingNumber.trim()
      }
    } catch {
      /*
       * QR may contain plain:
       * T-003
       * or
       * MS-2026-XXXX
       */
    }

    console.log('QR SCANNED:', decoded)
    console.log('QR VALUE SENT TO GATE CHECK-IN:', valueToSend)

    if (valueToSend) {
      onScanSuccess(valueToSend)
    }

    void stopCamera()
  }

  const startCamera = async () => {
  if (startingRef.current || scannerRef.current) return

  setCameraError(null)
  setScannedFeedback(null)
  scanHandledRef.current = false
  startingRef.current = true
  setCameraActive(true)

  // Give React time to mount the scanner container.
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })

  if (!mountedRef.current) {
    startingRef.current = false
    return
  }

  const element = document.getElementById(elementId)

  if (!element) {
    startingRef.current = false
    setCameraActive(false)
    setCameraError(
      'Scanner area could not be initialized. Please try again.'
    )
    return
  }

  try {
    /*
     * Get the cameras available on this device.
     *
     * We do NOT force facingMode here because some
     * browsers/devices throw OverconstrainedError
     * when "environment" is unavailable as a constraint.
     */
    const cameras = await Html5Qrcode.getCameras()

    console.log('AVAILABLE CAMERAS:', cameras)

    if (!cameras || cameras.length === 0) {
      throw new Error(
        'No camera was found on this device.'
      )
    }

    /*
     * Prefer a rear/back/environment camera.
     * If the browser does not expose a useful label,
     * simply use the first available camera.
     */
    const preferredCamera =
      cameras.find((camera) => {
        const label = camera.label.toLowerCase()

        return (
          label.includes('back') ||
          label.includes('rear') ||
          label.includes('environment')
        )
      }) || cameras[0]

    console.log(
      'SELECTED QR CAMERA:',
      preferredCamera
    )

    const scanner = new Html5Qrcode(elementId)

    scannerRef.current = scanner

    await scanner.start(
      preferredCamera.id,
      {
        fps: 15,

        qrbox: {
          width: 300,
          height: 300,
        },

        disableFlip: false,
      },
      (decodedText) => {
        processScannedValue(decodedText)
      },
      () => {
        /*
         * QR decode failures are normal while the
         * scanner is searching for a QR code.
         */
      },
    )

    if (!mountedRef.current) {
      try {
        if (scanner.isScanning) {
          await scanner.stop()
        }
      } catch {
        // Ignore cleanup error.
      }

      try {
        scanner.clear()
      } catch {
        // Ignore cleanup error.
      }

      scannerRef.current = null
      startingRef.current = false
      return
    }

    startingRef.current = false
  } catch (error: unknown) {
    console.error(
      'QR scanner start failed:',
      error
    )

    const message =
      error instanceof Error
        ? error.message
        : 'Camera access denied or unavailable.'

    scannerRef.current = null
    startingRef.current = false

    try {
      const element = document.getElementById(elementId)

      if (element) {
        element.innerHTML = ''
      }
    } catch {
      // Ignore cleanup error.
    }

    if (mountedRef.current) {
      setCameraActive(false)
      setCameraError(message)
    }
  }
}

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false

      const scanner = scannerRef.current
      scannerRef.current = null
      startingRef.current = false

      if (scanner) {
        if (scanner.isScanning) {
          scanner.stop().catch(() => {})
        }

        try {
          scanner.clear()
        } catch {
          // Ignore cleanup error.
        }
      }
    }
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Gate Verification & Check-In
          </h3>

          <p className="text-xs text-slate-500">
            Scan farmer token QR or enter token number
          </p>
        </div>

        {!cameraActive ? (
          <Button
            size="sm"
            variant="outline"
            onClick={startCamera}
            disabled={isLoading}
            leftIcon={
              <Camera className="w-4 h-4 text-emerald-700" />
            }
          >
            Start Camera Scanner
          </Button>
        ) : (
          <Button
            size="sm"
            variant="danger"
            onClick={() => void stopCamera()}
          >
            Stop Camera
          </Button>
        )}
      </div>

      {/* Camera Viewport */}
      {cameraActive && (
        <div className="mb-4 relative rounded-xl overflow-hidden border-2 border-emerald-500 bg-black flex flex-col items-center justify-center min-h-[320px]">
          <div
            id={elementId}
            className="w-full max-w-lg"
          />

          <div className="absolute top-2 right-2 z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Scanning
            </span>
          </div>
        </div>
      )}

      {/* Camera Error */}
      {cameraError && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />

          <span>
            {cameraError} (Use manual input below instead)
          </span>
        </div>
      )}

      {/* Manual Input Fallback */}
      <form
        onSubmit={handleManualSubmit}
        className="flex gap-2"
      >
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
          disabled={!manualInput.trim() || isLoading}
          leftIcon={
            <CheckCircle2 className="w-4 h-4" />
          }
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
