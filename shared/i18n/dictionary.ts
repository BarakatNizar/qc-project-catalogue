// export type Locale = "en" | "ar";

// const dictionary = {
//   en: {
//     overview: "Overview", supervisors: "Supervisors", aiService: "AI service", projects: "Projects", students: "Students",
//     exploreProjects: "Explore projects", myProfile: "My profile", signIn: "Sign in", signOut: "Sign out",
//     subtitle: "ACADEMIC PROJECT DISCOVERY", adminWorkspace: "Administration", supervisorWorkspace: "Supervisor workspace",
//     footer: "Qalamoon Compass · Academic project discovery", explore: "Explore", welcome: "Welcome back",

//     // Homepage specific translations
//     compassSubtitle: "Your academic project compass",
//     heroTitleFirst: "Good projects begin with",
//     heroTitleHighlight: "clear direction.",
//     heroDesc: "A curated space to explore graduation and semester project ideas, understand how they are scoped, and uncover thoughtful ways to take them further.",
//     exploreProjectIdeas: "Explore project ideas",
//     staffStudentSignIn: "Staff and student sign in",
//     curatedBriefs: "Curated academic briefs",
//     aiInspiration: "Context-aware AI inspiration",
//     briefPreview: "Project brief preview",
//     campusConnect: "Campus Connect",
//     graduation: "Graduation",
//     campusConnectDesc: "A unified platform that helps students discover campus resources, activities, and academic support from one place.",
//     inScope: "In scope",
//     resourceSearch: "Resource search",
//     eventCalendar: "Event calendar",
//     studentDashboard: "Student dashboard",
//     featureInspiration: "Feature inspiration",
//     featureInspirationDesc: "Suggest meaningful enhancements based on project scope, technologies, and ideas already shared.",
//     illustrativePreview: "Illustrative preview",
//     structuredShared: "Structured · Searchable · Shared",
//     clearerStartingPoint: "A clearer starting point",
//     exploreIdeasContext: "Explore ideas with context, not guesswork.",
//     qcFocusDesc: "QC keeps the focus on project knowledge and practical inspiration — not assigning projects or tracking students' final choices.",
    
//     // Pillars
//     pillar1Title: "Structured project briefs",
//     pillar1Text: "Explore ideas through clear objectives, scope boundaries, proposed solutions, and technology choices.",
//     pillar2Title: "Discover what exists",
//     pillar2Text: "Search the catalogue and learn from projects already documented by your academic community.",
//     pillar3Title: "Thoughtful feature inspiration",
//     pillar3Text: "Request practical new feature ideas grounded in a project's context, technologies, and existing suggestions.",

//     // Bottom Banner
//     startExploring: "Start exploring",
//     findNextDirection: "Find your next project direction.",
//     bannerDesc: "Browse visible project briefs and use them as a launch point for your own academic thinking.",
//     openCatalogue: "Open project catalogue",
//   },
//   ar: {
//     overview: "نظرة عامة", supervisors: "المشرفون", aiService: "خدمة الذكاء الاصطناعي", projects: "المشاريع", students: "الطلاب",
//     exploreProjects: "استكشاف المشاريع", myProfile: "ملفي الشخصي", signIn: "تسجيل الدخول", signOut: "تسجيل الخروج",
//     subtitle: "اكتشاف المشاريع الأكاديمية", adminWorkspace: "الإدارة", supervisorWorkspace: "مساحة المشرف",
//     footer: "بوصلة قلمون · اكتشاف المشاريع الأكاديمية", explore: "استكشاف", welcome: "مرحباً بعودتك",

