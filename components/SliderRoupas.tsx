'use client'
import { useRef } from 'react'
import Image from 'next/image'
import { Roupa } from '@/lib/supabase'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  label: string
  emoji: string
  roupas: Roupa[]
  selecionada: Roupa | null
  onSelect: (roupa: Roupa) => void
}

export default function SliderRoupas({ label, emoji, roupas, selecionada, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'left' ? -160 : 160, behavior: 'smooth' })
  }

  if (roupas.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2">
        <span className="text-lg">{emoji}</span>
        <span className="text-sm text-gray-400 italic">Nenhuma {label.toLowerCase()} cadastrada</span>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-4 mb-1">
        <span className="text-base">{emoji}</span>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      </div>

      <div className="relative group">
        <button
          onClick={() => scroll('left')}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft size={16} />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-1"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {roupas.map((roupa) => {
            const selected = selecionada?.id === roupa.id
            return (
              <button
                key={roupa.id}
                onClick={() => onSelect(roupa)}
                className={`flex-none w-28 h-28 rounded-xl overflow-hidden border-2 transition-all ${
                  selected
                    ? 'border-indigo-500 shadow-lg scale-105'
                    : 'border-transparent'
                }`}
                style={{ scrollSnapAlign: 'start' }}
              >
                <Image
                  src={roupa.imagem_url}
                  alt={roupa.nome || label}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                />
              </button>
            )
          })}
        </div>

        <button
          onClick={() => scroll('right')}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
