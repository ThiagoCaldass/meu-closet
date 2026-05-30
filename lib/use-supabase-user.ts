'use client'
import { getSupabase } from './supabase'
import { useUsuario } from './user-context'

export function useSupabaseUser() {
  const { usuario } = useUsuario()
  // Retorna o cliente Supabase normal — o filtro por usuário é feito em cada query
  return getSupabase()
}
