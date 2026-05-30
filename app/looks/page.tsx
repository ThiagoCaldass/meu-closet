'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getSupabase, Look, Roupa } from '@/lib/supabase'
import ModalTryOn from '@/components/ModalTryOn'
import { Trash2, Sparkles } from 'lucide-react'

interface LookComRoupas extends Look {
  sapato?: Roupa | null
  parte_baixo?: Roupa | null
  parte_cima?: Roupa | null
  corpo_inteiro?: Roupa | null
  acessorio?: Roupa | null
}

export default function LooksPage() {
  const [looks, setLooks] = useState<LookComRoupas[]>([])
  const [loading, setLoading] = useState(true)
  const [tryOn, setTryOn] = useState<LookComRoupas | null>(null)

  useEffect(() => { carregar() }, [])

  const carregar = async () => {
    setLoading(true)
    const { data: looksData } = await getSupabase()
      .from('looks')
      .select('*')
      .order('created_at', { ascending: false })

    if (!looksData) { setLoading(false); return }

    const roupaIds = [
      ...new Set(
        looksData.flatMap((l) =>
          [l.sapato_id, l.parte_baixo_id, l.parte_cima_id, l.corpo_inteiro_id, l.acessorio_id].filter(Boolean)
        )
      ),
    ]

    const { data: roupasData } = roupaIds.length > 0
      ? await getSupabase().from('roupas').select('*').in('id', roupaIds)
      : { data: [] }

    const roupaMap = new Map((roupasData || []).map((r: Roupa) => [r.id, r]))

    setLooks(
      looksData.map((l) => ({
        ...l,
        sapato: l.sapato_id ? roupaMap.get(l.sapato_id) : null,
        parte_baixo: l.parte_baixo_id ? roupaMap.get(l.parte_baixo_id) : null,
        parte_cima: l.parte_cima_id ? roupaMap.get(l.parte_cima_id) : null,
        corpo_inteiro: l.corpo_inteiro_id ? roupaMap.get(l.corpo_inteiro_id) : null,
        acessorio: l.acessorio_id ? roupaMap.get(l.acessorio_id) : null,
      }))
    )
    setLoading(false)
  }

  const deletar = async (look: LookComRoupas) => {
    if (!confirm(`Remover look "${look.nome}"?`)) return
    await getSupabase().from('looks').delete().eq('id', look.id)
    setLooks((prev) => prev.filter((l) => l.id !== look.id))
  }

  const pecasDoLook = (look: LookComRoupas) =>
    [look.acessorio, look.parte_cima, look.corpo_inteiro, look.parte_baixo, look.sapato].filter(
      Boolean
    ) as Roupa[]

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold">Meus Looks</h1>
        <p className="text-sm text-gray-400 mt-1">
          {looks.length} look{looks.length !== 1 ? 's' : ''} salvos
        </p>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <p>Carregando...</p>
        </div>
      ) : looks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 px-8 text-center">
          <span className="text-6xl mb-4">✨</span>
          <p className="font-medium">Nenhum look salvo ainda</p>
          <p className="text-sm mt-1">Monte um look na aba Montar e salve!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 px-4 pb-4">
          {looks.map((look) => {
            const pecas = pecasDoLook(look)
            return (
              <div key={look.id} className="bg-gray-50 rounded-2xl overflow-hidden">
                {/* Fotos das peças */}
                <div className="flex gap-1 p-3">
                  {pecas.slice(0, 5).map((peca) => (
                    <div
                      key={peca.id}
                      className="flex-1 aspect-square rounded-xl overflow-hidden min-w-0"
                      style={{
                        background:
                          'repeating-conic-gradient(#f3f4f6 0% 25%, white 0% 50%) 0 0 / 10px 10px',
                      }}
                    >
                      <Image
                        src={peca.imagem_url}
                        alt={peca.nome || ''}
                        width={80}
                        height={80}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ))}
                  {pecas.length === 1 && <div className="flex-1 rounded-xl bg-gray-200" />}
                </div>

                {/* Nome, ações e botão try-on */}
                <div className="px-3 pb-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{look.nome}</p>
                      <p className="text-xs text-gray-400">
                        {look.modo === 'completo' ? 'Peças separadas' : 'Corpo inteiro'} ·{' '}
                        {pecas.length} peça{pecas.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => deletar(look)}
                      className="p-2 text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Botão experimentar */}
                  {pecas.length > 0 && (
                    <button
                      onClick={() => setTryOn(look)}
                      className="w-full border border-indigo-200 bg-indigo-50 text-indigo-600 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5"
                    >
                      <Sparkles size={15} /> Experimentar este look
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tryOn && (
        <ModalTryOn
          look={{
            nome: tryOn.nome,
            sapato: tryOn.sapato ?? null,
            parte_baixo: tryOn.parte_baixo ?? null,
            parte_cima: tryOn.parte_cima ?? null,
            corpo_inteiro: tryOn.corpo_inteiro ?? null,
            acessorio: tryOn.acessorio ?? null,
          }}
          onClose={() => setTryOn(null)}
        />
      )}
    </div>
  )
}
