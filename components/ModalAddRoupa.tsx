'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'
import { getSupabase, CATEGORIAS, Categoria } from '@/lib/supabase'
import { X, Camera, Upload } from 'lucide-react'

interface Props {
  onClose: () => void
  onAdded: () => void
}

export default function ModalAddRoupa({ onClose, onAdded }: Props) {
  const [categoria, setCategoria] = useState<Categoria>('parte_cima')
  const [nome, setNome] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0])
  }

  const handleSalvar = async () => {
    if (!file) { setErro('Selecione uma imagem'); return }
    setLoading(true)
    setErro('')

    const ext = file.name.split('.').pop()
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

        {/* Upload imagem */}
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
            <Image
              src={preview}
              alt="Preview"
              width={400}
              height={300}
              className="w-full h-56 object-cover rounded-2xl"
            />
            <button
              onClick={() => { setPreview(null); setFile(null) }}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
            >
              <X size={16} />
            </button>
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

        {erro && <p className="text-red-500 text-sm mb-3">{erro}</p>}

        <button
          onClick={handleSalvar}
          disabled={loading || !file}
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-semibold text-base disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Salvando...' : 'Salvar peça'}
        </button>
      </div>
    </div>
  )
}
