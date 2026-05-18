import React, { useState } from 'react';
import { Link } from 'react-router-dom';


// تعريف التخصصات الـ 35 المأخوذة من كود عمرو الأصلي
const MAJORS_DATA = {
  cs_ai:       { name: 'الذكاء الاصطناعي وعلوم البيانات',       field: 'علوم الحاسب', desc: 'بناء نماذج التعلم الآلي، تحليل البيانات الضخمة، ومعالجة اللغة الطبيعية' },
  cs_soft:     { name: 'هندسة البرمجيات وتطوير التطبيقات',      field: 'علوم الحاسب', desc: 'تصميم وبناء التطبيقات والأنظمة البرمجية الكبيرة' },
  cs_cyber:    { name: 'الأمن السيبراني والشبكات',              field: 'علوم الحاسب', desc: 'حماية الأنظمة من الاختراق، تحليل الثغرات، وإدارة البنية التحتية للشبكات' },
  cs_hw:       { name: 'هندسة الحاسب والأجهزة المدمجة',        field: 'علوم الحاسب', desc: 'تصميم المعالجات والدوائر المدمجة والأجهزة الإلكترونية الذكية' },
  eng_civil:   { name: 'الهندسة المدنية والبنية التحتية',      field: 'الهندسة', desc: 'تصميم الجسور والطرق والسدود وشبكات المياه والصرف الصحي' },
  eng_arch:    { name: 'العمارة والتخطيط العمراني',             field: 'الهندسة', desc: 'تصميم المباني والمدن الذكية والفراغات المعمارية الوظيفية والجمالية' },
  eng_elec:    { name: 'الهندسة الكهربائية والإلكترونية',      field: 'الهندسة', desc: 'أنظمة الطاقة، الدوائر الإلكترونية، والاتصالات اللاسلكية' },
  eng_mech:    { name: 'الهندسة الميكانيكية والروبوتات',       field: 'الهندسة', desc: 'تصميم الآلات، المحركات، وأنظمة الروبوتات والأتمتة' },
  eng_chem:    { name: 'الهندسة الكيميائية والصناعية',         field: 'الهندسة', desc: 'تصميم المصانع، العمليات الكيميائية، وتصنيع المنتجات على نطاق واسع' },
  eng_environ: { name: 'الهندسة البيئية والاستدامة',           field: 'الهندسة', desc: 'معالجة المياه والهواء والتربة، والحلول الهندسية للتحديات البيئية' },
  eng_food:    { name: 'هندسة الغذاء والصناعات الغذائية',      field: 'الهندسة', desc: 'تصميم خطوط الإنتاج الغذائي، ضمان جودة المنتجات، وعلوم التغذية التطبيقية' },
  medicine:    { name: 'الطب البشري والتخصصات السريرية',       field: 'الطب والصحة', desc: 'تشخيص الأمراض وعلاجها والتعامل المباشر مع المرضى في بيئة طبية' },
  dentistry:   { name: 'طب الأسنان وجراحة الفم',              field: 'الطب والصحة', desc: 'تشخيص وعلاج أمراض الأسنان والفكين والجراحة التجميلية والترميمية للأسنان' },
  pharmacy:    { name: 'الصيدلة والعلوم الصيدلانية',           field: 'الطب والصحة', desc: 'الأدوية وتركيبها وتأثيراتها والإشراف على العلاج الدوائي' },
  nursing:     { name: 'التمريض والعلوم الصحية',               field: 'الطب والصحة', desc: 'رعاية المرضى مباشرةً، متابعة الحالات السريرية، والعمل ضمن الفريق الطبي' },
  med_lab:     { name: 'المختبرات الطبية والتحاليل',           field: 'الطب والصحة', desc: 'تحليل عينات الدم والأنسجة لتشخيص الأمراض واكتشاف العوامل المعدية' },
  nutrition:   { name: 'التغذية والغذاء السريري',              field: 'الطب والصحة', desc: 'تصميم برامج التغذية العلاجية والوقائية ودراسة تأثير الغذاء على الصحة' },
  business:    { name: 'إدارة الأعمال وريادة الشركات',         field: 'الأعمال', desc: 'بناء الشركات، التخطيط الاستراتيجي، والإدارة المالية والتسويقية' },
  economics:   { name: 'الاقتصاد والمالية والمحاسبة',          field: 'الأعمال', desc: 'تحليل الأسواق، إدارة الأصول المالية، والمحاسبة المعتمدة' },
  marketing:   { name: 'التسويق وإدارة العلامات التجارية',     field: 'الأعمال', desc: 'بناء هوية المنتجات، صياغة حملات إعلانية، وقراءة سلوك المستهلك' },
  hotel:       { name: 'إدارة الضيافة والفنادق والسياحة',      field: 'الأعمال', desc: 'تشغيل الفنادق والمنتجعات السياحية والمطاعم وإدارة تجربة الضيف' },
  law:         { name: 'القانون والعلوم السياسية',              field: 'القانون والمجتمع', desc: 'التقاضي، صياغة الأنظمة، والدبلوماسية والسياسات العامة' },
  criminology: { name: 'العلوم الجنائية والتحقيق الجنائي',     field: 'القانون والمجتمع', desc: 'تحليل أدلة الجرائم، الطب الشرعي، وإجراءات التحقيق الجنائي والأمني' },
  social:      { name: 'علم النفس والخدمة الاجتماعية',         field: 'القانون والمجتمع', desc: 'فهم السلوك الإنساني وتقديم الدعم النفسي والاجتماعي' },
  sociology:   { name: 'علم الاجتماع والدراسات الإنسانية',     field: 'القانون والمجتمع', desc: 'دراسة المجتمعات والثقافات والظواهر الاجتماعية وتأثيرها على الأفراد' },
  media:       { name: 'الإعلام والصحافة والعلاقات العامة',    field: 'الإعلام والفنون', desc: 'صناعة المحتوى الإعلامي، الصحافة الاستقصائية، وإدارة السمعة' },
  arts:        { name: 'الأدب والترجمة واللغويات',             field: 'الإعلام والفنون', desc: 'الكتابة الإبداعية، الترجمة بين اللغات، والبحث في اللسانيات' },
  design:      { name: 'التصميم الجرافيكي وتجربة المستخدم',    field: 'الإعلام والفنون', desc: 'تصميم الهوية البصرية، واجهات التطبيقات، وتجربة المستخدم الرقمية' },
  film:        { name: 'الإنتاج الإعلامي والسينما والمونتاج',  field: 'الإعلام والفنون', desc: 'إنتاج الأفلام والمحتوى المرئي، الإخراج، والمونتاج السينمائي والرقمي' },
  culinary:    { name: 'فنون الطهي وإدارة المطاعم',            field: 'الإعلام والفنون', desc: 'تعلم فنون الطبخ الاحترافي، إدارة المطابخ، وتصميم قوائم الطعام وتجربة الضيف' },
  science:     { name: 'العلوم التطبيقية والبحث العلمي',       field: 'العلوم البحثية', desc: 'الكيمياء، الفيزياء، علم الأحياء، والبحث في المختبرات' },
  biotech:     { name: 'التقنية الحيوية والجينوم',             field: 'العلوم البحثية', desc: 'الهندسة الوراثية، تطوير اللقاحات، وعلم الجينوم وتطبيقاته الطبية والزراعية' },
  space:       { name: 'هندسة الفضاء والطيران',                field: 'العلوم البحثية', desc: 'تصميم الصواريخ والأقمار الاصطناعية والمركبات الجوية وأنظمة الملاحة' },
  education:   { name: 'التربية وعلوم التعليم',                field: 'التربية والتعليم', desc: 'تصميم المناهج الدراسية وأساليب التدريس وتطوير بيئات التعلم' },
  security:    { name: 'الأمن الوطني والعلوم الأمنية',         field: 'الأمن والدفاع', desc: 'إدارة الأزمات الأمنية، الاستخبارات، وحماية المنشآت الحيوية' },
  agriculture: { name: 'الهندسة الزراعية وعلوم البيئة',       field: 'الزراعة والبيئة', desc: 'تطوير الإنتاج الزراعي، إدارة الموارد الطبيعية، والزراعة الذكية' },
};

