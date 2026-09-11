// app/api/scan/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface ScanProduct {
  name: string;
  price: number;
  quantity: number;
}

interface RawScanProduct {
  name?: unknown;
  price?: unknown;
  quantity?: unknown;
}

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_PRODUCTS = 80;
const GEMINI_TIMEOUT_MS = 12000;

const parseProductsFromText = (text: string): RawScanProduct[] => {
  const candidates = [
    text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim(),
    text.match(/\{[\s\S]*\}/)?.[0],
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as { products?: RawScanProduct[] };
      if (Array.isArray(parsed.products)) return parsed.products;
    } catch {
      // Try the next candidate.
    }
  }

  return [];
};

const cleanProducts = (products: RawScanProduct[]): ScanProduct[] => products
  .filter((product) => String(product.name ?? '').trim().length > 0)
  .slice(0, MAX_PRODUCTS)
  .map((product) => ({
    name: String(product.name).trim(),
    price: typeof product.price === 'number'
      ? product.price
      : Number.parseFloat(String(product.price || '0').replace(',', '.')) || 0,
    quantity: Number.parseInt(String(product.quantity || '1'), 10) || 1,
  }));

export async function POST(req: NextRequest) {
  try {
    const { imageData } = await req.json();

    if (typeof imageData !== 'string' || !imageData) {
      return NextResponse.json({ error: 'No image data' }, { status: 400 });
    }

    if (!/^[A-Za-z0-9+/=]+$/.test(imageData)) {
      return NextResponse.json({ error: 'Invalid image data' }, { status: 400 });
    }

    if ((imageData.length * 3) / 4 > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 });
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      // Demo data si no hay key
      return NextResponse.json({
        products: [
          { name: 'Leche integral', price: 5.99, quantity: 2 },
          { name: 'Pan de molde', price: 4.50, quantity: 1 },
          { name: 'Arroz', price: 7.90, quantity: 1 },
        ]
      });
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: imageData,
                  }
                },
                {
                  text: `Analiza esta imagen y extrae TODOS los productos visibles.
Puede ser un ticket de supermercado, una lista escrita a mano, etiquetas de góndola, o cualquier lista de productos.

REGLAS:
- Extrae todos los nombres de productos que puedas leer
- Si hay precios visibles, inclúyelos como número (ej: 5.99)
- Si no hay precio, usa 0
- Si hay cantidades, inclúyelas; si no, usa 1
- Responde ÚNICAMENTE con JSON válido, sin texto extra, sin markdown

Formato exacto:
{"products":[{"name":"nombre del producto","price":0.00,"quantity":1}]}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          }
        })
      }
    );
    clearTimeout(timeout);

    if (!response.ok) {
      const err = await response.json();
      console.error('Gemini API error:', err);
      return NextResponse.json({ error: 'Error calling Gemini API' }, { status: 500 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const cleaned = cleanProducts(parseProductsFromText(text));

    return NextResponse.json({ products: cleaned });

  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