//     // Homepage specific translations
//     compassSubtitle: "بوصلة مشاريعك الأكاديمية",
//     heroTitleFirst: "الأفكار الجيدة تبدأ بـ",
//     heroTitleHighlight: "استلهام ذكي.",
//     heroDesc: "مساحة منسقة لاستكشاف أفكار مشاريع التخرج والفصلية الأكاديمية، وفهم نطاقها، واستلهام فكرة جديدة أو اكتشاف طرق لتطويرها..",
//     exploreProjectIdeas: "استكشاف أفكار المشاريع",
//     staffStudentSignIn: "تسجيل دخول الهيئة التدريسية والطلاب",
//     curatedBriefs: "ملخصات أكاديمية منسقة",
//     aiInspiration: "إلهام الذكاء الاصطناعي المدرك للسياق",
//     briefPreview: "معاينة ملخص المشروع",
//     campusConnect: "تواصل الحرم الجامعي",
//     graduation: "مشروع تخرج",
//     campusConnectDesc: "منصة موحدة تساعد الطلاب في اكتشاف موارد الحرم الجامعي والأنشطة والدعم الأكاديمي من مكان واحد.",
//     inScope: "ضمن النطاق",
//     resourceSearch: "بحث الموارد مع فهرسة",
//     eventCalendar: " تقويم الفعاليات مع تنبيه",
//     studentDashboard: "لوحة تحكم الطالب",
//     featureInspiration: "إلهام الميزات",
//     featureInspirationDesc: "اقتراح تحسينات هادفة بناءً على نطاق المشروع والتقنيات والأفكار المشتركة مسبقاً.",
//     illustrativePreview: "معاينة توضيحية",
//     structuredShared: "منظم · سهل البحث · تعاوني",
//     clearerStartingPoint: "نقطة انطلاق أوضح",
//     exploreIdeasContext: "استكشف الأفكار بسياق واضح، لا بالتخمين.",
//     qcFocusDesc: "تحافظ بوصلة قلمون على التركيز على معرفة المشاريع الموجودة لتحسينها او دمج عدة افكار لتحصيل مشروع مُبتَكر مُستلهم - وليس عصف ذهني او انتقاء عشوائي للمشاريع.",

//     // Pillars
//     pillar1Title: "ملخصات مشاريع منظمة",
//     pillar1Text: "استكشاف الأفكار من خلال أهداف واضحة، حدود النطاق، الحلول المقترحة، والخيارات التقنية.",
//     pillar2Title: "اكتشف ما هو موجود",
//     pillar2Text: "ابحث في الكتالوج وتعلّم من المشاريع الموثقة مسبقاً من قبل مجتمعك الأكاديمي.",
//     pillar3Title: "AI إلهام الميزات المدروسة",
//     pillar3Text: "اطلب أفكار ميزات جديدة وعملية مبنية على سياق المشروع وتقنياته والاقتراحات الحالية.",

//     // Bottom Banner
//     startExploring: "ابدأ الاستكشاف",
//     findNextDirection: "اعثر على اتجاه مشروعك القادم.",
//     bannerDesc: "تصفح ملخصات المشاريع الظاهرة واستخدمها نقطة انطلاق لتفكيرك الأكاديمي.",
//     openCatalogue: "افتح كتالوج المشاريع",
//   },
// } satisfies Record<Locale, Record<string, string>>;

// export function t(locale: Locale, key: keyof typeof dictionary.en) {
//   return dictionary[locale][key];
// }




// export type Locale = "en" | "ar";

// const dictionary = {
//   en: {
//     overview: "Overview", supervisors: "Supervisors", aiService: "AI service", projects: "Projects", students: "Students",
//     exploreProjects: "Explore projects", myProfile: "My profile", signIn: "Sign in", signOut: "Sign out",
//     subtitle: "ACADEMIC PROJECT DISCOVERY", adminWorkspace: "Administration", supervisorWorkspace: "Supervisor workspace",
//     footer: "Qalamoon Compass · Academic project discovery", explore: "Explore", welcome: "Welcome back",

//     // Homepage Redesign Translations
//     heroBadge: "✨ Your Academic Project Compass",
//     heroTitleStart: "Shape your academic journey with",
//     heroTitleHighlight: "clarity & direction.",
//     heroDesc: "Discover graduation and semester project briefs, understand real-world scope boundaries, and unlock intelligent AI-powered feature inspiration.",
//     exploreProjectIdeas: "Explore project ideas",
//     staffStudentSignIn: "Staff & student sign in",
//     curatedBriefs: "Curated academic briefs",
//     aiInspiration: "Context-aware AI inspiration",
    
