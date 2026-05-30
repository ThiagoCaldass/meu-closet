'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Usuario = 'yasmim' | 'thiago'

interface UserContextType {
  usuario: Usuario | null
  setUsuario: (u: Usuario) => void
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuarioState] = useState<Usuario | null>(null)
  const [hidratado, setHidratado] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('usuario') as Usuario | null
    setUsuarioState(u)
    setHidratado(true)
  }, [])

  const setUsuario = (u: Usuario) => {
    localStorage.setItem('usuario', u)
    setUsuarioState(u)
  }

  if (!hidratado) return <>{children}</> // sem contexto durante SSR

  return (
    <UserContext.Provider value={{ usuario, setUsuario }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUsuario() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUsuario fora de UserProvider')
  return ctx
}
