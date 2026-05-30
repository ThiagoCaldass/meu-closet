'use client'
import { useState } from 'react'
import { getSupabase, Roupa, ModoLook } from '@/lib/supabase'
import { X } from 'lucide-react'

interface Selecao {
  modo: ModoLook
  sapato: Roupa | null
  parte_baixo: Roupa | null
  parte_cima: Roupa | null
  corpo_inteiro: Roupa | null
  acessorio: Roupa | null
}

interface Props {
  selecao: Selecao
  onClose: () => void
  onSalvo: () => void
}

export default function ModalSalvarLook({ selecao, onClose, onSalvo }: Props) {
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const handleSalvar = async () => {
    if (!nome.trim()) { setErro('Dê um nome ao look'); return }
    setLoading(true)
    setErro('')

    const { error } = await getSupabase().from('looks').insert({
      nome: nome.trim(),
      modo: selecao.modo,
      sapato_id: selecao.sapato?.id ?? null,
      parte_baixo_id: selecao.parte_baixo?.id ?? null,
      parte_cima_id: selecao.parte_cima?.id ?? null,
      corpo_inteiro_id: selecao.corpo_inteiro?.id ?? null,
      acessorio_id: selecao.acessorio?.id ?? null,
    })

    if (error) { setErro('Erro ao salvar look'); setLoading(false); return }
    onSalvo()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-end" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-3xl p-6 pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold">Salvar look</h2>
          <button onClick={onClose}><X size={22} /></button>
        </div>

        <input
          type="text"
          placeholder="Nome do look (ex: Casual segunda)"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:border-indigo-400"
          autoFocus
        />

        {erro && <p className="text-red-500 text-sm mb-3">{erro}</p>}

        <button
          onClick={handleSalvar}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-semibold disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar look ✨'}
        </button>
      </div>
    </div>
  )
}