//     // Preview Card
//     briefPreview: "Featured Brief Preview",
//     campusConnect: "Campus Connect Platform",
//     graduation: "Graduation Project",
//     campusConnectDesc: "A unified ecosystem helping students discover campus resources, events, and academic guidance seamlessly.",
//     inScope: "Core Scope",
//     resourceSearch: "Resource search",
//     eventCalendar: "Event calendar",
//     studentDashboard: "Student dashboard",
//     featureInspiration: "Feature Inspiration",
//     featureInspirationDesc: "AI suggests high-value enhancements based on existing project scope and technical stack.",
//     verifiedBrief: "Verified Academic Standard",

//     // Pillars Section
//     sectionEyebrow: "Built for Excellence",
//     sectionTitle: "Explore ideas with context, not guesswork.",
//     sectionDesc: "Qalamoon Compass focuses strictly on project knowledge, clarity, and practical inspiration to empower your academic planning.",
    
//     pillar1Title: "Structured project briefs",
//     pillar1Text: "Explore concepts through defined objectives, clear boundaries, proposed solutions, and technology choices.",
//     pillar2Title: "Comprehensive discovery",
//     pillar2Text: "Search the official catalogue and learn from successfully documented projects across your academic community.",
//     pillar3Title: "Intelligent feature inspiration",
//     pillar3Text: "Generate practical new feature ideas grounded in your project's unique context and technical constraints.",

//     // Bottom Banner
//     bannerEyebrow: "Ready to begin?",
//     bannerTitle: "Find your next project direction today.",
//     bannerDesc: "Browse available academic project briefs and use them as a springboard for your own innovation.",
//     openCatalogue: "Open project catalogue",
//   },
//   ar: {
//     overview: "نظرة عامة", supervisors: "المشرفون", aiService: "خدمة الذكاء الاصطناعي", projects: "المشاريع", students: "الطلاب",
//     exploreProjects: "استكشاف المشاريع", myProfile: "ملفي الشخصي", signIn: "تسجيل الدخول", signOut: "تسجيل الخروج",
//     subtitle: "اكتشاف المشاريع الأكاديمية", adminWorkspace: "الإدارة", supervisorWorkspace: "مساحة المشرف",
//     footer: "بوصلة قلمون · اكتشاف المشاريع الأكاديمية", explore: "استكشاف", welcome: "مرحباً بعودتك",

//     // Homepage Redesign Translations
//     heroBadge: "✨ بوصلة مشاريعك الأكاديمية",
//     heroTitleStart: "اصنع مسيرتك الأكاديمية بـ",
//     heroTitleHighlight: "وضوح واتجاه دقيق.",
//     heroDesc: "استكشف ملخصات مشاريع التخرج والفصول الدراسية، وافهم حدود النطاق الواقعية، وافتح آفاقاً جديدة للإلهام المدعوم بالذكاء الاصطناعي.",
//     exploreProjectIdeas: "استكشاف أفكار المشاريع",
//     staffStudentSignIn: "تسجيل دخول الهيئة التدريسية والطلاب",
//     curatedBriefs: "ملخصات أكاديمية منسقة",
//     aiInspiration: "إلهام ذكي مدرك للسياق",
    
//     // Preview Card
//     briefPreview: "معاينة الملخص المميز",
//     campusConnect: "منصة تواصل الحرم الجامعي",
//     graduation: "مشروع تخرج",
//     campusConnectDesc: "نظام بيئي موحد يساعد الطلاب في اكتشاف موارد الحرم الجامعي والفعاليات والإرشاد الأكاديمي بسلاسة.",
//     inScope: "النطاق الأساسي",
//     resourceSearch: "بحث الموارد",
//     eventCalendar: "تقويم الفعاليات",
//     studentDashboard: "لوحة تحكم الطالب",
//     featureInspiration: "إلهام الميزات",
//     featureInspirationDesc: "يقترح الذكاء الاصطناعي تحسينات عالية القيمة بناءً على نطاق المشروع الحالي والمكدس التقني.",
//     verifiedBrief: "معيار أكاديمي معتمد",

