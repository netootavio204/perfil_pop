'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createCampaign } from '@/actions/campaigns'
import { SafeAdminUser, CampaignFormat } from '@/types/database'
import {
  UploadCloud,
  Image as ImageIcon,
  Sparkles,
  Check,
  Copy,
  ExternalLink,
  AlertCircle,
  X,
  Square,
  Smartphone,
  CircleDot,
  ZoomIn,
  ZoomOut,
  Move,
  RefreshCcw,
  Sliders,
  Crosshair,
  ArrowDownToLine,
  Maximize2,
  Minimize2,
  Users,
} from 'lucide-react'

interface CreateCampaignFormProps {
  onCampaignCreated?: () => void
  users?: SafeAdminUser[]
  currentUser?: {
    id: string
    name: string
    email: string
    role: string
  } | null
}

export function CreateCampaignForm({ onCampaignCreated, users = [], currentUser }: CreateCampaignFormProps) {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [format, setFormat] = useState<CampaignFormat>('1:1')
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser?.id || '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successInfo, setSuccessInfo] = useState<{ slug: string; url: string } | null>(null)
  const [copied, setCopied] = useState(false)

  // Interactive Frame Adjustment States (for Admin Preview & Re-framing)
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

  // Target canvas dimensions
  const canvasWidth = 1080
  const canvasHeight = (format === '4:5' || format === '3:4') ? 1350 : 1080

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setTitle(val)
    if (!slugManuallyEdited) {
      setSlug(generateSlug(val))
    }
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManuallyEdited(true)
    setSlug(generateSlug(e.target.value))
  }

  const handleFileSelect = (file: File) => {
    setError(null)
    if (!file) return

    if (!['image/png', 'image/webp'].includes(file.type)) {
      setError('Por favor, selecione uma imagem no formato PNG (com fundo transparente) ou WebP.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('O arquivo deve ter no máximo 5MB.')
      return
    }

    setSelectedFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    // Load image into ref and calculate initial fit
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = objectUrl
    img.onload = () => {
      frameImageRef.current = img
      // Initial fit to canvas width
      const initialScale = canvasWidth / img.naturalWidth
      setFrameScale(initialScale)
      setFramePosition({ x: 0, y: 0 })
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    frameImageRef.current = null
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setFrameScale(1)
    setFramePosition({ x: 0, y: 0 })
  }

  // Draw admin preview canvas
  const drawAdminCanvas = useCallback(() => {
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

    // Position and scale frame
    ctx.translate(canvasWidth / 2 + framePosition.x, canvasHeight / 2 + framePosition.y)
    ctx.scale(frameScale, frameScale)

    const w = img.naturalWidth
    const h = img.naturalHeight
    ctx.drawImage(img, -w / 2, -h / 2, w, h)

    ctx.restore()
  }, [canvasWidth, canvasHeight, framePosition, frameScale, format])

  useEffect(() => {
    drawAdminCanvas()
  }, [drawAdminCanvas])

  // Mouse & touch drag for admin preview
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

  // Quick Preset Actions
  const handleCenter = () => {
    setFramePosition({ x: 0, y: 0 })
  }

  const handleAlignBottom = () => {
    const img = frameImageRef.current
    if (!img) return
    // Calculate Y so bottom of frame meets bottom of canvas
    const renderedHeight = img.naturalHeight * frameScale
    const targetY = (canvasHeight / 2) - (renderedHeight / 2)
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

  const handleResetAdjustments = () => {
    handleFillWidth()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessInfo(null)

    if (!title.trim()) {
      setError('Informe o título da campanha.')
      return
    }

    if (!slug.trim()) {
      setError('Informe o slug da campanha.')
      return
    }

    if (!selectedFile) {
      setError('Selecione uma imagem de moldura PNG com fundo transparente.')
      return
    }

    setLoading(true)

    try {
      // Export high-resolution transparent PNG directly from canvas
      const canvas = previewCanvasRef.current
      let finalFile: File = selectedFile

      if (canvas && frameImageRef.current) {
        // Create full resolution offscreen canvas to guarantee pristine 1080x1350 or 1080x1080 PNG
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
            finalFile = new File([blob], `${slug}-frame.png`, { type: 'image/png' })
          }
        }
      }

      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('slug', slug.trim())
      formData.append('format', format)
      formData.append('frame', finalFile)

      const targetUser = users.find((u) => u.id === selectedUserId)
      if (targetUser) {
        formData.append('user_id', targetUser.id)
        formData.append('user_email', targetUser.email)
        formData.append('user_name', targetUser.name)
      } else if (currentUser) {
        formData.append('user_id', currentUser.id)
        formData.append('user_email', currentUser.email)
        formData.append('user_name', currentUser.name)
      }

      const result = await createCampaign(formData)

      if (result.success && result.slug) {
        const fullUrl = `${window.location.origin}/c/${result.slug}`
        setSuccessInfo({
          slug: result.slug,
          url: fullUrl,
        })
        // Reset form
        setTitle('')
        setSlug('')
        setSlugManuallyEdited(false)
        setFormat('1:1')
        removeSelectedFile()
        router.refresh()
        onCampaignCreated?.()
      } else {
        setError(result.error || 'Falha ao criar a campanha.')
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao criar campanha.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {successInfo && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-6 backdrop-blur-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-base">Campanha Criada com Sucesso!</h4>
                <p className="text-xs text-emerald-300/80">O link público já está pronto e ativo para receber apoiadores.</p>
              </div>
            </div>
            <button
              onClick={() => setSuccessInfo(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <code className="text-xs text-emerald-300 font-mono truncate select-all px-1">
              {successInfo.url}
            </code>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => copyToClipboard(successInfo.url)}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado!' : 'Copiar Link'}
              </button>
              <a
                href={successInfo.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Acessar
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Creation Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800/80">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Criar Nova Campanha</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Defina o formato, ajuste a moldura no quadro e gere o link oficial
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-4 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Form Fields */}
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Título da Campanha <span className="text-indigo-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="Ex: Campanha Solidária 2026"
                  className="w-full rounded-xl bg-slate-950/90 border border-slate-800 px-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Slug da URL (Link Amigável) <span className="text-indigo-400">*</span>
                </label>
                <div className="flex items-center rounded-xl bg-slate-950/90 border border-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-all">
                  <span className="px-3.5 py-3 text-xs text-slate-500 bg-slate-900/60 border-r border-slate-800 select-none">
                    /c/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={handleSlugChange}
                    placeholder="campanha-solidaria-2026"
                    className="w-full bg-transparent px-3.5 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Link final: <span className="text-indigo-400 font-mono">/c/{slug || 'nome-da-campanha'}</span>
                </p>
              </div>

              {/* User / Owner Selector */}
              {users && users.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Proprietário da Campanha (Administrador/Usuário)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pink-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full rounded-xl bg-slate-950/90 border border-slate-800 pl-10 pr-4 py-3 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all cursor-pointer"
                    >
                      <option value={currentUser?.id || ''}>
                        {currentUser?.name || currentUser?.email || 'Minha Própria Conta'} (Atual)
                      </option>
                      {users
                        .filter((u) => u.id !== currentUser?.id)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.email}) — {u.role === 'admin' ? 'Administrador' : 'Editor'}
                          </option>
                        ))}
                    </select>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Permite atribuir esta campanha para ser gerenciada especificamente por este usuário.
                  </p>
                </div>
              )}

              {/* Format Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Formato da Moldura <span className="text-indigo-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormat('1:1')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      format === '1:1'
                        ? 'border-indigo-500 bg-indigo-600/20 text-white shadow-sm ring-1 ring-indigo-500'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Square className="w-5 h-5 mb-1.5 text-indigo-400" />
                    <span className="text-xs font-bold">1:1 Quadrado</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">1080×1080px</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('4:5')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      format === '4:5' || format === '3:4'
                        ? 'border-indigo-500 bg-indigo-600/20 text-white shadow-sm ring-1 ring-indigo-500'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 mb-1.5 text-purple-400" />
                    <span className="text-xs font-bold">4:5 Retrato</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">1080×1350px</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('circle')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      format === 'circle'
                        ? 'border-indigo-500 bg-indigo-600/20 text-white shadow-sm ring-1 ring-indigo-500'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <CircleDot className="w-5 h-5 mb-1.5 text-pink-400" />
                    <span className="text-xs font-bold">Redondo / Perfil</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Máscara Circular</span>
                  </button>
                </div>
              </div>

              {/* Upload Input Area */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Moldura PNG (Fundo Transparente) <span className="text-indigo-400">*</span>
                </label>

                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    selectedFile
                      ? 'border-indigo-500/50 bg-indigo-500/5'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/80'
                  }`}
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

                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-200">
                      {selectedFile ? selectedFile.name : 'Clique para selecionar ou arraste o PNG'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedFile
                        ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • PNG (Você pode ajustar a posição no quadro ao lado)`
                        : `Formato selecionado: ${format === '1:1' ? '1:1 Quadrado' : (format === '4:5' || format === '3:4') ? '4:5 Retrato' : 'Redondo Perfil'} • PNG transparente até 5MB`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Frame Positioner & Live Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Ajuste & Pré-visualização ({format === '1:1' ? '1:1 Quadrado' : (format === '4:5' || format === '3:4') ? '4:5 Retrato' : 'Círculo'})
                </label>
                {selectedFile && (
                  <button
                    type="button"
                    onClick={handleResetAdjustments}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-300 transition-colors"
                  >
                    <RefreshCcw className="w-3 h-3" />
                    <span>Redefinir</span>
                  </button>
                )}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 flex flex-col items-center justify-center min-h-[380px] relative space-y-4">
                {selectedFile ? (
                  <>
                    {/* Interactive Frame Canvas */}
                    <div
                      ref={previewContainerRef}
                      onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
                      onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
                      onMouseUp={handlePointerUp}
                      onMouseLeave={handlePointerUp}
                      onTouchStart={(e) => {
                        if (e.touches.length === 1) {
                          handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)
                        }
                      }}
                      onTouchMove={(e) => {
                        if (e.touches.length === 1) {
                          handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)
                        }
                      }}
                      onTouchEnd={handlePointerUp}
                      className={`relative overflow-hidden border-2 shadow-2xl transition-colors select-none touch-none ${
                        format === '1:1'
                          ? 'w-full max-w-[280px] aspect-square rounded-2xl'
                          : (format === '4:5' || format === '3:4')
                          ? 'w-full max-w-[250px] aspect-[4/5] rounded-2xl'
                          : 'w-full max-w-[280px] aspect-square rounded-full border-indigo-500/40'
                      } ${
                        isDraggingFrame
                          ? 'border-indigo-500 shadow-indigo-500/30 cursor-grabbing'
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
                      {/* HTML5 Canvas for Interactive Framing */}
                      <canvas
                        ref={previewCanvasRef}
                        width={canvasWidth}
                        height={canvasHeight}
                        className="w-full h-full block object-contain pointer-events-none"
                      />

                      {/* Clear file button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeSelectedFile()
                        }}
                        className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-slate-950/80 text-rose-400 hover:text-rose-300 border border-slate-800 hover:bg-slate-900 transition-colors shadow-lg"
                        title="Remover moldura selecionada"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {/* Drag hint */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] text-slate-300 pointer-events-none flex items-center gap-1 shadow whitespace-nowrap">
                        <Move className="w-3 h-3 text-indigo-400" />
                        <span>Arraste para posicionar</span>
                      </div>
                    </div>

                    {/* Interactive Frame Controls (Zoom + Quick Alignments) */}
                    <div className="w-full space-y-3 pt-2">
                      {/* Zoom Slider */}
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 shrink-0">
                          <ZoomIn className="w-3.5 h-3.5 text-indigo-400" />
                          Escala:
                        </span>
                        <button
                          type="button"
                          onClick={() => setFrameScale((prev) => Math.max(0.2, Number((prev - 0.05).toFixed(2))))}
                          className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                          title="Diminuir"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="range"
                          min="0.2"
                          max="3"
                          step="0.02"
                          value={frameScale}
                          onChange={(e) => setFrameScale(parseFloat(e.target.value))}
                          className="flex-1 accent-indigo-500 cursor-pointer h-1.5 bg-slate-900 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setFrameScale((prev) => Math.min(3, Number((prev + 0.05).toFixed(2))))}
                          className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                          title="Aumentar"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono text-[11px] text-slate-400 w-10 text-right">
                          {Math.round(frameScale * 100)}%
                        </span>
                      </div>

                      {/* Quick Alignment Presets */}
                      <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                        <button
                          type="button"
                          onClick={handleAlignBottom}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors font-medium"
                          title="Alinhar a moldura na base / rodapé"
                        >
                          <ArrowDownToLine className="w-3 h-3" />
                          <span>Na Base</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleCenter}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                          title="Centralizar moldura"
                        >
                          <Crosshair className="w-3 h-3" />
                          <span>Centro</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleFillWidth}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                          title="Preencher largura 100%"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>Largura</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleFit}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                          title="Conter no quadro"
                        >
                          <Minimize2 className="w-3 h-3" />
                          <span>Conter</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6 text-slate-500">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-center mb-3">
                      <ImageIcon className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-400">Nenhuma moldura selecionada</p>
                    <p className="text-xs text-slate-600 mt-1 max-w-[240px]">
                      Ao fazer upload do PNG, você poderá arrastar, dar zoom e alinhar perfeitamente no quadro {format === '1:1' ? '1080×1080' : (format === '4:5' || format === '3:4') ? '1080×1350' : 'Circular'}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={loading || !title || !slug || !selectedFile}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Publicando Campanha...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Publicar e Gerar Link</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
