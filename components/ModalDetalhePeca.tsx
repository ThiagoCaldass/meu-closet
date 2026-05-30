'use client'
import { useState } from 'react'
import Image from 'next/image'
import { getSupabase, Roupa, CATEGORIAS, Categoria } from '@/lib/supabase'
import { X, Trash2, Check } from 'lucide-react'

interface Props {
  roupa: Roupa
  onClose: () => void
  onDeleted: () => void
  onUpdated: (nova: Roupa) => void
}

export default function ModalDetalhePeca({ roupa, onClose, onDeleted, onUpdated }: Props) {
  const [nome, setNome] = useState(roupa.nome ?? '')
  const [categoria, setCategoria] = useState<Categoria>(roupa.categoria)
  const [salvando, setSalvando] = useState(false)
  const [deletando, setDeletando] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const mudou = nome !== (roupa.nome ?? '') || categoria !== roupa.categoria

  const salvar = async () => {
    setSalvando(true)
    const { data, error } = await getSupabase()
      .from('roupas')
      .update({ nome: nome.trim() || null, categoria })
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

  return (
    <div className="fixed inset-0 bg-black/70 z-[70] flex items-end" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-3xl max-h-[92vh] flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
          <span className="text-base font-bold">Editar peça</span>
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
            alt={roupa.nome || ''}
            width={400} height={400}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Nome */}
        <div className="px-5 pt-4 pb-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Nome</label>
          <input
            type="text"
            placeholder="Nome da peça (opcional)"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400"
          />
        </div>

        {/* Categoria */}
        <div className="px-5 pb-4">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Categoria</label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIAS.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategoria(cat.value)}
                className={`flex flex-col items-center py-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                  categoria === cat.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-500'
                }`}
              >
                <span className="text-xl mb-0.5">{cat.emoji}</span>
                <span className="text-center leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Salvar alterações */}
        {mudou && (
          <div className="px-5 pb-3">
            <button
              onClick={salvar}
              disabled={salvando}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check size={17} /> {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        )}

        {/* Excluir */}
        <div className="px-5 pb-10 pt-1">
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
