export const config = {
  runtime: 'edge',
};


const rateLimitMap = new Map();

export default async function handler(req) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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

  // إذا كان الطلب من موقع غريب، ارفضه فوراً
  if (!isAllowedOrigin && origin !== '') {
    return new Response(JSON.stringify({ error: 'Unauthorized Access' }), { status: 403, headers: corsHeaders });
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
  }

  // 2. نظام الحماية الثاني (Rate Limiting): منع إغراق السيرفر بالطلبات
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (ip !== 'unknown') {
    const now = Date.now();
    const windowMs = 60 * 1000; // دقيقة واحدة
    const maxRequests = 10; // الحد الأقصى: 10 رسائل في الدقيقة لكل مستخدم

    const userRecord = rateLimitMap.get(ip) || { count: 0, startTime: now };
    
    if (now - userRecord.startTime > windowMs) {
      // تصفير العداد إذا مرت دقيقة
      userRecord.count = 1;
      userRecord.startTime = now;
    } else {
      userRecord.count++;
      if (userRecord.count > maxRequests) {
        return new Response(JSON.stringify({ error: 'تم تجاوز الحد المسموح من الرسائل. يرجى الانتظار قليلاً.' }), {
          status: 429, // Too Many Requests
          headers: corsHeaders
        });
      }
    }
    rateLimitMap.set(ip, userRecord);
  }

  try {
    const { history } = await req.json();

    if (!history || !Array.isArray(history)) {
      return new Response(JSON.stringify({ error: 'بيانات غير صالحة' }), { status: 400, headers: corsHeaders });
    }
    if (history.length > 30) {
      return new Response(JSON.stringify({ error: 'تم تجاوز الحد الأقصى لطول المحادثة' }), { status: 400, headers: corsHeaders });
    }

    let contents = history
      .map(m => {
        const role = m.role === 'assistant' ? 'model' : 'user';

        if (Array.isArray(m.content)) {
          const parts = m.content.map(item => {
            if (item.type === 'text') return { text: item.text };
            if (item.type === 'image' && item.source?.type === 'base64') {
              return { inlineData: { mimeType: item.source.media_type, data: item.source.data } };
            }
            if (item.type === 'document' && item.source?.type === 'base64') {
              return { inlineData: { mimeType: 'application/pdf', data: item.source.data } };
            }
            return null;
          }).filter(Boolean);

          if (parts.length === 0) return null;
          return { role, parts };
        }

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

    if (validatedContents.length === 0) {
      return new Response(JSON.stringify({ error: 'لا يوجد محتوى صالح بعد الفحص' }), { status: 400, headers: corsHeaders });
    }

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'مفتاح API غير متوفر' }), { status: 500, headers: corsHeaders });
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: 'أنت مساعد ذكي اسمك لمام في منصة مُلم. تساعد الطلاب في الإجابة عن كل مايتعلق بالمنح الدراسية وإعداد الملفات الخاصة بها ك السيرة الذاتية وخطاب الحافز. يجب أن تتكلم دائماً باللغة العربية الفصحى البسيطة فقط. ممنوع منعاً باتاً استخدام اللهجة المصرية أو أي لهجة عامية. استخدم أسلوباً ودوداً وواضحاً بالعربية الفصحى فقط.'
            }]
          },
          contents: validatedContents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048 
          }
        })
      }
    );

    if (!geminiRes.ok) {
      const errorDetails = await geminiRes.text();
      console.error('Gemini API Error:', errorDetails);
      return new Response(JSON.stringify({ error: 'خطأ في الاتصال بالخادم الذكي', details: errorDetails }), { 
        status: 502, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }

    
    const responseData = await geminiRes.json();
    const botReplyText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، لم أتمكن من معالجة الرد.";

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // إرسال النص الصافي كاملاً
          controller.enqueue(encoder.encode(botReplyText));
        } catch (err) {
          console.error('Stream simulation error:', err);
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