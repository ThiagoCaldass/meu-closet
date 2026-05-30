import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 300 // 5 min para HF Space acordar + processar

async function conectarGradio() {
  const { Client } = await import('@gradio/client')
  // Acorda o Space (pode estar hibernando no plano gratuito)
  try {
    await fetch('https://levihsu-ootdiffusion.hf.space/', {
      signal: AbortSignal.timeout(12000),
    })
  } catch { /* ignora — só um "ping" de wake-up */ }

  // Tenta conectar com até 3 tentativas
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    try {
      return await Client.connect('levihsu/OOTDiffusion', {
        token: process.env.HF_TOKEN as `hf_${string}`,
      })
    } catch (err) {
      if (tentativa === 2) throw err
      await new Promise(r => setTimeout(r, 6000))
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

    const result = await client.predict('/process_dc', {
      vton_img: pessoaFile,
      garm_img: roupaFile,
      n_samples: 1,
      n_steps: 20,
      image_scale: 2,
      seed: -1,
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
    const amigavel = msg.includes('config') || msg.includes('connect')
      ? 'O servidor de try-on está iniciando. Aguarde 30 segundos e tente novamente.'
      : msg
    return NextResponse.json({ error: amigavel }, { status: 500 })
  }
}
