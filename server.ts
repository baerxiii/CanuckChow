import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Allow up to 25MB for high-resolution pamphlet photos or scans
app.use(express.json({ limit: '25mb' }));

// Helper to initialize Gemini client safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Endpoint: Parse nutrition pamphlets from images or raw copied text
app.post('/api/parse-pamphlet', async (req, res) => {
  try {
    const { text, imageBase64, mimeType, defaultChainId } = req.body;

    if (!text && !imageBase64) {
      return res.status(400).json({
        error: 'Please provide pamphlet text or upload a photo/scan of the nutritional pamphlet.'
      });
    }

    const ai = getGeminiClient();

    // If Gemini API key is configured, use Gemini 3.8 Flash to extract structured items
    if (ai) {
      const parts: any[] = [];

      if (imageBase64 && mimeType) {
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: imageBase64.replace(/^data:[^;]+;base64,/, ''),
          },
        });
      }

      const promptInstructions = `
You are an expert Canadian nutritionist and fast food menu data analyst.
Analyze the provided nutritional pamphlet, flyer, brochure, table, or menu text.
Extract every individual food or beverage item into clean structured data.

Rules:
1. Extract item name accurately.
2. Standard Canadian nutritional columns:
   - calories (number, kcal)
   - protein (number in grams)
   - totalFat (number in grams)
   - saturatedFat (number in grams, 0 if not listed)
   - carbs (number in grams)
   - fiber (number in grams, 0 if not listed)
   - sugars (number in grams, 0 if not listed)
   - sodium (number in milligrams, mg)
   - servingSize (string, e.g. "1 sandwich (215g)" or "Regular")
   - priceCAD (estimated or listed price in Canadian Dollars, e.g. 7.99 if unknown make a reasonable estimate)
   - category: must be one of ['burgers', 'chicken', 'breakfast', 'bowls-salads', 'pizza-pitas', 'poutine-sides', 'beverages', 'desserts-baked']
   - tags: array of strings e.g. ["High Protein", "Pamphlet Extracted"]
   - isCanadianClassic: boolean (true if icon like Tim Hortons, A&W Teen, Harvey's, Swiss Chalet, Poutine, etc.)

Additional text or context provided:
${text || 'Extract all menu items from the attached pamphlet image.'}
`;

      parts.push({ text: promptInstructions });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts },
        config: {
          systemInstruction: 'You extract precise nutritional values from Canadian fast food brochures and tables without fabricating zero if valid numbers exist.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING },
                servingSize: { type: Type.STRING },
                priceCAD: { type: Type.NUMBER },
                calories: { type: Type.NUMBER },
                protein: { type: Type.NUMBER },
                totalFat: { type: Type.NUMBER },
                saturatedFat: { type: Type.NUMBER },
                carbs: { type: Type.NUMBER },
                fiber: { type: Type.NUMBER },
                sugars: { type: Type.NUMBER },
                sodium: { type: Type.NUMBER },
                description: { type: Type.STRING },
                isCanadianClassic: { type: Type.BOOLEAN },
                tags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ['name', 'calories', 'protein', 'totalFat', 'carbs', 'sodium']
            }
          }
        }
      });

      const extractedItems = JSON.parse(response.text || '[]');
      return res.json({
        items: extractedItems,
        source: 'gemini-ai'
      });
    }

    // Heuristic fallback parser if Gemini API key is not yet set
    // Parses tab-separated or comma-separated lines
    const lines = (text || '').split('\n').filter((l: string) => l.trim().length > 0);
    const parsedFallback: any[] = [];

    for (const line of lines) {
      // Look for line containing numbers (e.g. "Teen Burger 500 28 40 25 1040")
      const tokens = line.split(/[\t,;|]+|\s{2,}/).map((t: string) => t.trim()).filter(Boolean);
      if (tokens.length >= 2) {
        const nameCandidate = tokens[0];
        const numTokens = tokens.slice(1).map((t: string) => parseFloat(t.replace(/[^0-9.]/g, ''))).filter((n: number) => !isNaN(n));
        
        if (numTokens.length >= 3) {
          parsedFallback.push({
            name: nameCandidate,
            category: 'burgers',
            servingSize: '1 serving',
            priceCAD: 8.50,
            calories: numTokens[0] || 400,
            totalFat: numTokens[1] || 15,
            carbs: numTokens[2] || 35,
            protein: numTokens[3] || 20,
            sodium: numTokens[4] || 800,
            fiber: 2,
            sugars: 5,
            saturatedFat: 5,
            isCanadianClassic: false,
            tags: ['Text Table Parsed']
          });
        }
      }
    }

    return res.json({
      items: parsedFallback,
      source: 'heuristic-parser',
      note: 'Parsed via table delimiter scanner.'
    });

  } catch (error: any) {
    console.error('Pamphlet parse error:', error);
    res.status(500).json({
      error: error.message || 'Failed to parse nutritional pamphlet.'
    });
  }
});

// Setup Vite middlewares in development or static in production
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
