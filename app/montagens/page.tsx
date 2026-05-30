'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getSupabase, Montagem } from '@/lib/supabase'
import { Trash2, Download } from 'lucide-react'

export default function MontagensPage() {
  const [montagens, setMontagens] = useState<Montagem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { carregar() }, [])

  const carregar = async () => {
    setLoading(true)
    const { data } = await getSupabase()
      .from('montagens')
      .select('*')
      .order('created_at', { ascending: false })
    setMontagens(data || [])
    setLoading(false)
  }

  const deletar = async (m: Montagem) => {
    if (!confirm(`Remover "${m.nome || 'montagem'}"?`)) return
    const path = m.imagem_url.split('/object/public/montagens/')[1]
    if (path) await getSupabase().storage.from('montagens').remove([path])
    await getSupabase().from('montagens').delete().eq('id', m.id)
    setMontagens(prev => prev.filter(x => x.id !== m.id))
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold">Montagens</h1>
        <p className="text-sm text-gray-400 mt-1">
          {montagens.length} montagem{montagens.length !== 1 ? 'ns' : ''} salva{montagens.length !== 1 ? 's' : ''}
        </p>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          Carregando...
        </div>
      ) : montagens.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 px-8 text-center">
          <span className="text-6xl mb-4">🎨</span>
          <p className="font-medium">Nenhuma montagem ainda</p>
          <p className="text-sm mt-1">Vá em Looks → Criar Montagem</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 px-4 pb-4">
          {montagens.map(m => (
            <div key={m.id} className="bg-gray-50 rounded-2xl overflow-hidden">
              <Image
                src={m.imagem_url}
                alt={m.nome || 'Montagem'}
                width={600}
                height={600}
                className="w-full aspect-square object-cover"
                unoptimized
              />
              <div className="flex items-center justify-between px-3 py-3">
                <p className="font-semibold text-sm">{m.nome || 'Sem nome'}</p>
                <div className="flex gap-2">
                  <a
                    href={m.imagem_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-indigo-500"
                  >
                    <Download size={18} />
                  </a>
                  <button onClick={() => deletar(m)} className="p-2 text-red-400">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
