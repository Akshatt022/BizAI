const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');

router.use(auth);


// ── Groq REST API helper ──────────────────────────────────────────────────────
async function callGroq(systemPrompt, userPrompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set in .env');

  // llama-3.1-8b-instant supports response_format json_object
  const reqBody = {
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt }
    ],
    temperature: 0.5,
    max_tokens: 1024,
    response_format: { type: 'json_object' }
  };



  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify(reqBody)
  });

  const data = await response.json();

  if (!response.ok) {
    const msg = data?.error?.message || ('HTTP ' + response.status);
    console.error('Groq API error (' + response.status + '):', msg);
    throw new Error(msg);
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    console.error('Groq returned no text. Full response:', JSON.stringify(data));
    throw new Error('Empty response from Groq');
  }


  const parsed = JSON.parse(text);

  // Normalise shape: could be { insights:[...] }, { daily_actions:[...] }, or root array
  if (Array.isArray(parsed)) return parsed;
  if (parsed.insights)      return parsed.insights;
  if (parsed.week_goal || parsed.daily_actions) return parsed;  // growth plan
  const arrVal = Object.values(parsed).find(v => Array.isArray(v));
  if (arrVal) return arrVal;
  return parsed;
}

// ── Rule-based fallback engine ────────────────────────────────────────────────
function ruleBasedInsights(salesStats = {}, customerStats = {}) {
  const insights = [];
  const { percentChange = 0, thisWeekRevenue = 0 } = salesStats;
  const { newThisWeek = 0, totalCustomers = 0, returningCustomers = 0 } = customerStats;

  if (percentChange < -10) {
    insights.push({ icon:'📉', title:'Sales Decline Detected', priority:'high',
      description:`Revenue dropped ${Math.abs(percentChange)}% vs last week. Run a limited-time flash sale or boost social media ads to win back customers.` });
  }
  if (newThisWeek < 3) {
    insights.push({ icon:'📢', title:'Low New Customer Acquisition', priority:'high',
      description:'You gained fewer than 3 new customers this week. Launch a referral campaign — offer existing customers a discount for every friend they bring in.' });
  }
  const returningRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;
  if (returningRate > 60) {
    insights.push({ icon:'⭐', title:'Strong Customer Loyalty', priority:'medium',
      description:`${Math.round(returningRate)}% of your customers keep coming back! Capitalise with a loyalty punch-card or exclusive member discount.` });
  }
  if (percentChange > 0) {
    insights.push({ icon:'🚀', title:'Revenue is Growing — Keep it Up!', priority:'low',
      description:`Great job — revenue is up ${percentChange}% this week. Upsell premium bundles and highlight your best-sellers to maintain momentum.` });
  }
  if (insights.length === 0) {
    insights.push({ icon:'📊', title:'Steady Performance', priority:'medium',
      description:'Business is stable. Introduce a seasonal promotion or a new product line to spark fresh growth.' });
  }
  return insights;
}

function ruleBasedGrowthPlan() {
  return {
    week_goal: 'Grow weekly revenue by 20% and acquire at least 5 new customers',
    daily_actions: [
      { day:'Monday',    task:'Post a special offer on WhatsApp, Instagram & Facebook Stories', expected_impact:'+15% foot traffic' },
      { day:'Tuesday',   task:'Call/message your top 10 returning customers with an exclusive discount', expected_impact:'+₹2,000 revenue' },
      { day:'Wednesday', task:'Rearrange store display to spotlight best-selling or high-margin items', expected_impact:'+10% upsell rate' },
      { day:'Thursday',  task:'Launch a "Bring a Friend" deal — both get 10% off', expected_impact:'+3 new customers' },
      { day:'Friday',    task:'Run an end-of-week flash sale on slow-moving inventory', expected_impact:'Clear stock + ₹3,000' },
      { day:'Saturday',  task:'Host a short in-store demo or tasting event for a key product', expected_impact:'+25% weekend sales' },
      { day:'Sunday',    task:"Review the week's numbers and plan next week's promotions", expected_impact:'Optimised strategy' },
    ],
  };
}

const SYSTEM_PROMPT = `You are BizAI, an AI business advisor for small local shops.
Always respond with ONLY valid JSON. Never include any text, explanation, or markdown outside the JSON.
For insights: return a JSON object {"insights": [{"title": string, "description": string, "priority": "high|medium|low", "icon": emoji}]}
For growth plan: return a JSON object {"week_goal": string, "daily_actions": [{"day": string, "task": string, "expected_impact": string}]}`;

