export default async function handler(req, res) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  // إعدادات الـ CORS
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

    const contents = history
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
      return res.status(400).json({ error: 'لا يوجد محتوى صالح في history' });
    }

    if (contents[0].role === 'model') {
      contents.shift();
    }

    if (!GEMINI_API_KEY) {
      console.error('Missing GEMINI_API_KEY');
      return res.status(500).json({ error: 'GEMINI_API_KEY غير معرف في إعدادات السيرفر.' });
    }

    // إرسال الطلب إلى Gemini مع التأكد من صياغة النظام
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`,
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
      console.error('Gemini API Error Response:', errText); // هذا السطر سيطبع لك السبب الدقيق في الـ Terminal لو رفضت جوجل الطلب
      return res.status(502).json({ error: 'خطأ أثناء الاتصال بـ Gemini API', details: errText });
    }

    // إعداد ترويسات البث بشكل متوافق مع البيئة المحلية و Vercel
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // قراءة الـ Stream بطريقة متوافقة عالمياً (Node.js Fetch + Web Stream)
    const reader = geminiRes.body;
    let buffer = '';

    // التحقق من الطريقة الأنسب للقراءة حسب إصدار البيئة التشغيلية
    if (typeof reader.getReader === 'function') {
      const webReader = reader.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await webReader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        buffer = processBuffer(buffer, res);
      }
    } else {
      // التعامل مع Streams التقليدية في بيئة Node المحلية القديمة
      for await (const chunk of reader) {
        buffer += chunk.toString();
        buffer = processBuffer(buffer, res);
      }
    }

    // معالجة أي بيانات متبقية
    if (buffer.trim()) {
      processLine(buffer.trim(), res);
    }

    res.end();

  } catch (error) {
    console.error('Server error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'خطأ داخلي في السيرفر' });
    }
  }
}

// دالة مساعدة لمعالجة كتل النصوص القادمة من البث
function processBuffer(buffer, res) {
  const lines = buffer.split('\n');
  const remaining = lines.pop() || '';

  for (const line of lines) {
    processLine(line, res);
  }
  return remaining;
}

// دالة مساعدة لتحليل سطر الـ SSE واستخراج النص وإرساله فوراً للـ Frontend
function processLine(line, res) {
  const trimmed = line.trim();
  if (!trimmed || !trimmed.startsWith('data:')) return;

  const jsonStr = trimmed.replace(/^data:\s*/, '');
  if (jsonStr === '[DONE]') return;

  try {
    const json = JSON.parse(jsonStr);
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (text) {
      res.write(text);
      if (typeof res.flush === 'function') res.flush();
    }
  } catch (e) {}
}