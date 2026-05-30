'use client'
import { useState } from 'react'
import Image from 'next/image'
import { getSupabase, Roupa, CATEGORIAS } from '@/lib/supabase'
import { X, Trash2, Check } from 'lucide-react'

interface Props {
  roupa: Roupa
  onClose: () => void
  onDeleted: () => void
  onUpdated: (nova: Roupa) => void
}

export default function ModalDetalhePeca({ roupa, onClose, onDeleted, onUpdated }: Props) {
  const [nome, setNome] = useState(roupa.nome ?? '')
  const [salvando, setSalvando] = useState(false)
  const [deletando, setDeletando] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const cat = CATEGORIAS.find((c) => c.value === roupa.categoria)

  const salvarNome = async () => {
    setSalvando(true)
    const { data, error } = await getSupabase()
      .from('roupas')
      .update({ nome: nome.trim() || null })
      .eq('id', roupa.id)
      .select()
      .single()
    setSalvando(false)
    if (!error && data) onUpdated(data as Roupa)
  }

  const deletar = async () => {
    setDeletando(true)
    const path = roupa.imagem_url.split('/object/public/roupas/')[1]
    if (path) await getSupabase().storage.from('roupas').remove([path])
    await getSupabase().from('roupas').delete().eq('id', roupa.id)
    onDeleted()
    onClose()
  }

  const nomeMudou = nome !== (roupa.nome ?? '')

  return (
    <div className="fixed inset-0 bg-black/70 z-[70] flex items-end" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-3xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{cat?.emoji}</span>
            <span className="text-sm font-semibold text-gray-500">{cat?.label}</span>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400">
            <X size={22} />
          </button>
        </div>

        {/* Imagem */}
        <div
          className="mx-5 rounded-2xl overflow-hidden flex-shrink-0"
          style={{
            aspectRatio: '1/1',
            background: 'repeating-conic-gradient(#f3f4f6 0% 25%, white 0% 50%) 0 0 / 16px 16px',
          }}
        >
          <Image
            src={roupa.imagem_url}
            alt={roupa.nome || cat?.label || ''}
            width={400}
            height={400}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Nome */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nome da peça (opcional)"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400"
            />
            {nomeMudou && (
              <button
                onClick={salvarNome}
                disabled={salvando}
                className="px-4 bg-indigo-600 text-white rounded-xl font-medium text-sm disabled:opacity-50 flex items-center gap-1"
              >
                <Check size={16} />
                {salvando ? '...' : 'Salvar'}
              </button>
            )}
          </div>
        </div>

        {/* Botão excluir */}
        <div className="px-5 pb-10 pt-2">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full border-2 border-red-200 text-red-500 py-3.5 rounded-2xl font-medium flex items-center justify-center gap-2"
            >
              <Trash2 size={17} /> Excluir peça
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-medium text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={deletar}
                disabled={deletando}
                className="flex-1 bg-red-500 text-white py-3.5 rounded-2xl font-medium text-sm disabled:opacity-50"
              >
                {deletando ? 'Excluindo...' : 'Confirmar exclusão'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
