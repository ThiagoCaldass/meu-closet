'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getSupabase, Roupa, ModoLook } from '@/lib/supabase'
import { getUsuarioAtual } from '@/lib/supabase-user'
import ModalSalvarLook from '@/components/ModalSalvarLook'
import SlotLook from '@/components/SlotLook'
import { Shuffle, Save } from 'lucide-react'

interface LookGerado {
  modo: ModoLook
  sapato: Roupa | null
  parte_baixo: Roupa | null
  parte_cima: Roupa | null
  corpo_inteiro: Roupa | null
  acessorio: Roupa | null
}

function rand<T>(arr: T[]): T | null {
  return arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null
}

export default function AleatorioPage() {
  const [closet, setCloset] = useState<Record<string, Roupa[]>>({})
  const [look, setLook] = useState<LookGerado | null>(null)
  const [modo, setModo] = useState<ModoLook>('completo')
  const [modalSalvar, setModalSalvar] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [animando, setAnimando] = useState(false)

  useEffect(() => { carregar() }, [])

  const carregar = async () => {
    const usuario = getUsuarioAtual()
    if (!usuario) return
    const { data } = await getSupabase().from('roupas').select('*').eq('usuario', usuario)
    if (!data) return
    const grouped: Record<string, Roupa[]> = {}
    data.forEach((r) => {
      if (!grouped[r.categoria]) grouped[r.categoria] = []
      grouped[r.categoria].push(r)
    })
    setCloset(grouped)
  }

  const gerar = () => {
    setAnimando(true)
    setTimeout(() => {
      setLook(
        modo === 'completo'
          ? {
              modo: 'completo',
              acessorio: rand(closet['acessorio'] || []),
              parte_cima: rand(closet['parte_cima'] || []),
              parte_baixo: rand(closet['parte_baixo'] || []),
              sapato: rand(closet['sapato'] || []),
              corpo_inteiro: null,
            }
          : {
              modo: 'corpo_inteiro',
              acessorio: rand(closet['acessorio'] || []),
              corpo_inteiro: rand(closet['corpo_inteiro'] || []),
              sapato: rand(closet['sapato'] || []),
              parte_baixo: null,
              parte_cima: null,
            }
      )
      setAnimando(false)
    }, 350)
  }

  const temRoupas = Object.values(closet).some((arr) => arr.length > 0)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-4 pt-12 pb-3">
        <h1 className="text-xl font-bold">Look Aleatório</h1>
        <p className="text-sm text-gray-400 mt-0.5 mb-3">Deixa o acaso escolher</p>
        <div className="flex gap-2">
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
      </div>

      {/* Área do look */}
      <div className="flex-1 flex flex-col justify-center px-4">
        {!temRoupas ? (
          <div className="text-center text-gray-400 py-12">
            <span className="text-5xl block mb-3">👗</span>
            <p className="font-medium">Closet vazio</p>
            <p className="text-sm mt-1">Adicione roupas no Closet primeiro</p>
          </div>
        ) : (
          <div className={`transition-opacity duration-300 ${animando ? 'opacity-0' : 'opacity-100'}`}>
            <div className="bg-gray-50 rounded-3xl p-3 mb-3">
              {modo === 'completo' ? (
                <div className="grid grid-cols-2 gap-2">
                  <SlotLook roupa={look?.acessorio ?? null}   emoji="👜" label="Acessório" />
                  <SlotLook roupa={look?.parte_cima ?? null}  emoji="👕" label="Parte de Cima" />
                  <SlotLook roupa={look?.parte_baixo ?? null} emoji="👖" label="Parte de Baixo" />
                  <SlotLook roupa={look?.sapato ?? null}      emoji="👟" label="Sapato" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-2">
                    <SlotLook roupa={look?.acessorio ?? null} emoji="👜" label="Acessório" />
                    <SlotLook roupa={look?.sapato ?? null}    emoji="👟" label="Sapato" />
                  </div>
                  <div className="col-span-2">
                    <div
                      className="w-full rounded-2xl overflow-hidden"
                      style={{
                        aspectRatio: '1/2',
                        background: look?.corpo_inteiro
                          ? 'repeating-conic-gradient(#f3f4f6 0% 25%, white 0% 50%) 0 0 / 12px 12px'
                          : undefined,
                      }}
                    >
                      {look?.corpo_inteiro ? (
                        <Image
                          src={look.corpo_inteiro.imagem_url}
                          alt={look.corpo_inteiro.nome || 'Corpo Inteiro'}
                          width={200}
                          height={400}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center">
                          <span className="text-4xl opacity-30">👗</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {look && (
              <button
                onClick={() => setModalSalvar(true)}
                className="w-full border-2 border-indigo-200 text-indigo-600 py-3 rounded-2xl font-medium flex items-center justify-center gap-2"
              >
                <Save size={17} /> Salvar este look
              </button>
            )}

            {salvo && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm text-center">
                Look salvo!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botão gerar */}
      <div className="px-4 py-4">
        <button
          onClick={gerar}
          disabled={!temRoupas || animando}
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