//     // Pillars Section
//     sectionEyebrow: "مصمم لأجل التميز",
//     sectionTitle: "استكشف الأفكار بسياق دقيق لا بالتخمين.",
//     sectionDesc: "تركز بوصلة قلمون حصرياً على معرفة المشاريع، الوضوح، والإلهام العملي تمكيناً لتخطيطك الأكاديمي.",
    
//     pillar1Title: "ملخصات مشاريع منظمة",
//     pillar1Text: "استكشف الأفكار عبر أهداف محددة، حدود واضحة، حلول مقترحة، وخيارات تقنية مدروسة.",
//     pillar2Title: "اكتشاف شامل",
//     pillar2Text: "ابحث في الكتالوج الرسمي وتعلّم من المشاريع الموثقة بنجاح عبر مجتمعك الأكاديمي.",
//     pillar3Title: "إلهام ذكي للميزات",
//     pillar3Text: "ولد أفكار ميزات جديدة وعملية مبنية على السياق الفريد لمشروعك والقيود التقنية.",

//     // Bottom Banner
//     bannerEyebrow: "هل أنت مستعد للبدء؟",
//     bannerTitle: "اعثر على اتجاه مشروعك القادم اليوم.",
//     bannerDesc: "تصفح ملخصات المشاريع الأكاديمية المتاحة واستخدمها نقطة انطلاق لابتكار إبداعك الخاص.",
//     openCatalogue: "فتح كتالوج المشاريع",
//   },
// } satisfies Record<Locale, Record<string, string>>;

// export function t(locale: Locale, key: keyof typeof dictionary.en) {
//   return dictionary[locale][key];
// }
export type Locale = "en" | "ar";

