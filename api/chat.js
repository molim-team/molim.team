export const config = {
  runtime: 'edge',
};

const rateLimitMap = new Map();

export default async function handler(req) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  // 1. نظام حماية CORS
  const origin = req.headers.get('origin') || '';
  const allowedOrigins = [
    'https://molim.team', 
    'https://www.molim.team', 
    'http://localhost:5173'
  ];
  
  const isAllowedOrigin = allowedOrigins.includes(origin);
  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'https://molim.team',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (!isAllowedOrigin && origin !== '') {
    return new Response(JSON.stringify({ error: 'Unauthorized Access' }), { status: 403, headers: corsHeaders });
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
  }

  // 2. نظام الحماية من السبام (Rate Limiting)
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (ip !== 'unknown') {
    const now = Date.now();
    const windowMs = 60 * 1000; 
    const maxRequests = 15; 

    const userRecord = rateLimitMap.get(ip) || { count: 0, startTime: now };
    
    if (now - userRecord.startTime > windowMs) {
      userRecord.count = 1;
      userRecord.startTime = now;
    } else {
      userRecord.count++;
      if (userRecord.count > maxRequests) {
        return new Response(JSON.stringify({ error: 'الرجاء الانتظار قليلاً قبل إرسال المزيد من الرسائل.' }), {
          status: 429, 
          headers: corsHeaders
        });
      }
    }
    rateLimitMap.set(ip, userRecord);
  }

  try {
    const { history } = await req.json();

    if (!history || !Array.isArray(history) || history.length === 0) {
      return new Response(JSON.stringify({ error: 'بيانات غير صالحة' }), { status: 400, headers: corsHeaders });
    }

    let contents = history
      .map(m => {
        const role = m.role === 'assistant' ? 'model' : 'user';
        if (typeof m.content === 'string' && m.content.trim()) {
          return { role, parts: [{ text: m.content }] };
        }
        return null;
      })
      .filter(Boolean);

    if (contents.length === 0) {
      return new Response(JSON.stringify({ error: 'لا يوجد محتوى صالح' }), { status: 400, headers: corsHeaders });
    }

 
    if (contents[0].role === 'model') {
      contents.shift();
    }

    const validatedContents = [];
    for (let i = 0; i < contents.length; i++) {
      if (validatedContents.length === 0 || validatedContents[validatedContents.length - 1].role !== contents[i].role) {
        validatedContents.push(contents[i]);
      } else {
        const lastParts = validatedContents[validatedContents.length - 1].parts;
        validatedContents[validatedContents.length - 1].parts = lastParts.concat(contents[i].parts);
      }
    }

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'مفتاح API غير متوفر' }), { status: 500, headers: corsHeaders });
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: 'أنت مساعد ذكي اسمك لمام في منصة مُلم. تساعد الطلاب في الإجابة عن كل مايتعلق بالمنح الدراسية وإعداد الملفات الخاصة بها كالسيرة الذاتية وخطاب الحافز. يجب أن تتحدث دائماً باللغة العربية الفصحى البسيطة فقط. استخدم أسلوباً ودوداً وواضحاً، وتجنب الإجابات المقطوعة.'
            }]
          },
          contents: validatedContents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096 
          }
        })
      }
    );

    if (!geminiRes.ok) {
      const errorDetails = await geminiRes.text();
      return new Response(JSON.stringify({ error: 'خطأ في الاتصال بالخادم الذكي', details: errorDetails }), { 
        status: 502, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }

    //  خوارزمية فك تشفير البث القوية (تعالج الفواصل المعقدة ولا تترك رسائل فارغة)
    const encoder = new TextEncoder();
    const decoder = new TextDecoder('utf-8');
    const reader = geminiRes.body.getReader();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            
            // Regex للبحث عن نهايات الأسطر المزدوجة بدقة تامة
            const boundaryRegex = /(?:\r?\n){2}/g;
            let match;
            let lastIndex = 0;

            while ((match = boundaryRegex.exec(buffer)) !== null) {
              const chunk = buffer.slice(lastIndex, match.index);
              lastIndex = match.index + match[0].length;

              const trimmedChunk = chunk.trim();
              if (trimmedChunk.startsWith('data:')) {
                const dataStr = trimmedChunk.slice(5).trim();
                if (dataStr !== '[DONE]') {
                  try {
                    const json = JSON.parse(dataStr);
                    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                      controller.enqueue(encoder.encode(text));
                    }
                  } catch (e) {
                  }
                }
              }
            }
            // الاحتفاظ بالبيانات غير المكتملة للدورة القادمة
            buffer = buffer.slice(lastIndex);
          }
        } catch (err) {
          console.error('Stream processing error:', err);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Server error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: corsHeaders });
  }
}