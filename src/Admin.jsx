import React, { useState } from 'react';

function Admin() {
  // إعدادات المستودع والثوابت
  const OWNER = 'molim-team';
  const REPO = 'molim-team.github.io';
  const FILE = 'data/scholarships.json';

  // حالات لوحة التحكم (States)
  const [token, setToken] = useState('');
  const [activeTab, setActiveTab] = useState('add'); // 'add' أو 'manage'
  const [message, setMessage] = useState({ text: '', type: '' });
  const [editMessage, setEditMessage] = useState({ text: '', type: '' });
  
  // حالات تخزين البيانات القادمة من GitHub
  const [cachedSha, setCachedSha] = useState('');
  const [scholarships, setScholarships] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // حالات المودال والتعديل
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);

  // هيكل البيانات الأساسي لنموذج المنحة (للإضافة والتعديل)
  const initialFormState = {
    title: '', enTitle: '', country: '', flag: '', degree: '', language: '',
    status: 'open', open_date: '', deadline: '', desc: '', notes: '', link: '',
    benefits: '', requirements: '', majors: '',
    requiredFiles: [''], optionalFiles: [''] // مصفوفات ديناميكية تبدأ بحقل فارغ
  };

  const [addForm, setAddForm] = useState(initialFormState);
  const [editForm, setEditForm] = useState(initialFormState);

  // --- دوال مساعدة للتعامل مع الـ Base64 و UTF-8 العربي ---
  const toBase64 = (str) => {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
  };

  const decodeContent = (content) => {
    const clean = content.replace(/\n/g, '');
    const bytes = Uint8Array.from(atob(clean), c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder('utf-8').decode(bytes));
  };

  // --- دوال ديناميكية لإدارة صفوف الملفات المضافة ---
  const handleFileTypeChange = (formType, fileType, index, value) => {
    const targetForm = formType === 'add' ? addForm : editForm;
    const setForm = formType === 'add' ? setAddForm : setEditForm;
    const updatedFiles = [...targetForm[fileType]];
    updatedFiles[index] = value;
    setForm({ ...targetForm, [fileType]: updatedFiles });
  };

  const addFileField = (formType, fileType) => {
    const targetForm = formType === 'add' ? addForm : editForm;
    const setForm = formType === 'add' ? setAddForm : setEditForm;
    setForm({ ...targetForm, [fileType]: [...targetForm[fileType], ''] });
  };

  const removeFileField = (formType, fileType, index) => {
    const targetForm = formType === 'add' ? addForm : editForm;
    const setForm = formType === 'add' ? setAddForm : setEditForm;
    const updatedFiles = targetForm[fileType].filter((_, i) => i !== index);
    setForm({ ...targetForm, [fileType]: updatedFiles });
  };

  // --- الاتصال بـ GitHub API ---
  const fetchGitHubFile = async () => {
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}`, {
      headers: { Authorization: `token ${token}` }
    });
    if (!res.ok) throw new Error('فشل الاتصال بـ GitHub — تأكد من التوكن وصلاحياته');
    return await res.json();
  };

  const saveGitHubFile = async (sha, dataArray, commitMessage) => {
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}`, {
      method: 'PUT',
      headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: commitMessage,
        content: toBase64(JSON.stringify(dataArray, null, 2)),
        sha: sha
      })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'فشل الحفظ في المستودع');
    return result;
  };

  // --- إضافة منحة جديدة ---
  const handleAddScholarship = async () => {
    setMessage({ text: '⏳ جاري الإضافة...', type: 'info' });

    if (!addForm.title.trim() || !addForm.country.trim()) {
      setMessage({ text: '❌ اسم المنحة والدولة مطلوبان بقوة!', type: 'error' });
      return;
    }

    const generatedId = addForm.enTitle
      ? addForm.enTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
      : 'scholarship-' + Date.now();

    const newEntry = {
      id: generatedId,
      name: addForm.title.trim(),
      name_en: addForm.enTitle.trim(),
      country: addForm.country.trim(),
      flag: addForm.flag.trim(),
      degree: addForm.degree.trim(),
      language: addForm.language.trim(),
      description: addForm.desc.trim(),
      benefits: addForm.benefits.split(',').map(s => s.trim()).filter(Boolean),
      requirements: addForm.requirements.split(',').map(s => s.trim()).filter(Boolean),
      majors: addForm.majors.split(',').map(s => s.trim()).filter(Boolean),
      open_date: addForm.open_date,
      deadline: addForm.deadline,
      documents: {
        required: addForm.requiredFiles.map(f => f.trim()).filter(Boolean),
        optional: addForm.optionalFiles.map(f => f.trim()).filter(Boolean)
      },
      link: addForm.link.trim(),
      open: addForm.status === 'open',
      notes: addForm.notes.trim()
    };

    try {
      const fileData = await fetchGitHubFile();
      const currentList = decodeContent(fileData.content);
      currentList.push(newEntry);

      await saveGitHubFile(fileData.sha, currentList, `إضافة منحة: ${newEntry.name}`);
      setMessage({ text: '✅ تمت إضافة المنحة بنجاح! ستظهر على الموقع خلال دقائق.', type: 'success' });
      setAddForm(initialFormState); // تصفير الفورم بعد النجاح
    } catch (e) {
      setMessage({ text: `❌ حدث خطأ: ${e.message}`, type: 'error' });
    }
  };

  // --- تحميل وإدارة المنح المخزنة ---
  const handleLoadScholarships = async () => {
    setLoadingList(true);
    setMessage({ text: '', type: '' });
    try {
      const fileData = await fetchGitHubFile();
      setCachedSha(fileData.sha);
      const decodedList = decodeContent(fileData.content);
      setScholarships(decodedList);
    } catch (e) {
      setMessage({ text: '❌ خطأ في تحميل القائمة — تأكد من صحة التوكن', type: 'error' });
    } finally {
      setLoadingList(false);
    }
  };

  // --- حذف منحة ---
  const handleDeleteScholarship = async (index) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المنحة نهائياً؟')) return;
    try {
      const targetList = [...scholarships];
      const targetTitle = targetList[index].name || targetList[index].title;
      targetList.splice(index, 1);

      // نأخذ الـ SHA الأحدث مباشرة لحذف آمن دون تعارضات
      const fileData = await fetchGitHubFile();
      await saveGitHubFile(fileData.sha, targetList, `حذف منحة: ${targetTitle}`);
      alert('✅ تم الحذف بنجاح من الخادم!');
      handleLoadScholarships(); // إعادة تحميل
    } catch (e) {
      alert(`❌ فشل الحذف: ${e.message}`);
    }
  };

  // --- فتح مودال التعديل وتجهيز بياناته ---
  const handleOpenEditModal = (index) => {
    const s = scholarships[index];
    setEditingIndex(index);
    setEditMessage({ text: '', type: '' });

    setEditForm({
      title: s.name || s.title || '',
      enTitle: s.name_en || s.enTitle || '',
      country: s.country || '',
      flag: s.flag || '',
      degree: s.degree || s.degrees || '',
      language: s.language || '',
      status: (s.open === true || s.status === 'open') ? 'open' : 'closed',
      open_date: s.open_date || '',
      deadline: s.deadline || '',
      desc: s.description || s.desc || '',
      benefits: Array.isArray(s.benefits) ? s.benefits.join(', ') : s.benefits || '',
      requirements: Array.isArray(s.requirements) ? s.requirements.join(', ') : s.requirements || '',
      majors: Array.isArray(s.majors) ? s.majors.join(', ') : s.majors || '',
      link: s.link || '',
      notes: s.notes || '',
      requiredFiles: s.documents?.required?.length ? s.documents.required : [''],
      optionalFiles: s.documents?.optional?.length ? s.documents.optional : ['']
    });

    setIsModalOpen(true);
  };

  // --- حفظ التعديلات المرسلة ---
  const handleSaveEdit = async () => {
    setEditMessage({ text: '⏳ جاري حفظ التعديلات...', type: 'info' });

    if (!editForm.title.trim() || !editForm.country.trim()) {
      setEditMessage({ text: '❌ اسم المنحة والدولة مطلوبان!', type: 'error' });
      return;
    }

    try {
      const updatedList = [...scholarships];
      const oldData = updatedList[editingIndex];

      updatedList[editingIndex] = {
        ...oldData,
        name: editForm.title.trim(),
        name_en: editForm.enTitle.trim(),
        country: editForm.country.trim(),
        flag: editForm.flag.trim(),
        degree: editForm.degree.trim(),
        language: editForm.language.trim(),
        description: editForm.desc.trim(),
        benefits: editForm.benefits.split(',').map(s => s.trim()).filter(Boolean),
        requirements: editForm.requirements.split(',').map(s => s.trim()).filter(Boolean),
        majors: editForm.majors.split(',').map(s => s.trim()).filter(Boolean),
        open_date: editForm.open_date,
        deadline: editForm.deadline,
        documents: {
          required: editForm.requiredFiles.map(f => f.trim()).filter(Boolean),
          optional: editForm.optionalFiles.map(f => f.trim()).filter(Boolean)
        },
        link: editForm.link.trim(),
        open: editForm.status === 'open',
        notes: editForm.notes.trim()
      };

      const fileData = await fetchGitHubFile();
      await saveGitHubFile(fileData.sha, updatedList, `تعديل منحة: ${editForm.title}`);

      setEditMessage({ text: '✅ تم حفظ التعديلات بنجاح!', type: 'success' });
      setTimeout(() => {
        setIsModalOpen(false);
        handleLoadScholarships();
      }, 1500);

    } catch (e) {
      setEditMessage({ text: `❌ فشل التعديل: ${e.message}`, type: 'error' });
    }
  };

  return (
    <div className="admin-container">
      <h1>🎛️ لوحة تحكم مُلم</h1>

      {/* حقل التوكن المشترك لكافة العمليات */}
      <div className="token-bar">
        <label>🔑 التوكن الخاص بـ GitHub (مطلوب للتحقق)</label>
        <input 
          type="password" 
          placeholder="أدخل التوكن هنا..." 
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
      </div>

      {/* التبويبات */}
      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'add' ? 'active' : 'inactive'}`} 
          onClick={() => setActiveTab('add')}
        >
          ➕ إضافة منحة
        </button>
        <button 
          className={`tab-btn ${activeTab === 'manage' ? 'active' : 'inactive'}`} 
          onClick={() => { setActiveTab('manage'); handleLoadScholarships(); }}
        >
          📋 إدارة المنح
        </button>
      </div>

      {/* رسائل التغذية الراجعة العامة */}
      {message.text && <p className={`admin-msg ${message.type}`}>{message.text}</p>}

      {/* ================= تبويب الإضافة ================= */}
      {activeTab === 'add' && (
        <div className="section-form">
          <div className="form-group">
            <label>اسم المنحة *</label>
            <input type="text" placeholder="مثال: منحة الحكومة التركية" value={addForm.title} onChange={e => setAddForm({...addForm, title: e.target.value})} />
          </div>
          <div className="form-group">
            <label>الاسم الإنجليزي للمنحة</label>
            <input type="text" placeholder="مثال: Turkey Government Scholarship" value={addForm.enTitle} onChange={e => setAddForm({...addForm, enTitle: e.target.value})} />
          </div>
          <div className="form-group">
            <label>الدولة *</label>
            <input type="text" placeholder="مثال: تركيا" value={addForm.country} onChange={e => setAddForm({...addForm, country: e.target.value})} />
          </div>
          <div className="form-group">
            <label>رمز الدولة (علم الـ Emoji)</label>
            <input type="text" placeholder="مثال: 🇹🇷" value={addForm.flag} onChange={e => setAddForm({...addForm, flag: e.target.value})} />
          </div>
          <div className="form-group">
            <label>المراحل الدراسية</label>
            <input type="text" placeholder="مثال: بكالوريوس، ماجستير" value={addForm.degree} onChange={e => setAddForm({...addForm, degree: e.target.value})} />
          </div>
          <div className="form-group">
            <label>🌐 لغة الدراسة</label>
            <input type="text" placeholder="مثال: الإنجليزية، التركية" value={addForm.language} onChange={e => setAddForm({...addForm, language: e.target.value})} />
          </div>
          <div className="form-group">
            <label>حالة التقديم</label>
            <select value={addForm.status} onChange={e => setAddForm({...addForm, status: e.target.value})}>
              <option value="open">مفتوح</option>
              <option value="closed">مغلق</option>
            </select>
          </div>
          <div className="form-group">
            <label>📅 موعد فتح التقديم</label>
            <input type="date" value={addForm.open_date} onChange={e => setAddForm({...addForm, open_date: e.target.value})} />
          </div>
          <div className="form-group">
            <label>📅 آخر موعد للتقديم</label>
            <input type="date" value={addForm.deadline} onChange={e => setAddForm({...addForm, deadline: e.target.value})} />
          </div>
          <div className="form-group">
            <label>وصف المنحة (قصير)</label>
            <textarea placeholder="اكتب وصفاً مختصراً يظهر في بطاقة المنحة الدراسية الرئيسيّة..." value={addForm.desc} onChange={e => setAddForm({...addForm, desc: e.target.value})}></textarea>
          </div>
          <div className="form-group">
            <label>المميزات (افصل بين كل ميزة بفاصلة ,)</label>
            <input type="text" placeholder="مثال: رسوم دراسية كاملة, سكن معيشي, راتب شهري" value={addForm.benefits} onChange={e => setAddForm({...addForm, benefits: e.target.value})} />
          </div>
          <div className="form-group">
            <label>الشروط (افصل بين كل شرط بفاصلة ,)</label>
            <input type="text" placeholder="مثال: شهادة الثانوية العامة, إجادة اللغة الإنجليزية" value={addForm.requirements} onChange={e => setAddForm({...addForm, requirements: e.target.value})} />
          </div>
          <div className="form-group">
            <label>📚 التخصصات المتاحة (افصل بينها بفاصلة ,)</label>
            <input type="text" placeholder="مثال: هندسة برمجيات, ذكاء اصطناعي, هندسة حاسوب" value={addForm.majors} onChange={e => setAddForm({...addForm, majors: e.target.value})} />
          </div>

          {/* الملفات الإلزامية والاختيارية */}
          <div className="files-section">
            <h4>📂 المستندات والملفات المطلوبة</h4>
            <p className="sub-title-file">📌 الملفات الإجبارية</p>
            {addForm.requiredFiles.map((file, i) => (
              <div key={i} className="file-row">
                <input type="text" placeholder="مثال: نسخة من جواز السفر..." value={file} onChange={e => handleFileTypeChange('add', 'requiredFiles', i, e.target.value)} />
                <button type="button" className="btn-remove-file" onClick={() => removeFileField('add', 'requiredFiles', i)}>✕</button>
              </div>
            ))}
            <button type="button" className="btn-add-file" onClick={() => addFileField('add', 'requiredFiles')}>+ إضافة مستند إجباري</button>
            
            <hr className="section-divider"/>
            
            <p className="sub-title-file">📎 الملفات الاختيارية</p>
            {addForm.optionalFiles.map((file, i) => (
              <div key={i} className="file-row">
                <input type="text" placeholder="مثال: شهادات تطوع أو إنجاز..." value={file} onChange={e => handleFileTypeChange('add', 'optionalFiles', i, e.target.value)} />
                <button type="button" className="btn-remove-file" onClick={() => removeFileField('add', 'optionalFiles', i)}>✕</button>
              </div>
            ))}
            <button type="button" className="btn-add-file" onClick={() => addFileField('add', 'optionalFiles')}>+ إضافة مستند اختياري</button>
          </div>

          <div className="form-group">
            <label>رابط التتقديم للموقع الرسمي</label>
            <input type="url" placeholder="https://..." value={addForm.link} onChange={e => setAddForm({...addForm, link: e.target.value})} />
          </div>
          <div className="form-group">
            <label>📝 تفاصيل أو ملاحظات إضافية</label>
            <textarea placeholder="أي شروحات دقيقة تظهر بداخل صفحة التفاصيل المفردة..." value={addForm.notes} onChange={e => setAddForm({...addForm, notes: e.target.value})}></textarea>
          </div>

          <button className="btn-submit" onClick={handleAddScholarship}>✅ إضافة المنحة للمستودع</button>
        </div>
      )}

      {/* ================= تبويب إدارة المنح ================= */}
      {activeTab === 'manage' && (
        <div className="section-manage">
          <button className="btn-submit" style={{ marginBottom: '15px' }} onClick={handleLoadScholarships}>
            🔄 تحديث ومزامنة القائمة
          </button>
          
          {loadingList ? (
            <p style={{ textAlign: 'center', color: '#888' }}>⏳ جاري سحب المنح وتحديثات السيرفر...</p>
          ) : scholarships.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#aaa' }}>لا توجد منح دراسية مضافة حالياً في السجل</p>
          ) : (
            <div className="scholarships-list">
              {scholarships.map((s, index) => (
                <div key={s.id || index} className="scholarship-item">
                  <div>
                    <h3>{s.flag} {s.name || s.title}</h3>
                    <p>{s.country} — {s.degree || s.degrees}</p>
                  </div>
                  <div className="item-btns">
                    <button className="btn-edit" onClick={() => handleOpenEditModal(index)}>✏️ تعديل</button>
                    <button className="btn-delete" onClick={() => handleDeleteScholarship(index)}>🗑️ حذف</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= المودال (نافذة التعديل المنبثقة) ================= */}
      {isModalOpen && (
        <div className="modal-overlay open" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
            <h2>✏️ تعديل بيانات المنحة المختارة</h2>
            {editMessage.text && <p className={`admin-msg ${editMessage.type}`}>{editMessage.text}</p>}

            <div className="form-group">
              <label>اسم المنحة *</label>
              <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} />
            </div>
            <div className="form-group">
              <label>الاسم الإنجليزي</label>
              <input type="text" value={editForm.enTitle} onChange={e => setEditForm({...editForm, enTitle: e.target.value})} />
            </div>
            <div className="form-group">
              <label>الدولة *</label>
              <input type="text" value={editForm.country} onChange={e => setEditForm({...editForm, country: e.target.value})} />
            </div>
            <div className="form-group">
              <label>رمز الدولة (علم)</label>
              <input type="text" value={editForm.flag} onChange={e => setEditForm({...editForm, flag: e.target.value})} />
            </div>
            <div className="form-group">
              <label>المراحل الدراسية</label>
              <input type="text" value={editForm.degree} onChange={e => setEditForm({...editForm, degree: e.target.value})} />
            </div>
            <div className="form-group">
              <label>🌐 لغة الدراسة</label>
              <input type="text" value={editForm.language} onChange={e => setEditForm({...editForm, language: e.target.value})} />
            </div>
            <div className="form-group">
              <label>حالة التقديم</label>
              <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                <option value="open">مفتوح</option>
                <option value="closed">مغلق</option>
              </select>
            </div>
            <div className="form-group">
              <label>📅 موعد فتح التقديم</label>
              <input type="date" value={editForm.open_date} onChange={e => setEditForm({...editForm, open_date: e.target.value})} />
            </div>
            <div className="form-group">
              <label>📅 آخر موعد للتقديم</label>
              <input type="date" value={editForm.deadline} onChange={e => setEditForm({...editForm, deadline: e.target.value})} />
            </div>
            <div className="form-group">
              <label>وصف المنحة (قصير)</label>
              <textarea value={editForm.desc} onChange={e => setEditForm({...editForm, desc: e.target.value})}></textarea>
            </div>
            <div className="form-group">
              <label>المميزات</label>
              <input type="text" value={editForm.benefits} onChange={e => setEditForm({...editForm, benefits: e.target.value})} />
            </div>
            <div className="form-group">
              <label>الشروط</label>
              <input type="text" value={editForm.requirements} onChange={e => setEditForm({...editForm, requirements: e.target.value})} />
            </div>
            <div className="form-group">
              <label>📚 التخصصات</label>
              <input type="text" value={editForm.majors} onChange={e => setEditForm({...editForm, majors: e.target.value})} />
            </div>

            {/* تعديل المستندات داخل المودال */}
            <div className="files-section">
              <h4>📂 تعديل المستندات</h4>
              <p className="sub-title-file">📌 الملفات الإجبارية</p>
              {editForm.requiredFiles.map((file, i) => (
                <div key={i} className="file-row">
                  <input type="text" value={file} onChange={e => handleFileTypeChange('edit', 'requiredFiles', i, e.target.value)} />
                  <button type="button" className="btn-remove-file" onClick={() => removeFileField('edit', 'requiredFiles', i)}>✕</button>
                </div>
              ))}
              <button type="button" className="btn-add-file" onClick={() => addFileField('edit', 'requiredFiles')}>+ إضافة مستند إجباري</button>
              
              <hr className="section-divider"/>
              
              <p className="sub-title-file">📎 الملفات الاختيارية</p>
              {editForm.optionalFiles.map((file, i) => (
                <div key={i} className="file-row">
                  <input type="text" value={file} onChange={e => handleFileTypeChange('edit', 'optionalFiles', i, e.target.value)} />
                  <button type="button" className="btn-remove-file" onClick={() => removeFileField('edit', 'optionalFiles', i)}>✕</button>
                </div>
              ))}
              <button type="button" className="btn-add-file" onClick={() => addFileField('edit', 'optionalFiles')}>+ إضافة مستند اختياري</button>
            </div>

            <div className="form-group">
              <label>رابط التقديم الرسمي</label>
              <input type="url" value={editForm.link} onChange={e => setEditForm({...editForm, link: e.target.value})} />
            </div>
            <div className="form-group">
              <label>📝 تفاصيل إضافية</label>
              <textarea value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})}></textarea>
            </div>

            <button className="btn-save" onClick={handleSaveEdit}>💾 حفظ التعديلات وإرسال للمستودع</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;