const dictionary = {
  en: {
    overview: "Overview", supervisors: "Supervisors", aiService: "AI service", projects: "Projects", students: "Students",
    exploreProjects: "Explore projects", myProfile: "My profile", signIn: "Sign in", signOut: "Sign out",
    subtitle: "ACADEMIC PROJECT INPIRATION", adminWorkspace: "Administration", supervisorWorkspace: "Supervisor workspace",
    footer: "Qalamoon Compass · Academic project discovery", explore: "Explore", welcome: "Welcome back",

    // Homepage Redesign Translations
    heroBadge: "✨ Your Academic Project Compass",
    heroTitleStart: "Shape your academic journey with",
    heroTitleHighlight: "clarity & direction.",
    heroDesc: "Discover graduation and semester project briefs, understand real-world scope boundaries, and unlock intelligent AI-powered feature inspiration.",
    exploreProjectIdeas: "Explore project ideas",
    staffStudentSignIn: "Staff & student sign in",
    curatedBriefs: "Curated academic briefs",
    aiInspiration: "Context-aware AI inspiration",
    
    // Preview Card
    briefPreview: "Featured Brief Preview",
    campusConnect: "Campus Connect Platform",
    graduation: "Graduation Project",
    campusConnectDesc: "A unified ecosystem helping students discover campus resources, events, and academic guidance seamlessly.",
    inScope: "Core Scope",
    resourceSearch: "Resource search",
    eventCalendar: "Event calendar",
    studentDashboard: "Student dashboard",
    featureInspiration: "Feature Inspiration",
    featureInspirationDesc: "AI suggests high-value enhancements based on existing project scope and technical stack.",
    verifiedBrief: "Verified Academic Standard",

    // Pillars Section
    sectionEyebrow: "Built for Excellence",
    sectionTitle: "Explore ideas with context, not guesswork.",
    sectionDesc: "Qalamoon Compass focuses strictly on project knowledge, clarity, and practical inspiration to empower your academic planning.",
    
    pillar1Title: "Structured project briefs",
    pillar1Text: "Explore concepts through defined objectives, clear boundaries, proposed solutions, and technology choices.",
    pillar2Title: "Comprehensive discovery",
    pillar2Text: "Search the official catalogue and learn from successfully documented projects across your academic community.",
    pillar3Title: "Intelligent feature inspiration",
    pillar3Text: "Generate practical new feature ideas grounded in your project's unique context and technical constraints.",

    // Bottom Banner
    bannerEyebrow: "Ready to begin?",
    bannerTitle: "Find your next project direction today.",
    bannerDesc: "Browse available academic project briefs and use them as a springboard for your own innovation.",
    openCatalogue: "Open project catalogue",
  },
  ar: {
    overview: "نظرة عامة", supervisors: "المشرفون", aiService: "خدمة الذكاء الاصطناعي", projects: "المشاريع", students: "الطلاب",
    exploreProjects: "استكشاف المشاريع", myProfile: "ملفي الشخصي", signIn: "تسجيل الدخول", signOut: "تسجيل الخروج",
    subtitle: "استلهام المشاريع الأكاديمية", adminWorkspace: "الإدارة", supervisorWorkspace: "مساحة المشرف",
    footer: "بوصلة قلمون · اكتشاف المشاريع الأكاديمية", explore: "استكشاف", welcome: "مرحباً بعودتك",

    // Homepage Redesign Translations
    heroBadge: "✨ بوصلة مشاريعك الأكاديمية",
    heroTitleStart: "اصنع مسيرتك الأكاديمية بـ",
    heroTitleHighlight: "وضوح واتجاه دقيق.",
    heroDesc: "استكشف ملخصات مشاريع التخرج والفصول الدراسية، وافهم حدود النطاق الواقعية، وافتح آفاقاً جديدة للإلهام المدعوم بالذكاء الاصطناعي.",
    exploreProjectIdeas: "استكشاف أفكار المشاريع",
    staffStudentSignIn: "تسجيل دخول الهيئة التدريسية والطلاب",
    curatedBriefs: "ملخصات أكاديمية منسقة",
    aiInspiration: "إلهام ذكي مدرك للسياق",
    
    // Preview Card
    briefPreview: "معاينة الملخص المميز",
    campusConnect: "منصة تواصل الحرم الجامعي",
    graduation: "مشروع تخرج",
    campusConnectDesc: "نظام بيئي موحد يساعد الطلاب في اكتشاف موارد الحرم الجامعي والفعاليات والإرشاد الأكاديمي بسلاسة.",
    inScope: "النطاق الأساسي",
    resourceSearch: "بحث الموارد",
    eventCalendar: "تقويم الفعاليات",
    studentDashboard: "لوحة تحكم الطالب",
    featureInspiration: "إلهام الميزات",
    featureInspirationDesc: "يقترح الذكاء الاصطناعي تحسينات عالية القيمة بناءً على نطاق المشروع الحالي والمكدس التقني.",
    verifiedBrief: "معيار أكاديمي معتمد",

    // Pillars Section
    sectionEyebrow: "مصمم لأجل التميز",
    sectionTitle: "استكشف الأفكار بسياق دقيق لا بالتخمين.",
    sectionDesc: "تركز بوصلة قلمون حصرياً على معرفة المشاريع، الوضوح، والإلهام العملي تمكيناً لتخطيطك الأكاديمي.",
    
    pillar1Title: "ملخصات مشاريع منظمة",
    pillar1Text: "استكشف الأفكار عبر أهداف محددة، حدود واضحة، حلول مقترحة، وخيارات تقنية مدروسة.",
    pillar2Title: "اكتشاف شامل",
    pillar2Text: "ابحث في الكتالوج الرسمي وتعلّم من المشاريع الموثقة بنجاح عبر مجتمعك الأكاديمي.",
    pillar3Title: "إلهام ذكي للميزات",
    pillar3Text: "ولد أفكار ميزات جديدة وعملية مبنية على السياق الفريد لمشروعك والقيود التقنية.",

    // Bottom Banner
    bannerEyebrow: "هل أنت مستعد للبدء؟",
    bannerTitle: "اعثر على اتجاه مشروعك القادم اليوم.",
    bannerDesc: "تصفح ملخصات المشاريع الأكاديمية المتاحة واستخدمها نقطة انطلاق لابتكار إبداعك الخاص.",
    openCatalogue: "فتح كتالوج المشاريع",
  },
} satisfies Record<Locale, Record<string, string>>;

export function t(locale: Locale, key: keyof typeof dictionary.en) {
  return dictionary[locale][key];
}