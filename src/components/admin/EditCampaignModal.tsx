'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { updateCampaign } from '@/actions/campaigns'
import { Campaign, CampaignFormat } from '@/types/database'
import {
  X,
  Edit3,
  UploadCloud,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Square,
  Smartphone,
  CircleDot,
  ZoomIn,
  ZoomOut,
  Move,
  RefreshCcw,
  Crosshair,
  ArrowDownToLine,
  Maximize2,
  Minimize2,
} from 'lucide-react'

interface EditCampaignModalProps {
  campaign: Campaign | null
  isOpen: boolean
  onClose: () => void
  onCampaignUpdated?: () => void
}

export function EditCampaignModal({
  campaign,
  isOpen,
  onClose,
  onCampaignUpdated,
}: EditCampaignModalProps) {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [format, setFormat] = useState<CampaignFormat>('1:1')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Interactive Frame Adjustment States
  const [frameScale, setFrameScale] = useState(1)
  const [framePosition, setFramePosition] = useState({ x: 0, y: 0 })
  const [isDraggingFrame, setIsDraggingFrame] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const dragInitialPosRef = useRef({ x: 0, y: 0 })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const frameImageRef = useRef<HTMLImageElement | null>(null)
  const router = useRouter()

  const canvasWidth = 1080
  const canvasHeight = format === '4:5' || format === '3:4' ? 1350 : 1080

  useEffect(() => {
    if (campaign && isOpen) {
      setTitle(campaign.title)
      setSlug(campaign.slug)
      setFormat(campaign.format || '1:1')
      setSelectedFile(null)
      setPreviewUrl(campaign.frame_url)
      setError(null)
      setSuccess(false)
      setFrameScale(1)
      setFramePosition({ x: 0, y: 0 })

      // Load current frame image into ref
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = campaign.frame_url
      img.onload = () => {
        frameImageRef.current = img
        const initialScale = canvasWidth / img.naturalWidth
        setFrameScale(initialScale)
        setFramePosition({ x: 0, y: 0 })
      }
    }
  }, [campaign, isOpen, canvasWidth])

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleFileSelect = (file: File) => {
    setError(null)
    if (!file) return

    if (!['image/png', 'image/webp'].includes(file.type)) {
      setError('Por favor, selecione uma imagem PNG (fundo transparente) ou WebP.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('O arquivo deve ter no máximo 5MB.')
      return
    }

    setSelectedFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = objectUrl
    img.onload = () => {
      frameImageRef.current = img
      const initialScale = canvasWidth / img.naturalWidth
      setFrameScale(initialScale)
      setFramePosition({ x: 0, y: 0 })
    }
  }

  // Draw preview canvas
  const drawCanvas = useCallback(() => {
    const canvas = previewCanvasRef.current
    const img = frameImageRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    ctx.save()

    if (format === 'circle') {
      ctx.beginPath()
      ctx.arc(canvasWidth / 2, canvasHeight / 2, canvasWidth / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
    }

    ctx.translate(canvasWidth / 2 + framePosition.x, canvasHeight / 2 + framePosition.y)
    ctx.scale(frameScale, frameScale)

    const w = img.naturalWidth
    const h = img.naturalHeight
    ctx.drawImage(img, -w / 2, -h / 2, w, h)

    ctx.restore()
  }, [canvasWidth, canvasHeight, framePosition, frameScale, format])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const getScaleRatio = () => {
    if (!previewContainerRef.current) return 1
    const rect = previewContainerRef.current.getBoundingClientRect()
    return canvasWidth / rect.width
  }

  const handlePointerDown = (clientX: number, clientY: number) => {
    setIsDraggingFrame(true)
    dragStartRef.current = { x: clientX, y: clientY }
    dragInitialPosRef.current = { ...framePosition }
  }

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDraggingFrame) return
    const ratio = getScaleRatio()
    const deltaX = (clientX - dragStartRef.current.x) * ratio
    const deltaY = (clientY - dragStartRef.current.y) * ratio

    setFramePosition({
      x: dragInitialPosRef.current.x + deltaX,
      y: dragInitialPosRef.current.y + deltaY,
    })
  }

  const handlePointerUp = () => {
    setIsDraggingFrame(false)
  }

  const handleCenter = () => setFramePosition({ x: 0, y: 0 })

  const handleAlignBottom = () => {
    const img = frameImageRef.current
    if (!img) return
    const renderedHeight = img.naturalHeight * frameScale
    const targetY = canvasHeight / 2 - renderedHeight / 2
    setFramePosition({ x: 0, y: targetY })
  }

  const handleFit = () => {
    const img = frameImageRef.current
    if (!img) return
    const scaleX = canvasWidth / img.naturalWidth
    const scaleY = canvasHeight / img.naturalHeight
    setFrameScale(Math.min(scaleX, scaleY))
    setFramePosition({ x: 0, y: 0 })
  }

  const handleFillWidth = () => {
    const img = frameImageRef.current
    if (!img) return
    const scaleX = canvasWidth / img.naturalWidth
    setFrameScale(scaleX)
    setFramePosition({ x: 0, y: 0 })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!campaign?.id) return

    setError(null)

    if (!title.trim()) {
      setError('Informe o título da campanha.')
      return
    }

    if (!slug.trim()) {
      setError('Informe o slug da campanha.')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('slug', generateSlug(slug))
      formData.append('format', format)

      // If a new file was selected or frame was adjusted, export from canvas
      if (selectedFile && previewCanvasRef.current && frameImageRef.current) {
        const offscreenCanvas = document.createElement('canvas')
        offscreenCanvas.width = canvasWidth
        offscreenCanvas.height = canvasHeight
        const ctx = offscreenCanvas.getContext('2d')

        if (ctx) {
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.clearRect(0, 0, canvasWidth, canvasHeight)

          ctx.save()
          if (format === 'circle') {
            ctx.beginPath()
            ctx.arc(canvasWidth / 2, canvasHeight / 2, canvasWidth / 2, 0, Math.PI * 2)
            ctx.closePath()
            ctx.clip()
          }

          ctx.translate(canvasWidth / 2 + framePosition.x, canvasHeight / 2 + framePosition.y)
          ctx.scale(frameScale, frameScale)
          const w = frameImageRef.current.naturalWidth
          const h = frameImageRef.current.naturalHeight
          ctx.drawImage(frameImageRef.current, -w / 2, -h / 2, w, h)
          ctx.restore()

          const blob = await new Promise<Blob | null>((resolve) =>
            offscreenCanvas.toBlob(resolve, 'image/png', 1.0)
          )

          if (blob) {
            const finalFile = new File([blob], `${slug}-frame.png`, { type: 'image/png' })
            formData.append('frame', finalFile)
          }
        }
      }

      const res = await updateCampaign(campaign.id, formData)

      if (res.success) {
        setSuccess(true)
        setTimeout(() => {
          onCampaignUpdated?.()
          router.refresh()
          onClose()
        }, 1000)
      } else {
        setError(res.error || 'Erro ao atualizar campanha.')
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao salvar alterações.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !campaign) return null

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/40 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 transition-colors"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
            <Edit3 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Editar Campanha</h3>
            <p className="text-xs text-slate-400">
              Modifique o título, link oficial ou substitua a moldura PNG
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 p-3.5 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2.5 p-3.5 mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Campanha atualizada com sucesso!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Título da Campanha
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl bg-slate-950/90 border border-slate-800 px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Slug da URL (Link)
                </label>
                <div className="flex items-center rounded-xl bg-slate-950/90 border border-slate-800 overflow-hidden">
                  <span className="px-3 py-2.5 text-xs text-slate-500 bg-slate-900 border-r border-slate-800">
                    /c/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full bg-transparent px-3 py-2.5 text-slate-100 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Formato da Moldura
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat('1:1')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      format === '1:1'
                        ? 'border-indigo-500 bg-indigo-600/20 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400'
                    }`}
                  >
                    <Square className="w-4 h-4 mb-1 text-indigo-400" />
                    <span className="text-xs font-bold">1:1 Quadrado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('4:5')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      format === '4:5' || format === '3:4'
                        ? 'border-indigo-500 bg-indigo-600/20 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 mb-1 text-purple-400" />
                    <span className="text-xs font-bold">4:5 Retrato</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('circle')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      format === 'circle'
                        ? 'border-indigo-500 bg-indigo-600/20 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400'
                    }`}
                  >
                    <CircleDot className="w-4 h-4 mb-1 text-pink-400" />
                    <span className="text-xs font-bold">Redondo</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Trocar Moldura PNG (Opcional)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl p-4 text-center cursor-pointer bg-slate-950/40 transition-colors"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0])
                      }
                    }}
                  />
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-300">
                    <UploadCloud className="w-4 h-4 text-indigo-400" />
                    <span>{selectedFile ? selectedFile.name : 'Clique para selecionar nova imagem PNG'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview & Adjust */}
            <div className="flex flex-col items-center justify-center space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 text-center">
                Visualização do Quadro
              </label>

              <div
                ref={previewContainerRef}
                onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
                onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                className={`relative overflow-hidden border-2 shadow-2xl transition-colors select-none touch-none ${
                  format === '1:1'
                    ? 'w-full max-w-[240px] aspect-square rounded-2xl'
                    : format === '4:5' || format === '3:4'
                    ? 'w-full max-w-[210px] aspect-[4/5] rounded-2xl'
                    : 'w-full max-w-[240px] aspect-square rounded-full border-indigo-500/40'
                } ${
                  isDraggingFrame
                    ? 'border-indigo-500 cursor-grabbing'
                    : 'border-slate-700 hover:border-indigo-500/60 cursor-grab'
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
                <canvas
                  ref={previewCanvasRef}
                  width={canvasWidth}
                  height={canvasHeight}
                  className="w-full h-full block object-contain pointer-events-none"
                />

                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] text-slate-300 pointer-events-none flex items-center gap-1 whitespace-nowrap">
                  <Move className="w-3 h-3 text-indigo-400" />
                  <span>Arraste para ajustar</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={handleAlignBottom}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                  title="Na Base"
                >
                  <ArrowDownToLine className="w-3 h-3 inline mr-1" />
                  Base
                </button>
                <button
                  type="button"
                  onClick={handleCenter}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                  title="Centro"
                >
                  <Crosshair className="w-3 h-3 inline mr-1" />
                  Centro
                </button>
                <button
                  type="button"
                  onClick={handleFillWidth}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                  title="Preencher largura"
                >
                  <Maximize2 className="w-3 h-3 inline mr-1" />
                  Largura
                </button>
                <button
                  type="button"
                  onClick={handleFit}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                  title="Conter no quadro"
                >
                  <Minimize2 className="w-3 h-3 inline mr-1" />
                  Conter
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando Alterações...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
