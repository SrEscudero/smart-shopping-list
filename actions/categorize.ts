// actions/categorize.ts
"use server";

export type Category =
  | 'Frutas y Verduras' | 'Carnes y Pescados' | 'Lácteos y Huevos'
  | 'Panadería' | 'Bebidas' | 'Limpieza' | 'Cuidado Personal'
  | 'Despensa' | 'Congelados' | 'Mascotas' | 'Bebés'
  | 'Electrónica' | 'Ropa' | 'Otros';

const VALID_CATEGORIES: Category[] = [
  'Frutas y Verduras', 'Carnes y Pescados', 'Lácteos y Huevos',
  'Panadería', 'Bebidas', 'Limpieza', 'Cuidado Personal',
  'Despensa', 'Congelados', 'Mascotas', 'Bebés',
  'Electrónica', 'Ropa', 'Otros',
];

// Cache en memoria para no repetir llamadas
const categoryCache = new Map<string, Category>();

export async function getCategoryFromAI(productName: string): Promise<Category> {
  const key = productName.toLowerCase().trim();

  if (categoryCache.has(key)) return categoryCache.get(key)!;

  // Intentar con Gemini si hay key
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    try {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Categoriza este producto de supermercado en exactamente UNA de estas categorías:
${VALID_CATEGORIES.join(', ')}

Producto: "${productName}"

Responde SOLO con el nombre exacto de la categoría, sin puntos, sin explicaciones.`
              }]
            }],
            generationConfig: {
              temperature: 0,
              maxOutputTokens: 20,
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() as Category;
        if (VALID_CATEGORIES.includes(text)) {
          categoryCache.set(key, text);
          return text;
        }
      }
    } catch {
      // Fallback al diccionario local
    }
  }

  // Diccionario local como fallback
  const result = localCategorize(key);
  categoryCache.set(key, result);
  return result;
}

function localCategorize(input: string): Category {
  const norm = (t: string) =>
    t.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\d+/g, '')
      .trim();

  const n = norm(input);
  if (!n) return 'Otros';

  const dict: Array<{ category: Category; keywords: string[]; p: number }> = [
    { category: 'Bebés', p: 100, keywords: ['panal', 'pañal', 'toallita', 'bebe', 'papilla', 'formula', 'chupete', 'biberon', 'mamadera', 'pomada bebe'] },
    { category: 'Mascotas', p: 100, keywords: ['racao', 'pienso', 'perro', 'gato', 'cao', 'arena gato', 'antipulgas', 'vermifugo', 'pet', 'mascota'] },
    { category: 'Electrónica', p: 95, keywords: ['cable', 'cargador', 'auricular', 'fone', 'pilha', 'bateria', 'lampada', 'adaptador', 'mouse', 'teclado', 'hdmi', 'usb'] },
    { category: 'Ropa', p: 95, keywords: ['camisa', 'camiseta', 'calca', 'pantalon', 'meia', 'calcinha', 'cueca', 'roupa', 'blusa', 'vestido', 'short', 'bermuda'] },
    { category: 'Congelados', p: 90, keywords: ['congelado', 'helado', 'sorvete', 'hielo', 'gelo', 'pizza', 'nuggets', 'papas fritas'] },
    { category: 'Carnes y Pescados', p: 88, keywords: ['carne', 'pollo', 'frango', 'cerdo', 'porco', 'pescado', 'peixe', 'salmon', 'atun', 'atum', 'camaron', 'camarao', 'salchicha', 'linguica', 'pechuga', 'peito', 'bife', 'jamon', 'presunto', 'bacon', 'hamburguer', 'salame', 'mortadela', 'costela', 'costilla'] },
    { category: 'Lácteos y Huevos', p: 85, keywords: ['leche', 'leite', 'queso', 'queijo', 'yogur', 'iogurte', 'mantequilla', 'manteiga', 'crema', 'nata', 'requeijao', 'margarina', 'huevo', 'ovo', 'creme de leite'] },
    { category: 'Frutas y Verduras', p: 80, keywords: ['manzana', 'maca', 'banana', 'platano', 'tomate', 'cebolla', 'cebola', 'papa', 'batata', 'limon', 'limao', 'zanahoria', 'cenoura', 'lechuga', 'alface', 'ajo', 'alho', 'naranja', 'laranja', 'uva', 'pimiento', 'brocoli', 'espinaca', 'pepino', 'fresa', 'morango', 'sandia', 'melancia', 'piña', 'abacaxi', 'mango', 'aguacate', 'abacate', 'vegetal', 'verdura', 'fruta'] },
    { category: 'Bebidas', p: 75, keywords: ['agua', 'soda', 'jugo', 'suco', 'refresco', 'refrigerante', 'gaseosa', 'cerveza', 'cerveja', 'vino', 'vinho', 'whisky', 'vodka', 'ron', 'energetico', 'gatorade', 'bebida', 'licor', 'achocolatado'] },
    { category: 'Panadería', p: 70, keywords: ['pan', 'pao', 'baguette', 'bolo', 'torta', 'pastel', 'galleta', 'bolacha', 'biscoito', 'croissant', 'tostada', 'torrada'] },
    { category: 'Despensa', p: 65, keywords: ['arroz', 'feijao', 'frijol', 'lenteja', 'pasta', 'macarrao', 'fideo', 'azucar', 'acucar', 'sal', 'aceite', 'oleo', 'azeite', 'vinagre', 'harina', 'farinha', 'cafe', 'cha', 'chocolate', 'cereal', 'avena', 'aveia', 'granola', 'sopa', 'maiz', 'milho', 'maionese', 'ketchup', 'mostarda', 'molho', 'tempero', 'oregano', 'pimienta', 'pimenta', 'lata', 'conserva'] },
    { category: 'Limpieza', p: 60, keywords: ['detergente', 'jabon', 'sabao', 'cloro', 'sanitaria', 'lavandina', 'desinfectante', 'multiuso', 'esponja', 'lava loucas', 'vassoura', 'escoba', 'rodo', 'lixo', 'basura', 'amaciante', 'suavizante', 'papel toalha', 'papel toalla', 'guardanapo', 'limpeza'] },
    { category: 'Cuidado Personal', p: 55, keywords: ['shampoo', 'champu', 'acondicionador', 'condicionador', 'desodorante', 'creme dental', 'pasta dente', 'cepillo', 'escova dente', 'papel higienico', 'sabonete', 'gel', 'gillette', 'toalla', 'toalha', 'algodon', 'algodao', 'absorvente', 'tampon', 'hidratante', 'perfume', 'talco', 'fio dental', 'protetor solar'] },
  ];

  let best: { category: Category; score: number } | null = null;

  for (const { category, keywords, p } of dict) {
    for (const kw of keywords) {
      const exact = new RegExp(`\\b${kw}(s|es)?\\b`, 'i');
      if (exact.test(n)) {
        const score = p + kw.length * 2;
        if (!best || score > best.score) best = { category, score };
      } else if (kw.length > 4 && n.includes(kw.substring(0, kw.length - 1))) {
        const score = p - 10;
        if (!best || score > best.score) best = { category, score };
      }
    }
  }

  return best?.category || 'Otros';
}