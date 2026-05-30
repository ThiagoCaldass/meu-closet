import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  if (!process.env.HF_TOKEN) {
    return NextResponse.json({ error: 'HF_TOKEN não configurado' }, { status: 503 })
  }

  const formData = await req.formData()
  const pessoaFile = formData.get('pessoa') as File | null
  const roupaUrl = formData.get('roupa_url') as string | null

  if (!pessoaFile || !roupaUrl) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  try {
    const { Client } = await import('@gradio/client')

    const client = await Client.connect('levihsu/OOTDiffusion', {
      token: process.env.HF_TOKEN as `hf_${string}`,
    })

    // Busca a imagem da roupa do Supabase e converte para File
    const roupaResp = await fetch(roupaUrl)
    const roupaBlob = await roupaResp.blob()
    const roupaFile = new File([roupaBlob], 'garment.png', {
      type: roupaBlob.type || 'image/png',
    })

    const result = await client.predict('/process_dc', {
      vton_img: pessoaFile,
      garm_img: roupaFile,
      n_samples: 1,
      n_steps: 20,
      image_scale: 2,
      seed: -1,
    })

    // O resultado pode ser um array de imagens ou uma imagem direta
    const data = result.data as unknown[]
    const primeira = Array.isArray(data[0]) ? (data[0] as unknown[])[0] : data[0]

    let imageUrl: string | null = null
    if (typeof primeira === 'string') {
      imageUrl = primeira
    } else if (primeira && typeof primeira === 'object' && 'url' in primeira) {
      imageUrl = (primeira as { url: string }).url
    } else if (primeira && typeof primeira === 'object' && 'path' in primeira) {
      imageUrl = (primeira as { path: string }).path
    }

    if (!imageUrl) {
      return NextResponse.json({ error: 'Resultado inesperado da API' }, { status: 500 })
    }

    return NextResponse.json({ url: imageUrl })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[tryon]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
