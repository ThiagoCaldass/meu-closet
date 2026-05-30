# Como fazer o deploy (100% grátis)

## Passo 1 — Criar conta no Supabase

1. Acesse https://supabase.com e crie uma conta gratuita
2. Clique em **New project**, dê um nome (ex: `meu-closet`) e escolha uma senha
3. Aguarde o projeto criar (~2 min)

## Passo 2 — Configurar o banco de dados

1. No painel do Supabase, vá em **SQL Editor** (menu lateral)
2. Copie todo o conteúdo do arquivo `supabase-schema.sql` deste projeto
3. Cole no editor e clique em **Run**
4. Deve aparecer "Success" para cada comando

## Passo 3 — Pegar as credenciais

1. Vá em **Project Settings → API** (ícone de engrenagem)
2. Copie:
   - **Project URL** → é o `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → é o `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Passo 4 — Configurar variáveis locais (para testar no computador)

Abra o arquivo `.env.local` e substitua os valores:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Para rodar localmente: `npm run dev` e acesse http://localhost:3000

## Passo 5 — Deploy no Vercel

1. Crie conta em https://vercel.com (pode entrar com GitHub)
2. Suba o projeto para o GitHub (ou use o Vercel CLI)
3. No Vercel, clique em **Add New Project** e importe o repositório
4. Na tela de configuração, vá em **Environment Variables** e adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` com o valor copiado no Passo 3
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` com o valor copiado no Passo 3
5. Clique em **Deploy**
6. Pronto! O Vercel gera uma URL pública (ex: `meu-closet.vercel.app`)

## Limites gratuitos

| Serviço | Limite grátis | Para uso pessoal |
|---------|--------------|-----------------|
| Supabase DB | 500 MB | ✅ Suficiente |
| Supabase Storage | 1 GB de imagens | ✅ Suficiente |
| Vercel | Projetos ilimitados | ✅ Sempre grátis |

## Dica: subir o projeto para o GitHub

```bash
git init
git add .
git commit -m "primeiro commit"
# Crie um repositório no GitHub e siga as instruções para push
```
