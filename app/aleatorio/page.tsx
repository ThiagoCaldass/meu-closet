'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getSupabase, Roupa, ModoLook } from '@/lib/supabase'
import ModalSalvarLook from '@/components/ModalSalvarLook'
import { Shuffle, Save } from 'lucide-react'

interface LookGerado {
  modo: ModoLook
  sapato: Roupa | null
  parte_baixo: Roupa | null
  parte_cima: Roupa | null
  corpo_inteiro: Roupa | null
  acessorio: Roupa | null
}

function aleatorio<T>(arr: T[]): T | null {
  return arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null
}

export default function AleatorioPage() {
  const [closet, setCloset] = useState<Record<string, Roupa[]>>({})
  const [look, setLook] = useState<LookGerado | null>(null)
  const [modo, setModo] = useState<ModoLook>('completo')
  const [modalSalvar, setModalSalvar] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [animating, setAnimating] = useState(false)

  useEffect(() => { carregar() }, [])

  const carregar = async () => {
    const { data } = await getSupabase().from('roupas').select('*')
    if (!data) return
    const grouped: Record<string, Roupa[]> = {}
    data.forEach((r) => {
      if (!grouped[r.categoria]) grouped[r.categoria] = []
      grouped[r.categoria].push(r)
    })
    setCloset(grouped)
  }

  const gerar = () => {
    setAnimating(true)
    setTimeout(() => {
      if (modo === 'completo') {
        setLook({
          modo: 'completo',
          sapato: aleatorio(closet['sapato'] || []),
          parte_baixo: aleatorio(closet['parte_baixo'] || []),
          parte_cima: aleatorio(closet['parte_cima'] || []),
          corpo_inteiro: null,
          acessorio: aleatorio(closet['acessorio'] || []),
        })
      } else {
        setLook({
          modo: 'corpo_inteiro',
          sapato: aleatorio(closet['sapato'] || []),
          parte_baixo: null,
          parte_cima: null,
          corpo_inteiro: aleatorio(closet['corpo_inteiro'] || []),
          acessorio: aleatorio(closet['acessorio'] || []),
        })
      }
      setAnimating(false)
    }, 400)
  }

  const pecas = look
    ? [look.acessorio, look.parte_cima, look.corpo_inteiro, look.parte_baixo, look.sapato].filter(Boolean) as Roupa[]
    : []

  const temRoupas = Object.values(closet).some((arr) => arr.length > 0)

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold">Look Aleatório</h1>
        <p className="text-sm text-gray-400 mt-1">Deixa o acaso escolher</p>
      </div>

      {/* Toggle modo */}
      <div className="flex gap-2 px-4 mb-6">
        {(['completo', 'corpo_inteiro'] as ModoLook[]).map((m) => (
          <button
            key={m}
            onClick={() => { setModo(m); setLook(null) }}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              modo === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {m === 'completo' ? '👕 Separadas' : '👗 Corpo Inteiro'}
          </button>
        ))}
      </div>

      {/* Resultado */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {!temRoupas ? (
          <div className="text-center text-gray-400">
            <span className="text-5xl block mb-3">👗</span>
            <p className="font-medium">Closet vazio</p>
            <p className="text-sm mt-1">Adicione roupas no Closet primeiro</p>
          </div>
        ) : !look ? (
          <div className="text-center text-gray-400">
            <span className="text-6xl block mb-4">🎲</span>
            <p className="font-medium text-gray-500">Toque em Gerar Look</p>
            <p className="text-sm mt-1">para montar um outfit aleatório</p>
          </div>
        ) : (
          <div
            className={`w-full transition-opacity duration-300 ${animating ? 'opacity-0' : 'opacity-100'}`}
          >
            {/* Grid de peças geradas */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {pecas.map((peca) => (
                <div key={peca.id} className="rounded-2xl overflow-hidden aspect-square relative">
                  <Image
                    src={peca.imagem_url}
                    alt={peca.nome || ''}
                    fill
                    className="object-cover"
                    sizes="50vw"
                  />
                  {peca.nome && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                      <p className="text-white text-xs">{peca.nome}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Botão salvar look */}
            <button
              onClick={() => setModalSalvar(true)}
              className="w-full border-2 border-indigo-200 text-indigo-600 py-3 rounded-2xl font-medium flex items-center justify-center gap-2 mb-3"
            >
              <Save size={18} /> Salvar este look
            </button>
          </div>
        )}

        {salvo && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm text-center w-full">
            Look salvo!
          </div>
        )}
      </div>

      {/* Botão principal */}
      <div className="px-4 py-4">
        <button
          onClick={gerar}
          disabled={!temRoupas || animating}
          className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 active:scale-95 transition-transform"
        >
          <Shuffle size={22} />
          {look ? 'Gerar outro' : 'Gerar Look'}
        </button>
      </div>

      {modalSalvar && look && (
        <ModalSalvarLook
          selecao={look}
          onClose={() => setModalSalvar(false)}
          onSalvo={() => {
            setSalvo(true)
            setTimeout(() => setSalvo(false), 3000)
          }}
        />
      )}
    </div>
  )
}
