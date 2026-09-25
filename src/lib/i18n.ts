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
    myProfile: string;
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
    panels: {
      heading: string;
      overall: string;
      overallOne: string;
      overallNone: string;
      votes: string;
      loginToVote: string;
      rate: { title: string; options: string[] };
      wear: { title: string; winter: string; spring: string; summer: string; fall: string; day: string; night: string };
      longevity: { title: string; options: string[] };
      sillage: { title: string; options: string[] };
      gender: { title: string; options: string[] };
      price: { title: string; options: string[] };
      extraHeading: string;
    };
    points: {
      heading: string;
      pros: string;
      cons: string;
      addPro: string;
      addCon: string;
      placeholder: string;
      add: string;
      none: string;
      note: string;
      remove: string;
    };
    helpful: string;
    helpfulCount: string;
    sortHelpful: string;
    sortNewest: string;
    reviewOn: string;
    blockedWord: string;
  };
  notes: { heading: string; top: string; heart: string; base: string; notes: string };
  facts: { year: string; perfumer: string; accords: string };
  browse: {
    brandMeta: string;
    brandCounts: string;
    brandHeading: string;
    brandPerfumes: string;
    brandAll: string;
    brandInspired: string;
    inspiredBy: string;
    noteMeta: string;
    noteHeading: string;
    noteInspired: string;
    notFound: string;
    empty: string;
  };
  nav: { top: string; suggest: string; search: string; inspired: string; brands: string };
  inspiredPage: {
    titleOne: string;
    description: string;
    intro: string;
    heading: string;
    headingReminds: string;
    rank: string;
    siblings: string;
  };
  inspiredIndex: {
    metaTitle: string;
    metaDescription: string;
    heading: string;
    intro: string;
    placeholder: string;
    allBrands: string;
    filter: string;
    count: string;
    none: string;
    prev: string;
    next: string;
    page: string;
    inspiredBy: string;
  };
  brandsIndex: {
    metaTitle: string;
    metaDescription: string;
    heading: string;
    intro: string;
    onSite: string;
    total: string;
    others: string;
    count: string;
    byLetter: string;
    letterTitle: string;
    letterDescription: string;
    otherLetter: string;
  };
  search: {
    metaTitle: string;
    heading: string;
    placeholder: string;
    submit: string;
    perfumes: string;
    inspired: string;
    brands: string;
    notes: string;
    none: string;
    hint: string;
    inspiredBy: string;
    count: string;
  };
  similarByNotes: string;
  perfumeHead: {
    outOf: string;
    votes: string;
    reviews: string;
    noRatings: string;
    rateIt: string;
    sections: string;
    navNotes: string;
    navInspired: string;
    navPhotos: string;
    navRatings: string;
    navReviews: string;
  };
  hero: { searchLabel: string; popular: string; browse: string; steps: [string, string, string] };
  prices: {
    cta: string;
    ctaHint: string;
    title: string;
    loading: string;
    loadingHint: string;
    cheapest: string;
    toStore: string;
    sizeLabel: string;
    sizeMl: string;
    unknownSize: string;
    unknownSizeHint: string;
    allSizes: string;
    per100: string;
    approx: string;
    approxHint: string;
    tester: string;
    testersTitle: string;
    offers: string;
    none: string;
    unavailable: string;
    disclaimer: string;
    updated: string;
    close: string;
    goOpening: string;
    goFail: string;
    goBack: string;
    goHint: string;
  };
  footerNav: { explore: string; community: string; about: string };
  homeCommunity: {
    latestReviews: string;
    topRated: string;
    mostWanted: string;
    newPhotos: string;
    seeCharts: string;
    reviewOf: string;
    missingHeading: string;
    missingText: string;
  };
  top: {
    metaTitle: string;
    metaDescription: string;
    heading: string;
    intro: string;
    topRated: string;
    mostLoved: string;
    mostWanted: string;
    mostOwned: string;
    mostReviewed: string;
    topMembers: string;
    ratingLine: string;
    lovesLine: string;
    wantLine: string;
    ownLine: string;
    reviewsLine: string;
    memberLine: string;
    empty: string;
  };
  comments: {
    show: string;
    hide: string;
    reply: string;
    placeholder: string;
    submit: string;
    remove: string;
  };
  noteVotes: {
    vote: string;
    done: string;
    hint: string;
    count: string;
    login: string;
  };
  photos: {
    heading: string;
    none: string;
    add: string;
    own: string;
    upload: string;
    uploading: string;
    sent: string;
    tooMany: string;
    invalid: string;
    by: string;
    remove: string;
    login: string;
  };
  suggest: {
    similarHeading: string;
    similarText: string;
    similarCta: string;
    brand: string;
    name: string;
    note: string;
    gender: string;
    submit: string;
    sent: string;
    sameBrand: string;
    tooMany: string;
    login: string;
    perfumeTitle: string;
    perfumeMeta: string;
    perfumeIntro: string;
  };
  profile: {
    metaTitle: string;
    joined: string;
    shelfHeading: string;
    ratingsHeading: string;
    stats: string;
    photosHeading: string;
    reviewsHeading: string;
    empty: string;
    notFound: string;
    back: string;
    edit: string;
    nameLabel: string;
    bioLabel: string;
    bioPlaceholder: string;
    save: string;
    cancel: string;
    saved: string;
    saveError: string;
  };
};

