'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getSupabase, Roupa, CATEGORIAS, Categoria } from '@/lib/supabase'
import ModalAddRoupa from '@/components/ModalAddRoupa'
import { Plus, Trash2 } from 'lucide-react'

export default function ClosetPage() {
  const [roupas, setRoupas] = useState<Roupa[]>([])
  const [categoriaAtiva, setCategoriaAtiva] = useState<Categoria>('parte_cima')
  const [modal, setModal] = useState(false)
  const [deletando, setDeletando] = useState<string | null>(null)

  useEffect(() => { carregar() }, [])

  const carregar = async () => {
    const { data } = await getSupabase().from('roupas').select('*').order('created_at', { ascending: false })
    setRoupas(data || [])
  }

  const deletar = async (roupa: Roupa) => {
    if (!confirm(`Remover "${roupa.nome || 'essa peça'}"?`)) return
    setDeletando(roupa.id)

    const path = roupa.imagem_url.split('/object/public/roupas/')[1]
    if (path) await getSupabase().storage.from('roupas').remove([path])
    await getSupabase().from('roupas').delete().eq('id', roupa.id)

    await carregar()
    setDeletando(null)
  }

  const filtradas = roupas.filter((r) => r.categoria === categoriaAtiva)
  const catAtual = CATEGORIAS.find((c) => c.value === categoriaAtiva)

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold mb-4">Meu Closet</h1>

        {/* Tabs de categoria */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIAS.map((cat) => {
            const qtd = roupas.filter((r) => r.categoria === cat.value).length
            return (
              <button
                key={cat.value}
                onClick={() => setCategoriaAtiva(cat.value)}
                className={`flex-none flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  categoriaAtiva === cat.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
                {qtd > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    categoriaAtiva === cat.value ? 'bg-white/20' : 'bg-gray-200'
                  }`}>
                    {qtd}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid de roupas */}
      <div className="flex-1 overflow-y-auto px-4">
        {filtradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <span className="text-5xl mb-3">{catAtual?.emoji}</span>
            <p className="text-sm">Nenhuma {catAtual?.label.toLowerCase()} ainda</p>
            <p className="text-xs mt-1">Toque no + para adicionar</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 py-2">
            {filtradas.map((roupa) => (
              <div key={roupa.id} className="relative rounded-xl overflow-hidden aspect-square group">
                <Image
                  src={roupa.imagem_url}
                  alt={roupa.nome || catAtual?.label || ''}
                  fill
                  className="object-cover"
                  sizes="33vw"
                />
                {roupa.nome && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
                    <p className="text-white text-xs truncate">{roupa.nome}</p>
                  </div>
                )}
                <button
                  onClick={() => deletar(roupa)}
                  disabled={deletando === roupa.id}
                  className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setModal(true)}
        className="fixed bottom-24 right-4 bg-indigo-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-xl"
      >
        <Plus size={26} />
      </button>

      {modal && (
        <ModalAddRoupa
          onClose={() => setModal(false)}
          onAdded={carregar}
        />
      )}
    </div>
  )
}
