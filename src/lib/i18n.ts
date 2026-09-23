// All the words on the site, in English and Hebrew. To change a sentence, change it here.
// Placeholders like {n} or {name} are filled in with fmt().

export type Lang = 'en' | 'he';
export const LANGS: Lang[] = ['he', 'en'];

type CountryStrings = { IL: string; US: string; GB: string; WORLD: string };

export type Dict = {
  langName: string;
  switchTo: string;
  switchLabel: string;
  dir: 'ltr' | 'rtl';

  metaTitle: string;
  metaDescription: string;
  perfumeTitle: string;
  perfumeDescOne: string;
  perfumeDescMany: string;
  perfumeDescNone: string;

  brandTag: string;
  heroSub: string;
  searchLabel: string;
  searchPlaceholder: string;
  filterLabel: string;
  filterAll: string;
  filterMale: string;
  filterFemale: string;
  filterUnisex: string;
  countOne: string;
  countOther: string;
  emptyCollection: string;
  noMatch: string;
  similarBadge: string;
  comingSoon: string;
  soon: string;

  home: string;
  allFragrances: string;
  inspiredHeading: string;
  moreFrom: string;
  keepExploring: string;
  originalFrom: string;
  audience: string;
  audMale: string;
  audFemale: string;
  audUnisex: string;
  audForMen: string;
  audForWomen: string;
  audForAll: string;
  introBase: string;
  introWithOne: string;
  introWithMany: string;
  introNone: string;
  introPrices: string;
  curatingSimilar: string;
  from: string;

  whereToBuy: string;
  compareCta: string;
  compareHint: string;
  shopFrom: string;
  countries: CountryStrings;
  countriesIn: CountryStrings;

  footer: string;
  footerA11y: string;

  a11yButton: string;
  a11yTitle: string;
  a11yBigger: string;
  a11ySmaller: string;
  a11yContrast: string;
  a11yLinks: string;
  a11yReadable: string;
  a11yStill: string;
  a11yReset: string;
  a11yClose: string;
  a11yStatement: string;

  st: {
    title: string;
    intro: string;
    doneTitle: string;
    done: string[];
    limitsTitle: string;
    limits: string;
    contactTitle: string;
    contact: string;
    contactEmail: string;
    updated: string;
  };

  notFoundTitle: string;
  notFoundText: string;
  backHome: string;

  auth: {
    loginCta: string;
    registerCta: string;
    logoutCta: string;
    greeting: string;
    loginTitle: string;
    registerTitle: string;
    emailLabel: string;
    passwordLabel: string;
    passwordHint: string;
    displayNameLabel: string;
    loginSubmit: string;
    registerSubmit: string;
    submitting: string;
    noAccountYet: string;
    haveAccountAlready: string;
    registerSuccess: string;
    errorGeneric: string;
  };

  community: {
    ratingsHeading: string;
    ratingSummaryOne: string;
    ratingSummary: string;
    ratingNone: string;
    yourRating: string;
    reviewsHeading: string;
    reviewPlaceholder: string;
    reviewSubmit: string;
    reviewNone: string;
    loginToParticipate: string;
    thanks: string;
    aspectsHint: string;
    aspectScent: string;
    aspectLongevity: string;
    aspectSillage: string;
    aspectBottle: string;
    aspectValue: string;
    breakdownHeading: string;
    entryVoteQuestion: string;
    entryVoteYes: string;
    entryVoteNo: string;
    entryVoteSummary: string;
    entryVoteNone: string;
    entryVoteLogin: string;
    shelfHeading: string;
    shelfOwn: string;
    shelfHad: string;
    shelfWant: string;
    shelfCounts: string;
    shelfLogin: string;
  };
  notes: { heading: string; top: string; heart: string; base: string; notes: string };
  profile: {
    metaTitle: string;
    joined: string;
    shelfHeading: string;
    reviewsHeading: string;
    empty: string;
    notFound: string;
    back: string;
  };
};