const en: Dict = {
  langName: 'English',
  switchTo: 'עברית',
  switchLabel: 'החלפה לעברית (Switch to Hebrew)',
  dir: 'ltr',

  metaTitle: 'MatchScent | Where to buy perfume cheapest in Israel',
  metaDescription: 'Compare perfume prices across stores in Israel and find where it is cheapest, plus notes, ratings and fragrances inspired by famous perfumes.',
  perfumeTitle: '{full}: Compare Prices and Similar Scents',
  perfumeDescOne: 'Compare prices of {full} across stores and discover a fragrance inspired by it: {names}.',
  perfumeDescMany: 'Compare prices of {full} across stores and discover {n} fragrances inspired by it, including {names}.',
  perfumeDescNone: 'Compare prices of {full} across stores and see its notes and ratings.',

  brandTag: 'Perfume price comparison',
  heroSub: 'Where is it cheapest to buy your perfume? Compare prices across stores in Israel, plus notes, ratings and inspired alternatives.',
  searchLabel: 'Search perfumes or brands',
  searchPlaceholder: 'Filter by perfume or brand...',
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
    myProfile: 'My profile',
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
    panels: {
      heading: 'User ratings',
      overall: 'Rated {avg} out of 5 with {count} votes',
      overallOne: 'Rated {avg} out of 5 with 1 vote',
      overallNone: 'No ratings yet - be the first!',
      votes: '{n} votes',
      loginToVote: 'Log in to vote',
      rate: { title: 'Rating', options: ['Hate', 'Dislike', 'OK', 'Like', 'Love'] },
      wear: { title: 'When to wear', winter: 'Winter', spring: 'Spring', summer: 'Summer', fall: 'Fall', day: 'Day', night: 'Night' },
      longevity: { title: 'Longevity', options: ['Very weak', 'Weak', 'Moderate', 'Long lasting', 'Eternal'] },
      sillage: { title: 'Sillage', options: ['Intimate', 'Moderate', 'Strong', 'Enormous'] },
      gender: { title: 'Gender', options: ['Female', 'More female', 'Unisex', 'More male', 'Male'] },
      price: { title: 'Price value', options: ['Way overpriced', 'Overpriced', 'OK', 'Good value', 'Great value'] },
      extraHeading: 'More scores (optional)',
    },
    points: {
      heading: 'What people say',
      pros: 'Pros',
      cons: 'Cons',
      addPro: 'Add a pro',
      addCon: 'Add a con',
      placeholder: 'One short sentence (up to 140 characters)',
      add: 'Add',
      none: 'Nothing here yet.',
      note: 'Pros and cons are written by community members.',
      remove: 'Remove',
    },
    helpful: 'Helpful',
    helpfulCount: '{n} found this helpful',
    sortHelpful: 'Most helpful',
    sortNewest: 'Newest',
    reviewOn: 'Review of {name}',
    blockedWord: 'Please write "similar" or "inspired by" instead of that word.',
  },
  notes: { heading: 'Notes', top: 'Top notes', heart: 'Heart notes', base: 'Base notes', notes: 'Notes' },
  facts: { year: 'Launched', perfumer: 'Perfumer', accords: 'Main accords' },
  browse: {
    brandMeta: '{brand}: perfumes and similar scents',
    brandCounts: '{perfumes} perfumes on the site · {inspired} similar scents',
    brandHeading: '{brand}',
    brandPerfumes: 'Perfumes by {brand}',
    brandAll: 'More perfumes by {brand} ({n})',
    brandInspired: 'Fragrances by {brand} that our lists compare to famous perfumes',
    inspiredBy: 'Inspired by',
    noteMeta: 'Perfumes with {note}',
    noteHeading: 'Perfumes with {note}',
    noteInspired: 'Similar scents with {note}',
    notFound: 'Nothing was found here.',
    empty: 'Nothing here yet.',
  },
  nav: { top: 'Top rated', suggest: 'Suggest a perfume', search: 'Search', inspired: 'Inspired fragrances', brands: 'Houses' },
  inspiredPage: {
    titleOne: '{full} - inspired by {orig}',
    description: '{full} is a fragrance inspired by {orig}. Notes, ratings, reviews and where to buy it.',
    intro: '{name} by {brand} is a fragrance inspired by {orig}.',
    heading: 'Inspired by',
    headingReminds: 'Also reminds people of',
    rank: 'Number {rank} of {of} in the list of {name}',
    siblings: 'More fragrances inspired by {name}',
  },
  inspiredIndex: {
    metaTitle: 'Inspired fragrances - every alternative and its original',
    metaDescription: 'Every fragrance inspired by a famous perfume, side by side with the perfume it is inspired by.',
    heading: 'Inspired fragrances',
    intro: 'Every fragrance that is inspired by a famous perfume, next to the perfume it is inspired by.',
    placeholder: 'Search by name or brand...',
    allBrands: 'All brands',
    filter: 'Show',
    count: '{n} fragrances',
    none: 'Nothing found.',
    prev: 'Previous',
    next: 'Next',
    page: 'Page {n} of {total}',
    inspiredBy: 'Inspired by',
  },
  brandsIndex: {
    metaTitle: 'Perfume houses A-Z',
    metaDescription: 'All the perfume houses, A to Z - with the perfumes and similar scents we have for each.',
    heading: 'Perfume houses',
    intro: 'All the perfume houses, A to Z. Houses with perfumes on the site are links.',
    onSite: 'Houses with perfumes on the site',
    total: 'All houses',
    byLetter: 'Every perfume house, by letter',
    letterTitle: 'Perfume houses: {l}',
    letterDescription: 'Every perfume house starting with {l}.',
    otherLetter: 'Other',
    others: 'More houses (no perfumes on the site yet)',
    count: '{n} houses',
  },
  search: {
    metaTitle: 'Search',
    heading: 'Search the site',
    placeholder: 'A perfume, a brand or a note (for example: vanilla)...',
    submit: 'Search',
    perfumes: 'Perfumes',
    inspired: 'Similar scents',
    brands: 'Brands',
    notes: 'Notes',
    none: 'Nothing found for "{q}".',
    hint: 'Search perfumes, the fragrances inspired by them, brands and notes.',
    inspiredBy: 'Inspired by',
    count: '{n} fragrances',
  },
  similarByNotes: 'Perfumes with a similar character',
  perfumeHead: {
    outOf: 'out of 5',
    votes: '{n} votes',
    reviews: '{n} reviews',
    noRatings: 'Not rated yet',
    rateIt: 'Rate it',
    sections: 'On this page',
    navNotes: 'Notes',
    navInspired: 'Similar scents',
    navPhotos: 'Photos',
    navRatings: 'Ratings',
    navReviews: 'Reviews',
  },
  hero: { searchLabel: 'Search a perfume, a brand or a note', popular: 'Popular:', browse: 'All perfumes', steps: ['Find your perfume', 'Compare store prices', 'Buy where it is cheapest'] },
  prices: {
    cta: 'Compare prices {in}',
    ctaHint: 'Where is it cheapest to buy?',
    title: 'Where it is cheapest {in}',
    loading: 'Checking prices in stores {in}...',
    loadingHint: 'This takes a few seconds',
    cheapest: 'Cheapest',
    toStore: 'To the store',
    sizeLabel: 'Size',
    sizeMl: '{n} ml',
    unknownSize: 'Size not stated',
    unknownSizeHint: 'The listing does not say the size. Check on the store\'s site.',
    allSizes: 'All',
    per100: '{price} per 100 ml',
    approx: 'Check the model',
    approxHint: 'The listing\'s title is shorter than the perfume\'s name. Check the model on the store\'s site.',
    tester: 'Tester',
    testersTitle: 'Testers (bottle without its box)',
    offers: '{n} offers',
    none: 'We could not find this perfume available to buy in stores {in} right now.',
    unavailable: 'We could not load prices right now. Please try again in a few minutes.',
    disclaimer: 'Prices are refreshed every few hours and may change. Shipping and taxes are not always included, so check the store\'s site before you buy.',
    updated: 'Updated {when}',
    close: 'Close',
    goOpening: 'Opening {store}...',
    goFail: 'We could not open the store.',
    goBack: 'Back to the site',
    goHint: 'If the store does not open within a few seconds, try again.',
  },
  footerNav: { explore: 'Explore', community: 'Community', about: 'About' },
  homeCommunity: {
    latestReviews: 'Latest reviews',
    topRated: 'Top rated by our members',
    mostWanted: 'Most wanted',
    newPhotos: 'New photos from members',
    seeCharts: 'All the charts',
    reviewOf: 'on {name}',
    missingHeading: 'Missing a perfume?',
    missingText: 'Tell us which perfume to add and we will add it with its similar scents.',
  },
  top: {
    metaTitle: 'Top rated perfumes - community charts',
    metaDescription: 'The perfumes our members rate highest, love most, own and want - updated all the time.',
    heading: 'Community charts',
    intro: 'Built from our members\' votes and updated all the time.',
    topRated: 'Top rated',
    mostLoved: 'Most loved',
    mostWanted: 'Most wanted',
    mostOwned: 'Most owned',
    mostReviewed: 'Most reviewed',
    topMembers: 'Most active members',
    ratingLine: '{avg} out of 5 · {count} votes',
    lovesLine: '{n} love it',
    wantLine: '{n} want it',
    ownLine: '{n} own it',
    reviewsLine: '{n} reviews',
    memberLine: '{ratings} ratings · {reviews} reviews',
    empty: 'Not enough votes yet - rate perfumes to fill this chart!',
  },
  comments: {
    show: 'Replies ({n})',
    hide: 'Hide replies',
    reply: 'Reply',
    placeholder: 'Write a reply...',
    submit: 'Post reply',
    remove: 'Delete',
  },
  noteVotes: {
    vote: 'Vote for notes',
    done: 'Done voting',
    hint: 'Tap the notes you really smell in it.',
    count: '{n} members smell it',
    login: 'Log in to vote for notes',
  },
  photos: {
    heading: 'Members\' photos',
    none: 'No photos yet - be the first to add one.',
    add: 'Add a photo of your bottle',
    own: 'This is my own photo (I took it myself)',
    upload: 'Upload',
    uploading: 'Uploading...',
    sent: 'Thank you! Your photo will appear after we check it.',
    tooMany: 'You have reached the photo limit for now.',
    invalid: 'Please choose a JPG, PNG or WEBP picture.',
    by: 'Photo: {name}',
    remove: 'Delete',
    login: 'Log in to add a photo',
  },
  suggest: {
    similarHeading: 'Know a fragrance that smells like it?',
    similarText: 'Suggest it and we will add it to the list after checking.',
    similarCta: 'Suggest a similar scent',
    brand: 'Brand',
    name: 'Fragrance name',
    note: 'Anything to add? (optional)',
    gender: 'For',
    submit: 'Send suggestion',
    sent: 'Thank you! We will check it and add it.',
    sameBrand: 'A similar scent has to be from a different brand.',
    tooMany: 'You have many suggestions waiting. Please wait until we check them.',
    login: 'Log in to send a suggestion',
    perfumeTitle: 'Suggest a perfume',
    perfumeMeta: 'Suggest a perfume to add to MatchScent',
    perfumeIntro: 'Which perfume should we add? We will check it and add it together with the fragrances that smell like it.',
  },
  profile: {
    metaTitle: 'Profile: {name}',
    joined: 'Member since {date}',
    shelfHeading: 'Shelf',
    ratingsHeading: 'Ratings',
    photosHeading: 'Photos',
    stats: '{ratings} ratings · {reviews} reviews · {shelf} on the shelf',
    reviewsHeading: 'Reviews',
    empty: 'Nothing here yet.',
    notFound: 'This profile was not found.',
    back: 'Back to the home page',
    edit: 'Edit profile',
    nameLabel: 'Display name',
    bioLabel: 'About me',
    bioPlaceholder: 'A few words about you and the scents you love (up to 300 characters)',
    save: 'Save',
    cancel: 'Cancel',
    saved: 'Saved.',
    saveError: 'Could not save. Please try again.',
  },
};

