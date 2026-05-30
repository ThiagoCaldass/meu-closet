'use client'
import { useRef, useState, useEffect } from 'react'
import { Undo2, Redo2, Eraser, Paintbrush } from 'lucide-react'

type ModoTracado = 'apagar' | 'restaurar'

interface Tracado {
  tipo: ModoTracado
  pontos: Array<{ x: number; y: number }>
  tamanho: number
}

interface Props {
  imagemUrl: string
  imagemOriginalUrl?: string  // foto antes da IA — restaurar lê daqui
  onConfirmar: (blob: Blob) => void
  onCancelar: () => void
}

export default function EditorPincel({ imagemUrl, imagemOriginalUrl, onConfirmar, onCancelar }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const origCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const lupaRef = useRef<HTMLDivElement>(null)
  const lupaCanvasRef = useRef<HTMLCanvasElement>(null)
  const LUPA_R = 85

  const desenhando = useRef(false)
  const tracadoAtual = useRef<Array<{ x: number; y: number }>>([])
  const tracadosRef = useRef<Tracado[]>([])
  const posicaoRef = useRef(0)
  const tamanhoRef = useRef(20)
  const modoRef = useRef<ModoTracado>('apagar')

  const [tamanho, setTamanho] = useState(20)
  const [modo, setModo] = useState<ModoTracado>('apagar')
  const [posicao, setPosicao] = useState(0)
  const [totalTracados, setTotalTracados] = useState(0)
  const [pronto, setPronto] = useState(false)

  useEffect(() => { tamanhoRef.current = tamanho }, [tamanho])
  useEffect(() => { modoRef.current = modo }, [modo])

  // Mostra a lupa ampliada acima do dedo
  const atualizarLupa = (clientX: number, clientY: number) => {
    const lupaEl = lupaRef.current
    const lupaCanvas = lupaCanvasRef.current
    const mainCanvas = canvasRef.current
    const container = canvasContainerRef.current
    if (!lupaEl || !lupaCanvas || !mainCanvas || !container) return

    const D = LUPA_R * 2
    const containerRect = container.getBoundingClientRect()
    const sx = clientX - containerRect.left
    const sy = clientY - containerRect.top

    // Posiciona acima do dedo, respeitando bordas
    const lx = Math.max(0, Math.min(containerRect.width - D, sx - LUPA_R))
    const ly = Math.max(0, Math.min(containerRect.height - D, sy - LUPA_R - 160))
    lupaEl.style.left = `${lx}px`
    lupaEl.style.top = `${ly}px`
    lupaEl.style.display = 'block'

    const ZOOM = 2
    const ctx = lupaCanvas.getContext('2d')!

    // Fundo quadriculado para visualizar transparência
    for (let py = 0; py < D; py += 10) {
      for (let px = 0; px < D; px += 10) {
        ctx.fillStyle = ((Math.floor(px / 10) + Math.floor(py / 10)) % 2 === 0) ? '#e5e7eb' : '#ffffff'
        ctx.fillRect(px, py, 10, 10)
      }
    }

    // Corta em círculo e desenha o canvas ampliado
    const mainRect = mainCanvas.getBoundingClientRect()
    const cx = (clientX - mainRect.left) * (mainCanvas.width / mainRect.width)
    const cy = (clientY - mainRect.top) * (mainCanvas.height / mainRect.height)
    const srcSize = D / ZOOM

    ctx.save()
    ctx.beginPath()
    ctx.arc(LUPA_R, LUPA_R, LUPA_R, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(mainCanvas, cx - srcSize / 2, cy - srcSize / 2, srcSize, srcSize, 0, 0, D, D)
    ctx.restore()

    // Mira central
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.85)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(LUPA_R - 10, LUPA_R); ctx.lineTo(LUPA_R + 10, LUPA_R)
    ctx.moveTo(LUPA_R, LUPA_R - 10); ctx.lineTo(LUPA_R, LUPA_R + 10)
    ctx.stroke()

    // Anel externo
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(LUPA_R, LUPA_R, LUPA_R - 2, 0, Math.PI * 2)
    ctx.stroke()
  }

  const esconderLupa = () => {
    const lupaEl = lupaRef.current
    if (lupaEl) lupaEl.style.display = 'none'
  }

  // Interpola entre dois pontos e restaura ao longo da linha — elimina o pontilhado
  const restaurarLinha = (canvas: HTMLCanvasElement, x1: number, y1: number, x2: number, y2: number) => {
    const dist = Math.hypot(x2 - x1, y2 - y1)
    // passo de no máximo 30% do raio para garantir sobreposição e traço contínuo
    const passo = Math.max(1, tamanhoRef.current * 0.3)
    const passos = Math.max(1, Math.ceil(dist / passo))
    for (let i = 0; i <= passos; i++) {
      const t = i / passos
      restaurarPixels(canvas, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)
    }
  }

  // Restaura pixels a partir do canvas original (para o pincel de restaurar)
  const restaurarPixels = (canvas: HTMLCanvasElement, x: number, y: number) => {
    const orig = origCanvasRef.current
    if (!orig) return
    const ctx = canvas.getContext('2d')!
    const r = tamanhoRef.current / 2
    const x0 = Math.max(0, Math.floor(x - r))
    const y0 = Math.max(0, Math.floor(y - r))
    const w = Math.min(canvas.width - x0, Math.ceil(tamanhoRef.current))
    const h = Math.min(canvas.height - y0, Math.ceil(tamanhoRef.current))
    if (w <= 0 || h <= 0) return

    const origCtx = orig.getContext('2d')!
    const origData = origCtx.getImageData(x0, y0, w, h)
    const curData = ctx.getImageData(x0, y0, w, h)
    const cx = x - x0; const cy = y - y0

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        if (Math.hypot(px - cx, py - cy) <= r) {
          const i = (py * w + px) * 4
          curData.data[i] = origData.data[i]
          curData.data[i + 1] = origData.data[i + 1]
          curData.data[i + 2] = origData.data[i + 2]
          curData.data[i + 3] = origData.data[i + 3]
        }
      }
    }
    ctx.putImageData(curData, x0, y0)
  }

  // Redesenha canvas do zero (imagem original + todos os tracados até 'ate')
  const redesenhar = (ate: number) => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')!

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.globalCompositeOperation = 'source-over'
    ctx.drawImage(img, 0, 0)

    for (let i = 0; i < ate; i++) {
      const tr = tracadosRef.current[i]
      if (!tr || tr.pontos.length === 0) continue

      if (tr.tipo === 'apagar') {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.strokeStyle = 'rgba(0,0,0,1)'
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.lineWidth = tr.tamanho
        if (tr.pontos.length === 1) {
          ctx.beginPath()
          ctx.arc(tr.pontos[0].x, tr.pontos[0].y, tr.tamanho / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.moveTo(tr.pontos[0].x, tr.pontos[0].y)
          for (const pt of tr.pontos.slice(1)) ctx.lineTo(pt.x, pt.y)
          ctx.stroke()
        }
        ctx.globalCompositeOperation = 'source-over'
      } else {
        // restaurar: interpolado para traço contínuo
        if (tr.pontos.length === 1) {
          restaurarPixels(canvas, tr.pontos[0].x, tr.pontos[0].y)
        } else {
          for (let j = 1; j < tr.pontos.length; j++) {
            restaurarLinha(canvas, tr.pontos[j - 1].x, tr.pontos[j - 1].y, tr.pontos[j].x, tr.pontos[j].y)
          }
        }
      }
    }
  }

  // Carrega imagem processada (canvas principal) e original (referência do restaurar)
  useEffect(() => {
    const carregarImg = (url: string): Promise<HTMLImageElement> =>
      new Promise(resolve => {
        const i = new window.Image()
        i.onload = () => resolve(i)
        i.src = url
      })

    const init = async () => {
      const img = await carregarImg(imagemUrl)
      imgRef.current = img

      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d')!.drawImage(img, 0, 0)

      // Canvas de referência para o restaurar:
      // usa a foto original se fornecida, senão usa a própria imagem processada
      const origSrc = imagemOriginalUrl ?? imagemUrl
      const origImg = origSrc === imagemUrl ? img : await carregarImg(origSrc)
      const orig = document.createElement('canvas')
      orig.width = canvas.width
      orig.height = canvas.height
      // Escala a imagem original para a resolução da imagem processada
      orig.getContext('2d')!.drawImage(origImg, 0, 0, orig.width, orig.height)
      origCanvasRef.current = orig

      setPronto(true)
    }

    init()
  }, [imagemUrl, imagemOriginalUrl])

  // Touch events com passive:false para prevenir scroll durante desenho
  useEffect(() => {
    if (!pronto) return
    const canvas = canvasRef.current
    if (!canvas) return

    const apagar = (x: number, y: number) => {
      const ctx = canvas.getContext('2d')!
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = tamanhoRef.current
      const prev = tracadoAtual.current[tracadoAtual.current.length - 1]
      if (prev) {
        ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(x, y); ctx.stroke()
      } else {
        ctx.beginPath(); ctx.arc(x, y, tamanhoRef.current / 2, 0, Math.PI * 2); ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'
      tracadoAtual.current.push({ x, y })
    }

    const restaurar = (x: number, y: number) => {
      const prev = tracadoAtual.current[tracadoAtual.current.length - 1]
      if (prev) {
        restaurarLinha(canvas, prev.x, prev.y, x, y)
      } else {
        restaurarPixels(canvas, x, y)
      }
      tracadoAtual.current.push({ x, y })
    }

    const desenhar = (x: number, y: number) => {
      if (modoRef.current === 'apagar') apagar(x, y)
      else restaurar(x, y)
    }

    const finalizar = () => {
      if (!desenhando.current || tracadoAtual.current.length === 0) return
      desenhando.current = false
      const novoTracado: Tracado = {
        tipo: modoRef.current,
        pontos: [...tracadoAtual.current],
        tamanho: tamanhoRef.current,
      }
      tracadoAtual.current = []
      const novos = [...tracadosRef.current.slice(0, posicaoRef.current), novoTracado]
      tracadosRef.current = novos
      posicaoRef.current = novos.length
      setTotalTracados(novos.length)
      setPosicao(novos.length)
    }

    const coords = (t: Touch) => {
      const rect = canvas.getBoundingClientRect()
      return {
        x: (t.clientX - rect.left) * (canvas.width / rect.width),
        y: (t.clientY - rect.top) * (canvas.height / rect.height),
      }
    }

    const onStart = (e: TouchEvent) => {
      e.preventDefault()
      desenhando.current = true
      tracadoAtual.current = []
      const t = e.touches[0]
      const { x, y } = coords(t)
      desenhar(x, y)
      atualizarLupa(t.clientX, t.clientY)
    }
    const onMove = (e: TouchEvent) => {
      e.preventDefault()
      if (!desenhando.current) return
      const t = e.touches[0]
      const { x, y } = coords(t)
      desenhar(x, y)
      atualizarLupa(t.clientX, t.clientY)
    }
    const onEnd = () => { finalizar(); esconderLupa() }

    canvas.addEventListener('touchstart', onStart, { passive: false })
    canvas.addEventListener('touchmove', onMove, { passive: false })
    canvas.addEventListener('touchend', onEnd)
    return () => {
      canvas.removeEventListener('touchstart', onStart)
      canvas.removeEventListener('touchmove', onMove)
      canvas.removeEventListener('touchend', onEnd)
    }
  }, [pronto])

  // Mouse (desktop)
  const mouseCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!
    const r = c.getBoundingClientRect()
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) }
  }

  const apagarMouse = (x: number, y: number) => {
    const c = canvasRef.current!; const ctx = c.getContext('2d')!
    ctx.globalCompositeOperation = 'destination-out'
    ctx.strokeStyle = 'rgba(0,0,0,1)'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = tamanhoRef.current
    const prev = tracadoAtual.current[tracadoAtual.current.length - 1]
    if (prev) { ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(x, y); ctx.stroke() }
    else { ctx.beginPath(); ctx.arc(x, y, tamanhoRef.current / 2, 0, Math.PI * 2); ctx.fill() }
    ctx.globalCompositeOperation = 'source-over'
    tracadoAtual.current.push({ x, y })
  }

  const desenharMouse = (x: number, y: number) => {
    if (modoRef.current === 'apagar') apagarMouse(x, y)
    else {
      const canvas = canvasRef.current!
      const prev = tracadoAtual.current[tracadoAtual.current.length - 1]
      if (prev) restaurarLinha(canvas, prev.x, prev.y, x, y)
      else restaurarPixels(canvas, x, y)
      tracadoAtual.current.push({ x, y })
    }
  }

  const finalizarMouse = () => {
    if (!desenhando.current || tracadoAtual.current.length === 0) return
    desenhando.current = false
    const novoTracado: Tracado = { tipo: modoRef.current, pontos: [...tracadoAtual.current], tamanho: tamanhoRef.current }
    tracadoAtual.current = []
    const novos = [...tracadosRef.current.slice(0, posicaoRef.current), novoTracado]
    tracadosRef.current = novos; posicaoRef.current = novos.length
    setTotalTracados(novos.length); setPosicao(novos.length)
  }

  const desfazer = () => {
    if (posicaoRef.current <= 0) return
    posicaoRef.current -= 1
    redesenhar(posicaoRef.current)
    setPosicao(posicaoRef.current)
  }

  const refazer = () => {
    if (posicaoRef.current >= tracadosRef.current.length) return
    posicaoRef.current += 1
    redesenhar(posicaoRef.current)
    setPosicao(posicaoRef.current)
  }

  const confirmar = () => {
    canvasRef.current?.toBlob(blob => { if (blob) onConfirmar(blob) }, 'image/png', 0.9)
  }

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black flex-shrink-0">
        <button onClick={onCancelar} className="text-gray-400 text-sm px-2 py-1">Cancelar</button>
        <span className="text-white text-sm font-semibold">Editor</span>
        <button onClick={confirmar} className="text-indigo-400 font-semibold text-sm px-2 py-1">Confirmar</button>
      </div>

      {/* Canvas */}
      <div
        ref={canvasContainerRef}
        className="flex-1 overflow-hidden flex items-center justify-center relative"
        style={{ background: 'repeating-conic-gradient(#2a2a2a 0% 25%, #1a1a1a 0% 50%) 0 0 / 20px 20px' }}
      >
        {!pronto && <p className="text-gray-400 text-sm">Carregando...</p>}
        <canvas
          ref={canvasRef}
          className={`max-w-full max-h-full ${!pronto ? 'hidden' : ''}`}
          style={{ cursor: modo === 'apagar' ? 'cell' : 'crosshair', touchAction: 'none' }}
          onMouseDown={e => { desenhando.current = true; tracadoAtual.current = []; const { x, y } = mouseCoords(e); desenharMouse(x, y); atualizarLupa(e.clientX, e.clientY) }}
          onMouseMove={e => { if (!desenhando.current) return; const { x, y } = mouseCoords(e); desenharMouse(x, y); atualizarLupa(e.clientX, e.clientY) }}
          onMouseUp={() => { finalizarMouse(); esconderLupa() }}
          onMouseLeave={() => { finalizarMouse(); esconderLupa() }}
        />
        {/* Lupa — posicionada acima do dedo */}
        <div
          ref={lupaRef}
          className="absolute pointer-events-none z-10"
          style={{ display: 'none', width: LUPA_R * 2, height: LUPA_R * 2, borderRadius: '50%', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.8)' }}
        >
          <canvas ref={lupaCanvasRef} width={LUPA_R * 2} height={LUPA_R * 2} style={{ display: 'block' }} />
        </div>
      </div>

      {/* Controles */}
      <div className="bg-black px-4 pt-3 pb-8 flex flex-col gap-3 flex-shrink-0">
        {/* Toggle de modo */}
        <div className="flex gap-2">
          <button
            onClick={() => setModo('apagar')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              modo === 'apagar' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            <Eraser size={16} /> Apagador
          </button>
          <button
            onClick={() => setModo('restaurar')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              modo === 'restaurar' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            <Paintbrush size={16} /> Restaurar
          </button>
        </div>

        {/* Tamanho */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-16 flex-none">Tamanho</span>
          <input
            type="range" min={4} max={80} value={tamanho}
            onChange={e => setTamanho(Number(e.target.value))}
            className="flex-1 accent-indigo-500"
          />
          <div
            className="rounded-full bg-white flex-none"
            style={{ width: Math.max(4, tamanho * 0.5), height: Math.max(4, tamanho * 0.5) }}
          />
        </div>

        {/* Desfazer / Refazer */}
        <div className="flex gap-2">
          <button
            onClick={desfazer} disabled={posicao <= 0}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-800 text-white py-3.5 rounded-2xl text-sm font-medium disabled:opacity-30 active:bg-gray-700"
          >
            <Undo2 size={17} /> Desfazer
          </button>
          <button
            onClick={refazer} disabled={posicao >= totalTracados}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-800 text-white py-3.5 rounded-2xl text-sm font-medium disabled:opacity-30 active:bg-gray-700"
          >
            <Redo2 size={17} /> Refazer
          </button>
        </div>
      </div>
    </div>
  )
}
