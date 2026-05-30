'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { getSupabase, Roupa, ModoLook } from '@/lib/supabase'
import NavegadorPeca from '@/components/NavegadorPeca'
import ModalSalvarLook from '@/components/ModalSalvarLook'
import { Save } from 'lucide-react'

interface Closet {
  sapatos: Roupa[]
  partes_baixo: Roupa[]
  partes_cima: Roupa[]
  corpos_inteiros: Roupa[]
  acessorios: Roupa[]
}

interface Indices {
  sapato: number
  parte_baixo: number
  parte_cima: number
  corpo_inteiro: number
  acessorio: number
}

export default function VisualizadorPage() {
  const [closet, setCloset] = useState<Closet>({
    sapatos: [], partes_baixo: [], partes_cima: [], corpos_inteiros: [], acessorios: []
  })
  const [modo, setModo] = useState<ModoLook>('completo')
  const [indices, setIndices] = useState<Indices>({ sapato: 0, parte_baixo: 0, parte_cima: 0, corpo_inteiro: 0, acessorio: 0 })
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

  const navegar = (cat: keyof Indices, roupas: Roupa[], dir: 'prev' | 'next') => {
    if (roupas.length === 0) return
    setIndices((prev) => ({
      ...prev,
      [cat]: dir === 'prev'
        ? (prev[cat] - 1 + roupas.length) % roupas.length
        : (prev[cat] + 1) % roupas.length,
    }))
  }

  const peca = (cat: keyof Indices, arr: Roupa[]): Roupa | null =>
    arr.length > 0 ? arr[indices[cat]] : null

  const lookAtual = {
    modo,
    sapato: peca('sapato', closet.sapatos),
    parte_baixo: modo === 'completo' ? peca('parte_baixo', closet.partes_baixo) : null,
    parte_cima: modo === 'completo' ? peca('parte_cima', closet.partes_cima) : null,
    corpo_inteiro: modo === 'corpo_inteiro' ? peca('corpo_inteiro', closet.corpos_inteiros) : null,
    acessorio: peca('acessorio', closet.acessorios),
  }

  const temRoupas = modo === 'completo'
    ? [closet.sapatos, closet.partes_baixo, closet.partes_cima, closet.acessorios].some(a => a.length > 0)
    : [closet.sapatos, closet.corpos_inteiros, closet.acessorios].some(a => a.length > 0)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-4 pt-12 pb-3">
        <h1 className="text-xl font-bold mb-3">Montar Look</h1>
        <div className="flex gap-2">
          {(['completo', 'corpo_inteiro'] as ModoLook[]).map((m) => (
            <button
              key={m}
              onClick={() => setModo(m)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                modo === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {m === 'completo' ? '👕 Separadas' : '👗 Corpo Inteiro'}
            </button>
          ))}
        </div>
      </div>

      {/* Navegadores de peça */}
      <div className="flex-1 flex flex-col gap-1 py-2">
        {modo === 'completo' ? (
          <>
            <NavegadorPeca
              label="Acessórios" emoji="👜"
              roupas={closet.acessorios}
              indice={indices.acessorio}
              onNavegar={(d) => navegar('acessorio', closet.acessorios, d)}
            />
            <NavegadorPeca
              label="Parte de Cima" emoji="👕"
              roupas={closet.partes_cima}
              indice={indices.parte_cima}
              onNavegar={(d) => navegar('parte_cima', closet.partes_cima, d)}
            />
            <NavegadorPeca
              label="Parte de Baixo" emoji="👖"
              roupas={closet.partes_baixo}
              indice={indices.parte_baixo}
              onNavegar={(d) => navegar('parte_baixo', closet.partes_baixo, d)}
            />
            <NavegadorPeca
              label="Sapatos" emoji="👟"
              roupas={closet.sapatos}
              indice={indices.sapato}
              onNavegar={(d) => navegar('sapato', closet.sapatos, d)}
            />
          </>
        ) : (
          <>
            <NavegadorPeca
              label="Acessórios" emoji="👜"
              roupas={closet.acessorios}
              indice={indices.acessorio}
              onNavegar={(d) => navegar('acessorio', closet.acessorios, d)}
            />
            <NavegadorPeca
              label="Corpo Inteiro" emoji="👗"
              roupas={closet.corpos_inteiros}
              indice={indices.corpo_inteiro}
              onNavegar={(d) => navegar('corpo_inteiro', closet.corpos_inteiros, d)}
            />
            <NavegadorPeca
              label="Sapatos" emoji="👟"
              roupas={closet.sapatos}
              indice={indices.sapato}
              onNavegar={(d) => navegar('sapato', closet.sapatos, d)}
            />
          </>
        )}
      </div>

      {/* Botão salvar */}
      {temRoupas && (
        <div className="px-4 py-3">
          <button
            onClick={() => setModalSalvar(true)}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-md"
          >
            <Save size={17} /> Salvar como Look
          </button>
        </div>
      )}

      {lookSalvo && (
        <div className="mx-4 mb-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm text-center">
          Look salvo com sucesso!
        </div>
      )}

      {modalSalvar && (
        <ModalSalvarLook
          selecao={lookAtual}
          onClose={() => setModalSalvar(false)}
          onSalvo={() => {
            setLookSalvo(true)
            setTimeout(() => setLookSalvo(false), 3000)
          }}
        />
      )}
    </div>
  )
}
