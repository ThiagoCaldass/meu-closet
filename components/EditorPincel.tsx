'use client'
import { useRef, useState, useEffect } from 'react'
import { Undo2, Redo2 } from 'lucide-react'

interface Tracado {
  pontos: Array<{ x: number; y: number }>
  tamanho: number
}

interface Props {
  imagemUrl: string
  onConfirmar: (blob: Blob) => void
  onCancelar: () => void
}

export default function EditorPincel({ imagemUrl, onConfirmar, onCancelar }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  // refs para acessar valores atuais dentro de event listeners
  const desenhando = useRef(false)
  const tracadoAtual = useRef<Array<{ x: number; y: number }>>([])
  const tracadosRef = useRef<Tracado[]>([])
  const posicaoRef = useRef(0)
  const tamanhoRef = useRef(20)

  // estado apenas para controle da UI
  const [tamanho, setTamanho] = useState(20)
  const [posicao, setPosicao] = useState(0)
  const [totalTracados, setTotalTracados] = useState(0)
  const [pronto, setPronto] = useState(false)

  useEffect(() => { tamanhoRef.current = tamanho }, [tamanho])

  // Redesenha a imagem original + tracados[0..ate]
  const redesenhar = (ate: number) => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')!

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.globalCompositeOperation = 'source-over'
    ctx.drawImage(img, 0, 0)

    ctx.globalCompositeOperation = 'destination-out'
    ctx.strokeStyle = 'rgba(0,0,0,1)'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    for (let i = 0; i < ate; i++) {
      const tr = tracadosRef.current[i]
      if (!tr || tr.pontos.length === 0) continue
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
    }
    ctx.globalCompositeOperation = 'source-over'
  }

  // Carrega a imagem e inicializa o canvas
  useEffect(() => {
    const img = new window.Image()
    img.onload = () => {
      imgRef.current = img
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      setPronto(true)
    }
    img.src = imagemUrl
  }, [imagemUrl])

  // Registra touch events com passive:false para permitir preventDefault
  useEffect(() => {
    if (!pronto) return
    const canvas = canvasRef.current
    if (!canvas) return

    const coords = (touch: Touch) => {
      const rect = canvas.getBoundingClientRect()
      return {
        x: (touch.clientX - rect.left) * (canvas.width / rect.width),
        y: (touch.clientY - rect.top) * (canvas.height / rect.height),
      }
    }

    const apagar = (x: number, y: number) => {
      const ctx = canvas.getContext('2d')!
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = tamanhoRef.current
      const prev = tracadoAtual.current[tracadoAtual.current.length - 1]
      if (prev) {
        ctx.beginPath()
        ctx.moveTo(prev.x, prev.y)
        ctx.lineTo(x, y)
        ctx.stroke()
      } else {
        ctx.beginPath()
        ctx.arc(x, y, tamanhoRef.current / 2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'
      tracadoAtual.current.push({ x, y })
    }

    const finalizarTracado = () => {
      if (!desenhando.current || tracadoAtual.current.length === 0) return
      desenhando.current = false
      const novoTracado: Tracado = { pontos: [...tracadoAtual.current], tamanho: tamanhoRef.current }
      tracadoAtual.current = []

      // descarta estados "futuros" e adiciona o novo tracado
      const novos = [...tracadosRef.current.slice(0, posicaoRef.current), novoTracado]
      tracadosRef.current = novos
      posicaoRef.current = novos.length
      setTotalTracados(novos.length)
      setPosicao(novos.length)
    }

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      desenhando.current = true
      tracadoAtual.current = []
      const { x, y } = coords(e.touches[0])
      apagar(x, y)
    }
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (!desenhando.current || !e.touches[0]) return
      const { x, y } = coords(e.touches[0])
      apagar(x, y)
    }
    const onTouchEnd = () => finalizarTracado()

    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd)
    return () => {
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [pronto])

  // Mouse events (desktop)
  const mouseCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  const apagarMouse = (x: number, y: number) => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.globalCompositeOperation = 'destination-out'
    ctx.strokeStyle = 'rgba(0,0,0,1)'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = tamanhoRef.current
    const prev = tracadoAtual.current[tracadoAtual.current.length - 1]
    if (prev) {
      ctx.beginPath()
      ctx.moveTo(prev.x, prev.y)
      ctx.lineTo(x, y)
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.arc(x, y, tamanhoRef.current / 2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'
    tracadoAtual.current.push({ x, y })
  }

  const finalizarMouse = () => {
    if (!desenhando.current || tracadoAtual.current.length === 0) return
    desenhando.current = false
    const novoTracado: Tracado = { pontos: [...tracadoAtual.current], tamanho: tamanhoRef.current }
    tracadoAtual.current = []
    const novos = [...tracadosRef.current.slice(0, posicaoRef.current), novoTracado]
    tracadosRef.current = novos
    posicaoRef.current = novos.length
    setTotalTracados(novos.length)
    setPosicao(novos.length)
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
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => { if (blob) onConfirmar(blob) }, 'image/png', 0.9)
  }

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black flex-shrink-0">
        <button onClick={onCancelar} className="text-gray-400 text-sm px-2 py-1">
          Cancelar
        </button>
        <span className="text-white text-sm font-semibold">Apagador</span>
        <button onClick={confirmar} className="text-indigo-400 font-semibold text-sm px-2 py-1">
          Confirmar
        </button>
      </div>

      {/* Canvas */}
      <div
        className="flex-1 overflow-hidden flex items-center justify-center"
        style={{ background: 'repeating-conic-gradient(#2a2a2a 0% 25%, #1a1a1a 0% 50%) 0 0 / 20px 20px' }}
      >
        {!pronto && <p className="text-gray-400 text-sm">Carregando...</p>}
        <canvas
          ref={canvasRef}
          className={`max-w-full max-h-full ${!pronto ? 'hidden' : ''}`}
          style={{ cursor: 'crosshair', touchAction: 'none' }}
          onMouseDown={(e) => { desenhando.current = true; tracadoAtual.current = []; const {x,y} = mouseCoords(e); apagarMouse(x,y) }}
          onMouseMove={(e) => { if (!desenhando.current) return; const {x,y} = mouseCoords(e); apagarMouse(x,y) }}
          onMouseUp={finalizarMouse}
          onMouseLeave={finalizarMouse}
        />
      </div>

      {/* Controles */}
      <div className="bg-black px-4 pt-3 pb-8 flex flex-col gap-3 flex-shrink-0">
        {/* Tamanho do pincel */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-16 flex-none">Tamanho</span>
          <input
            type="range" min={4} max={80} value={tamanho}
            onChange={(e) => setTamanho(Number(e.target.value))}
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
            onClick={desfazer}
            disabled={posicao <= 0}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-800 text-white py-3.5 rounded-2xl text-sm font-medium disabled:opacity-30 active:bg-gray-700"
          >
            <Undo2 size={17} /> Desfazer
          </button>
          <button
            onClick={refazer}
            disabled={posicao >= totalTracados}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-800 text-white py-3.5 rounded-2xl text-sm font-medium disabled:opacity-30 active:bg-gray-700"
          >
            <Redo2 size={17} /> Refazer
          </button>
        </div>
      </div>
    </div>
  )
}
