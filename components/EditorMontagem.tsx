'use client'
import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { getSupabase, Roupa, CATEGORIAS } from '@/lib/supabase'
import { X, Trash2, Download, Save } from 'lucide-react'

interface Elemento {
  id: string
  imagemUrl: string
  x: number        // centro X em % do container
  y: number        // centro Y em % do container
  escala: number   // largura em % do container
  rotacao: number  // graus
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
  look?: LookPecas   // opcional — se ausente, canvas começa vazio
  onSalvar: (blob: Blob, nome: string) => Promise<void>
  onFechar: () => void
}

const getTouchDist = (t0: Touch, t1: Touch) =>
  Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY)
const getTouchAngle = (t0: Touch, t1: Touch) =>
  Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX) * (180 / Math.PI)
const getTouchMid = (t0: Touch, t1: Touch, rect: DOMRect) => ({
  x: ((t0.clientX + t1.clientX) / 2 - rect.left) / rect.width * 100,
  y: ((t0.clientY + t1.clientY) / 2 - rect.top) / rect.height * 100,
})

export default function EditorMontagem({ look, onSalvar, onFechar }: Props) {
  const [elementos, setElementos] = useState<Elemento[]>([])
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const [adesivos, setAdesivos] = useState<Roupa[]>([])
  const [closetRoupas, setClosetRoupas] = useState<Roupa[]>([])
  const [categoriaCloset, setCategoriaCloset] = useState(0)
  const [nome, setNome] = useState('')
  const [salvando, setSalvando] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const proximoZ = useRef(1)
  const selecionadoRef = useRef<string | null>(null)
  const elementosRef = useRef<Elemento[]>([])

  // keep refs in sync
  useEffect(() => { selecionadoRef.current = selecionado }, [selecionado])
  useEffect(() => { elementosRef.current = elementos }, [elementos])

  // drag ref: 1-dedo move
  const dragRef = useRef<{ id: string; startTX: number; startTY: number; startElX: number; startElY: number } | null>(null)
  // pinch ref: 2-dedos scale+rotate
  const pinchRef = useRef<{ id: string; startDist: number; startAngle: number; startEscala: number; startRotacao: number } | null>(null)

  // move handler atualizado a cada render
  const onMoveRef = useRef<(cx: number, cy: number) => void>(() => {})
  onMoveRef.current = (cx, cy) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect || !dragRef.current) return
    const xPct = ((cx - rect.left) / rect.width) * 100
    const yPct = ((cy - rect.top) / rect.height) * 100
    const { id, startTX, startTY, startElX, startElY } = dragRef.current
    setElementos(prev => prev.map(el =>
      el.id === id ? { ...el, x: Math.max(2, Math.min(98, startElX + (xPct - startTX))), y: Math.max(2, Math.min(98, startElY + (yPct - startTY))) } : el
    ))
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      const rect = container.getBoundingClientRect()
      if (e.touches.length === 2 && selecionadoRef.current) {
        const el = elementosRef.current.find(el => el.id === selecionadoRef.current)
        if (!el) return
        dragRef.current = null
        pinchRef.current = {
          id: selecionadoRef.current,
          startDist: getTouchDist(e.touches[0], e.touches[1]),
          startAngle: getTouchAngle(e.touches[0], e.touches[1]),
          startEscala: el.escala,
          startRotacao: el.rotacao,
        }
      } else if (e.touches.length === 1) {
        pinchRef.current = null
        const t = e.touches[0]
        if (selecionadoRef.current) {
          const el = elementosRef.current.find(el => el.id === selecionadoRef.current)
          if (el) {
            const xPct = ((t.clientX - rect.left) / rect.width) * 100
            const yPct = ((t.clientY - rect.top) / rect.height) * 100
            dragRef.current = { id: el.id, startTX: xPct, startTY: yPct, startElX: el.x, startElY: el.y }
          }
        }
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length === 2 && pinchRef.current) {
        const { id, startDist, startAngle, startEscala, startRotacao } = pinchRef.current
        const dist = getTouchDist(e.touches[0], e.touches[1])
        const angle = getTouchAngle(e.touches[0], e.touches[1])
        const novaEscala = Math.max(5, Math.min(95, startEscala * (dist / startDist)))
        const novaRotacao = startRotacao + (angle - startAngle)
        setElementos(prev => prev.map(el => el.id === id ? { ...el, escala: novaEscala, rotacao: novaRotacao } : el))
      } else if (e.touches.length === 1) {
        onMoveRef.current(e.touches[0].clientX, e.touches[0].clientY)
      }
    }

    const onTouchEnd = () => { dragRef.current = null; pinchRef.current = null }

    container.addEventListener('touchstart', onTouchStart, { passive: false })
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    container.addEventListener('touchend', onTouchEnd)
    return () => {
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  // Inicializa com peças do look (se fornecidas)
  useEffect(() => {
    if (!look) return
    const pecas = [look.acessorio, look.parte_cima, look.parte_baixo, look.sapato, look.corpo_inteiro].filter(Boolean) as Roupa[]
    const posicoes = [[50, 22], [25, 50], [75, 50], [25, 78], [75, 78]]
    setElementos(pecas.map((p, i) => ({
      id: `peca-${p.id}`,
      imagemUrl: p.imagem_url,
      x: posicoes[i]?.[0] ?? 50, y: posicoes[i]?.[1] ?? 50,
      escala: 38, rotacao: 0, zIndex: i + 1,
    })))
    proximoZ.current = pecas.length + 1
  }, [look])

  // Carrega adesivos e closet
  useEffect(() => {
    getSupabase().from('roupas').select('*').eq('categoria', 'adesivo').order('created_at', { ascending: false })
      .then(({ data }) => setAdesivos(data || []))
    getSupabase().from('roupas').select('*').not('categoria', 'eq', 'adesivo').order('categoria').order('created_at', { ascending: false })
      .then(({ data }) => setClosetRoupas(data || []))
  }, [])

  const adicionarElemento = (r: Roupa) => {
    const el: Elemento = {
      id: `el-${r.id}-${Date.now()}`,
      imagemUrl: r.imagem_url,
      x: 50, y: 50, escala: 22, rotacao: 0, zIndex: proximoZ.current++,
    }
    setElementos(prev => [...prev, el])
    setSelecionado(el.id)
  }

  const selecionarEl = (id: string) => {
    setSelecionado(id)
    setElementos(prev => prev.map(el => el.id === id ? { ...el, zIndex: proximoZ.current++ } : el))
  }

  const excluirSelecionado = () => {
    setElementos(prev => prev.filter(el => el.id !== selecionado))
    setSelecionado(null)
  }

  const exportarBlob = async (): Promise<Blob> => {
    const SIZE = 1200
    const canvas = document.createElement('canvas')
    canvas.width = SIZE; canvas.height = SIZE
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, SIZE, SIZE)
    const sorted = [...elementos].sort((a, b) => a.zIndex - b.zIndex)
    for (const el of sorted) {
      await new Promise<void>(resolve => {
        const img = new window.Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const w = (el.escala / 100) * SIZE
          const h = w * (img.naturalHeight / img.naturalWidth)
          const cx = (el.x / 100) * SIZE
          const cy = (el.y / 100) * SIZE
          ctx.save()
          ctx.translate(cx, cy)
          ctx.rotate(el.rotacao * Math.PI / 180)
          ctx.drawImage(img, -w / 2, -h / 2, w, h)
          ctx.restore()
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
    } finally { setSalvando(false) }
  }

  const handleExportar = async () => {
    const blob = await exportarBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${nome.trim() || 'montagem'}.jpg`; a.click()
    URL.revokeObjectURL(url)
  }

  const categorias = [...new Set(closetRoupas.map(r => r.categoria))]
  const catLabel = CATEGORIAS.find(c => c.value === categorias[categoriaCloset])

  return (
    <div className="fixed inset-0 z-[80] bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white px-3 py-2 flex items-center gap-2 border-b flex-shrink-0">
        <button onClick={onFechar} className="p-1.5 text-gray-400 flex-none"><X size={20} /></button>
        <input
          type="text" placeholder="Nome da montagem" value={nome} onChange={e => setNome(e.target.value)}
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-400 min-w-0"
        />
        <button onClick={handleSalvar} disabled={salvando} className="flex-none flex items-center gap-1 bg-indigo-600 text-white text-xs px-3 py-2 rounded-xl font-medium disabled:opacity-50">
          <Save size={13} /> {salvando ? '...' : 'Salvar'}
        </button>
        <button onClick={handleExportar} className="flex-none flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-3 py-2 rounded-xl font-medium">
          <Download size={13} /> JPG
        </button>
      </div>

      {/* Canvas 1:1 */}
      <div
        ref={containerRef}
        className="relative bg-white flex-shrink-0 overflow-hidden"
        style={{ width: '100%', aspectRatio: '1/1' }}
        onMouseMove={e => { if (dragRef.current) onMoveRef.current(e.clientX, e.clientY) }}
        onMouseUp={() => { dragRef.current = null; pinchRef.current = null }}
        onClick={() => setSelecionado(null)}
      >
        {[...elementos].sort((a, b) => a.zIndex - b.zIndex).map(el => {
          const sel = selecionado === el.id
          return (
            <div
              key={el.id}
              className={sel ? 'ring-2 ring-indigo-500 ring-offset-1 rounded-sm' : ''}
              style={{
                position: 'absolute',
                left: `${el.x}%`, top: `${el.y}%`,
                width: `${el.escala}%`,
                transform: `translate(-50%, -50%) rotate(${el.rotacao}deg)`,
                zIndex: el.zIndex,
                touchAction: 'none', cursor: 'grab',
              }}
              onMouseDown={e => {
                e.stopPropagation()
                selecionarEl(el.id)
                const rect = containerRef.current!.getBoundingClientRect()
                dragRef.current = { id: el.id, startTX: ((e.clientX - rect.left) / rect.width) * 100, startTY: ((e.clientY - rect.top) / rect.height) * 100, startElX: el.x, startElY: el.y }
              }}
              onClick={e => e.stopPropagation()}
              onTouchStart={e => { e.stopPropagation(); selecionarEl(el.id) }}
            >
              <Image src={el.imagemUrl} alt="" width={200} height={200} className="w-full h-auto pointer-events-none select-none" unoptimized />
            </div>
          )
        })}
      </div>

      {/* Controles elemento selecionado */}
      {selecionado && (
        <div className="bg-white border-t border-b flex items-center justify-between px-4 py-2 flex-shrink-0">
          <span className="text-xs text-gray-400">Arraste • 2 dedos para girar/redimensionar</span>
          <button onClick={excluirSelecionado} className="flex items-center gap-1 text-red-500 text-xs px-3 py-1.5 rounded-lg border border-red-200">
            <Trash2 size={13} /> Excluir
          </button>
        </div>
      )}

      {/* Bandeja: Adesivos + Closet */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {adesivos.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 pt-3 pb-2">
              Adesivos ({adesivos.length})
            </p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-3">
              {adesivos.map(a => (
                <button key={a.id} onClick={() => adicionarElemento(a)} className="flex-none w-14 h-14 rounded-xl overflow-hidden border border-gray-200 active:scale-95 transition-transform" style={{ background: 'repeating-conic-gradient(#f3f4f6 0% 25%, white 0% 50%) 0 0 / 10px 10px' }}>
                  <Image src={a.imagem_url} alt={a.nome || ''} width={56} height={56} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          </div>
        )}

        {closetRoupas.length > 0 && (
          <div className="pb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 pt-2 pb-2">Closet</p>
            {/* Tab categorias */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide px-4 pb-2">
              {categorias.map((cat, i) => {
                const c = CATEGORIAS.find(x => x.value === cat)
                return (
                  <button key={cat} onClick={() => setCategoriaCloset(i)} className={`flex-none text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${i === categoriaCloset ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {c?.emoji} {c?.label}
                  </button>
                )
              })}
            </div>
            {/* Peças da categoria */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4">
              {closetRoupas.filter(r => r.categoria === categorias[categoriaCloset]).map(r => (
                <button key={r.id} onClick={() => adicionarElemento(r)} className="flex-none w-16 h-16 rounded-xl overflow-hidden border border-gray-200 active:scale-95 transition-transform" style={{ background: 'repeating-conic-gradient(#f3f4f6 0% 25%, white 0% 50%) 0 0 / 10px 10px' }}>
                  <Image src={r.imagem_url} alt={r.nome || catLabel?.label || ''} width={64} height={64} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
