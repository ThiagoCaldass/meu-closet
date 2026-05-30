'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import BottomNav from '@/components/BottomNav'

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<string | null>(null)
  const [hidratado, setHidratado] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const u = localStorage.getItem('usuario')
    setUsuario(u)
    setHidratado(true)

    // Se não tem usuário e não está em /select-user, redireciona
    if (!u && pathname !== '/select-user') {
      router.push('/select-user')
    }
  }, [pathname, router])

  const showNav = usuario && pathname !== '/select-user'

  return (
    <>
      <main className={`max-w-md mx-auto min-h-screen bg-white ${showNav ? 'pb-28' : ''}`}>
        {hidratado ? children : null}
      </main>
      {showNav && (
        <div className="max-w-md mx-auto">
          <BottomNav />
        </div>
      )}
    </>
  )
}
