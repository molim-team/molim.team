import fetch from 'node-fetch'; // تأكد من وجودها إذا كنت تستخدم بيئة Node قديمة، أو احذف السطر إذا كانت البيئة تدعم fetch تلقائياً

export default async function handler(req, res) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  // إعدادات الـ CORS لتسمح للفرونت إند (Vite) بالتواصل مع السيرفر
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { history } = req.body;

    if (!history || !Array.isArray(history) || history.length === 0) {
      return res.status(400).json({ error: 'history مطلوب ويجب أن يكون مصفوفة' });
    }

    // بناء الهيكل التفاعلي لـ Gemini لدعم النصوص، الصور، والملفات
    const contents = history
      .map(m => {
        const role = m.role === 'assistant' ? 'model' : 'user';

        if (Array.isArray(m.content)) {
          const parts = m.content.map(item => {
            if (item.type === 'text') {
              return { text: item.text };
            }
            if (item.type === 'image' && item.source?.type === 'base64') {
              return {
                inlineData: {
                  mimeType: item.source.media_type,
                  data: item.source.data
                }
              };
            }
            if (item.type === 'document' && item.source?.type === 'base64') {
              return {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: item.source.data
                }
              };
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
      return res.status(400).json({ error: 'لا يوجد محتوى صالح في history' });
    }

    // حماية: منع Gemini من استقبال محادثة تبدأ بدور النموذج (model)
    if (contents[0].role === 'model') {
      contents.shift();
    }

    if (!GEMINI_API_KEY) {
      console.error('Missing GEMINI_API_KEY');
      return res.status(500).json({ error: 'GEMINI_API_KEY غير معرف في إعدادات السيرفر.' });
    }

    // إرسال الطلب إلى Gemini بأسلوب البث المستمر sse
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
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
      console.error('Gemini error:', errText);
      return res.status(502).json({ error: 'خطأ أثناء الاتصال بـ Gemini API' });
    }

    // تجهيز الهيدرز لإرسال الإجابة كـ Stream (Chunked) للمتصفح فوراً
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const reader = geminiRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // الاحتفاظ بالسطر غير المكتمل

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const jsonStr = trimmed.replace(/^data:\s*/, '');
        if (jsonStr === '[DONE]') continue;

        try {
          const json = JSON.parse(jsonStr);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (text) res.write(text); // بث النص المقطوع مباشرة إلى العميل
        } catch (e) {}
      }
    }

    // قراءة آخر بقايا الـ buffer
    if (buffer.trim().startsWith('data:')) {
      const jsonStr = buffer.trim().replace(/^data:\s*/, '');
      if (jsonStr && jsonStr !== '[DONE]') {
        try {
          const json = JSON.parse(jsonStr);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (text) res.write(text);
        } catch (e) {}
      }
    }

    res.end();

  } catch (error) {
    console.error('Server error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'خطأ داخلي في السيرفر' });
    }
  }
}