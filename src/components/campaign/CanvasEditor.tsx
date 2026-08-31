'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { CampaignFormat, LeadContactType } from '@/types/database'
import { recordCampaignLeadAndDownload } from '@/actions/campaigns'
import { DownloadLeadModal } from '@/components/campaign/DownloadLeadModal'
import { CelebrationModal } from '@/components/campaign/CelebrationModal'
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  Move,
  RefreshCcw,
  Image as ImageIcon,
  Sliders,
  Download,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Crosshair,
  Ratio,
  Square,
  Circle,
  Smartphone,
} from 'lucide-react'

interface CanvasEditorProps {
  frameUrl: string
  userPhotoFile: File
  campaignTitle: string
  campaignSlug?: string
  campaignId?: string
  format?: CampaignFormat
  onFormatChange?: (format: CampaignFormat) => void
  onResetPhoto: () => void
}

export function CanvasEditor({
  frameUrl,
  userPhotoFile,
  campaignTitle,
  campaignSlug = 'campanha',
  campaignId,
  format: initialFormat = '1:1',
  onFormatChange,
  onResetPhoto,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Dynamic active format chosen by end user
  const [activeFormat, setActiveFormat] = useState<CampaignFormat>(initialFormat)

  // Synchronize when parent format changes
  useEffect(() => {
    setActiveFormat(initialFormat)
  }, [initialFormat])

  const handleFormatChange = (newFormat: CampaignFormat) => {
    setActiveFormat(newFormat)
    onFormatChange?.(newFormat)
  }

  // Dynamic canvas dimensions based on chosen format
  const canvasWidth = 1080
  const canvasHeight = (activeFormat === '4:5' || activeFormat === '3:4') ? 1350 : 1080

  // State of transformations
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0) // in degrees
  const [flipH, setFlipH] = useState(false)

  // Drag & Multi-touch Pinch state
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const dragInitialPosRef = useRef({ x: 0, y: 0 })
  const pinchStartDistanceRef = useRef<number | null>(null)
  const pinchStartScaleRef = useRef(1)

  // Lead Modal & Celebration Modal states
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false)
  const [isCelebrationModalOpen, setIsCelebrationModalOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  // Loaded image elements
  const userImgRef = useRef<HTMLImageElement | null>(null)
  const frameImgRef = useRef<HTMLImageElement | null>(null)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Animation frame ref for 60fps rendering
  const animFrameIdRef = useRef<number | null>(null)

  // 1. Load Images
  useEffect(() => {
    let isCancelled = false
    setImagesLoaded(false)
    setLoadError(null)

    const frameImg = new Image()
    frameImg.crossOrigin = 'anonymous'
    frameImg.src = frameUrl

    const userImg = new Image()
    const userPhotoUrl = URL.createObjectURL(userPhotoFile)
    userImg.src = userPhotoUrl

    let frameReady = false
    let userReady = false

    const checkBothLoaded = () => {
      if (frameReady && userReady && !isCancelled) {
        userImgRef.current = userImg
        frameImgRef.current = frameImg

        // Compute initial scale to cover canvas optimally
        const scaleX = 1080 / userImg.naturalWidth
        const scaleY = 1080 / userImg.naturalHeight
        const initialScale = Math.max(scaleX, scaleY, 1)

        setScale(initialScale)
        setPosition({ x: 0, y: 0 })
        setRotation(0)
        setFlipH(false)
        setImagesLoaded(true)
      }
    }

    frameImg.onload = () => {
      frameReady = true
      checkBothLoaded()
    }
    frameImg.onerror = () => {
      if (!isCancelled) {
        setLoadError('Não foi possível carregar a moldura da campanha. Verifique as configurações de CORS do bucket.')
      }
    }

    userImg.onload = () => {
      userReady = true
      checkBothLoaded()
    }
    userImg.onerror = () => {
      if (!isCancelled) {
        setLoadError('Não foi possível processar a foto selecionada.')
      }
    }

    return () => {
      isCancelled = true
      URL.revokeObjectURL(userPhotoUrl)
    }
  }, [frameUrl, userPhotoFile])

  // 2. High-Performance 60 FPS Canvas Render Loop
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !imagesLoaded || !userImgRef.current || !frameImgRef.current) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Ensure high quality smoothing
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    // Save global state
    ctx.save()

    // If active format is circle, apply smooth anti-aliased circular clip mask
    if (activeFormat === 'circle') {
      ctx.beginPath()
      ctx.arc(canvasWidth / 2, canvasHeight / 2, canvasWidth / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
    }

    // --- LAYER 1: User Photo ---
    ctx.save()
    // Center point for transformations
    ctx.translate(canvasWidth / 2 + position.x, canvasHeight / 2 + position.y)
    // Rotation
    ctx.rotate((rotation * Math.PI) / 180)
    // Scale and horizontal flip
    ctx.scale(flipH ? -scale : scale, scale)

    // Draw user image centered at origin
    const uWidth = userImgRef.current.naturalWidth
    const uHeight = userImgRef.current.naturalHeight
    ctx.drawImage(userImgRef.current, -uWidth / 2, -uHeight / 2, uWidth, uHeight)
    ctx.restore()

    // --- LAYER 2: Campaign Official Frame ---
    const frame = frameImgRef.current
    const frameRatio = frame.naturalWidth / frame.naturalHeight
    const canvasRatio = canvasWidth / canvasHeight

    if (Math.abs(frameRatio - canvasRatio) < 0.05) {
      // Natural 1:1 or 4:5 match
      ctx.drawImage(frame, 0, 0, canvasWidth, canvasHeight)
    } else {
      // Proportional fit: preserve graphics, logos and numbers without distortion
      const drawWidth = Math.min(canvasWidth, canvasHeight * frameRatio)
      const drawHeight = drawWidth / frameRatio
      const offsetX = (canvasWidth - drawWidth) / 2
      const offsetY = (canvasHeight - drawHeight) / 2
      ctx.drawImage(frame, offsetX, offsetY, drawWidth, drawHeight)
    }

    // Restore global state
    ctx.restore()
  }, [imagesLoaded, position, scale, rotation, flipH, canvasWidth, canvasHeight, activeFormat])

  // Synchronize rendering with requestAnimationFrame
  useEffect(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current)
    }
    animFrameIdRef.current = requestAnimationFrame(renderCanvas)
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current)
      }
    }
  }, [renderCanvas])

  // 3. Pointer & Multi-Touch Gesture Handlers
  const getCanvasScaleRatio = () => {
    if (!containerRef.current) return 1
    const rect = containerRef.current.getBoundingClientRect()
    return canvasWidth / rect.width
  }

  // Mouse / Pointer Down
  const handlePointerDown = (clientX: number, clientY: number) => {
    setIsDragging(true)
    dragStartRef.current = { x: clientX, y: clientY }
    dragInitialPosRef.current = { ...position }
  }

  // Mouse / Pointer Move
  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging) return
    const ratio = getCanvasScaleRatio()
    const deltaX = (clientX - dragStartRef.current.x) * ratio
    const deltaY = (clientY - dragStartRef.current.y) * ratio

    setPosition({
      x: dragInitialPosRef.current.x + deltaX,
      y: dragInitialPosRef.current.y + deltaY,
    })
  }

  const handlePointerUp = () => {
    setIsDragging(false)
    pinchStartDistanceRef.current = null
  }

  // Multi-Touch Handlers (1-finger drag + 2-finger pinch-to-zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)
    } else if (e.touches.length === 2) {
      setIsDragging(false)
      const t1 = e.touches[0]
      const t2 = e.touches[1]
      const distance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
      pinchStartDistanceRef.current = distance
      pinchStartScaleRef.current = scale
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)
    } else if (e.touches.length === 2 && pinchStartDistanceRef.current !== null) {
      const t1 = e.touches[0]
      const t2 = e.touches[1]
      const currentDistance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
      const factor = currentDistance / pinchStartDistanceRef.current
      const newScale = Math.min(Math.max(0.2, pinchStartScaleRef.current * factor), 5)
      setScale(newScale)
    }
  }

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08
    setScale((prev) => Math.min(Math.max(0.2, Number((prev + zoomDelta).toFixed(3))), 5))
  }

  // Preset Handlers
  const handleReset = () => {
    if (userImgRef.current) {
      const scaleX = canvasWidth / userImgRef.current.naturalWidth
      const scaleY = canvasHeight / userImgRef.current.naturalHeight
      const initialScale = Math.max(scaleX, scaleY, 1)
      setScale(initialScale)
    } else {
      setScale(1)
    }
    setPosition({ x: 0, y: 0 })
    setRotation(0)
    setFlipH(false)
  }

  const handleCenter = () => {
    setPosition({ x: 0, y: 0 })
  }

  const handleFit = () => {
    if (userImgRef.current) {
      const scaleX = canvasWidth / userImgRef.current.naturalWidth
      const scaleY = canvasHeight / userImgRef.current.naturalHeight
      setScale(Math.min(scaleX, scaleY))
      setPosition({ x: 0, y: 0 })
    }
  }

  const handleFill = () => {
    if (userImgRef.current) {
      const scaleX = canvasWidth / userImgRef.current.naturalWidth
      const scaleY = canvasHeight / userImgRef.current.naturalHeight
      setScale(Math.max(scaleX, scaleY))
      setPosition({ x: 0, y: 0 })
    }
  }

  const rotateBy = (deg: number) => {
    setRotation((prev) => (prev + deg) % 360)
  }

  // Keyboard navigation for precision fine-tuning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return

      const step = e.shiftKey ? 10 : 2
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          setPosition((p) => ({ ...p, y: p.y - step }))
          break
        case 'ArrowDown':
          e.preventDefault()
          setPosition((p) => ({ ...p, y: p.y + step }))
          break
        case 'ArrowLeft':
          e.preventDefault()
          setPosition((p) => ({ ...p, x: p.x - step }))
          break
        case 'ArrowRight':
          e.preventDefault()
          setPosition((p) => ({ ...p, x: p.x + step }))
          break
        case '+':
        case '=':
          e.preventDefault()
          setScale((s) => Math.min(5, s + 0.05))
          break
        case '-':
        case '_':
          e.preventDefault()
          setScale((s) => Math.max(0.2, s - 0.05))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 4. Initiates download flow by opening lead capture modal
  const handleInitiateDownload = () => {
    if (!imagesLoaded) return
    setIsLeadModalOpen(true)
  }

  // 5. Executes Lead recording + Image file download + Confetti Celebration
  const handleProcessDownload = async (leadData: {
    contactType: LeadContactType
    contactValue: string
    userName?: string
  }) => {
    const canvas = canvasRef.current
    if (!canvas) return

    setDownloading(true)
    try {
      // 1. Record lead in Supabase & increment download counter
      if (campaignId) {
        await recordCampaignLeadAndDownload({
          campaignId,
          contactType: leadData.contactType,
          contactValue: leadData.contactValue,
          userName: leadData.userName,
        })
      }

      // 2. Export high-res PNG file to device
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setDownloading(false)
            alert('Não foi possível gerar o arquivo de imagem. Tente novamente.')
            return
          }

          const blobUrl = URL.createObjectURL(blob)
          const link = document.createElement('a')
          const safeSlug = (campaignSlug || 'campanha')
            .toLowerCase()
            .replace(/[^a-z0-9_-]/gi, '_')

          const formatTag =
            activeFormat === 'circle'
              ? 'circular'
              : activeFormat === '4:5' || activeFormat === '3:4'
              ? 'retrato_4x5'
              : 'quadrado_1x1'

          link.download = `avatar_${safeSlug}_${formatTag}_${Date.now()}.png`
          link.href = blobUrl
          document.body.appendChild(link)
          link.click()

          setTimeout(() => {
            if (document.body.contains(link)) {
              document.body.removeChild(link)
            }
            URL.revokeObjectURL(blobUrl)
          }, 1500)

          setDownloading(false)
          setIsLeadModalOpen(false)
          setDownloadSuccess(true)
          setIsCelebrationModalOpen(true)
        },
        'image/png',
        1.0
      )
    } catch (err: any) {
      console.error('Erro ao processar download:', err)
      setDownloading(false)
      alert('Erro ao exportar a imagem. Tente novamente.')
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {loadError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Interactive Canvas */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
            onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handlePointerUp}
            className={`relative w-full overflow-hidden border-2 shadow-2xl transition-all duration-300 select-none touch-none ${
              activeFormat === '4:5' || activeFormat === '3:4'
                ? 'max-w-[340px] aspect-[4/5] rounded-3xl'
                : activeFormat === 'circle'
                ? 'max-w-[380px] aspect-square rounded-full border-indigo-500/50 shadow-indigo-500/25 ring-4 ring-indigo-500/10'
                : 'max-w-[400px] aspect-square rounded-3xl'
            } ${
              isDragging
                ? 'border-indigo-500 shadow-indigo-500/30 cursor-grabbing'
                : 'border-slate-700/80 hover:border-slate-600 cursor-grab'
            }`}
            style={{
              backgroundImage: `
                linear-gradient(45deg, #1e293b 25%, transparent 25%),
                linear-gradient(-45deg, #1e293b 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #1e293b 75%),
                linear-gradient(-45deg, transparent 75%, #1e293b 75%)
              `,
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
              backgroundColor: '#0f172a',
            }}
          >
            {!imagesLoaded ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm text-slate-400">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                <span className="text-xs font-medium">Carregando foto e moldura...</span>
              </div>
            ) : null}

            {/* HTML5 Canvas Element */}
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="w-full h-full block object-contain pointer-events-none"
            />

            {/* Drag hint overlay */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] text-slate-200 pointer-events-none flex items-center gap-1.5 shadow-lg whitespace-nowrap">
              <Move className="w-3.5 h-3.5 text-indigo-400" />
              <span>Arraste ou dê zoom com 2 dedos</span>
            </div>
          </div>

          {/* Quick presets toolbar below canvas */}
          <div className="flex items-center gap-2 mt-4 px-3 py-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <button
              onClick={handleCenter}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
              title="Centralizar posição da foto"
            >
              <Crosshair className="w-3.5 h-3.5 text-indigo-400" />
              <span>Centralizar</span>
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={handleFit}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
              title="Ajustar dentro dos limites"
            >
              <Minimize2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Conter</span>
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={handleFill}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
              title="Preencher toda a moldura"
            >
              <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Preencher</span>
            </button>
          </div>
        </div>

        {/* Right Column: Controls & Download */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 shadow-xl backdrop-blur-xl space-y-5 sm:space-y-6">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Ajustar Foto</span>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-indigo-300 transition-colors p-1"
                title="Redefinir todos os ajustes"
              >
                <RefreshCcw className="w-3 h-3" />
                <span>Redefinir</span>
              </button>
            </div>

            {/* Avatar Format Selector inside Editor */}
            <div className="space-y-2 pb-4 border-b border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-slate-300 flex items-center gap-1.5">
                  <Ratio className="w-3.5 h-3.5 text-indigo-400" />
                  Formato do Avatar
                </label>
                <span className="text-[11px] text-indigo-400 font-medium">
                  {activeFormat === 'circle' ? 'Foto de Perfil' : activeFormat === '4:5' || activeFormat === '3:4' ? '1080×1350' : '1080×1080'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleFormatChange('1:1')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeFormat === '1:1'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm ring-1 ring-white/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                  title="Quadrado 1:1 (Feed e Posts)"
                >
                  <Square className="w-3.5 h-3.5 shrink-0 text-indigo-300" />
                  <span className="truncate">1:1</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFormatChange('circle')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeFormat === 'circle'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm ring-1 ring-white/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                  title="Circular (Perfil WhatsApp / Instagram)"
                >
                  <Circle className="w-3.5 h-3.5 shrink-0 text-purple-300" />
                  <span className="truncate">Circular</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFormatChange('4:5')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeFormat === '4:5' || activeFormat === '3:4'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm ring-1 ring-white/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                  title="Retrato 4:5 (Feed vertical / Stories)"
                >
                  <Smartphone className="w-3.5 h-3.5 shrink-0 text-pink-300" />
                  <span className="truncate">4:5</span>
                </button>
              </div>
            </div>

            {/* 1. Zoom Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-slate-300 flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5 text-indigo-400" />
                  Zoom
                </label>
                <span className="font-mono text-slate-400">
                  {Math.round(scale * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setScale((prev) => Math.max(0.2, Number((prev - 0.1).toFixed(2))))}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors shrink-0"
                  title="Diminuir Zoom"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <input
                  type="range"
                  min="0.2"
                  max="4"
                  step="0.02"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="flex-1 accent-indigo-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
                />

                <button
                  type="button"
                  onClick={() => setScale((prev) => Math.min(5, Number((prev + 0.1).toFixed(2))))}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors shrink-0"
                  title="Aumentar Zoom"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Rotation & Flip */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-slate-300 flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                  Rotação & Orientação
                </label>
                <span className="font-mono text-slate-400">{rotation}°</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => rotateBy(-90)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  -90°
                </button>

                <button
                  type="button"
                  onClick={() => rotateBy(90)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  +90°
                </button>

                <button
                  type="button"
                  onClick={() => setFlipH((prev) => !prev)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition-colors ${
                    flipH
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  Espelhar
                </button>
              </div>

              <div className="pt-2">
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-950 rounded-lg"
                />
              </div>
            </div>

            {/* 3. High Resolution Download Button */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <button
                type="button"
                onClick={handleInitiateDownload}
                disabled={downloading || !imagesLoaded}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Imagem com Moldura</span>
              </button>

              {downloadSuccess && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-medium py-1 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Foto baixada com sucesso!</span>
                </div>
              )}

              <button
                type="button"
                onClick={onResetPhoto}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-950/60 hover:bg-slate-900 border border-slate-800 transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Trocar Foto Escolhida
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Pre-download Lead Capture Modal (WhatsApp / Email) */}
      <DownloadLeadModal
        isOpen={isLeadModalOpen}
        campaignTitle={campaignTitle}
        onClose={() => setIsLeadModalOpen(false)}
        onSubmit={handleProcessDownload}
        loading={downloading}
      />

      {/* Step 2: Post-download Celebration Modal with Confetti */}
      <CelebrationModal
        isOpen={isCelebrationModalOpen}
        campaignTitle={campaignTitle}
        campaignSlug={campaignSlug}
        onClose={() => setIsCelebrationModalOpen(false)}
      />
    </div>
  )
}
