import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _client
}

export type Categoria = 'sapato' | 'parte_baixo' | 'parte_cima' | 'corpo_inteiro' | 'acessorio'
export type ModoLook = 'completo' | 'corpo_inteiro'

export interface Roupa {
  id: string
  nome: string | null
  categoria: Categoria
  imagem_url: string
  created_at: string
}

export interface Look {
  id: string
  nome: string
  modo: ModoLook
  sapato_id: string | null
  parte_baixo_id: string | null
  parte_cima_id: string | null
  corpo_inteiro_id: string | null
  acessorio_id: string | null
  created_at: string
}

export const CATEGORIAS: { value: Categoria; label: string; emoji: string }[] = [
  { value: 'parte_cima', label: 'Parte de Cima', emoji: '👕' },
  { value: 'parte_baixo', label: 'Parte de Baixo', emoji: '👖' },
  { value: 'corpo_inteiro', label: 'Corpo Inteiro', emoji: '👗' },
  { value: 'sapato', label: 'Sapatos', emoji: '👟' },
  { value: 'acessorio', label: 'Acessórios', emoji: '👜' },
]
