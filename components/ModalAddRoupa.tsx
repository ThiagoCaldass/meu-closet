'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'
import { getSupabase, CATEGORIAS, Categoria } from '@/lib/supabase'
import { X, Camera, Upload, Sparkles } from 'lucide-react'

interface Props {
  onClose: () => void
  onAdded: () => void
}

// Aplica máscaras de segmentação de roupa via Canvas, tornando o resto transparente
async function aplicarMascaras(
  imagem: File,
  mascaras: Array<{ mask: string }>
): Promise<Blob> {
  const imgBitmap = await createImageBitmap(imagem)
  const { width, height } = imgBitmap

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(imgBitmap, 0, 0)
  const dadosImg = ctx.getImageData(0, 0, width, height)

  const mascaraFinal = new Uint8Array(width * height).fill(0)

  for (const { mask: b64 } of mascaras) {
    const maskBlob = await fetch(`data:image/png;base64,${b64}`).then((r) => r.blob())
    const maskBitmap = await createImageBitmap(maskBlob)

    const maskCanvas = document.createElement('canvas')
    maskCanvas.width = width
    maskCanvas.height = height
    const maskCtx = maskCanvas.getContext('2d')!
    maskCtx.drawImage(maskBitmap, 0, 0, width, height)
    const dadosMask = maskCtx.getImageData(0, 0, width, height)

    for (let i = 0; i < mascaraFinal.length; i++) {
      if (dadosMask.data[i * 4] > 128) mascaraFinal[i] = 255
    }
  }

  // Pixels fora da roupa → transparentes
  for (let i = 0; i < dadosImg.data.length / 4; i++) {
    if (mascaraFinal[i] === 0) dadosImg.data[i * 4 + 3] = 0
  }
  ctx.putImageData(dadosImg, 0, 0)

  return new Promise((resolve) => canvas.toBlob(resolve as BlobCallback, 'image/png', 0.9))
}

export default function ModalAddRoupa({ onClose, onAdded }: Props) {
  const [categoria, setCategoria] = useState<Categoria>('parte_cima')
  const [nome, setNome] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [msgProcessando, setMsgProcessando] = useState('')
  const [erro, setErro] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (f: File) => {
    setErro('')
    setPreview(URL.createObjectURL(f))
    setFile(f)
    setProcessando(true)

    let processado = false

    // Tenta segmentação de roupa (remove pessoa + fundo) via API HF
    try {
      setMsgProcessando('Extraindo a roupa...')
      const form = new FormData()
      form.append('imagem', f)
      const res = await fetch('/api/segmentar', { method: 'POST', body: form })
      const json = await res.json()

      if (json.mascaras && json.mascaras.length > 0) {
        const blob = await aplicarMascaras(f, json.mascaras)
        const pf = new File([blob], f.name.replace(/\.[^.]+$/, '.png'), { type: 'image/png' })
        setFile(pf)
        setPreview(URL.createObjectURL(pf))
        processado = true
      }
    } catch {
      // prossegue para o fallback
    }

    // Fallback: remoção de fundo comum (@imgly)
    if (!processado) {
      try {
        setMsgProcessando('Removendo fundo...')
        const { removeBackground } = await import('@imgly/background-removal')
        const blob = await removeBackground(f, { output: { format: 'image/png', quality: 0.9 } })
        const pf = new File([blob], f.name.replace(/\.[^.]+$/, '.png'), { type: 'image/png' })
        setFile(pf)
        setPreview(URL.createObjectURL(pf))
      } catch {
        // mantém a imagem original se tudo falhar
      }
    }

    setProcessando(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0])
  }

  const handleSalvar = async () => {
    if (!file) { setErro('Selecione uma imagem'); return }
    setLoading(true)
    setErro('')

    const ext = file.type === 'image/png' ? 'png' : (file.name.split('.').pop() ?? 'jpg')
    const path = `${categoria}/${Date.now()}.${ext}`

    const { error: uploadError } = await getSupabase().storage
      .from('roupas')
      .upload(path, file, { contentType: file.type })

    if (uploadError) { setErro('Erro ao enviar imagem'); setLoading(false); return }

    const { data: { publicUrl } } = getSupabase().storage.from('roupas').getPublicUrl(path)

    const { error: dbError } = await getSupabase().from('roupas').insert({
      categoria,
      nome: nome.trim() || null,
      imagem_url: publicUrl,
    })

    if (dbError) { setErro('Erro ao salvar'); setLoading(false); return }

    onAdded()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-3xl p-6 pb-10 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">Adicionar peça</h2>
          <button onClick={onClose} className="p-1">
            <X size={22} />
          </button>
        </div>

        {/* Seletor de categoria */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoria(cat.value)}
              className={`flex flex-col items-center py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                categoria === cat.value
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-600'
              }`}
            >
              <span className="text-2xl mb-1">{cat.emoji}</span>
              <span className="text-xs text-center leading-tight">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Input nome */}
        <input
          type="text"
          placeholder="Nome da peça (opcional)"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:border-indigo-400"
        />

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleInputChange}
        />

        {preview ? (
          <div className="relative mb-4">
            <div
              className="w-full h-56 rounded-2xl overflow-hidden"
              style={{ background: 'repeating-conic-gradient(#e5e7eb 0% 25%, white 0% 50%) 0 0 / 16px 16px' }}
            >
              <Image
                src={preview}
                alt="Preview"
                width={400}
                height={224}
                className="w-full h-full object-contain"
              />
            </div>

            {processando && (
              <div className="absolute inset-0 bg-white/80 rounded-2xl flex flex-col items-center justify-center gap-2">
                <Sparkles size={28} className="text-indigo-500 animate-pulse" />
                <p className="text-sm font-medium text-indigo-600">{msgProcessando}</p>
                <p className="text-xs text-gray-400">Isso leva alguns segundos</p>
              </div>
            )}

            {!processando && (
              <>
                <button
                  onClick={() => { setPreview(null); setFile(null) }}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
                >
                  <X size={16} />
                </button>
                <div className="absolute bottom-2 left-2 bg-indigo-600/90 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                  <Sparkles size={11} /> Processado
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => { if (inputRef.current) { inputRef.current.removeAttribute('capture'); inputRef.current.click() } }}
              className="flex-1 border-2 border-dashed border-gray-300 rounded-2xl py-8 flex flex-col items-center gap-2 text-gray-400"
            >
              <Upload size={24} />
              <span className="text-sm">Galeria</span>
            </button>
            <button
              onClick={() => { if (inputRef.current) { inputRef.current.setAttribute('capture', 'environment'); inputRef.current.click() } }}
              className="flex-1 border-2 border-dashed border-gray-300 rounded-2xl py-8 flex flex-col items-center gap-2 text-gray-400"
            >
              <Camera size={24} />
              <span className="text-sm">Câmera</span>
            </button>
          </div>
        )}

        {!preview && (
          <div className="flex items-center gap-2 mb-4 px-1">
            <Sparkles size={14} className="text-indigo-400 flex-none" />
            <p className="text-xs text-gray-400">Roupa vestida? A IA remove a pessoa automaticamente</p>
          </div>
        )}

        {erro && <p className="text-red-500 text-sm mb-3">{erro}</p>}

        <button
          onClick={handleSalvar}
          disabled={loading || !file || processando}
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-semibold text-base disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Salvando...' : processando ? msgProcessando : 'Salvar peça'}
        </button>
      </div>
    </div>
  )
}