// ── POST /api/ai/insights ─────────────────────────────────────────────────────
router.post('/insights', async (req, res) => {
  try {
    const { salesStats = {}, customerStats = {} } = req.body;
    const prompt = `Sales Data:
- Total Revenue: ₹${salesStats.totalRevenue ?? 0}
- This Week Revenue: ₹${salesStats.thisWeekRevenue ?? 0}
- Last Week Revenue: ₹${salesStats.lastWeekRevenue ?? 0}
- Week-over-week change: ${salesStats.percentChange ?? 0}%
- Transactions this week: ${salesStats.thisWeekCount ?? 0}

Customer Data:
- Total Customers: ${customerStats.totalCustomers ?? 0}
- New This Week: ${customerStats.newThisWeek ?? 0}
- Returning Customers: ${customerStats.returningCustomers ?? 0}

Provide 3-5 actionable insights as a JSON array.`;

    try {
      const result = await callGroq(SYSTEM_PROMPT, prompt);
      // result is already normalised by callGroq — could be array or {insights: [...]}
      const insights = Array.isArray(result) ? result : (result.insights || [result]);
      return res.json({ success: true, data: insights });
    } catch (aiErr) {
      console.warn('Groq unavailable, using rule-based fallback:', aiErr.message);
      return res.json({ success: true, data: ruleBasedInsights(salesStats, customerStats), fallback: true });
    }
  } catch (err) {
    console.error('AI insights error:', err);
    res.status(500).json({ success: false, message: 'Could not generate insights.' });
  }
});

// ── POST /api/ai/growth-plan ──────────────────────────────────────────────────
router.post('/growth-plan', async (req, res) => {
  try {
    const { salesStats = {}, customerStats = {} } = req.body;
    const prompt = `Sales Data:
- Total Revenue: ₹${salesStats.totalRevenue ?? 0}
- This Week Revenue: ₹${salesStats.thisWeekRevenue ?? 0}
- Week-over-week change: ${salesStats.percentChange ?? 0}%

Customer Data:
- Total Customers: ${customerStats.totalCustomers ?? 0}
- New This Week: ${customerStats.newThisWeek ?? 0}
- Returning Customers: ${customerStats.returningCustomers ?? 0}

Create a 7-day growth plan as JSON with {week_goal, daily_actions: [{day, task, expected_impact}]}.`;

    try {
      const plan = await callGroq(SYSTEM_PROMPT, prompt);
      // plan is already normalised
      const finalPlan = (plan.week_goal || plan.daily_actions) ? plan : (plan.growth_plan || plan);
      return res.json({ success: true, data: finalPlan });
    } catch (aiErr) {
      console.warn('Groq unavailable, using rule-based fallback:', aiErr.message);
      return res.json({ success: true, data: ruleBasedGrowthPlan(), fallback: true });
    }
  } catch (err) {
    console.error('AI growth-plan error:', err);
    res.status(500).json({ success: false, message: 'Could not generate growth plan.' });
  }
});

// ── POST /api/ai/chat ─────────────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [], businessContext = {} } = req.body;

    const Sale     = require('../models/Sale');
    const Customer = require('../models/Customer');

    const [salesStats, customerStats, recentSales] = await Promise.all([
      Sale.aggregate([
        { $match: { userId: req.user._id || req.user.id } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]).then(r => r[0] || { total: 0, count: 0 }),
      Customer.countDocuments({ userId: req.user.id }).then(n => ({ total: n })),
      Sale.find({ userId: req.user.id }).sort({ date: -1 }).limit(5),
    ]);

    const contextPrompt = `You are BizAI, a friendly and smart AI business advisor for a local shop owner.
The owner's business has:
- Total Revenue: ₹${salesStats.total?.toFixed(0) || 0} across ${salesStats.count || 0} sales
- Total Customers: ${customerStats.total || 0}
- Recent sales: ${recentSales.map(s => `₹${s.amount} (${s.category})`).join(', ') || 'none yet'}
Answer concisely and helpfully. Keep responses under 3 sentences unless asked for detail.
Respond in plain text (not JSON). Be warm, practical, and specific to their data.`;

    const apiKey = process.env.GROQ_API_KEY;
    const messages = [
      { role: 'system', content: contextPrompt },
      ...history.slice(-10),  // last 10 messages for context window
      { role: 'user', content: message },
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages, temperature: 0.7, max_tokens: 512 }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || 'Groq error');

    const reply = data.choices?.[0]?.message?.content;
    if (!reply) throw new Error('Empty chat response');

    res.json({ success: true, data: { reply, role: 'assistant' } });
  } catch (err) {
    console.error('AI chat error:', err.message);
    res.json({ success: true, data: { reply: "I'm having trouble connecting right now. Try asking me again in a moment!", role: 'assistant' } });
  }
});

