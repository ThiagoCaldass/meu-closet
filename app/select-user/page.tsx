'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const USUARIOS = [
  { id: 'yasmim', nome: 'Yasmim', emoji: '👩' },
  { id: 'thiago', nome: 'Thiago', emoji: '👨' },
]

export default function SelectUserPage() {
  const router = useRouter()
  const [selecionando, setSelecionando] = useState(false)

  const handleSelect = (id: string) => {
    setSelecionando(true)
    localStorage.setItem('usuario', id)
    router.push('/')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">Meu Closet</h1>
        <p className="text-gray-500">Escolha seu guarda-roupa</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        {USUARIOS.map(u => (
          <button
            key={u.id}
            onClick={() => handleSelect(u.id)}
            disabled={selecionando}
            className="flex items-center gap-4 p-6 border-2 border-gray-200 rounded-3xl hover:border-indigo-400 hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-50"
          >
            <span className="text-5xl">{u.emoji}</span>
            <span className="text-xl font-semibold text-gray-700">{u.nome}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-12 text-center">
        Cada usuário tem seu próprio closet,<br />looks e montagens separados
      </p>
    </div>
  )
}
