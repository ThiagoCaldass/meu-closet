'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Roupa, CATEGORIAS, Categoria } from '@/lib/supabase'
import { useSupabaseUser } from '@/lib/use-supabase-user'
import { getUsuarioAtual } from '@/lib/supabase-user'
import ModalAddRoupa from '@/components/ModalAddRoupa'
import ModalDetalhePeca from '@/components/ModalDetalhePeca'
import { Plus } from 'lucide-react'

export default function ClosetPage() {
  const [roupas, setRoupas] = useState<Roupa[]>([])
  const [categoriaAtiva, setCategoriaAtiva] = useState<Categoria>('parte_cima')
  const [modalAdd, setModalAdd] = useState(false)
  const [detalhe, setDetalhe] = useState<Roupa | null>(null)
  const supabase = useSupabaseUser()

  useEffect(() => { carregar() }, [supabase])

  const carregar = async () => {
    const usuario = getUsuarioAtual()
    if (!usuario) return
    const { data } = await supabase.from('roupas').select('*').eq('usuario', usuario).order('created_at', { ascending: false })
    setRoupas(data || [])
  }

  const filtradas = roupas.filter((r) => r.categoria === categoriaAtiva)
  const catAtual = CATEGORIAS.find((c) => c.value === categoriaAtiva)

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold mb-4">Meu Closet</h1>

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
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {filtradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <span className="text-5xl mb-3">{catAtual?.emoji}</span>
            <p className="text-sm">Nenhuma {catAtual?.label.toLowerCase()} ainda</p>
            <p className="text-xs mt-1">Toque no + para adicionar</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 py-2">
            {filtradas.map((roupa) => (
              <button
                key={roupa.id}
                onClick={() => setDetalhe(roupa)}
                className="relative rounded-xl overflow-hidden aspect-square"
                style={{ background: 'repeating-conic-gradient(#f3f4f6 0% 25%, white 0% 50%) 0 0 / 10px 10px' }}
              >
                <Image
                  src={roupa.imagem_url}
                  alt={roupa.nome || catAtual?.label || ''}
                  fill
                  className="object-contain"
                  sizes="33vw"
                />
                {roupa.nome && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
                    <p className="text-white text-xs truncate">{roupa.nome}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setModalAdd(true)}
        className="fixed bottom-24 right-4 bg-indigo-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-xl"
      >
        <Plus size={26} />
      </button>

      {modalAdd && (
        <ModalAddRoupa
          onClose={() => setModalAdd(false)}
          onAdded={carregar}
        />
      )}

      {detalhe && (
        <ModalDetalhePeca
          roupa={detalhe}
          onClose={() => setDetalhe(null)}
          onDeleted={carregar}
          onUpdated={(nova) => {
            setRoupas((prev) => prev.map((r) => r.id === nova.id ? nova : r))
            setDetalhe(nova)
          }}
        />
      )}
    </div>
  )
}
