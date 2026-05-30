import { getSupabase } from './supabase'

type Usuario = 'yasmim' | 'thiago'

export function getUsuarioAtual(): Usuario | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('usuario') as Usuario | null
}

// Query builder que filtra automaticamente por usuário
export function queryParaUsuario(usuario: Usuario | null) {
  if (!usuario) throw new Error('Usuário não selecionado')
  return { eq: { usuario } }
}
