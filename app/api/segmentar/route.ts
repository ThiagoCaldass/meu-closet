import { NextRequest, NextResponse } from 'next/server'

// Labels do modelo segformer_b2_clothes que representam itens de vestuário
const LABELS_ROUPA = [
  'upper-clothes', 'skirt', 'pants', 'dress', 'belt',
  'left-shoe', 'right-shoe', 'bag', 'scarf', 'hat',
  'sunglasses', 'glove', 'coat',
]

async function chamarHF(buffer: ArrayBuffer, contentType: string): Promise<Response> {
  return fetch(
    'https://api-inference.huggingface.co/models/mattmdjaga/segformer_b2_clothes',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        'Content-Type': contentType,
      },
      body: buffer,
    }
  )
}

export async function POST(req: NextRequest) {
  if (!process.env.HF_TOKEN) {
    return NextResponse.json({ disponivel: false })
  }

  const formData = await req.formData()
  const imagem = formData.get('imagem') as File | null
  if (!imagem) return NextResponse.json({ error: 'Sem imagem' }, { status: 400 })

  const buffer = await imagem.arrayBuffer()

  let resposta = await chamarHF(buffer, imagem.type)

  // Modelo frio (cold start): aguarda e tenta de novo
  if (resposta.status === 503) {
    const corpo = await resposta.json().catch(() => ({}))
    const espera = Math.min((corpo.estimated_time || 20) * 1000, 25000)
    await new Promise((r) => setTimeout(r, espera))
    resposta = await chamarHF(buffer, imagem.type)
  }

  if (!resposta.ok) {
    return NextResponse.json({ error: 'Falha na API HF' }, { status: 502 })
  }

  const segmentos: Array<{ label: string; score: number; mask: string }> =
    await resposta.json()

  const mascarasRoupa = segmentos.filter((s) =>
    LABELS_ROUPA.some((l) => s.label.toLowerCase().includes(l))
  )

  if (mascarasRoupa.length === 0) {
    return NextResponse.json({ mascaras: [] })
  }

  return NextResponse.json({ mascaras: mascarasRoupa })
}
