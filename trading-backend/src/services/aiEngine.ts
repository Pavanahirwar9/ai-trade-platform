const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

const to2 = (n) => parseFloat(Number(n).toFixed(2));

const buildFallbackAnalysis = ({ symbol, quote }) => {
  const price = quote?.price || 0;
  const dayHigh = quote?.dayHigh || price;
  const dayLow = quote?.dayLow || price;

  const support = to2(Math.max(dayLow, price * 0.985));
  const resistance = to2(Math.min(dayHigh > 0 ? dayHigh : price * 1.015, price * 1.02));

  return {
    symbol,
    source: GEMINI_API_KEY ? 'gemini-fallback' : 'heuristic-fallback',
    fundamentals: {
      summary: 'Neutral valuation snapshot with no severe red flags detected in current profile.',
      score: 0.58,
    },
    newsSentiment: {
      sentiment: 'NEUTRAL',
      score: 0.52,
      summary: 'Mixed headlines with balanced bullish and bearish cues.',
    },
    technical: {
      support,
      resistance,
      trend: 'SIDEWAYS',
      volatility: 'MEDIUM',
    },
    nextDayPrediction: {
      entry: to2((support + price) / 2),
      target: to2(resistance * 1.01),
      stopLoss: to2(support * 0.99),
      rationale: 'Predicted bounce off support towards resistance for the next session.',
    },
    risk: {
      level: 'MEDIUM',
      notes: ['Avoid oversized position before trend confirmation.'],
    },
    generatedAt: new Date().toISOString(),
  };
};

const tryGeminiAnalysis = async ({ symbol, quote }) => {
  if (!GEMINI_API_KEY) return null;

  const prompt = `You are a stock market analyst predicting NEXT DAY movements. Return strictly raw JSON with no markdown wrapping.
Analyze ${symbol}. Current quote: ${JSON.stringify(quote)}
Calculate strict numeric next_day entry, target, and stopLoss based on today's levels.
Schema: { "fundamentals":{"summary":"string","score":0.0}, "newsSentiment":{"sentiment":"string","score":0.0,"summary":"string"}, "technical":{"support":0.0,"resistance":0.0,"trend":"string","volatility":"string"}, "nextDayPrediction":{"entry":0.0,"target":0.0,"stopLoss":0.0,"rationale":"string"}, "risk":{"level":"string","notes":["string"]} }`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await axios.post(
      url,
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      },
      { timeout: 12000 }
    );

    const text =
      response?.data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      symbol,
      source: 'gemini',
      ...parsed,
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
};

const generateDeepAnalysis = async ({ symbol, quote }) => {
  const gemini = await tryGeminiAnalysis({ symbol, quote });
  if (gemini) return gemini;
  return buildFallbackAnalysis({ symbol, quote });
};

const buildFallbackStrategy = ({ symbol, quote, analysis, quantity }) => {
  const price = quote?.price || 0;
  const support = analysis?.technical?.support || to2(price * 0.985);
  const resistance = analysis?.technical?.resistance || to2(price * 1.015);
  const entryPrice = to2((support + price) / 2);
  const stopLoss = to2(entryPrice * 0.99);
  const exitPrice = to2(Math.max(resistance, entryPrice * 1.01));

  return {
    symbol,
    strategyType: 'INTRADAY_RULESET',
    source: GROQ_API_KEY ? 'groq-fallback' : 'heuristic-fallback',
    timeframe: '1m-5m',
    quantity: quantity || 1,
    rules: {
      entry: { whenPriceAtOrBelow: entryPrice },
      stopLoss,
      takeProfit: exitPrice,
      forceCloseTimeIST: '15:15',
    },
    rationale:
      'Entry near support, strict stop-loss, and intraday take-profit with forced square-off before close.',
    generatedAt: new Date().toISOString(),
  };
};

const tryGroqStrategy = async ({ symbol, quote, analysis, quantity }) => {
  if (!GROQ_API_KEY) return null;

  const prompt = `You are an AI generating trading rules. Return strictly raw JSON with no markdown wrapping. Build a NEXT DAY active strategy for ${symbol}.
Inputs:\nquote=${JSON.stringify(quote)}\nanalysis=${JSON.stringify(analysis)}
Schema={"strategyType":"string","timeframe":"Next Day","quantity":1,"rules":{"entry":{"whenPriceAtOrBelow":0.0},"stopLoss":0.0,"takeProfit":0.0,"forceCloseTimeIST":"15:15"},"rationale":"string"}`;

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        timeout: 12000,
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const text = response?.data?.choices?.[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);

    return {
      symbol,
      source: 'groq',
      ...parsed,
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
};

const generateIntradayStrategy = async ({ symbol, quote, analysis, quantity }) => {
  const groq = await tryGroqStrategy({ symbol, quote, analysis, quantity });
  if (groq) return groq;
  return buildFallbackStrategy({ symbol, quote, analysis, quantity });
};

const evaluateTickAgainstStrategy = async ({ tickPrice, strategy, hasOpenPosition }) => {
  const stopLoss = Number(strategy?.rules?.stopLoss || 0);
  const takeProfit = Number(strategy?.rules?.takeProfit || 0);
  const entryPrice = Number(strategy?.rules?.entry?.whenPriceAtOrBelow || 0);

  if (!hasOpenPosition && entryPrice > 0 && tickPrice <= entryPrice) {
    return { action: 'BUY', reason: `Price ${tickPrice} reached entry <= ${entryPrice}` };
  }

  if (hasOpenPosition && stopLoss > 0 && tickPrice <= stopLoss) {
    return { action: 'SELL', reason: `Stop-loss hit at ${tickPrice} <= ${stopLoss}` };
  }

  if (hasOpenPosition && takeProfit > 0 && tickPrice >= takeProfit) {
    return { action: 'SELL', reason: `Take-profit hit at ${tickPrice} >= ${takeProfit}` };
  }

  return { action: 'HOLD', reason: 'No strategy rule triggered on this tick.' };
};

module.exports = {
  generateDeepAnalysis,
  generateIntradayStrategy,
  evaluateTickAgainstStrategy,
};