const en: Dict = {
  langName: 'English',
  switchTo: 'עברית',
  switchLabel: 'החלפה לעברית (Switch to Hebrew)',
  dir: 'ltr',

  metaTitle: 'MatchScent | Discover Fragrances Inspired by Iconic Perfumes',
  metaDescription: 'Explore iconic perfumes and the fragrances inspired by them, with links to stores where you can buy.',
  perfumeTitle: 'Fragrances Inspired by {full}',
  perfumeDescOne: 'Discover a fragrance inspired by {full}: {names}. Compare prices and find where to buy.',
  perfumeDescMany: 'Discover {n} fragrances inspired by {full}, including {names}. Compare prices and find where to buy.',
  perfumeDescNone: 'We are curating fragrances inspired by {full}. Check back soon.',

  brandTag: 'The fragrance guide',
  heroSub: "Explore fragrances inspired by the world's most iconic perfumes.",
  searchLabel: 'Search perfumes or brands',
  searchPlaceholder: 'Search a perfume or brand...',
  filterLabel: 'Filter by audience',
  filterAll: 'All',
  filterMale: 'For Him',
  filterFemale: 'For Her',
  filterUnisex: 'Unisex',
  countOne: '1 fragrance',
  countOther: '{n} fragrances',
  emptyCollection: 'Our collection is being updated. Please check back soon.',
  noMatch: 'No fragrances match your search.',
  similarBadge: '{n} similar',
  comingSoon: 'Coming soon',
  soon: 'Soon',

  home: 'Home',
  allFragrances: 'All fragrances',
  inspiredHeading: 'Fragrances inspired by {name}',
  moreFrom: 'More from {brand}',
  keepExploring: 'Keep exploring',
  originalFrom: 'Original from',
  audience: 'Audience',
  audMale: 'For him',
  audFemale: 'For her',
  audUnisex: 'Unisex',
  audForMen: 'men',
  audForWomen: 'women',
  audForAll: 'everyone',
  introBase: '{name} by {brand} is a fragrance for {audience}.',
  introWithOne: 'Below is 1 fragrance inspired by it, so you can find a similar scent that suits your budget.',
  introWithMany: 'Below are {n} fragrances inspired by it, so you can find a similar scent that suits your budget.',
  introNone: 'We are still curating fragrances inspired by it. Check back soon.',
  introPrices: 'Prices are approximate and change, so check the store before you buy.',
  curatingSimilar: 'We are still curating similar scents for this fragrance.',
  from: 'From',

  whereToBuy: 'Where to buy',
  compareCta: 'Compare prices across stores {in}',
  compareHint: 'Every store that sells it, with prices',
  shopFrom: 'Shop from',
  countries: { IL: 'Israel', US: 'United States', GB: 'United Kingdom', WORLD: 'Rest of the world' },
  countriesIn: { IL: 'in Israel', US: 'in the US', GB: 'in the UK', WORLD: 'near you' },

  footer:
    'MatchScent is an independent fragrance guide. We are not affiliated with, or endorsed by, any of the brands mentioned. All trademarks belong to their respective owners. Product pictures belong to their respective owners and are shown to help identify each fragrance; if you own one and want it removed, contact us and we will remove it promptly.',
  footerA11y: 'Accessibility statement',

  a11yButton: 'Accessibility',
  a11yTitle: 'Accessibility tools',
  a11yBigger: 'Larger text',
  a11ySmaller: 'Smaller text',
  a11yContrast: 'High contrast',
  a11yLinks: 'Underline links',
  a11yReadable: 'Readable font',
  a11yStill: 'Stop animations',
  a11yReset: 'Reset all',
  a11yClose: 'Close',
  a11yStatement: 'Accessibility statement',

  st: {
    title: 'Accessibility statement',
    intro:
      'MatchScent wants everyone to be able to use this website, including people with disabilities. We aim to meet the requirements of Israeli Standard 5568 and WCAG 2.0 level AA, and we keep improving the site.',
    doneTitle: 'What we have done',
    done: [
      'The site can be used with a keyboard, with a visible focus outline.',
      'Pages use proper headings, lists and landmarks so screen readers can move around easily.',
      'Text can be enlarged, and the layout adapts to phones and tablets.',
      'Colours have strong contrast, and there is a high contrast mode.',
      'An accessibility toolbar (bottom corner of every page) lets you enlarge text, switch to high contrast, underline links, use a readable font, and stop animations.',
      'The site is available in Hebrew (right to left) and in English.',
    ],
    limitsTitle: 'Known limitations',
    limits:
      'The bottle pictures are decorative illustrations. The stores we link to are separate websites, and their accessibility is outside our control.',
    contactTitle: 'Contact us',
    contact:
      'If you find something that is hard to use, or you need information in another format, please tell us and we will do our best to help.',
    contactEmail: 'Email',
    updated: 'Last updated: September 2026',
  },

  notFoundTitle: 'Page not found',
  notFoundText: 'The page you are looking for does not exist.',
  backHome: 'Back to the home page',

  auth: {
    loginCta: 'Log in',
    registerCta: 'Sign up',
    logoutCta: 'Log out',
    greeting: 'Hi, {name}',
    loginTitle: 'Log in',
    registerTitle: 'Create an account',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    passwordHint: 'At least 8 characters',
    displayNameLabel: 'Display name',
    loginSubmit: 'Log in',
    registerSubmit: 'Sign up',
    submitting: 'One moment...',
    noAccountYet: "Don't have an account? Sign up",
    haveAccountAlready: 'Already have an account? Log in',
    registerSuccess: 'Account created! Check your email to confirm it, then log in.',
    errorGeneric: 'Something went wrong. Please try again.',
  },

  community: {
    ratingsHeading: 'Ratings & reviews',
    ratingSummaryOne: '{avg} out of 5 (1 rating)',
    ratingSummary: '{avg} out of 5 ({count} ratings)',
    ratingNone: 'No ratings yet - be the first to rate it.',
    yourRating: 'Your rating',
    reviewsHeading: 'Reviews',
    reviewPlaceholder: 'What do you think of this fragrance?',
    reviewSubmit: 'Post review',
    reviewNone: 'No reviews yet.',
    loginToParticipate: 'Log in to rate and review this fragrance.',
    thanks: 'Thanks! Your rating was saved.',
    aspectsHint: 'Rate the details too (optional):',
    aspectScent: 'Scent',
    aspectLongevity: 'Longevity',
    aspectSillage: 'Sillage (scent trail)',
    aspectBottle: 'Bottle',
    aspectValue: 'Value for money',
    breakdownHeading: 'What people say',
    entryVoteQuestion: 'Does it smell like the original?',
    entryVoteYes: 'Yes',
    entryVoteNo: 'No',
    entryVoteSummary: '{up} of {total} say it matches',
    entryVoteNone: 'Be the first to vote',
    entryVoteLogin: 'Log in to vote',
    shelfHeading: 'Your shelf',
    shelfOwn: 'I own it',
    shelfHad: 'I had it',
    shelfWant: 'I want it',
    shelfCounts: '{own} own it · {want} want it',
    shelfLogin: 'Log in to add it to your shelf.',
  },
  notes: { heading: 'Notes', top: 'Top notes', heart: 'Heart notes', base: 'Base notes', notes: 'Notes' },
  profile: {
    metaTitle: 'Profile: {name}',
    joined: 'Member since {date}',
    shelfHeading: 'Shelf',
    reviewsHeading: 'Reviews',
    empty: 'Nothing here yet.',
    notFound: 'This profile was not found.',
    back: 'Back to the home page',
  },
};

