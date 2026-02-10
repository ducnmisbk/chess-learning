import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createClient } from 'redis';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// ============================================
// Middleware
// ============================================

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST'],
}));

// Compression
app.use(compression());

// JSON parsing
app.use(express.json());

// Rate limiting (prevent abuse)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: 'Too many requests, please try again later.',
});
app.use('/api/', limiter);

// ============================================
// Redis Client
// ============================================
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.error('Redis error:', err));
redisClient.connect().catch(console.error);

// ============================================
// OpenAI Client
// ============================================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// Types
// ============================================
interface ExplainRequest {
  move: string;          // e.g., "e2e4"
  boardState: string;    // FEN notation
  playerLevel: 'beginner' | 'intermediate';
}

// ============================================
// Routes
// ============================================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Explain chess move (main endpoint)
app.post('/api/explain', async (req: Request, res: Response) => {
  try {
    const { move, boardState, playerLevel = 'beginner' }: ExplainRequest = req.body;

    if (!move || !boardState) {
      return res.status(400).json({ error: 'Missing move or boardState' });
    }

    // Check cache first
    const cacheKey = `explain:${move}:${boardState}:${playerLevel}`;
    const cached = await redisClient.get(cacheKey);
    
    if (cached) {
      console.log('Cache hit:', cacheKey);
      return res.json({ explanation: cached, cached: true });
    }

    // Generate explanation with OpenAI
    const explanation = await generateExplanation(move, boardState, playerLevel);

    // Cache for 1 hour
    await redisClient.setEx(cacheKey, 3600, explanation);

    res.json({ explanation, cached: false });
  } catch (error) {
    console.error('Error explaining move:', error);
    res.status(500).json({ error: 'Failed to generate explanation' });
  }
});

// Get hints for current position
app.post('/api/hint', async (req: Request, res: Response) => {
  try {
    const { boardState, lessonObjective } = req.body;

    if (!boardState) {
      return res.status(400).json({ error: 'Missing boardState' });
    }

    const hint = await generateHint(boardState, lessonObjective);
    res.json({ hint });
  } catch (error) {
    console.error('Error generating hint:', error);
    res.status(500).json({ error: 'Failed to generate hint' });
  }
});

// ============================================
// AI Logic
// ============================================

async function generateExplanation(
  move: string,
  boardState: string,
  playerLevel: 'beginner' | 'intermediate'
): Promise<string> {
  const systemPrompt = `You are ChessBuddy, a friendly chess teacher for kids aged 5-10. 
Explain chess moves in simple, encouraging language. Use emojis occasionally. 
Keep explanations under 30 words. Be positive and educational.`;

  const userPrompt = `The player (${playerLevel}) made this move: ${move}
Board state (FEN): ${boardState}

Explain why this is a good or okay move in kid-friendly language.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Cheaper and faster
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 100,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content || 'Great move! 🌟';
}

async function generateHint(
  boardState: string,
  lessonObjective?: string
): Promise<string> {
  const systemPrompt = `You are ChessBuddy, helping kids learn chess. 
Give a gentle hint (not the full answer). Keep it under 20 words.`;

  const userPrompt = `Board state: ${boardState}
Lesson objective: ${lessonObjective || 'Find a good move'}

Give a hint to help them think.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 60,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content || 'Look at your center pieces! 🤔';
}

// ============================================
// Start Server
// ============================================
app.listen(port, () => {
  console.log(`🚀 AI API server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing connections...');
  await redisClient.quit();
  process.exit(0);
});
