'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getSupabase, Roupa, ModoLook } from '@/lib/supabase'
import SliderRoupas from '@/components/SliderRoupas'
import ModalSalvarLook from '@/components/ModalSalvarLook'
import { Save, RefreshCw } from 'lucide-react'

interface Closet {
  sapatos: Roupa[]
  partes_baixo: Roupa[]
  partes_cima: Roupa[]
  corpos_inteiros: Roupa[]
  acessorios: Roupa[]
}

interface Selecao {
  sapato: Roupa | null
  parte_baixo: Roupa | null
  parte_cima: Roupa | null
  corpo_inteiro: Roupa | null
  acessorio: Roupa | null
}

export default function VisualizadorPage() {
  const [closet, setCloset] = useState<Closet>({
    sapatos: [], partes_baixo: [], partes_cima: [], corpos_inteiros: [], acessorios: []
  })
  const [modo, setModo] = useState<ModoLook>('completo')
  const [selecao, setSelecao] = useState<Selecao>({
    sapato: null, parte_baixo: null, parte_cima: null, corpo_inteiro: null, acessorio: null
  })
  const [modalSalvar, setModalSalvar] = useState(false)
  const [lookSalvo, setLookSalvo] = useState(false)

  useEffect(() => { carregarCloset() }, [])

  const carregarCloset = async () => {
    const { data } = await getSupabase().from('roupas').select('*').order('created_at', { ascending: false })
    if (!data) return
    setCloset({
      sapatos: data.filter((r) => r.categoria === 'sapato'),
      partes_baixo: data.filter((r) => r.categoria === 'parte_baixo'),
      partes_cima: data.filter((r) => r.categoria === 'parte_cima'),
      corpos_inteiros: data.filter((r) => r.categoria === 'corpo_inteiro'),
      acessorios: data.filter((r) => r.categoria === 'acessorio'),
    })
  }

  const temSelecao = Object.values(selecao).some(Boolean)

  const limpar = () => setSelecao({ sapato: null, parte_baixo: null, parte_cima: null, corpo_inteiro: null, acessorio: null })

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-4 pt-12 pb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Montar Look</h1>
        {temSelecao && (
          <button onClick={limpar} className="text-sm text-gray-400 flex items-center gap-1">
            <RefreshCw size={14} /> Limpar
          </button>
        )}
      </div>

      {/* Toggle modo */}
      <div className="flex gap-2 px-4 mb-4">
        {(['completo', 'corpo_inteiro'] as ModoLook[]).map((m) => (
          <button
            key={m}
            onClick={() => { setModo(m); limpar() }}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              modo === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {m === 'completo' ? '👕 Separadas' : '👗 Corpo Inteiro'}
          </button>
        ))}
      </div>

      {/* Preview do look atual */}
      {temSelecao && (
        <div className="mx-4 mb-4 bg-gray-50 rounded-2xl p-3 flex justify-center gap-2 flex-wrap">
          {[
            selecao.acessorio,
            selecao.parte_cima,
            selecao.corpo_inteiro,
            selecao.parte_baixo,
            selecao.sapato,
          ]
            .filter(Boolean)
            .map((r) => (
              <div key={r!.id} className="w-16 h-16 rounded-xl overflow-hidden">
                <Image
                  src={r!.imagem_url}
                  alt={r!.nome || ''}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
        </div>
      )}

      {/* Sliders */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 py-2">
        {modo === 'completo' ? (
          <>
            <SliderRoupas
              label="Acessórios" emoji="👜"
              roupas={closet.acessorios}
              selecionada={selecao.acessorio}
              onSelect={(r) => setSelecao((s) => ({ ...s, acessorio: s.acessorio?.id === r.id ? null : r }))}
            />
            <SliderRoupas
              label="Parte de Cima" emoji="👕"
              roupas={closet.partes_cima}
              selecionada={selecao.parte_cima}
              onSelect={(r) => setSelecao((s) => ({ ...s, parte_cima: s.parte_cima?.id === r.id ? null : r }))}
            />
            <SliderRoupas
              label="Parte de Baixo" emoji="👖"
              roupas={closet.partes_baixo}
              selecionada={selecao.parte_baixo}
              onSelect={(r) => setSelecao((s) => ({ ...s, parte_baixo: s.parte_baixo?.id === r.id ? null : r }))}
            />
            <SliderRoupas
              label="Sapatos" emoji="👟"
              roupas={closet.sapatos}
              selecionada={selecao.sapato}
              onSelect={(r) => setSelecao((s) => ({ ...s, sapato: s.sapato?.id === r.id ? null : r }))}
            />
          </>
        ) : (
          <>
            <SliderRoupas
              label="Acessórios" emoji="👜"
              roupas={closet.acessorios}
              selecionada={selecao.acessorio}
              onSelect={(r) => setSelecao((s) => ({ ...s, acessorio: s.acessorio?.id === r.id ? null : r }))}
            />
            <SliderRoupas
              label="Corpo Inteiro" emoji="👗"
              roupas={closet.corpos_inteiros}
              selecionada={selecao.corpo_inteiro}
              onSelect={(r) => setSelecao((s) => ({ ...s, corpo_inteiro: s.corpo_inteiro?.id === r.id ? null : r }))}
            />
            <SliderRoupas
              label="Sapatos" emoji="👟"
              roupas={closet.sapatos}
              selecionada={selecao.sapato}
              onSelect={(r) => setSelecao((s) => ({ ...s, sapato: s.sapato?.id === r.id ? null : r }))}
            />
          </>
        )}
      </div>

      {/* Botão salvar look */}
      {temSelecao && (
        <div className="px-4 py-3">
          <button
            onClick={() => setModalSalvar(true)}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg"
          >
            <Save size={18} /> Salvar como Look
          </button>
        </div>
      )}

      {lookSalvo && (
        <div className="mx-4 mb-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm text-center">
          Look salvo com sucesso!
        </div>
      )}

      {modalSalvar && (
        <ModalSalvarLook
          selecao={{ modo, ...selecao }}
          onClose={() => setModalSalvar(false)}
          onSalvo={() => {
            setLookSalvo(true)
            limpar()
            setTimeout(() => setLookSalvo(false), 3000)
          }}
        />
      )}
    </div>
  )
}
