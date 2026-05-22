export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const { history } = await req.json();

    if (!history || !Array.isArray(history) || history.length === 0) {
      return new Response(JSON.stringify({ error: 'history مطلوب ويجب أن يكون مصفوفة' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
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

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY غير معرف' }), { status: 500, headers: corsHeaders });
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: 'أنت مساعد ذكي اسمك لمام في منصة مُلم. تساعد الطلاب في الإجابة عن كل مايتعلق بالمنح الدراسية وإعداد الملفات الخاصة بها ك السيرة الذاتية وخطاب الحافز. يجب أن تتكلم دائماً باللغة العربية الفصحى البسيطة فقط. ممنوع منعاً باتاً استخدام اللهجة المصرية أو أي لهجة عامية. استخدم أسلوباً ودوداً وواضحاً بالعربية الفصحى فقط.'
            }]
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192
          }
        })
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(JSON.stringify({ error: 'Gemini Error', details: errText }), { status: 502, headers: corsHeaders });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder('utf-8');
    const reader = geminiRes.body.getReader();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          let lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (let line of lines) {
            let cleaned = line.trim();
            
            if (cleaned.startsWith('data:')) {
              cleaned = cleaned.substring(5).trim();
              if (cleaned === '[DONE]') continue;
              
              try {
                const json = JSON.parse(cleaned);
                const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  controller.enqueue(encoder.encode(text));
                }
              } catch (e) {
              }
            }
          }
        }

        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache, no-transform',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Server error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: corsHeaders });
  }
}