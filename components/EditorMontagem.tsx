'use client'
import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { getSupabase, Roupa } from '@/lib/supabase'
import { X, Trash2, Download, Save } from 'lucide-react'

interface Elemento {
  id: string
  imagemUrl: string
  x: number      // centro X em % do container
  y: number      // centro Y em % do container
  escala: number // largura em % do container
  zIndex: number
}

interface LookPecas {
  sapato: Roupa | null
  parte_baixo: Roupa | null
  parte_cima: Roupa | null
  corpo_inteiro: Roupa | null
  acessorio: Roupa | null
}

interface Props {
  look: LookPecas
  onSalvar: (blob: Blob, nome: string) => Promise<void>
  onFechar: () => void
}

export default function EditorMontagem({ look, onSalvar, onFechar }: Props) {
  const [elementos, setElementos] = useState<Elemento[]>([])
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const [adesivos, setAdesivos] = useState<Roupa[]>([])
  const [nome, setNome] = useState('')
  const [salvando, setSalvando] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const proximoZ = useRef(1)

  // refs para acessar valores atuais dentro de event listeners
  const dragRef = useRef<{
    id: string
    startTX: number; startTY: number
    startElX: number; startElY: number
  } | null>(null)

  const resizeRef = useRef<{
    id: string
    startDist: number
    startEscala: number
    cxPx: number; cyPx: number
  } | null>(null)

  // handler de move atualizado a cada render para evitar closures antigas
  const onMoveRef = useRef<(cx: number, cy: number) => void>(() => {})
  onMoveRef.current = (cx: number, cy: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    if (dragRef.current) {
      const xPct = ((cx - rect.left) / rect.width) * 100
      const yPct = ((cy - rect.top) / rect.height) * 100
      const { id, startTX, startTY, startElX, startElY } = dragRef.current
      setElementos(prev => prev.map(el =>
        el.id === id
          ? { ...el, x: Math.max(2, Math.min(98, startElX + (xPct - startTX))), y: Math.max(2, Math.min(98, startElY + (yPct - startTY))) }
          : el
      ))
    }

    if (resizeRef.current) {
      const { id, startDist, startEscala, cxPx, cyPx } = resizeRef.current
      const dist = Math.hypot(cx - rect.left - cxPx, cy - rect.top - cyPx)
      const novaEscala = Math.max(5, Math.min(95, startEscala * (dist / startDist)))
      setElementos(prev => prev.map(el =>
        el.id === id ? { ...el, escala: novaEscala } : el
      ))
    }
  }

  // Registra eventos touch com passive:false para permitir preventDefault
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onMove = (e: TouchEvent) => {
      if (!dragRef.current && !resizeRef.current) return
      e.preventDefault()
      onMoveRef.current(e.touches[0].clientX, e.touches[0].clientY)
    }
    const onEnd = () => { dragRef.current = null; resizeRef.current = null }

    container.addEventListener('touchmove', onMove, { passive: false })
    container.addEventListener('touchend', onEnd)
    return () => {
      container.removeEventListener('touchmove', onMove)
      container.removeEventListener('touchend', onEnd)
    }
  }, [])

  // Inicializa com peças do look em posições distribuídas
  useEffect(() => {
    const pecas = [look.acessorio, look.parte_cima, look.parte_baixo, look.sapato, look.corpo_inteiro].filter(Boolean) as Roupa[]
    const posicoes = [[50, 22], [25, 50], [75, 50], [25, 78], [75, 78]]
    const novos: Elemento[] = pecas.map((p, i) => ({
      id: `peca-${p.id}`,
      imagemUrl: p.imagem_url,
      x: posicoes[i]?.[0] ?? 50,
      y: posicoes[i]?.[1] ?? 50,
      escala: 38,
      zIndex: i + 1,
    }))
    setElementos(novos)
    proximoZ.current = pecas.length + 1
  }, [look])

  // Carrega adesivos
  useEffect(() => {
    getSupabase().from('roupas').select('*').eq('categoria', 'adesivo').order('created_at', { ascending: false })
      .then(({ data }) => setAdesivos(data || []))
  }, [])

  const selecionarEl = (id: string) => {
    setSelecionado(id)
    setElementos(prev => prev.map(el => el.id === id ? { ...el, zIndex: proximoZ.current++ } : el))
  }

  const adicionarAdesivo = (a: Roupa) => {
    const el: Elemento = {
      id: `ad-${a.id}-${Date.now()}`,
      imagemUrl: a.imagem_url,
      x: 50, y: 50, escala: 20,
      zIndex: proximoZ.current++,
    }
    setElementos(prev => [...prev, el])
    setSelecionado(el.id)
  }

  const excluirSelecionado = () => {
    setElementos(prev => prev.filter(el => el.id !== selecionado))
    setSelecionado(null)
  }

  const iniciarDrag = (el: Elemento, cx: number, cy: number) => {
    const rect = containerRef.current!.getBoundingClientRect()
    dragRef.current = {
      id: el.id,
      startTX: ((cx - rect.left) / rect.width) * 100,
      startTY: ((cy - rect.top) / rect.height) * 100,
      startElX: el.x, startElY: el.y,
    }
  }

  const iniciarResize = (el: Elemento, cx: number, cy: number) => {
    dragRef.current = null
    const rect = containerRef.current!.getBoundingClientRect()
    const cxPx = (el.x / 100) * rect.width
    const cyPx = (el.y / 100) * rect.height
    resizeRef.current = {
      id: el.id,
      startDist: Math.max(10, Math.hypot(cx - rect.left - cxPx, cy - rect.top - cyPx)),
      startEscala: el.escala,
      cxPx, cyPx,
    }
  }

  // Exporta canvas como JPG (1200x1200)
  const exportarBlob = async (): Promise<Blob> => {
    const SIZE = 1200
    const canvas = document.createElement('canvas')
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, SIZE, SIZE)

    const sorted = [...elementos].sort((a, b) => a.zIndex - b.zIndex)
    for (const el of sorted) {
      await new Promise<void>((resolve) => {
        const img = new window.Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const w = (el.escala / 100) * SIZE
          const h = w * (img.naturalHeight / img.naturalWidth)
          ctx.drawImage(img, (el.x / 100) * SIZE - w / 2, (el.y / 100) * SIZE - h / 2, w, h)
          resolve()
        }
        img.onerror = () => resolve()
        img.src = el.imagemUrl
      })
    }
    return new Promise(res => canvas.toBlob(b => res(b!), 'image/jpeg', 0.92))
  }

  const handleSalvar = async () => {
    setSalvando(true)
    try {
      const blob = await exportarBlob()
      await onSalvar(blob, nome.trim() || `Montagem ${new Date().toLocaleDateString('pt-BR')}`)
    } finally {
      setSalvando(false)
    }
  }

  const handleExportar = async () => {
    const blob = await exportarBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${nome.trim() || 'montagem'}.jpg`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-[80] bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white px-3 py-2 flex items-center gap-2 border-b flex-shrink-0">
        <button onClick={onFechar} className="p-1.5 text-gray-400 flex-none"><X size={20} /></button>
        <input
          type="text" placeholder="Nome da montagem" value={nome}
          onChange={e => setNome(e.target.value)}
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-400 min-w-0"
        />
        <button
          onClick={handleSalvar} disabled={salvando}
          className="flex-none flex items-center gap-1 bg-indigo-600 text-white text-xs px-3 py-2 rounded-xl font-medium disabled:opacity-50"
        >
          <Save size={13} /> {salvando ? '...' : 'Salvar'}
        </button>
        <button
          onClick={handleExportar}
          className="flex-none flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-3 py-2 rounded-xl font-medium"
        >
          <Download size={13} /> JPG
        </button>
      </div>

      {/* Canvas 1:1 */}
      <div
        ref={containerRef}
        className="relative bg-white flex-shrink-0 overflow-hidden"
        style={{ width: '100%', aspectRatio: '1/1' }}
        onMouseMove={e => { if (dragRef.current || resizeRef.current) onMoveRef.current(e.clientX, e.clientY) }}
        onMouseUp={() => { dragRef.current = null; resizeRef.current = null }}
        onClick={() => setSelecionado(null)}
      >
        {[...elementos].sort((a, b) => a.zIndex - b.zIndex).map(el => {
          const sel = selecionado === el.id
          return (
            <div
              key={el.id}
              className={`absolute ${sel ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
              style={{
                left: `${el.x}%`, top: `${el.y}%`,
                width: `${el.escala}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: el.zIndex,
                touchAction: 'none',
                cursor: 'grab',
              }}
              onTouchStart={e => { e.stopPropagation(); selecionarEl(el.id); iniciarDrag(el, e.touches[0].clientX, e.touches[0].clientY) }}
              onMouseDown={e => { e.stopPropagation(); selecionarEl(el.id); iniciarDrag(el, e.clientX, e.clientY) }}
              onClick={e => e.stopPropagation()}
            >
              <Image
                src={el.imagemUrl} alt="" width={200} height={200}
                className="w-full h-auto pointer-events-none select-none"
                unoptimized
              />
              {sel && (
                <div
                  className="absolute -bottom-3 -right-3 w-7 h-7 bg-indigo-500 rounded-full border-2 border-white cursor-se-resize flex items-center justify-center"
                  style={{ touchAction: 'none' }}
                  onTouchStart={e => { e.stopPropagation(); iniciarResize(el, e.touches[0].clientX, e.touches[0].clientY) }}
                  onMouseDown={e => { e.stopPropagation(); iniciarResize(el, e.clientX, e.clientY) }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" className="text-white">
                    <path d="M1 9L9 1M5 9L9 5M9 9L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Controles do elemento selecionado */}
      {selecionado && (
        <div className="bg-white border-t border-b flex items-center justify-between px-4 py-2 flex-shrink-0">
          <span className="text-xs text-gray-500">Arraste para mover · <span className="text-indigo-500">●</span> para redimensionar</span>
          <button
            onClick={excluirSelecionado}
            className="flex items-center gap-1 text-red-500 text-xs px-3 py-1.5 rounded-lg border border-red-200"
          >
            <Trash2 size={13} /> Excluir
          </button>
        </div>
      )}

      {/* Bandeja de adesivos */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 pt-3 pb-2">
          Adesivos {adesivos.length > 0 && `(${adesivos.length})`}
        </p>
        {adesivos.length === 0 ? (
          <p className="text-xs text-gray-400 px-4 pb-3">
            Cadastre imagens na categoria Adesivos no Closet para aparecerem aqui.
          </p>
        ) : (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-4">
            {adesivos.map(a => (
              <button
                key={a.id}
                onClick={() => adicionarAdesivo(a)}
                title={a.nome || undefined}
                className="flex-none w-16 h-16 rounded-xl overflow-hidden border border-gray-200 active:scale-95 transition-transform"
                style={{ background: 'repeating-conic-gradient(#f3f4f6 0% 25%, white 0% 50%) 0 0 / 10px 10px' }}
              >
                <Image src={a.imagem_url} alt={a.nome || ''} width={64} height={64} className="w-full h-full object-contain" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