// ── POST /api/ai/forecast ─────────────────────────────────────────────────────
router.post('/forecast', async (req, res) => {
  try {
    const { weeklyData = [] } = req.body;

    const avgRevenue = weeklyData.length
      ? Math.round(weeklyData.reduce((s, d) => s + (d.total || 0), 0) / weeklyData.length)
      : 1000;

    const trend = weeklyData.length >= 2
      ? weeklyData[weeklyData.length - 1].total - weeklyData[0].total
      : 0;

    const prompt = `You are a revenue forecasting AI. A local shop had these daily revenues last week:
${weeklyData.map(d => `${d.day}: ₹${d.total}`).join('\n')}

Average daily revenue: ₹${avgRevenue}
Weekly trend: ${trend >= 0 ? '+' : ''}₹${trend} (${trend >= 0 ? 'growing' : 'declining'})

Predict the NEXT 7 days of revenue (the coming week, NOT the same days again).
Rules:
- Weekend days (Sat, Sun) should be 20-40% HIGHER than weekdays
- Apply the observed trend to next week's values
- Values must be DIFFERENT from last week (not a copy!)
- Vary each day realistically (±10-25% from the trend line)
- Average of predictions should be ${trend >= 0 ? 'higher' : 'similar or lower'} than ₹${avgRevenue}

Respond ONLY as JSON: {"forecast": [{"day": "Mon", "predicted": 1800, "confidence": "high|medium|low"}]}
Include exactly 7 entries for Mon through Sun.`;

    const FORECAST_SYSTEM = `You are a revenue forecasting AI. Always respond with ONLY valid JSON. No markdown, no text before or after the JSON.`;

    const result = await callGroq(FORECAST_SYSTEM, prompt);
    const forecast = Array.isArray(result) ? result : (result.forecast || []);

    res.json({ success: true, data: forecast });
  } catch (err) {
    console.error('Forecast error:', err.message);
    // Rule-based fallback — applies a realistic trend with weekend boost
    const { weeklyData = [] } = req.body;
    const avg = weeklyData.length
      ? weeklyData.reduce((s, d) => s + (d.total || 0), 0) / weeklyData.length
      : 1000;
    const trendFactor = weeklyData.length >= 2
      ? (weeklyData[weeklyData.length - 1].total / Math.max(weeklyData[0].total, 1))
      : 1.05; // assume 5% growth if no data
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const weekendBoost = { Sat: 1.4, Sun: 1.3 };
    const fallback = days.map((day) => {
      const base = avg * trendFactor * (weekendBoost[day] || 1);
      const variance = 0.85 + Math.random() * 0.3; // ±15%
      return { day, predicted: Math.round(base * variance), confidence: 'medium' };
    });
    res.json({ success: true, data: fallback, fallback: true });
  }
});

// ── POST /api/ai/health-score ─────────────────────────────────────────────────
router.post('/health-score', async (req, res) => {
  try {
    const { salesStats = {}, customerStats = {} } = req.body;

    const prompt = `Business stats:
- Revenue this week: ₹${salesStats.thisWeekRevenue || 0}
- Revenue last week: ₹${salesStats.lastWeekRevenue || 0}
- Week change: ${salesStats.percentChange || 0}%
- Total customers: ${customerStats.totalCustomers || 0}
- New customers: ${customerStats.newThisWeek || 0}
- Returning customers: ${customerStats.returningCustomers || 0}
- Weekly transactions: ${salesStats.thisWeekCount || 0}

Rate this business health from 0-100.
Respond as JSON: {"score": 72, "label": "Thriving|Stable|Growing|Struggling|Critical", "factors": [{"icon": "📈", "text": "short reason"}]}`;

    const HEALTH_SYSTEM = `You are a business analyst. Always respond with ONLY valid JSON. No extra text.`;
    const result = await callGroq(HEALTH_SYSTEM, prompt);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Health score error:', err.message);
    // Fallback calculation
    let score = 50;
    const { percentChange = 0, thisWeekCount = 0 } = req.body.salesStats || {};
    const { newThisWeek = 0, returningCustomers = 0 } = req.body.customerStats || {};
    if (percentChange > 15) score += 20;
    else if (percentChange > 0) score += 10;
    else if (percentChange < -15) score -= 20;
    else if (percentChange < 0) score -= 10;
    if (newThisWeek > 5) score += 10;
    if (returningCustomers > 5) score += 10;
    if (thisWeekCount > 10) score += 10;
    score = Math.max(10, Math.min(100, score));
    const label = score >= 75 ? 'Thriving' : score >= 55 ? 'Stable' : score >= 35 ? 'Growing' : 'Struggling';
    res.json({ success: true, data: { score, label, factors: [
      { icon: percentChange >= 0 ? '📈' : '📉', text: `Revenue ${percentChange >= 0 ? 'up' : 'down'} ${Math.abs(percentChange)}% vs last week` },
      { icon: '👥', text: `${newThisWeek} new customers this week` },
    ]}, fallback: true });
  }
});

module.exports = router;


