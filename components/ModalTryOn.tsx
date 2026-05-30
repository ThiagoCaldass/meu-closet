'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'
import { Roupa, CATEGORIAS } from '@/lib/supabase'
import { X, Upload, Camera, Sparkles, Download, RefreshCw, Check } from 'lucide-react'

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

// Ordem de aplicação (de baixo para cima na visualização)
const ORDEM: Array<keyof Omit<LookPecas, 'nome'>> = [
  'sapato', 'parte_baixo', 'parte_cima', 'corpo_inteiro', 'acessorio',
]

export default function ModalTryOn({ look, onClose }: Props) {
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())
  const [pessoaFile, setPessoaFile] = useState<File | null>(null)
  const [pessoaPreview, setPessoaPreview] = useState<string | null>(null)
  const [gerando, setGerando] = useState(false)
  const [progresso, setProgresso] = useState('')
  const [resultado, setResultado] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const pecas = ORDEM.map(k => look[k]).filter(Boolean) as Roupa[]

  const emojiDePeca = (r: Roupa) =>
    CATEGORIAS.find((c) => c.value === r.categoria)?.emoji ?? '👗'

  const togglePeca = (id: string) => {
    setSelecionadas(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setResultado(null)
  }

  const handlePessoaFile = (f: File) => {
    setPessoaFile(f)
    setPessoaPreview(URL.createObjectURL(f))
    setResultado(null)
    setErro('')
  }

  const handleGerar = async () => {
    if (selecionadas.size === 0 || !pessoaFile) return
    setGerando(true)
    setErro('')
    setResultado(null)

    const pecasOrdenadas = pecas.filter(p => selecionadas.has(p.id))
    let pessoaAtual: File = pessoaFile
    let ultimaUrl = ''

    try {
      for (let i = 0; i < pecasOrdenadas.length; i++) {
        const peca = pecasOrdenadas[i]
        const label = peca.nome || CATEGORIAS.find(c => c.value === peca.categoria)?.label || 'peça'

        // Tenta até 3 vezes com wait progressivo
        let sucesso = false
        for (let tentativa = 0; tentativa < 3; tentativa++) {
          setProgresso(`${i + 1}/${pecasOrdenadas.length}: ${label}${tentativa > 0 ? ` (tentativa ${tentativa + 1})` : ''}...`)

          try {
            const form = new FormData()
            form.append('pessoa', pessoaAtual)
            form.append('roupa_url', peca.imagem_url)

            const res = await fetch('/api/tryon', { method: 'POST', body: form, signal: AbortSignal.timeout(120000) })
            const json = await res.json()

            if (!json.url) throw new Error(json.error || 'Erro na geração')
            ultimaUrl = json.url

            if (i < pecasOrdenadas.length - 1) {
              const imgResp = await fetch(json.url)
              const blob = await imgResp.blob()
              pessoaAtual = new File([blob], 'resultado.jpg', { type: 'image/jpeg' })
            }
            sucesso = true
            break
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erro desconhecido'
            if (tentativa === 2) throw err
            // Wait progressivo antes da próxima tentativa: 10s, 15s
            setProgresso(`${i + 1}/${pecasOrdenadas.length}: ${label} — reconectando em ${15 - tentativa * 5}s...`)
            await new Promise(r => setTimeout(r, (15 - tentativa * 5) * 1000))
          }
        }
        if (!sucesso) throw new Error('Falha após 3 tentativas')
      }
      setResultado(ultimaUrl)
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao gerar. Tente novamente.')
    } finally {
      setGerando(false)
      setProgresso('')
    }
  }

  const podeGerar = selecionadas.size > 0 && pessoaFile && !gerando

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
          <button onClick={onClose} className="p-1 text-gray-400"><X size={22} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {/* 1. Selecionar peças */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              1. Selecione as peças <span className="text-gray-400 font-normal">(pode ser mais de uma)</span>
            </p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {pecas.map((peca) => {
                const sel = selecionadas.has(peca.id)
                return (
                  <button
                    key={peca.id}
                    onClick={() => togglePeca(peca.id)}
                    className="flex-none flex flex-col items-center gap-1"
                  >
                    <div
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                        sel ? 'border-indigo-500 scale-105 shadow-md' : 'border-transparent'
                      }`}
                      style={{ background: 'repeating-conic-gradient(#f3f4f6 0% 25%, white 0% 50%) 0 0 / 10px 10px' }}
                    >
                      <Image src={peca.imagem_url} alt={peca.nome || ''} width={80} height={80} className="w-full h-full object-contain" />
                      {sel && (
                        <div className="absolute top-1 right-1 bg-indigo-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                          <Check size={12} />
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{emojiDePeca(peca)}</span>
                  </button>
                )
              })}
            </div>
            {selecionadas.size > 1 && (
              <p className="text-xs text-indigo-500 mt-1.5">
                {selecionadas.size} peças → aplicadas em sequência
              </p>
            )}
          </div>

          {/* 2. Foto da pessoa */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              2. Sua foto (corpo inteiro funciona melhor)
            </p>
            <input
              ref={inputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handlePessoaFile(e.target.files[0])}
            />
            {pessoaPreview ? (
              <div className="relative">
                <Image src={pessoaPreview} alt="Você" width={300} height={400} className="w-full max-h-60 object-contain rounded-2xl bg-gray-50" />
                <button onClick={() => { setPessoaFile(null); setPessoaPreview(null); setResultado(null) }} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => { inputRef.current?.removeAttribute('capture'); inputRef.current?.click() }} className="flex-1 border-2 border-dashed border-gray-300 rounded-2xl py-6 flex flex-col items-center gap-1 text-gray-400 text-sm">
                  <Upload size={22} /> Galeria
                </button>
                <button onClick={() => { inputRef.current?.setAttribute('capture', 'user'); inputRef.current?.click() }} className="flex-1 border-2 border-dashed border-gray-300 rounded-2xl py-6 flex flex-col items-center gap-1 text-gray-400 text-sm">
                  <Camera size={22} /> Câmera
                </button>
              </div>
            )}
          </div>

          {!resultado && !gerando && (
            <p className="text-xs text-gray-400 text-center">
              {selecionadas.size > 1
                ? `${selecionadas.size} peças em sequência · pode levar ${selecionadas.size}-${selecionadas.size * 2} min`
                : 'Geração leva entre 30s e 2 min dependendo da fila'}
            </p>
          )}

          {gerando && (
            <div className="flex flex-col items-center py-8">
              <Sparkles size={36} className="text-indigo-500 animate-pulse mb-3" />
              <p className="font-semibold text-indigo-600">Gerando look...</p>
              {progresso && <p className="text-xs text-gray-500 mt-1">{progresso}</p>}
            </div>
          )}

          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm text-center">{erro}</div>
          )}

          {resultado && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Resultado ✨</p>
              <Image src={resultado} alt="Look gerado" width={400} height={500} className="w-full rounded-2xl" unoptimized />
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
          {resultado ? (
            <div className="flex gap-2">
              <button onClick={() => { setResultado(null); setErro('') }} className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-medium text-sm flex items-center justify-center gap-1">
                <RefreshCw size={15} /> Tentar outra
              </button>
              <a href={resultado} download="tryon.jpg" target="_blank" rel="noopener noreferrer" className="flex-1 bg-indigo-600 text-white py-3.5 rounded-2xl font-medium text-sm flex items-center justify-center gap-1">
                <Download size={15} /> Baixar
              </a>
            </div>
          ) : (
            <button onClick={handleGerar} disabled={!podeGerar} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
              <Sparkles size={18} />
              {gerando ? 'Gerando...' : `Experimentar${selecionadas.size > 1 ? ` (${selecionadas.size} peças)` : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
