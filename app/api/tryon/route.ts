import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 300 // 5 min para processar

async function conectarGradio() {
  const { Client } = await import('@gradio/client')

  // Tenta conectar com retries + waits progressivos
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    try {
      const client = await Client.connect('Kwai-Kolors/Kolors-Virtual-Try-On', {
        token: process.env.HF_TOKEN as `hf_${string}`,
      })
      return client
    } catch (err) {
      if (tentativa === 4) throw err
      // Wait progressivo: 3s, 5s, 7s, 10s
      const wait = 3000 + tentativa * 2000
      await new Promise(r => setTimeout(r, wait))
    }
  }
  throw new Error('Não foi possível conectar ao servidor de try-on.')
}

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
    const client = await conectarGradio()

    const roupaResp = await fetch(roupaUrl)
    const roupaBlob = await roupaResp.blob()
    const roupaFile = new File([roupaBlob], 'garment.png', {
      type: roupaBlob.type || 'image/png',
    })

    // Kolors-Virtual-Try-On espera: person_image, garment_image
    const result = await client.predict('/virtual_try_on', {
      person_image: pessoaFile,
      garment_image: roupaFile,
    })

    const data = result.data as unknown[]
    const primeira = Array.isArray(data[0]) ? (data[0] as unknown[])[0] : data[0]

    let imageUrl: string | null = null
    if (typeof primeira === 'string') imageUrl = primeira
    else if (primeira && typeof primeira === 'object' && 'url' in primeira) imageUrl = (primeira as { url: string }).url
    else if (primeira && typeof primeira === 'object' && 'path' in primeira) imageUrl = (primeira as { path: string }).path

    if (!imageUrl) return NextResponse.json({ error: 'Resultado inesperado da API' }, { status: 500 })

    return NextResponse.json({ url: imageUrl })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[tryon]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