const he: Dict = {
  langName: 'עברית',
  switchTo: 'English',
  switchLabel: 'Switch to English (החלפה לאנגלית)',
  dir: 'rtl',

  metaTitle: 'MatchScent | איפה הכי זול לקנות בושם בישראל',
  metaDescription: 'השוואת מחירי בשמים בין חנויות בישראל: איפה הכי זול לקנות, ובנוסף תווים, דירוגים ובשמים בהשראת הבשמים המפורסמים.',
  perfumeTitle: '{full}: השוואת מחירים ובשמים בהשראתו',
  perfumeDescOne: 'השוו מחירים של {full} בין חנויות בישראל וגלו בושם בהשראתו: {names}.',
  perfumeDescMany: 'השוו מחירים של {full} בין חנויות בישראל וגלו {n} בשמים בהשראתו, ובהם {names}.',
  perfumeDescNone: 'השוו מחירים של {full} בין חנויות בישראל, וראו תווים ודירוגים.',

  brandTag: 'השוואת מחירי בשמים',
  heroSub: 'איפה הכי זול לקנות את הבושם שלכם? השוואת מחירים בין חנויות בישראל, ובנוסף תווים, דירוגים ובשמים בהשראתו.',
  searchLabel: 'חיפוש בושם או מותג',
  searchPlaceholder: 'סננו לפי שם בושם או מותג...',
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
    myProfile: 'הפרופיל שלי',
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
    panels: {
      heading: 'דירוגי משתמשים',
      overall: 'דירוג הבושם {avg} מתוך 5 עם {count} הצבעות',
      overallOne: 'דירוג הבושם {avg} מתוך 5 עם הצבעה אחת',
      overallNone: 'עדיין אין דירוגים - היו הראשונים!',
      votes: '{n} הצבעות',
      loginToVote: 'התחברו כדי להצביע',
      rate: { title: 'דירוג', options: ['שנאתי', 'לא אהבתי', 'בסדר', 'אהבתי', 'אהבתי מאוד'] },
      wear: { title: 'מתי ללבוש', winter: 'חורף', spring: 'אביב', summer: 'קיץ', fall: 'סתיו', day: 'יום', night: 'לילה' },
      longevity: { title: 'עמידות', options: ['חלשה מאוד', 'חלשה', 'בינונית', 'מחזיקה זמן רב', 'נצחית'] },
      sillage: { title: 'שובל', options: ['אינטימי', 'בינוני', 'חזק', 'עצום'] },
      gender: { title: 'מתאים ל...', options: ['נשי', 'יותר נשי', 'יוניסקס', 'יותר גברי', 'גברי'] },
      price: { title: 'תמורה למחיר', options: ['יקר בהרבה מדי', 'יקר', 'סביר', 'תמורה טובה', 'תמורה מעולה'] },
      extraHeading: 'ציונים נוספים (לא חובה)',
    },
    points: {
      heading: 'מה אומרים המשתמשים',
      pros: 'יתרונות',
      cons: 'חסרונות',
      addPro: 'הוסיפו יתרון',
      addCon: 'הוסיפו חסרון',
      placeholder: 'משפט קצר אחד (עד 140 תווים)',
      add: 'הוספה',
      none: 'אין כאן עדיין כלום.',
      note: 'היתרונות והחסרונות נכתבים על ידי חברי הקהילה.',
      remove: 'הסרה',
    },
    helpful: 'מועיל',
    helpfulCount: '{n} מצאו את זה מועיל',
    sortHelpful: 'הכי מועילות',
    sortNewest: 'הכי חדשות',
    reviewOn: 'ביקורת על {name}',
    blockedWord: 'נא לכתוב "דומה" או "בהשראת" במקום המילה הזו.',
  },
  notes: { heading: 'תווים', top: 'תווי ראש', heart: 'תווי לב', base: 'תווי בסיס', notes: 'תווים' },
  facts: { year: 'שנת הוצאה', perfumer: 'יוצר הבושם', accords: 'אקורדים עיקריים' },
  browse: {
    brandMeta: '{brand}: בשמים ובשמים דומים',
    brandCounts: '{perfumes} בשמים באתר · {inspired} בשמים דומים',
    brandHeading: '{brand}',
    brandPerfumes: 'הבשמים של {brand}',
    brandAll: 'עוד בשמים של {brand} ({n})',
    brandInspired: 'בשמים של {brand} שהרשימות שלנו משוות לבשמים מפורסמים',
    inspiredBy: 'בהשראת',
    noteMeta: 'בשמים עם {note}',
    noteHeading: 'בשמים עם {note}',
    noteInspired: 'בשמים דומים עם {note}',
    notFound: 'לא נמצא כלום כאן.',
    empty: 'אין כאן עדיין כלום.',
  },
  nav: { top: 'המובילים', suggest: 'הציעו בושם', search: 'חיפוש', inspired: 'בשמים בהשראת', brands: 'בתי בישום' },
  inspiredPage: {
    titleOne: '{full} - בהשראת {orig}',
    description: '{full} הוא בושם בהשראת {orig}. תווים, דירוגים, ביקורות, ואיפה לקנות.',
    intro: '{name} של {brand} הוא בושם בהשראת {orig}.',
    heading: 'בהשראת',
    headingReminds: 'מזכיר גם את',
    rank: 'מקום {rank} מתוך {of} ברשימה של {name}',
    siblings: 'עוד בשמים בהשראת {name}',
  },
  inspiredIndex: {
    metaTitle: 'בשמים בהשראת - כל החלופות והבושם המקורי שלהן',
    metaDescription: 'כל הבשמים בהשראת בשמים מפורסמים, כל אחד לצד הבושם שהוא בהשראתו.',
    heading: 'בשמים בהשראת',
    intro: 'כל הבשמים בהשראת בשמים מפורסמים, כל אחד לצד הבושם שהוא בהשראתו.',
    placeholder: 'חיפוש לפי שם או מותג...',
    allBrands: 'כל המותגים',
    filter: 'הצגה',
    count: '{n} בשמים',
    none: 'לא נמצא דבר.',
    prev: 'הקודם',
    next: 'הבא',
    page: 'עמוד {n} מתוך {total}',
    inspiredBy: 'בהשראת',
  },
  brandsIndex: {
    metaTitle: 'בתי בישום מא׳ עד ת׳',
    metaDescription: 'כל בתי הבישום, מא׳ עד ת׳, עם הבשמים והבשמים הדומים שיש לנו לכל אחד.',
    heading: 'בתי בישום',
    intro: 'כל בתי הבישום, לפי סדר האלף-בית. בתי בישום שיש להם בשמים באתר מסומנים כקישור.',
    onSite: 'בתי בישום עם בשמים באתר',
    total: 'כל בתי הבישום',
    byLetter: 'כל בתי הבישום בעולם, לפי אות',
    letterTitle: 'בתי בישום: {l}',
    letterDescription: 'כל בתי הבישום שמתחילים ב-{l}.',
    otherLetter: 'אחר',
    others: 'עוד בתי בישום (עדיין אין להם בשמים באתר)',
    count: '{n} בתי בישום',
  },
  search: {
    metaTitle: 'חיפוש',
    heading: 'חיפוש באתר',
    placeholder: 'בושם, מותג או תו (למשל: וניל)...',
    submit: 'חיפוש',
    perfumes: 'בשמים',
    inspired: 'בשמים דומים',
    brands: 'מותגים',
    notes: 'תווים',
    none: 'לא נמצא דבר עבור "{q}".',
    hint: 'חפשו בשמים, בשמים בהשראתם, מותגים ותווים.',
    inspiredBy: 'בהשראת',
    count: '{n} בשמים',
  },
  similarByNotes: 'בשמים עם אופי דומה',
  perfumeHead: {
    outOf: 'מתוך 5',
    votes: '{n} הצבעות',
    reviews: '{n} ביקורות',
    noRatings: 'עדיין לא דורג',
    rateIt: 'דרגו אותו',
    sections: 'בעמוד הזה',
    navNotes: 'תווים',
    navInspired: 'בשמים דומים',
    navPhotos: 'תמונות',
    navRatings: 'דירוגים',
    navReviews: 'ביקורות',
  },
  hero: { searchLabel: 'חפשו בושם, מותג או תו', popular: 'פופולרי:', browse: 'כל הבשמים', steps: ['מצאו את הבושם שלכם', 'השוו מחירים בין חנויות', 'קנו איפה שהכי זול'] },
  prices: {
    cta: 'השוואת מחירים {in}',
    ctaHint: 'איפה הכי זול לקנות אותו?',
    title: 'איפה הכי זול {in}',
    loading: 'בודקים מחירים בחנויות {in}...',
    loadingHint: 'זה לוקח כמה שניות',
    cheapest: 'הכי זול',
    toStore: 'לחנות',
    sizeLabel: 'גודל',
    sizeMl: '{n} מ״ל',
    unknownSize: 'גודל לא צוין',
    unknownSizeHint: 'המודעה לא מציינת גודל. כדאי לבדוק באתר החנות.',
    allSizes: 'הכל',
    per100: '{price} ל-100 מ״ל',
    approx: 'לוודא דגם',
    approxHint: 'כותרת המודעה קצרה משם הבושם. כדאי לוודא את הדגם באתר החנות.',
    tester: 'טסטר',
    testersTitle: 'טסטרים (בקבוק ללא אריזה)',
    offers: '{n} הצעות',
    none: 'לא מצאנו את הבושם הזה זמין לרכישה בחנויות {in} כרגע.',
    unavailable: 'לא הצלחנו לטעון מחירים כרגע. נסו שוב בעוד כמה דקות.',
    disclaimer: 'המחירים מתעדכנים כל כמה שעות ועשויים להשתנות. משלוח ומיסים לא תמיד נכללים, ולכן כדאי לבדוק באתר החנות לפני הרכישה.',
    updated: 'עודכן {when}',
    close: 'סגירה',
    goOpening: 'פותחים את {store}...',
    goFail: 'לא הצלחנו לפתוח את החנות.',
    goBack: 'חזרה לאתר',
    goHint: 'אם החנות לא נפתחת תוך כמה שניות, נסו שוב.',
  },
  footerNav: { explore: 'לגלות', community: 'קהילה', about: 'על האתר' },
  homeCommunity: {
    latestReviews: 'ביקורות אחרונות',
    topRated: 'הכי מדורגים אצל החברים שלנו',
    mostWanted: 'הכי מבוקשים',
    newPhotos: 'תמונות חדשות מהחברים',
    seeCharts: 'לכל הטבלאות',
    reviewOf: 'על {name}',
    missingHeading: 'חסר לכם בושם?',
    missingText: 'ספרו לנו איזה בושם להוסיף, ונוסיף אותו יחד עם הבשמים הדומים לו.',
  },
  top: {
    metaTitle: 'הבשמים המובילים - טבלאות הקהילה',
    metaDescription: 'הבשמים שהחברים שלנו מדרגים הכי גבוה, אוהבים, מחזיקים ורוצים - מתעדכן כל הזמן.',
    heading: 'טבלאות הקהילה',
    intro: 'נבנות מההצבעות של החברים שלנו ומתעדכנות כל הזמן.',
    topRated: 'הכי מדורגים',
    mostLoved: 'הכי אהובים',
    mostWanted: 'הכי מבוקשים',
    mostOwned: 'הכי נפוצים על המדף',
    mostReviewed: 'הכי הרבה ביקורות',
    topMembers: 'החברים הכי פעילים',
    ratingLine: '{avg} מתוך 5 · {count} הצבעות',
    lovesLine: '{n} אוהבים מאוד',
    wantLine: '{n} רוצים אותו',
    ownLine: '{n} מחזיקים בו',
    reviewsLine: '{n} ביקורות',
    memberLine: '{ratings} דירוגים · {reviews} ביקורות',
    empty: 'עדיין אין מספיק הצבעות - דרגו בשמים כדי למלא את הטבלה!',
  },
  comments: {
    show: 'תגובות ({n})',
    hide: 'הסתרת התגובות',
    reply: 'הגיבו',
    placeholder: 'כתבו תגובה...',
    submit: 'פרסום תגובה',
    remove: 'מחיקה',
  },
  noteVotes: {
    vote: 'הצביעו על התווים',
    done: 'סיום הצבעה',
    hint: 'לחצו על התווים שאתם באמת מריחים בבושם.',
    count: '{n} חברים מריחים אותו',
    login: 'התחברו כדי להצביע על תווים',
  },
  photos: {
    heading: 'תמונות של החברים',
    none: 'עדיין אין תמונות - היו הראשונים להוסיף.',
    add: 'הוסיפו תמונה של הבקבוק שלכם',
    own: 'זו תמונה שלי (צילמתי אותה בעצמי)',
    upload: 'העלאה',
    uploading: 'מעלה...',
    sent: 'תודה! התמונה תופיע אחרי שנבדוק אותה.',
    tooMany: 'הגעתם למגבלת התמונות כרגע.',
    invalid: 'נא לבחור תמונה מסוג JPG, PNG או WEBP.',
    by: 'צילום: {name}',
    remove: 'מחיקה',
    login: 'התחברו כדי להוסיף תמונה',
  },
  suggest: {
    similarHeading: 'מכירים בושם שמריח כמוהו?',
    similarText: 'הציעו אותו, ואחרי בדיקה נוסיף אותו לרשימה.',
    similarCta: 'הציעו בושם דומה',
    brand: 'מותג',
    name: 'שם הבושם',
    note: 'משהו להוסיף? (לא חובה)',
    gender: 'מתאים ל',
    submit: 'שליחת ההצעה',
    sent: 'תודה! נבדוק ונוסיף.',
    sameBrand: 'בושם דומה צריך להיות ממותג אחר.',
    tooMany: 'יש לכם הרבה הצעות שמחכות. נא לחכות שנבדוק אותן.',
    login: 'התחברו כדי לשלוח הצעה',
    perfumeTitle: 'הציעו בושם',
    perfumeMeta: 'הציעו בושם שיתווסף ל-MatchScent',
    perfumeIntro: 'איזה בושם כדאי שנוסיף? נבדוק ונוסיף אותו יחד עם הבשמים שמריחים כמוהו.',
  },
  profile: {
    metaTitle: 'פרופיל: {name}',
    joined: 'חברים מאז {date}',
    shelfHeading: 'מדף',
    ratingsHeading: 'דירוגים',
    photosHeading: 'תמונות',
    stats: '{ratings} דירוגים · {reviews} ביקורות · {shelf} על המדף',
    reviewsHeading: 'ביקורות',
    empty: 'אין כאן עדיין כלום.',
    notFound: 'הפרופיל לא נמצא.',
    back: 'חזרה לעמוד הבית',
    edit: 'עריכת פרופיל',
    nameLabel: 'שם תצוגה',
    bioLabel: 'קצת עליי',
    bioPlaceholder: 'כמה מילים עליכם ועל הניחוחות שאתם אוהבים (עד 300 תווים)',
    save: 'שמירה',
    cancel: 'ביטול',
    saved: 'נשמר.',
    saveError: 'לא הצלחנו לשמור. נסו שוב.',
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