const he: Dict = {
  langName: 'עברית',
  switchTo: 'English',
  switchLabel: 'Switch to English (החלפה לאנגלית)',
  dir: 'rtl',

  metaTitle: 'MatchScent | גלו בשמים בהשראת הבשמים האיקוניים',
  metaDescription: 'גלו בשמים איקוניים ובשמים בהשראתם, עם קישורים לחנויות שבהן אפשר לקנות.',
  perfumeTitle: 'בשמים בהשראת {full}',
  perfumeDescOne: 'גלו בושם בהשראת {full}: {names}. השוו מחירים ומצאו איפה לקנות.',
  perfumeDescMany: 'גלו {n} בשמים בהשראת {full}, ובהם {names}. השוו מחירים ומצאו איפה לקנות.',
  perfumeDescNone: 'אנחנו מרכזים בשמים בהשראת {full}. חזרו בקרוב.',

  brandTag: 'מדריך הבשמים',
  heroSub: 'גלו בשמים בהשראת הבשמים האיקוניים בעולם.',
  searchLabel: 'חיפוש בושם או מותג',
  searchPlaceholder: 'חפשו בושם או מותג...',
  filterLabel: 'סינון לפי קהל יעד',
  filterAll: 'הכל',
  filterMale: 'לגבר',
  filterFemale: 'לאישה',
  filterUnisex: 'יוניסקס',
  countOne: 'בושם אחד',
  countOther: '{n} בשמים',
  emptyCollection: 'הקולקציה שלנו מתעדכנת. אנא חזרו בקרוב.',
  noMatch: 'לא נמצאו בשמים שמתאימים לחיפוש.',
  similarBadge: '{n} דומים',
  comingSoon: 'בקרוב',
  soon: 'בקרוב',

  home: 'דף הבית',
  allFragrances: 'כל הבשמים',
  inspiredHeading: 'בשמים בהשראת {name}',
  moreFrom: 'עוד מבית {brand}',
  keepExploring: 'להמשיך לגלות',
  originalFrom: 'מחיר המקור החל מ-',
  audience: 'קהל יעד',
  audMale: 'לגבר',
  audFemale: 'לאישה',
  audUnisex: 'יוניסקס',
  audForMen: 'גברים',
  audForWomen: 'נשים',
  audForAll: 'כולם',
  introBase: '{name} של {brand} הוא בושם עבור {audience}.',
  introWithOne: 'למטה מופיע בושם אחד בהשראתו, כדי שתמצאו ניחוח דומה שמתאים לתקציב שלכם.',
  introWithMany: 'למטה מופיעים {n} בשמים בהשראתו, כדי שתמצאו ניחוח דומה שמתאים לתקציב שלכם.',
  introNone: 'אנחנו עדיין מרכזים בשמים בהשראתו. חזרו בקרוב.',
  introPrices: 'המחירים משוערים ומשתנים, ולכן כדאי לבדוק בחנות לפני הרכישה.',
  curatingSimilar: 'אנחנו עדיין מרכזים ניחוחות דומים לבושם הזה.',
  from: 'החל מ-',

  whereToBuy: 'איפה לקנות',
  compareCta: 'השוואת מחירים בין חנויות {in}',
  compareHint: 'כל החנויות שמוכרות אותו, עם מחירים',
  shopFrom: 'קונים מ',
  countries: { IL: 'ישראל', US: 'ארצות הברית', GB: 'בריטניה', WORLD: 'שאר העולם' },
  countriesIn: { IL: 'בישראל', US: 'בארה״ב', GB: 'בבריטניה', WORLD: 'באזור שלכם' },

  footer:
    'MatchScent הוא מדריך בשמים עצמאי. אין לנו קשר למותגים המוזכרים ואיננו מטעמם או בחסותם. כל סימני המסחר שייכים לבעליהם. תמונות המוצרים שייכות לבעליהן ומוצגות לצורך זיהוי הבושם; אם אתם בעלי תמונה ומבקשים להסירה, צרו קשר ונסיר אותה בהקדם.',
  footerA11y: 'הצהרת נגישות',

  a11yButton: 'נגישות',
  a11yTitle: 'כלי נגישות',
  a11yBigger: 'הגדלת טקסט',
  a11ySmaller: 'הקטנת טקסט',
  a11yContrast: 'ניגודיות גבוהה',
  a11yLinks: 'הדגשת קישורים',
  a11yReadable: 'גופן קריא',
  a11yStill: 'עצירת אנימציות',
  a11yReset: 'איפוס הכל',
  a11yClose: 'סגירה',
  a11yStatement: 'הצהרת נגישות',

  st: {
    title: 'הצהרת נגישות',
    intro:
      'ב-MatchScent רוצים שכולם יוכלו להשתמש באתר, כולל אנשים עם מוגבלות. אנחנו שואפים לעמוד בדרישות התקן הישראלי 5568 וב-WCAG 2.0 ברמה AA, וממשיכים לשפר את האתר.',
    doneTitle: 'מה עשינו',
    done: [
      'אפשר להשתמש באתר באמצעות המקלדת, עם סימון מיקוד ברור.',
      'הדפים בנויים עם כותרות, רשימות ואזורים מסומנים, כדי שקוראי מסך יוכלו לנווט בקלות.',
      'אפשר להגדיל את הטקסט, והעיצוב מתאים לטלפונים וללוחות.',
      'הצבעים בעלי ניגודיות חזקה, ויש מצב ניגודיות גבוהה.',
      'סרגל נגישות (בפינה התחתונה של כל דף) מאפשר להגדיל טקסט, לעבור לניגודיות גבוהה, להדגיש קישורים, להשתמש בגופן קריא ולעצור אנימציות.',
      'האתר זמין בעברית (מימין לשמאל) ובאנגלית.',
    ],
    limitsTitle: 'מגבלות ידועות',
    limits:
      'תמונות הבקבוקים הן איורים דקורטיביים. החנויות שאליהן אנחנו מקשרים הן אתרים נפרדים, והנגישות שלהם אינה בשליטתנו.',
    contactTitle: 'יצירת קשר',
    contact:
      'אם נתקלתם במשהו שקשה להשתמש בו, או שאתם צריכים מידע בפורמט אחר, ספרו לנו ונעשה כמיטב יכולתנו לעזור.',
    contactEmail: 'דוא״ל',
    updated: 'עודכן לאחרונה: ספטמבר 2026',
  },

  notFoundTitle: 'הדף לא נמצא',
  notFoundText: 'הדף שחיפשתם אינו קיים.',
  backHome: 'חזרה לדף הבית',

  auth: {
    loginCta: 'התחברות',
    registerCta: 'הרשמה',
    logoutCta: 'התנתקות',
    greeting: 'שלום, {name}',
    loginTitle: 'התחברות',
    registerTitle: 'יצירת חשבון',
    emailLabel: 'אימייל',
    passwordLabel: 'סיסמה',
    passwordHint: 'לפחות 8 תווים',
    displayNameLabel: 'שם תצוגה',
    loginSubmit: 'התחברות',
    registerSubmit: 'הרשמה',
    submitting: 'רגע אחד...',
    noAccountYet: 'עדיין אין לכם חשבון? הרשמו',
    haveAccountAlready: 'כבר יש לכם חשבון? התחברו',
    registerSuccess: 'החשבון נוצר! בדקו את המייל לאישור, ואז התחברו.',
    errorGeneric: 'משהו השתבש. נסו שוב.',
  },

  community: {
    ratingsHeading: 'דירוגים וביקורות',
    ratingSummaryOne: '{avg} מתוך 5 (דירוג אחד)',
    ratingSummary: '{avg} מתוך 5 ({count} דירוגים)',
    ratingNone: 'אין עדיין דירוגים - היו הראשונים לדרג.',
    yourRating: 'הדירוג שלכם',
    reviewsHeading: 'ביקורות',
    reviewPlaceholder: 'מה דעתכם על הבושם הזה?',
    reviewSubmit: 'פרסום ביקורת',
    reviewNone: 'אין עדיין ביקורות.',
    loginToParticipate: 'התחברו כדי לדרג ולכתוב ביקורת על הבושם.',
    thanks: 'תודה! הדירוג שלכם נשמר.',
    aspectsHint: 'אפשר לדרג גם את הפרטים (לא חובה):',
    aspectScent: 'ריח',
    aspectLongevity: 'עמידות',
    aspectSillage: 'שובל (עוצמת הריח באוויר)',
    aspectBottle: 'בקבוק',
    aspectValue: 'תמורה למחיר',
    breakdownHeading: 'מה אומרים המשתמשים',
    entryVoteQuestion: 'האם הריח דומה למקור?',
    entryVoteYes: 'כן',
    entryVoteNo: 'לא',
    entryVoteSummary: '{up} מתוך {total} אומרים שזה מתאים',
    entryVoteNone: 'היו הראשונים להצביע',
    entryVoteLogin: 'התחברו כדי להצביע',
    shelfHeading: 'המדף שלכם',
    shelfOwn: 'יש לי',
    shelfHad: 'היה לי',
    shelfWant: 'אני רוצה',
    shelfCounts: '{own} משתמשים מחזיקים בו · {want} רוצים אותו',
    shelfLogin: 'התחברו כדי להוסיף אותו למדף שלכם.',
  },
  notes: { heading: 'תווים', top: 'תווי ראש', heart: 'תווי לב', base: 'תווי בסיס', notes: 'תווים' },
  profile: {
    metaTitle: 'פרופיל: {name}',
    joined: 'חברים מאז {date}',
    shelfHeading: 'מדף',
    reviewsHeading: 'ביקורות',
    empty: 'אין כאן עדיין כלום.',
    notFound: 'הפרופיל לא נמצא.',
    back: 'חזרה לעמוד הבית',
  },
};

const dictionaries: Record<Lang, Dict> = { en, he };

export const getDict = (lang: Lang): Dict => dictionaries[lang];

export const isLang = (value: string): value is Lang => value === 'en' || value === 'he';

// "Hello {name}" + { name: 'Dana' } -> "Hello Dana"
export const fmt = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));

// Hebrew is the site's main language and keeps the plain addresses; English lives under /en.
export const withLang = (lang: Lang, path: string): string => {
  if (lang === 'he') return path;
  return path === '/' ? '/en' : `/en${path}`;
};

export const otherLang = (lang: Lang): Lang => (lang === 'en' ? 'he' : 'en');
