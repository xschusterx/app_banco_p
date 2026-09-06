import { useEffect, useRef, useState } from 'react'

type SignaturePadProps = {
  label: string
  value: string | null
  onChange: (dataUrl: string | null) => void
  disabled?: boolean
}

/**
 * Canvas de assinatura com mouse/toque.
 * Emite PNG dataURL ao soltar o ponteiro; Limpar zera o traço.
 */
export function SignaturePad({ label, value, onChange, disabled = false }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)
  const lastRef = useRef<{ x: number; y: number } | null>(null)
  const [hasInk, setHasInk] = useState(Boolean(value))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    const width = canvas.clientWidth || 320
    const height = canvas.clientHeight || 160
    canvas.width = Math.floor(width * ratio)
    canvas.height = Math.floor(height * ratio)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#14241d'
    ctx.lineWidth = 2.4

    if (value) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height)
        setHasInk(true)
      }
      img.src = value
    } else {
      setHasInk(false)
    }
  }, [value])

  function pointFromEvent(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return
    const canvas = canvasRef.current
    const point = pointFromEvent(event)
    if (!canvas || !point) return
    canvas.setPointerCapture(event.pointerId)
    drawingRef.current = true
    lastRef.current = point
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled || !drawingRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const point = pointFromEvent(event)
    const last = lastRef.current
    if (!canvas || !ctx || !point || !last) return
    ctx.beginPath()
    ctx.moveTo(last.x, last.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    lastRef.current = point
    if (!hasInk) setHasInk(true)
  }

  function finishStroke(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return
    drawingRef.current = false
    lastRef.current = null
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      canvas.releasePointerCapture(event.pointerId)
    } catch {
      // ignore
    }
    onChange(canvas.toDataURL('image/png'))
  }

  function handleClear() {
    if (disabled) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const width = canvas.clientWidth || 320
    const height = canvas.clientHeight || 160
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    setHasInk(false)
    onChange(null)
  }

  return (
    <div className={`signature-pad ${disabled ? 'disabled' : ''}`}>
      <div className="signature-pad-head">
        <span>{label}</span>
        <button type="button" className="btn ghost compact" onClick={handleClear} disabled={disabled || !hasInk}>
          Limpar
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="signature-canvas"
        aria-label={label}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
      />
      <p className="hint">{hasInk ? 'Assinatura capturada.' : 'Assine com o dedo ou o mouse neste campo.'}</p>
    </div>
  )
}
