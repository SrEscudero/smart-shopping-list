// actions/categorize.ts
"use server";

export type Category =
  | 'Frutas y Verduras' | 'Carnes y Pescados' | 'Lácteos y Huevos'
  | 'Panadería' | 'Bebidas' | 'Limpieza' | 'Cuidado Personal'
  | 'Despensa' | 'Congelados' | 'Mascotas' | 'Bebés' | 'Otros';

interface KeywordMatch {
  category: Category;
  keyword: string;
  score: number; // Ahora usamos un Score compuesto
}

export async function getCategoryFromAI(productName: string): Promise<Category> {
  await new Promise((resolve) => setTimeout(resolve, 300)); // Retraso más corto y ágil

  // 1. NORMALIZACIÓN AVANZADA
  const normalize = (text: string): string => {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Sin acentos
      .replace(/[^\w\s]/g, ' ')        // Sin caracteres raros
      .replace(/\d+/g, '')             // Sin números (ej. "leche 1L" -> "leche")
      .replace(/\s+/g, ' ')            // Sin espacios dobles
      .trim();
  };

  const normalizedInput = normalize(productName);
  if (!normalizedInput) return 'Otros';

  // 2. DICCIONARIO BILINGÜE CON PRIORIDAD BASE
  const dictionary: Array<{ category: Category; keywords: string[]; basePriority: number }> = [
    {
      category: 'Bebés', basePriority: 100,
      keywords: ['pañal', 'panal', 'toallita humeda', 'toalhita umida', 'bebe', 'papilla', 'potito', 'leche formula', 'chupete', 'biberon', 'mamadera', 'pomada']
    },
    {
      category: 'Mascotas', basePriority: 100,
      keywords: ['perro', 'cao', 'gato', 'alimento perro', 'racao', 'pienso', 'arena gato', 'snack', 'hueso', 'antipulgas', 'vermifugo']
    },
    {
      category: 'Congelados', basePriority: 95,
      keywords: ['congelado', 'helado', 'sorvete', 'hielo', 'gelo', 'pizza', 'hamburguesa congelada', 'nuggets', 'papas fritas']
    },
    {
      category: 'Carnes y Pescados', basePriority: 90,
      keywords: ['carne', 'pollo', 'frango', 'cerdo', 'porco', 'res', 'gado', 'pescado', 'peixe', 'salmon', 'salmao', 'atun', 'atum', 'camaron', 'camarao', 'salchicha', 'salsicha', 'chorizo', 'linguica', 'pechuga', 'peito', 'bife', 'jamon', 'presunto', 'tocino', 'bacon', 'hamburguesa', 'hamburguer', 'salame', 'mortadela', 'chuleta', 'costilla', 'costela']
    },
    {
      category: 'Lácteos y Huevos', basePriority: 85,
      keywords: ['leche', 'leite', 'queso', 'queijo', 'yogur', 'iogurte', 'mantequilla', 'manteiga', 'crema', 'creme', 'nata', 'requeson', 'requeijao', 'margarina', 'huevo', 'ovo']
    },
    {
      category: 'Frutas y Verduras', basePriority: 80,
      keywords: ['manzana', 'maca', 'banana', 'platano', 'tomate', 'cebolla', 'cebola', 'papa', 'batata', 'limon', 'limao', 'zanahoria', 'cenoura', 'lechuga', 'alface', 'ajo', 'alho', 'naranja', 'laranja', 'uva', 'pimiento', 'pimentao', 'brocoli', 'brocolis', 'espinaca', 'espinafre', 'pepino', 'fresa', 'morango', 'sandia', 'melancia', 'melon', 'melao', 'piña', 'abacaxi', 'mango', 'manga', 'aguacate', 'abacate', 'champiñon', 'cogumelo']
    },
    {
      category: 'Bebidas', basePriority: 75,
      keywords: ['agua', 'soda', 'jugo', 'suco', 'refresco', 'refrigerante', 'gaseosa', 'bebida', 'cerveza', 'cerveja', 'vino', 'vinho', 'whisky', 'vodka', 'ron', 'energetico', 'isotônico', 'gatorade', 'licor']
    },
    {
      category: 'Panadería', basePriority: 70,
      keywords: ['pan', 'pao', 'baguette', 'bollo', 'bolo', 'torta', 'pastel', 'galleta', 'bolacha', 'biscoito', 'croissant', 'medialuna', 'tostada', 'torrada']
    },
    {
      category: 'Despensa', basePriority: 65,
      keywords: ['arroz', 'frijol', 'feijao', 'poroto', 'lenteja', 'lentilha', 'pasta', 'macarrao', 'fideo', 'azucar', 'acucar', 'edulcorante', 'adocante', 'sal', 'aceite', 'oleo', 'azeite', 'vinagre', 'harina', 'farinha', 'cafe', 'te', 'cha', 'mate', 'chocolate', 'cereal', 'avena', 'aveia', 'granola', 'sopa', 'caldo', 'lata', 'maiz', 'milho', 'mayonesa', 'maionese', 'ketchup', 'mostaza', 'mostarda', 'salsa', 'molho', 'condimento', 'tempero', 'oregano', 'pimienta', 'pimenta']
    },
    {
      category: 'Limpieza', basePriority: 60,
      keywords: ['detergente', 'jabon', 'sabao', 'cloro', 'agua sanitaria', 'lavandina', 'desinfectante', 'desinfetante', 'multiuso', 'esponja', 'lavavajillas', 'lava loucas', 'escoba', 'vassoura', 'trapeador', 'rodo', 'basura', 'lixo', 'suavizante', 'amaciante', 'desengrasante', 'papel toalla', 'papel toalha', 'guardanapo']
    },
    {
      category: 'Cuidado Personal', basePriority: 55,
      keywords: ['shampoo', 'champu', 'acondicionador', 'condicionador', 'desodorante', 'crema dental', 'pasta de dente', 'cepillo', 'escova', 'papel higienico', 'sabonete', 'gel ducha', 'afeitadora', 'prestobarba', 'gillette', 'toalla', 'toalha', 'algodon', 'algodao', 'absorvente', 'tampon', 'hidratante', 'perfume', 'talco', 'fio dental']
    }
  ];

  const matches: KeywordMatch[] = [];

  // 3. BÚSQUEDA SÚPER INTELIGENTE
  for (const { category, keywords, basePriority } of dictionary) {
    for (const keyword of keywords) {

      // A) Búsqueda Exacta con soporte de Plurales automático (s, es)
      // Ej: Si la keyword es "tomate", el input "tomates" hace match.
      const exactRegex = new RegExp(`\\b${keyword}(s|es)?\\b`, 'i');

      if (exactRegex.test(normalizedInput)) {
        // Cálculo del Score: Prioridad + (Tamaño de la palabra * 2)
        // Esto asegura que "aceite de oliva" gane sobre "aceite"
        const score = basePriority + (keyword.length * 2);
        matches.push({ category, keyword, score });
        continue;
      }

      // B) Búsqueda Parcial (Typo-Tolerance) para palabras largas
      // Si el input tiene más de 4 letras y contiene el 80% de la keyword
      if (keyword.length > 4 && normalizedInput.length > 4) {
        if (normalizedInput.includes(keyword.substring(0, keyword.length - 1))) {
          // Score menor porque es coincidencia parcial
          matches.push({ category, keyword, score: basePriority - 10 });
        }
      }
    }
  }

  // 4. RESOLUCIÓN DE CONFLICTOS POR SCORING
  if (matches.length > 0) {
    // Ordenamos por mayor puntuación
    matches.sort((a, b) => b.score - a.score);
    return matches[0].category;
  }

  return 'Otros';
}