// مصفوفة الأسئلة الـ 20 كاملة
const QUESTIONS_DATA = [
  { text: "ما الذي يشدّك أكثر عند التفكير بمستقبلك المهني؟", options: [{ label: "بناء برامج وتطبيقات تكنولوجية.", traits: { cs_soft: 3, cs_ai: 2, cs_cyber: 1 } }, { label: "مساعدة الناس والعمل معهم مباشرة.", traits: { medicine: 2, nursing: 3, social: 3, education: 2 } }, { label: "تصميم مشاريع هندسية وبناء أشياء ملموسة.", traits: { eng_civil: 3, eng_mech: 3, eng_arch: 2 } }, { label: "تحليل البيانات والأرقام واتخاذ قرارات ذكية.", traits: { economics: 3, cs_ai: 3, science: 2 } }] },
  { text: "عندما تقرأ عن نجاح مشروع تجاري ضخم ومشهور (مثل سلسلة مطاعم أو فنادق عالمية)، ما الذي يشغل تفكيرك؟", options: [{ label: "هندسة الغذاء المتبعة، ومعايير الجودة الصارمة للمكونات، وفنون الطهي الاحترافية التي تميزهم.", traits: { eng_food: 3, culinary: 3, nutrition: 1 } }, { label: "آلية إدارة الضيافة، وتدريب الموظفين على التعامل مع الضيوف، وتشغيل الفنادق والمرافق الفاخرة.", traits: { hotel: 3, business: 3 } }, { label: "الخوارزميات البرمجية التي تدير نظام الطلبات الضخم، وتحليل بيانات العملاء للتنبؤ بسلوكهم.", traits: { cs_ai: 3, cs_soft: 2 } }, { label: "العقود القانونية الحصرية للفرنشايز، وحماية حقوق الملكية الفكرية والسياسات العامة للشركة.", traits: { law: 3, marketing: 2 } }] },
  { text: "في مشروع جماعي، ما الدور الذي تختاره طوعاً؟", options: [{ label: "جمع البيانات وتحليلها وإعداد الإحصائيات.", traits: { science: 3, cs_ai: 3, economics: 2 } }, { label: "تصميم العروض التقديمية والواجهات البصرية.", traits: { design: 3, film: 2, marketing: 2 } }, { label: "التحدث أمام الجمهور وإقناع الآخرين بالأفكار.", traits: { law: 3, media: 3, marketing: 2 } }, { label: "كتابة التقرير والمحتوى بدقة واحترافية.", traits: { arts: 3, education: 2, media: 2 } }] },
  { text: "عند دخول مبنى كبير ومتطور لأول مرة، ما الذي يثير اهتمامك الفعلي؟", options: [{ label: "الهيكل المعماري الفني، وتوزيع المساحات والإضاءة الطبيعية بالفراغ.", traits: { eng_arch: 3, eng_civil: 2 } }, { label: "مدى فاعلية الأنظمة الميكانيكية الذكية ولوحات التحكم والسلالم الكهربائية.", traits: { eng_mech: 3, cs_hw: 2 } }, { label: "مستوى الأمان والتحقق من الهويات، وتوافر غرف المراقبة ومخارج الطوارئ.", traits: { security: 3, cs_cyber: 2, criminology: 1 } }, { label: "النشاط التجاري الداخلي، هوية المحلات، وحجم الفرص الاقتصادية بالمكان.", traits: { business: 3, marketing: 2, economics: 2 } }] },
  { text: "أي بيئة عمل تناسبك أكثر؟", options: [{ label: "مختبر أو مكان بحثي هادئ ومنظم.", traits: { science: 3, biotech: 3, med_lab: 2, pharmacy: 2 } }, { label: "موقع ميداني فيه حركة ونشاط مستمر.", traits: { eng_civil: 3, agriculture: 2, eng_environ: 2, security: 2 } }, { label: "مكتب فيه فريق وتواصل مع عملاء.", traits: { business: 3, marketing: 3, hotel: 2, media: 2 } }, { label: "استوديو إبداعي أصمم وأنتج فيه محتوى بصري وفني.", traits: { design: 3, film: 3, arts: 3, media: 2 } }] },
  { text: "لو دخلت معرض علمي وتقني كبير، وش أول جناح تروح له؟", options: [{ label: "جناح الروبوتات والطابعات ثلاثية الأبعاد والأجهزة الذكية.", traits: { eng_mech: 3, cs_hw: 3, eng_elec: 2 } }, { label: "جناح الفضاء والصواريخ والأقمار الاصطناعية.", traits: { space: 3, science: 2, eng_mech: 2 } }, { label: "جناح الطب والعمليات الجراحية والمجسمات التشريحية.", traits: { medicine: 3, dentistry: 2, nursing: 2, biotech: 2 } }, { label: "جناح الواقع الافتراضي والأفلام والتجارب التفاعلية.", traits: { film: 3, design: 3, cs_soft: 2 } }] },
  { text: "أي نوع من المواد الدراسية كان يستهويك في المدرسة؟", options: [{ label: "الرياضيات والفيزياء والعلوم التجريبية.", traits: { science: 3, eng_mech: 2, cs_ai: 2, space: 2 } }, { label: "الأحياء والكيمياء والعلوم الصحية.", traits: { medicine: 3, biotech: 3, pharmacy: 2, nutrition: 2 } }, { label: "اللغة العربية والتاريخ والعلوم الاجتماعية.", traits: { arts: 3, sociology: 3, law: 2, education: 2 } }, { label: "الحاسوب وتقنية المعلومات.", traits: { cs_soft: 3, cs_ai: 3, cs_cyber: 2, cs_hw: 2 } }] },
  { text: "لو عرضوا عليك وظيفة مجانية ليوم واحد، وش تختار؟", options: [{ label: "طبيب في غرفة طوارئ أو صيدلي يشرف على الأدوية.", traits: { medicine: 3, pharmacy: 2, nursing: 2, dentistry: 2 } }, { label: "مهندس في موقع بناء جسر أو ناطحة سحاب.", traits: { eng_civil: 3, eng_mech: 2, eng_arch: 2 } }, { label: "محقق جنائي يحلل أدلة في قضية غامضة.", traits: { criminology: 3, law: 3, security: 2 } }, { label: "شيف في مطعم فاخر يبتكر أطباق جديدة.", traits: { culinary: 3, hotel: 2, eng_food: 2, nutrition: 2 } }] },
  { text: "أي من هذه القيم تأتي في مقدمة أولوياتك المهنية؟", options: [{ label: "الابتكار وتقديم شيء جديد للعالم.", traits: { cs_ai: 3, biotech: 3, design: 2, space: 2 } }, { label: "العدالة وحماية حقوق الناس.", traits: { law: 3, criminology: 3, security: 2, social: 2 } }, { label: "النجاح المالي وبناء مشاريع ناجحة.", traits: { business: 3, economics: 3, marketing: 2 } }, { label: "خدمة المجتمع والمساهمة في الصحة والرعاية.", traits: { medicine: 3, nursing: 3, nutrition: 2, pharmacy: 2 } }] },
  { text: "لو أتيح لك الاطلاع على كواليس مكان لمرة واحدة، ماذا تختار؟", options: [{ label: "وكالة فضاء لرؤية هندسة الصواريخ.", traits: { space: 3, eng_mech: 2, science: 2 } }, { label: "محكمة كبرى لمتابعة المرافعات وصنع القرار.", traits: { law: 3, criminology: 2, security: 2 } }, { label: "استوديو سينمائي لرؤية المونتاج والإنتاج.", traits: { film: 3, design: 2, arts: 2 } }, { label: "غرفة عمليات أو مختبر طبي.", traits: { medicine: 3, med_lab: 3, pharmacy: 2 } }] },
  { text: "أي نوع من الشغل تقدر تصبر عليه ساعات طويلة بدون ملل؟", options: [{ label: "البحث والقراءة والتعمق في موضوع علمي أو طبي.", traits: { science: 3, medicine: 2, biotech: 3, pharmacy: 2 } }, { label: "كتابة أكواد أو إصلاح مشاكل تقنية في نظام.", traits: { cs_soft: 3, cs_cyber: 3, cs_hw: 2 } }, { label: "رسم أو تصميم أو تحرير محتوى مرئي.", traits: { design: 3, film: 3, arts: 2, eng_arch: 2 } }, { label: "التفاوض والتنسيق والتواصل مع أشخاص مختلفين.", traits: { business: 3, marketing: 2, law: 2, hotel: 3 } }] },
  { text: "لو قريت خبر عن اختراع جديد غيّر العالم، وش أول شي يخطر ببالك؟", options: [{ label: "كيف يشتغل تقنياً؟ وش البرمجة أو الهندسة وراه؟", traits: { cs_soft: 3, eng_elec: 2, cs_hw: 2, eng_mech: 2 } }, { label: "كيف ممكن يستفيد منه المرضى أو يحسن صحة الناس Ley.", traits: { medicine: 3, pharmacy: 2, nursing: 2, nutrition: 2 } }, { label: "كيف ممكن أستثمر فيه أو أبني مشروع حوله؟", traits: { business: 3, economics: 3, marketing: 2 } }, { label: "كيف بيأثر على المجتمع والقوانين والسياسات؟", traits: { law: 3, sociology: 3, social: 2, media: 2 } }] },
  { text: "عندما تتابع منصات المحتوى (يوتيوب، بودكاست، وثائقيات)، ما نوع المحتوى الذي يشدك تلقائياً؟", options: [{ label: "شروحات تقنية وبرمجية وأدوات رقمية.", traits: { cs_soft: 3, cs_ai: 3, cs_cyber: 2 } }, { label: "مطاعم وسياحة وفنون طهي وضيافة.", traits: { culinary: 3, hotel: 3, business: 2 } }, { label: "تحليل أفلام وسينما وقصص أدبية.", traits: { film: 3, arts: 3, media: 2 } }, { label: "وثائقيات علمية وأخبار اكتشافات طبية وبيئية.", traits: { science: 3, medicine: 2, eng_environ: 2, biotech: 2 } }] },
  { text: "لو كنت مسؤول عن مشروع غذاء وصحة، ما دورك المفضل؟", options: [{ label: "تصميم خطوط إنتاج وضمان جودة الغذاء هندسياً.", traits: { eng_food: 3, eng_chem: 2, agriculture: 2 } }, { label: "وضع خطط تغذية علاجية للمرضى.", traits: { nutrition: 3, medicine: 2, pharmacy: 2 } }, { label: "تطوير تقنيات زراعية جديدة لزيادة الإنتاج.", traits: { agriculture: 3, biotech: 2, eng_environ: 2 } }, { label: "الترويج للمنتج وإدارة العلامة التجارية.", traits: { marketing: 3, business: 3, hotel: 2 } }] },
  { text: "إذا أردت تعلم مهارة جديدة، وش أفضل طريقة بالنسبة لك؟", options: [{ label: "أقرأ كتب ومراجع وأفهم النظرية بالتفصيل أولاً.", traits: { science: 3, law: 2, economics: 2, arts: 2 } }, { label: "أجرب بيدي مباشرة وأتعلم من الأخطاء.", traits: { eng_mech: 3, cs_soft: 3, culinary: 2, cs_hw: 2 } }, { label: "أشاهد شخص محترف يسويها وأقلده.", traits: { medicine: 2, dentistry: 3, film: 2, design: 2 } }, { label: "أنضم لمجموعة وأتعلم مع ناس عندهم نفس الاهتمام.", traits: { education: 3, social: 3, sociology: 2, hotel: 2 } }] },
  { text: "أي من هذه المشاريع يثير اهتمامك أكثر؟", options: [{ label: "تطوير دواء أو علاج مبتكر لمرض معين.", traits: { pharmacy: 3, biotech: 3, medicine: 2, science: 2 } }, { label: "بناء تطبيق يحل مشكلة حقيقية للناس.", traits: { cs_soft: 3, design: 2, cs_ai: 2 } }, { label: "تصميم مبنى عصري يجمع بين الجمال والوظيفية.", traits: { eng_arch: 3, design: 2, eng_civil: 2 } }, { label: "إنشاء حملة إعلامية تغيّر صورة علامة تجارية.", traits: { marketing: 3, media: 3, design: 2 } }] },
  { text: "لو قدرت تمتلك قدرة خارقة واحدة تساعدك في حياتك المهنية، وش تختار؟", options: [{ label: "قراءة أي لغة برمجة أو معادلة علمية وفهمها فوراً.", traits: { cs_soft: 3, cs_ai: 3, science: 2, eng_elec: 2 } }, { label: "معرفة ما يشعر به أي شخص واحتياجاته الحقيقية.", traits: { social: 3, nursing: 3, education: 2, sociology: 2 } }, { label: "تحويل أي فكرة في ذهني إلى تصميم أو نموذج ثلاثي الأبعاد.", traits: { eng_arch: 3, design: 3, eng_mech: 2, film: 2 } }, { label: "التنبؤ باتجاهات السوق والاقتصاد قبل حدوثها.", traits: { economics: 3, business: 3, marketing: 2 } }] },
  { text: "لو شاركت in حل مشكلة بيئية، كيف تساهم؟", options: [{ label: "تطوير حلول زراعية وتقنيات ري ذكية.", traits: { agriculture: 3, eng_food: 2, eng_environ: 2 } }, { label: "تصميم شبكات طاقة نظيفة ومعالجة مياه.", traits: { eng_civil: 3, eng_elec: 3, eng_environ: 2 } }, { label: "إجراء أبحاث علمية لفهم أسباب المشكلة.", traits: { science: 3, biotech: 3, agriculture: 2 } }, { label: "إطلاق حملات توعوية وتثقيف المجتمع.", traits: { media: 3, education: 3, sociology: 2 } }] },
  { text: "وش الشي الي الناس دايم يمدحونك فيه أو يطلبون مساعدتك فيه؟", options: [{ label: "إصلاح الأجهزة أو حل مشاكل الكمبيوتر والتقنية.", traits: { cs_soft: 3, cs_hw: 3, eng_elec: 2, cs_cyber: 2 } }, { label: "الاستماع لمشاكلهم وتقديم نصائح أو دعم نفسي.", traits: { social: 3, nursing: 2, education: 2, sociology: 2 } }, { label: "تصميم أو تنسيق أشياء بشكل جميل ومنظم.", traits: { design: 3, eng_arch: 2, arts: 2, film: 2 } }, { label: "شرح الأشياء المعقدة بطريقة بسيطة ومفهومة.", traits: { education: 3, media: 2, science: 2, medicine: 2 } }] },
  { text: "إذا كان لديك مبلغ تريد استثماره في مشروع تشعر انك ستبدع فيه، وش تختار؟", options: [{ label: "مشروع تقني مثل تطبيق أو منصة رقمية.", traits: { cs_soft: 3, cs_ai: 2, business: 2 } }, { label: "عيادة طبية أو صيدلية أو مركز صحي.", traits: { medicine: 2, pharmacy: 3, dentistry: 2, nutrition: 2 } }, { label: "مطعم فاخر أو فندق أو مشروع سياحي.", traits: { culinary: 3, hotel: 3, business: 2 } }, { label: "شركة إنتاج إعلامي أو استوديو تصميم.", traits: { film: 3, media: 3, design: 2, marketing: 2 } }] }
];

