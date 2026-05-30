'use client'
import Image from 'next/image'
import { Roupa } from '@/lib/supabase'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  label: string
  emoji: string
  roupas: Roupa[]
  indice: number
  onNavegar: (dir: 'prev' | 'next') => void
}

export default function NavegadorPeca({ label, emoji, roupas, indice, onNavegar }: Props) {
  if (roupas.length === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 opacity-50">
        <span className="text-xl">{emoji}</span>
        <span className="text-sm text-gray-400 italic">Nenhum(a) {label.toLowerCase()} cadastrada</span>
      </div>
    )
  }

  const peca = roupas[indice]

  return (
    <div className="px-4 py-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span>{emoji}</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        </div>
        <span className="text-xs text-gray-400 tabular-nums">{indice + 1} / {roupas.length}</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavegar('prev')}
          className="flex-none w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center active:bg-gray-200 transition-colors"
        >
          <ChevronLeft size={22} className="text-gray-600" />
        </button>

        <div
          className="flex-1 aspect-square rounded-2xl overflow-hidden"
          style={{ background: 'repeating-conic-gradient(#f3f4f6 0% 25%, white 0% 50%) 0 0 / 14px 14px' }}
        >
          <Image
            src={peca.imagem_url}
            alt={peca.nome || label}
            width={240}
            height={240}
            className="w-full h-full object-contain"
          />
        </div>

        <button
          onClick={() => onNavegar('next')}
          className="flex-none w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center active:bg-gray-200 transition-colors"
        >
          <ChevronRight size={22} className="text-gray-600" />
        </button>
      </div>

      {peca.nome && (
        <p className="text-center text-xs text-gray-500 mt-1.5 truncate px-14">{peca.nome}</p>
      )}
    </div>
  )
}
