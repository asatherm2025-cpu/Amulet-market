import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, created, badRequest, unauthorized, serverError } from '@/lib/api-response'
import { createAiAnalysisSchema } from '@/lib/validations'
import { getCurrentUser } from '@/lib/auth-helpers'
import { AiStatus } from '@prisma/client'

// POST /api/ai/analyze — Submit image for AI analysis
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body   = await req.json()
    const parsed = createAiAnalysisSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.message)

    const { imageUrl, coinId } = parsed.data
    const startMs = Date.now()

    // Create analysis record (PROCESSING)
    const analysis = await prisma.aiAnalysis.create({
      data: {
        userId:   user.id,
        coinId,
        imageUrl,
        status:   AiStatus.PROCESSING,
      },
    })

    // Call AI service (OpenAI Vision or mock in dev)
    let result: AiAnalysisResult
    try {
      result = await analyzeWithAI(imageUrl)
    } catch (aiError) {
      await prisma.aiAnalysis.update({
        where: { id: analysis.id },
        data: {
          status:       AiStatus.FAILED,
          errorMessage: aiError instanceof Error ? aiError.message : 'AI service error',
        },
      })
      return serverError(aiError)
    }

    // Update with results
    const updated = await prisma.aiAnalysis.update({
      where: { id: analysis.id },
      data: {
        status:             AiStatus.COMPLETED,
        authenticityScore:  result.authenticityScore,
        conditionScore:     result.conditionScore,
        detectedMonk:       result.detectedMonk,
        detectedYear:       result.detectedYear,
        detectedMaterial:   result.detectedMaterial,
        confidence:         result.confidence,
        rawResponse:        result.raw,
        processingMs:       Date.now() - startMs,
      },
    })

    // Update coin AI score if coinId provided
    if (coinId) {
      await prisma.coin.update({
        where: { id: coinId },
        data:  { aiScore: result.authenticityScore },
      })
    }

    return created(updated)
  } catch (e) {
    return serverError(e)
  }
}

// GET /api/ai/analyze?coinId=xxx — Get analysis result
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const coinId     = req.nextUrl.searchParams.get('coinId')
    const analysisId = req.nextUrl.searchParams.get('id')

    const analysis = await prisma.aiAnalysis.findFirst({
      where: {
        ...(coinId     && { coinId }),
        ...(analysisId && { id: analysisId }),
        userId: user.id,
      },
      orderBy: { createdAt: 'desc' },
    })

    return ok(analysis)
  } catch (e) {
    return serverError(e)
  }
}

// ── AI Analysis Engine ──────────────────────────────────────

interface AiAnalysisResult {
  authenticityScore: number
  conditionScore: number
  detectedMonk: string | null
  detectedYear: number | null
  detectedMaterial: string | null
  confidence: number
  raw: Record<string, unknown>
}

async function analyzeWithAI(imageUrl: string): Promise<AiAnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY

  // Mock in development / when no API key
  if (!apiKey) {
    await new Promise(r => setTimeout(r, 500)) // simulate delay
    return {
      authenticityScore: 75 + Math.random() * 20,
      conditionScore:    60 + Math.random() * 35,
      detectedMonk:      'หลวงปู่ทวด',
      detectedYear:      2515,
      detectedMaterial:  'เนื้อทองแดง',
      confidence:        0.82,
      raw:               { mock: true, imageUrl },
    }
  }

  // Real OpenAI Vision API call
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert in Thai Buddhist amulet coins (เหรียญพระเครื่อง). 
Analyze the image and return a JSON object with:
- authenticityScore (0-100): likelihood the coin is genuine
- conditionScore (0-100): physical condition
- detectedMonk: monk name in Thai if identifiable, or null
- detectedYear: Buddhist Era year if visible, or null  
- detectedMaterial: material type in Thai (เนื้อทองแดง/เนื้อเงิน/etc), or null
- confidence (0-1): confidence in your analysis
Only return valid JSON, no other text.`,
        },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
          ],
        },
      ],
      max_tokens: 500,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`)

  const data = await response.json()
  const content = JSON.parse(data.choices[0].message.content)

  return {
    authenticityScore: Number(content.authenticityScore ?? 50),
    conditionScore:    Number(content.conditionScore    ?? 50),
    detectedMonk:      content.detectedMonk     ?? null,
    detectedYear:      content.detectedYear     ? Number(content.detectedYear) : null,
    detectedMaterial:  content.detectedMaterial ?? null,
    confidence:        Number(content.confidence ?? 0.5),
    raw:               content,
  }
}
