'use client'
import Image from 'next/image'
import { Roupa } from '@/lib/supabase'

interface Props {
  roupa: Roupa | null
  emoji: string
  label: string
}

export default function SlotLook({ roupa, emoji, label }: Props) {
  return (
    <div
      className="aspect-square rounded-2xl overflow-hidden"
      style={{
        background: roupa
          ? 'repeating-conic-gradient(#f3f4f6 0% 25%, white 0% 50%) 0 0 / 12px 12px'
          : undefined,
      }}
    >
      {roupa ? (
        <Image
          src={roupa.imagem_url}
          alt={roupa.nome || label}
          width={160}
          height={160}
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="w-full h-full border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center">
          <span className="text-2xl opacity-30">{emoji}</span>
        </div>
      )}
    </div>
  )
}
