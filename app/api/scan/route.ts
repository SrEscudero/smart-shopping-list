// app/api/scan/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { imageData } = await req.json();

    if (!imageData) {
      return NextResponse.json({ error: 'No image data' }, { status: 400 });
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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

    if (!response.ok) {
      const err = await response.json();
      console.error('Gemini API error:', err);
      return NextResponse.json({ error: 'Error calling Gemini API' }, { status: 500 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON
    let products = [];
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      products = parsed.products || [];
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          products = parsed.products || [];
        } catch {
          products = [];
        }
      }
    }

    // Limpiar y validar
    const cleaned = products
      .filter((p: { name?: string }) => p.name && String(p.name).trim().length > 0)
      .map((p: { name: string; price?: number | string; quantity?: number }) => ({
        name: String(p.name).trim(),
        price: typeof p.price === 'number'
          ? p.price
          : parseFloat(String(p.price || '0').replace(',', '.')) || 0,
        quantity: parseInt(String(p.quantity || '1')) || 1,
      }));

    return NextResponse.json({ products: cleaned });

  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}