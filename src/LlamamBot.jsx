import React, { useState, useEffect, useRef } from 'react';

function LlamamBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [history, setHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleBotClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: 'مرحباً! أنا لمام، مساعدك الذكي في منصة مُلم 🎓\nيمكنني مساعدتك في:\n• كتابة وتقييم خطاب الحافز\n• نصائح للـ CV\n• تحليل الصور والملفات\n• توجيهك لأفضل منحة تناسبك\n\n⚠️ الحد الأقصى 15 رسالة لكل محادثة، انتقِ أسئلتك بعناية.'
        }
      ]);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAttachedFile(file);
    setFilePreview(`📎 ${file.name}`);
  };

  const handleSendMessage = async (textToSend = inputValue) => {
    const trimmedText = textToSend.trim();
    if (!trimmedText && !attachedFile) return;

    const userMsgCount = history.filter(m => m.role === 'user').length;
    if (userMsgCount >= 15) {
      setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: '⚠️ وصلت للحد الأقصى (15 رسالة). يرجى تحديث الصفحة لبدء محادثة جديدة.' }]);
      return;
    }

    const displayUserText = trimmedText || (attachedFile ? '📎 تم إرفاق ملف' : '');

    const newMsgId = Date.now();
    setMessages(prev => [...prev, { id: newMsgId, sender: 'user', text: displayUserText }]);
    setInputValue('');

    // تجهيز المحتوى وحقن الملفات إن وجدت
    let userContent;
    if (attachedFile) {
      try {
        const base64Data = await fileToBase64(attachedFile);
        const isImage = attachedFile.type.startsWith('image/');
        userContent = [
          isImage 
            ? { type: 'image', source: { type: 'base64', media_type: attachedFile.type, data: base64Data } }
            : { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Data } },
          { type: 'text', text: trimmedText || 'حلل هذا الملف' }
        ];
      } catch (err) {
        console.error("File conversion error:", err);
      }
      setAttachedFile(null);
      setFilePreview('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      userContent = trimmedText;
    }

    const updatedHistory = [...history, { role: 'user', content: userContent }];
    setHistory(updatedHistory);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: updatedHistory })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      setIsTyping(false);

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullReply = '';
      let buffer = '';


      const aiResponseId = Date.now() + '-ai';
      setMessages(prev => [...prev, { id: aiResponseId, sender: 'ai', text: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        if (chunk.includes('"text":') || chunk.trim().startsWith('{') || chunk.trim().startsWith('data:')) {
          buffer += chunk;
          let lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (let line of lines) {
            let cleaned = line.trim();
            if (cleaned.startsWith('data:')) cleaned = cleaned.substring(5).trim();
            if (cleaned.startsWith(',')) cleaned = cleaned.substring(1).trim();
            if (!cleaned || cleaned === '[' || cleaned === ']' || cleaned === '[DONE]') continue;

            try {
              const parsed = JSON.parse(cleaned);
              const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text || parsed.text || '';
              if (textChunk) {
                fullReply += textChunk;
                setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: fullReply } : m));
              }
            } catch (e) {
              if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
                fullReply += line;
                setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: fullReply } : m));
              }
            }
          }
        } else {
          fullReply += chunk;
          setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: fullReply } : m));
        }
      }

      if (buffer.trim() && (buffer.includes('"text":') || buffer.trim().startsWith('{'))) {
        try {
          let cleaned = buffer.trim();
          if (cleaned.startsWith('data:')) cleaned = cleaned.substring(5).trim();
          if (cleaned.startsWith(',')) cleaned = cleaned.substring(1).trim();
          const parsed = JSON.parse(cleaned);
          const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text || parsed.text || '';
          if (textChunk) fullReply += textChunk;
        } catch (e) {
          fullReply += buffer;
        }
        setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: fullReply } : m));
      }

      setHistory(prev => [...prev, { role: 'assistant', content: fullReply }]);

    } catch (err) {
      setIsTyping(false);
      console.error('Llamam Error:', err);
      setMessages(prev => [...prev, { 
        id: Date.now() + '-err', 
        sender: 'ai', 
        text: 'عذراً، حدث خطأ في الاتصال بالخادم. تحقق من اتصال الإنترنت وحاول مرة أخرى.' 
      }]);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const quickQuestions = ['كيف أكتب خطاب حافز قوي', 'كيف اكتب سيرة ذاتية بشكل ممتاز', 'كيف أختار المنحة المناسبة'];

  return (
    <>
      {/* زر لمام AI الأساسي */}
      <button className="llamam-button" onClick={handleBotClick}>
        🤖 لمام
      </button>

      {/* صندوق المحادثة التفاعلي المساعد */}
      {isOpen && (
        <div className="llamam-chat-box">
          <div className="llamam-header">
            <span>🤖 لمام — مساعدك الذكي</span>
            <button className="llamam-close-btn" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="llamam-messages-area">
            {messages.map((msg) => (
              <div key={msg.id} className={`llamam-msg ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            {isTyping && <div style={{ color: '#aaa', fontSize: '13px' }}>...يكتب الآن</div>}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && (
            <div className="llamam-quick-container">
              {quickQuestions.map((q, idx) => (
                <button key={idx} className="llamam-quick-btn" onClick={() => handleSendMessage(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="llamam-footer">
            <div className="llamam-input-row">
              <label htmlFor="llamam-file" style={{ cursor: 'pointer', fontSize: '22px' }} title="إرفاق صورة أو PDF">📎</label>
              <input 
                id="llamam-file" 
                type="file" 
                accept="image/*,.pdf" 
                style={{ display: 'none' }} 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <input 
                type="text" 
                className="llamam-input-field"
                placeholder="اسألني أي شيء..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button className="llamam-send-btn" onClick={() => handleSendMessage()}>إرسال</button>
            </div>
            {filePreview && <div className="llamam-preview-text">{filePreview}</div>}
          </div>
        </div>
      )}
    </>
  );
}

export default LlamamBot;