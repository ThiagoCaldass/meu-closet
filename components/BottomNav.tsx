'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shirt, BookOpen, Shuffle, LayoutGrid } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Montar', icon: Shirt },
  { href: '/closet', label: 'Closet', icon: LayoutGrid },
  { href: '/looks', label: 'Looks', icon: BookOpen },
  { href: '/aleatorio', label: 'Aleatório', icon: Shuffle },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
      <div className="flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
                active ? 'text-indigo-600' : 'text-gray-400'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
