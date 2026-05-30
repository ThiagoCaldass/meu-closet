import { NextRequest, NextResponse } from 'next/server'

const LABELS_ROUPA = [
  'upper-clothes', 'skirt', 'pants', 'dress', 'belt',
  'left-shoe', 'right-shoe', 'bag', 'scarf', 'hat',
  'sunglasses', 'glove', 'coat',
]

export async function POST(req: NextRequest) {
  if (!process.env.HF_TOKEN) {
    return NextResponse.json({ disponivel: false })
  }

  const formData = await req.formData()
  const imagem = formData.get('imagem') as File | null
  if (!imagem) return NextResponse.json({ error: 'Sem imagem' }, { status: 400 })

  try {
    const { HfInference } = await import('@huggingface/inference')
    const hf = new HfInference(process.env.HF_TOKEN)

    const buffer = await imagem.arrayBuffer()

    const segmentos = await hf.imageSegmentation({
      model: 'mattmdjaga/segformer_b2_clothes',
      inputs: new Blob([buffer], { type: imagem.type }),
    })

    const mascarasRoupa = segmentos.filter((s) =>
      LABELS_ROUPA.some((l) => s.label.toLowerCase().includes(l))
    )

    if (mascarasRoupa.length === 0) {
      return NextResponse.json({ mascaras: [] })
    }

    return NextResponse.json({ mascaras: mascarasRoupa })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[segmentar]', msg)
    // retorna 200 para que o cliente faça fallback silencioso
    return NextResponse.json({ mascaras: [], erro: msg })
  }
}