const rankEmojis = ['🥇','🥈','🥉','4️⃣','5️⃣'];

function Quiz() {
  const [screen, setScreen] = useState('intro'); // intro, quiz, results
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({}); // { 0: Set([1, 2]) }
  const [calculatedResults, setCalculatedResults] = useState([]);

  const toArabicNum = (n) => {
    const map = {'0':'٠','1':'١','2':'٢','3':'٣','4':'٤','5':'٥','6':'٦','7':'٧','8':'٨','9':'٩'};
    return String(n).replace(/[0-9]/g, c => map[c]);
  };

  const startQuiz = () => {
    setAnswers({});
    setCurrentQ(0);
    setScreen('quiz');
  };

  const toggleOption = (optIndex) => {
    const currentSelected = new Set(answers[currentQ] || []);
    if (currentSelected.has(optIndex)) {
      currentSelected.delete(optIndex);
    } else if (currentSelected.size < 2) {
      currentSelected.add(optIndex);
    }
    setAnswers({ ...answers, [currentQ]: currentSelected });
  };

  const nextQuestion = () => {
    const selected = answers[currentQ] || new Set();
    if (selected.size === 0) return;

    if (currentQ < QUESTIONS_DATA.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      processResults();
    }
  };

  const prevQuestion = () => {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  };

  // معادلة عمرو الرياضية العادلة الحسابية الصافية المترجمة بالكامل
  const processResults = () => {
    const scores = {};
    const maxPerMajor = {};

    Object.keys(MAJORS_DATA).forEach(k => { scores[k] = 0; maxPerMajor[k] = 0; });

    // 1. حساب النقاط
    QUESTIONS_DATA.forEach((q, qi) => {
      const sel = answers[qi];
      if (!sel || sel.size === 0) return;
      const weight = sel.size === 1 ? 1.0 : 0.65;
      sel.forEach(ai => {
        Object.entries(q.options[ai].traits).forEach(([k, v]) => {
          if (scores[k] !== undefined) scores[k] += v * weight;
        });
      });
    });

    // 2. حساب السقف الأعلى
    QUESTIONS_DATA.forEach(q => {
      const bestForThisQuestion = {};
      q.options.forEach(opt => {
        Object.entries(opt.traits).forEach(([k, v]) => {
          if (v > 0) {
            if (bestForThisQuestion[k] === undefined || v > bestForThisQuestion[k]) {
              bestForThisQuestion[k] = v;
            }
          }
        });
      });
      Object.entries(bestForThisQuestion).forEach(([k, v]) => {
        if (maxPerMajor[k] !== undefined) maxPerMajor[k] += v;
      });
    });

    // 3. النسبة المئوية الصافية العادلة
    const pcts = {};
    Object.keys(scores).forEach(k => {
      if (maxPerMajor[k] > 0 && scores[k] > 0) {
        pcts[k] = Math.min(100, Math.round((scores[k] / maxPerMajor[k]) * 100));
      } else {
        pcts[k] = 0;
      }
    });

    const finalSorted = Object.entries(pcts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, pct]) => ({ key, pct }));

    setCalculatedResults(finalSorted);
    setScreen('results');
  };

  const currentSelected = answers[currentQ] || new Set();
  const progressPct = (currentQ / QUESTIONS_DATA.length) * 100;

  return (
    <main style={{ maxWidth: '820px', margin: '0 auto', padding: '2.5rem 1.25rem 4rem' }}>
      
      {/* 1. شاشة البداية */}
      {screen === 'intro' && (
        <div className="intro-screen">
          <span className="intro-icon">🧭</span>
          <h1>اكتشف تخصصك المثالي بعمق</h1>
          <p>
            عشرون سؤالاً نفسياً وعملياً متطوراً — لا تقيس فقط ما تحبه، بل كيف تفكر تحت الضغط، وكيف تتخذ القرارات، وما الذي يجذب انتباهك. 
            يمكنك اختيار إجابة أو إجابتين تعكسان طبيعتك الحقيقية.
          </p>
          <div className="intro-features">
            <div className="intro-feature">⏱️ سبع دقائق تقريباً</div>
            <div className="intro-feature">🧠 أبعاد نفسية وعلمية</div>
            <div className="intro-feature">☑️ اختر حتى إجابتين</div>
            <div className="intro-feature">📊 تحليل منطقي متوازن</div>
            <div className="intro-feature">🎓 أكثر من ٣٥ تخصصاً</div>
          </div>
          <button className="btn-primary" onClick={startQuiz}>ابدأ الاختبار</button>
        </div>
      )}

      {/* 2. شاشة الكويز */}
      {screen === 'quiz' && (
        <div className="quiz-screen">
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }}></div>
          </div>
          <div className="progress-label">السؤال {toArabicNum(currentQ + 1)} من {toArabicNum(QUESTIONS_DATA.length)}</div>
          
          <div className="question-card">
            <div className="q-step">السؤال {toArabicNum(currentQ + 1)} من {toArabicNum(QUESTIONS_DATA.length)}</div>
            <div className="q-text">{QUESTIONS_DATA[currentQ].text}</div>
            <div className="q-hint">يمكنك اختيار إجابة أو إجابتين إن كانتا تنطبقان عليك بالقدر ذاته</div>
            
            <div className="options-list">
              {QUESTIONS_DATA[currentQ].options.map((opt, i) => {
                const isSelected = currentSelected.has(i);
                const maxReached = currentSelected.size >= 2;
                return (
                  <button 
                    key={i}
                    className={`option-btn ${isSelected ? 'selected' : ''} ${maxReached && !isSelected ? 'dimmed' : ''}`}
                    onClick={() => toggleOption(i)}
                  >
                    <span className="check-box"></span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="quiz-nav">
            <button className="btn-secondary" style={{ visibility: currentQ === 0 ? 'hidden' : 'visible' }} onClick={prevQuestion}>السابق</button>
            <button className="btn-primary" disabled={currentSelected.size === 0} onClick={nextQuestion}>
              {currentQ === QUESTIONS_DATA.length - 1 ? 'عرض النتائج' : 'التالي'}
            </button>
          </div>
        </div>
      )}

      {/* 3. شاشة النتائج المتوافقة الصافية */}
      {screen === 'results' && (
        <div className="results-screen">
          <div className="results-header">
            <span className="trophy">🏆</span>
            <h2>نتائجك جاهزة!</h2>
            <p>بناءً على تحليلك السلوكي الشامل، هذه التخصصات الأنسب لطريقتك في التفكير:</p>
          </div>

          <div className="majors-list">
            {calculatedResults.map(({ key, pct }, i) => {
              const major = MAJORS_DATA[key];
              return (
                <div key={key} className={`major-card ${i === 0 ? 'top-pick' : ''}`}>
                  <div className="major-rank">{rankEmojis[i]}</div>
                  <div className="major-info">
                    <div className="major-field">{major.field}</div>
                    <div className="major-name">{major.name}</div>
                    <div className="major-desc">{major.desc}</div>
                    
                    <div style={{ marginTop: '0.6rem', marginBottom: '0.2rem' }}>
                      <Link 
                        to={`/major#${key}`} 
                        className="inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-[#ff4500] bg-[#ff4500]/[0.08] hover:bg-[#ff4500]/[0.15] border border-[#ff4500]/20 px-3 py-1.5 rounded-lg transition-all duration-200"
                      >
                        تفاصيل التخصص
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 17l9.2-9.2M17 17V7H7"/>
                        </svg>
                      </Link>
                    </div>

                    <div className="pct-bar-wrap">
                      <div className="pct-bar-fill" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                  <div className="major-pct-wrap">
                    <span className="major-pct">{pct}%</span>
                    <span className="major-pct-label">توافق</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="results-actions">
            <button className="btn-primary" onClick={() => alert('سيتم الربط مع صفحة المنح الشاملة لاحقاً')}>استعرض المنح المتاحة</button>
            <button className="btn-secondary" onClick={() => setScreen('intro')}>أعد الاختبار</button>
          </div>
        </div>
      )}
    </main>
  );
}

export default Quiz;