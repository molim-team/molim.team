export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  const allowedOrigin = '*'; 
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
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

    // إصلاح ترتيب الأدوار: يجب أن تبدأ المحادثة دائماً بـ user
    if (contents[0].role === 'model') {
      contents.shift();
    }

    // مصفاة إضافية آمنة لمنع تكرار دورين متتاليين من نفس النوع (مثلاً user ثم user) مما يكسر الـ API
    const validatedContents = [];
    for (let i = 0; i < contents.length; i++) {
      if (validatedContents.length === 0 || validatedContents[validatedContents.length - 1].role !== contents[i].role) {
        validatedContents.push(contents[i]);
      } else {
        // إذا تكرر نفس الدور (مثلاً رسالتين مستخدم متتاليتين)، ندمج النصوص في رسالة واحدة لضمان التناوب الصارم
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
          contents: validatedContents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048 
          }
        })
      }
    );

    // إصلاح الثغرة: قراءة نص الخطأ بشكل آمن وتمريره للمتصفح دون التسبب في انهيار صامت (Crash) للـ Edge Runtime
    if (!geminiRes.ok) {
      let errorDetails = 'Unknown error';
      try {
        errorDetails = await geminiRes.text();
      } catch (e) {
        errorDetails = 'Could not read error text';
      }
      console.error('Gemini API Error:', errorDetails);
      return new Response(JSON.stringify({ error: 'خطأ في الاتصال بالخادم الذكي', details: errorDetails }), { 
        status: 502, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }

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
            
            let eventEndIndex;
            while ((eventEndIndex = buffer.indexOf('\n\n')) >= 0) {
              const eventStr = buffer.slice(0, eventEndIndex).trim();
              buffer = buffer.slice(eventEndIndex + 2);

              if (!eventStr.startsWith('data:')) continue;
              
              const dataStr = eventStr.substring(5).trim();
              if (dataStr === '[DONE]') continue;
              
              try {
                const json = JSON.parse(dataStr);
                const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  controller.enqueue(encoder.encode(text));
                }
              } catch (e) {
                // تجاهل أخطاء الـ parse لأسطر الـ Stream غير المكتملة
              }
            }
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