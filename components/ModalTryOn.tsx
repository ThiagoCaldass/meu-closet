'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'
import { Roupa, CATEGORIAS } from '@/lib/supabase'
import { X, Upload, Camera, Sparkles, Download, RefreshCw } from 'lucide-react'

interface LookPecas {
  nome: string
  sapato: Roupa | null
  parte_baixo: Roupa | null
  parte_cima: Roupa | null
  corpo_inteiro: Roupa | null
  acessorio: Roupa | null
}

interface Props {
  look: LookPecas
  onClose: () => void
}

export default function ModalTryOn({ look, onClose }: Props) {
  const [pecaSelecionada, setPecaSelecionada] = useState<Roupa | null>(null)
  const [pessoaFile, setPessoaFile] = useState<File | null>(null)
  const [pessoaPreview, setPessoaPreview] = useState<string | null>(null)
  const [gerando, setGerando] = useState(false)
  const [resultado, setResultado] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const pecas = [
    look.acessorio,
    look.parte_cima,
    look.corpo_inteiro,
    look.parte_baixo,
    look.sapato,
  ].filter(Boolean) as Roupa[]

  const emojiDePeca = (r: Roupa) =>
    CATEGORIAS.find((c) => c.value === r.categoria)?.emoji ?? '👗'

  const handlePessoaFile = (f: File) => {
    setPessoaFile(f)
    setPessoaPreview(URL.createObjectURL(f))
    setResultado(null)
    setErro('')
  }

  const handleGerar = async () => {
    if (!pecaSelecionada || !pessoaFile) return
    setGerando(true)
    setErro('')
    setResultado(null)

    const form = new FormData()
    form.append('pessoa', pessoaFile)
    form.append('roupa_url', pecaSelecionada.imagem_url)

    try {
      const res = await fetch('/api/tryon', { method: 'POST', body: form })
      const json = await res.json()

      if (json.url) {
        setResultado(json.url)
      } else {
        setErro(json.error || 'Não foi possível gerar. Tente novamente.')
      }
    } catch {
      setErro('Erro de conexão. Verifique e tente novamente.')
    } finally {
      setGerando(false)
    }
  }

  const podeGerar = pecaSelecionada && pessoaFile && !gerando

  return (
    <div className="fixed inset-0 bg-black/70 z-[70] flex items-end" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-3xl max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold">Experimentar Look</h2>
            <p className="text-xs text-gray-400">{look.nome}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400">
            <X size={22} />
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">

          {/* 1. Selecionar peça */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              1. Selecione a peça para experimentar
            </p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {pecas.map((peca) => (
                <button
                  key={peca.id}
                  onClick={() => { setPecaSelecionada(peca); setResultado(null) }}
                  className={`flex-none flex flex-col items-center gap-1 transition-all`}
                >
                  <div
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      pecaSelecionada?.id === peca.id
                        ? 'border-indigo-500 scale-105 shadow-md'
                        : 'border-transparent'
                    }`}
                    style={{ background: 'repeating-conic-gradient(#f3f4f6 0% 25%, white 0% 50%) 0 0 / 10px 10px' }}
                  >
                    <Image
                      src={peca.imagem_url}
                      alt={peca.nome || ''}
                      width={80}
                      height={80}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-xs text-gray-400">{emojiDePeca(peca)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Foto da pessoa */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              2. Sua foto (de corpo inteiro funciona melhor)
            </p>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handlePessoaFile(e.target.files[0])}
            />

            {pessoaPreview ? (
              <div className="relative">
                <Image
                  src={pessoaPreview}
                  alt="Sua foto"
                  width={300}
                  height={400}
                  className="w-full max-h-60 object-contain rounded-2xl bg-gray-50"
                />
                <button
                  onClick={() => { setPessoaFile(null); setPessoaPreview(null); setResultado(null) }}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => { inputRef.current?.removeAttribute('capture'); inputRef.current?.click() }}
                  className="flex-1 border-2 border-dashed border-gray-300 rounded-2xl py-6 flex flex-col items-center gap-1 text-gray-400 text-sm"
                >
                  <Upload size={22} /> Galeria
                </button>
                <button
                  onClick={() => { inputRef.current?.setAttribute('capture', 'user'); inputRef.current?.click() }}
                  className="flex-1 border-2 border-dashed border-gray-300 rounded-2xl py-6 flex flex-col items-center gap-1 text-gray-400 text-sm"
                >
                  <Camera size={22} /> Câmera
                </button>
              </div>
            )}
          </div>

          {/* Aviso de tempo */}
          {!resultado && !gerando && (
            <p className="text-xs text-gray-400 text-center">
              A geração leva entre 30 segundos e 2 minutos dependendo da fila
            </p>
          )}

          {/* Loading */}
          {gerando && (
            <div className="flex flex-col items-center py-8">
              <Sparkles size={36} className="text-indigo-500 animate-pulse mb-3" />
              <p className="font-semibold text-indigo-600">Gerando seu look...</p>
              <p className="text-xs text-gray-400 mt-1">Aguarde, isso pode levar 1-2 minutos</p>
            </div>
          )}

          {/* Erro */}
          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm text-center">
              {erro}
            </div>
          )}

          {/* Resultado */}
          {resultado && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Resultado ✨</p>
              <Image
                src={resultado}
                alt="Look gerado"
                width={400}
                height={500}
                className="w-full rounded-2xl"
                unoptimized
              />
            </div>
          )}
        </div>

        {/* Footer com botões */}
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
          {resultado ? (
            <div className="flex gap-2">
              <button
                onClick={() => { setResultado(null); setErro('') }}
                className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-medium text-sm flex items-center justify-center gap-1"
              >
                <RefreshCw size={15} /> Tentar outra peça
              </button>
              <a
                href={resultado}
                download="tryon.jpg"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-indigo-600 text-white py-3.5 rounded-2xl font-medium text-sm flex items-center justify-center gap-1"
              >
                <Download size={15} /> Baixar
              </a>
            </div>
          ) : (
            <button
              onClick={handleGerar}
              disabled={!podeGerar}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
            >
              <Sparkles size={18} />
              {gerando ? 'Gerando...' : 'Experimentar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
