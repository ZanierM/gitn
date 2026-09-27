// ============================================================
//  Geography in the News: settings you might want to change
// ============================================================

// News feeds. `hint` nudges the sorting: `seep` adds weight to a SEEP theme,
// `cont` limits where stories are placed (continent codes: AF AS EU NA SA OC).
export const FEEDS = [
  { id: 'bbc-world', source: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { id: 'bbc-africa', source: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml', hint: { cont: ['AF'] } },
  { id: 'bbc-asia', source: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml', hint: { cont: ['AS', 'OC'] } },
  { id: 'bbc-latam', source: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/latin_america/rss.xml', hint: { cont: ['SA', 'NA'] } },
  { id: 'bbc-mideast', source: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml', hint: { cont: ['AS', 'AF'] } },
  { id: 'bbc-europe', source: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml', hint: { cont: ['EU'] } },
  { id: 'bbc-usc', source: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml', hint: { cont: ['NA'] } },
  { id: 'bbc-sci', source: 'BBC News', url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', hint: { seep: 'En' } },
  { id: 'bbc-business', source: 'BBC News', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', hint: { seep: 'E' } },
  { id: 'guardian-environment', source: 'The Guardian', url: 'https://www.theguardian.com/environment/rss', hint: { seep: 'En' } },
  { id: 'guardian-global-development', source: 'The Guardian', url: 'https://www.theguardian.com/global-development/rss', hint: { seep: 'S' }, maxAgeHours: 168 },
  { id: 'guardian-world', source: 'The Guardian', url: 'https://www.theguardian.com/world/rss' },
  { id: 'aljazeera', source: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { id: 'un-all', source: 'UN News', url: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml', hint: { seep: 'S' }, maxAgeHours: 72 },
];

export const MAX_STORIES = 30;      // stories per day
export const MAX_PER_COUNTRY = 3;   // stops one country dominating
export const MAX_AGE_HOURS = 48;    // ignore older items still sitting in feeds (a feed can set its own maxAgeHours)
export const NO_REPEAT_DAYS = 2;    // don't repeat a story that appeared in the last N days
export const MIN_SCORE = 3;         // how "geographical" a story must be to be kept

// ---------- SEEP keywords (regular expressions, matched case-insensitively) ----------
// Each match adds its weight to that theme. Keep words fairly specific.
export const SEEP = {
  S: { label: 'Social', words: [
    ['migra|migrant|refugee|asylum|displac', 3], ['population|census|birth rate|ageing|aging', 2],
    ['health|disease|outbreak|cholera|malaria|measles|mpox|dengue|vaccin|hospital', 2],
    ['education|schools?\\b|pupils|literacy', 2], ['poverty|poorest|inequalit|slum|informal settlement|homeless|housing', 3],
    ['famine|hunger|malnutri|food insecurity|starv', 3], ['humanitarian|aid workers|aid agenc', 2], ['sanitation|clean water|drinking water', 3],
    ['women|girls|gender|child marriage|children', 1], ['indigenous|first nations|tribe|tribal', 2], ['culture|heritage|pilgrim|religio', 1],
    ['life expectancy|quality of life|living conditions', 3], ['communit|rural|villag', 1], ['protest', 1],
  ]},
  E: { label: 'Economic', words: [
    ['econom|gdp|recession|growth forecast', 3], ['trade|tariff|export|import', 3], ['inflation|interest rate|cost of living|cost-of-living|prices?\\b', 2],
    ['jobs|unemploy|wages|workers|labour|labor', 2], ['industr|manufactur|factor(y|ies)|supply chain', 2], ['invest|debt|loan|imf\\b|world bank|budget|\\btax', 2],
    ['oil|gas\\b|lng|fuel prices?|energy prices?|opec', 2], ['shipping|port\\b|ports\\b|container', 2], ['touris', 2], ['farm|crop|harvest|agricultur|livestock|cocoa|coffee|rice|wheat', 2],
    ['mining|\\bmines?\\b|mineral|lithium|cobalt|copper|rare earth', 2], ['market|currency|stock|shares|company|firms?\\b', 1], ['infrastructure|railway|high-speed rail|airport', 1],
  ]},
  En: { label: 'Environmental', words: [
    ['climate|global warming|greenhouse|emission|carbon|co2|net zero|net-zero', 3], ['flood|drought|heatwave|heat wave|wildfire|bushfire|monsoon|rainfall|heavy rain', 3],
    ['cyclone|hurricane|typhoon|tropical storm|storm\\b|tornado', 3], ['earthquake|quake|volcan|erupt|tsunami|landslide|mudslide|avalanche', 3],
    ['deforest|rainforest|forest|biodiversity|species|wildlife|extinct|conservation|habitat|national park', 3], ['ocean|sea level|coral|reef|marine|fish stocks|overfishing|whale', 2],
    ['glacier|ice sheet|sea ice|permafrost|arctic|antarctic', 3], ['pollution|pollut|plastic|smog|air quality|sewage|toxic', 3], ['water shortage|water scarcity|river|lake|aquifer|groundwater', 2],
    ['renewable|solar|wind farm|wind power|wind turbine|hydropower|geothermal|clean energy|electric vehicle|\\bevs?\\b', 2], ['coal|fossil fuel', 2], ['el ni[nñ]o|la ni[nñ]a|weather|temperature', 1],
    ['soil|erosion|desertification|coast', 2], ['environment|ecosystem|nature', 2],
  ]},
  P: { label: 'Political', words: [
    ['government|minister|president|parliament|senate|congress', 1], ['election|vote|referendum|poll\\b', 2], ['polic(y|ies)|law\\b|legislation|regulation|ban\\b', 1],
    ['sanction|treaty|agreement|summit|talks|negotiat|diplomat', 2], ['united nations|\\bun\\b|general assembly|cop\\d|nato|\\beu\\b|european union|g20|g7|brics|african union|asean', 2],
    ['border|territor|sovereign|annex|independence|separatis', 3], ['conflict|war\\b|ceasefire|peace deal|peace talks|military|troops|army|militar', 2],
    ['human rights|coup|regime|crackdown|opposition', 2], ['geopolit|superpower|alliance|trade war', 3],
  ]},
};
export const SEEP_ORDER = ['S', 'E', 'En', 'P'];

// ---------- Topics: link each story to a part of the Geography course ----------
export const TOPICS = [
  { id: 'hazards', label: 'Natural hazards', words: 'earthquake|quake|volcan|erupt|tsunami|flood|drought|cyclone|hurricane|typhoon|tropical storm|landslide|wildfire|bushfire|heatwave|monsoon|avalanche|tornado',
    q: ['What might the primary and secondary effects of this event be in {place}?', 'How could {place}’s level of development affect how well it responds?'] },
  { id: 'climate', label: 'Climate change', words: 'climate|global warming|emission|carbon|net zero|net-zero|fossil fuel|cop\\d|glacier|sea level|greenhouse',
    q: ['Is this story about the causes of climate change, its effects, or responses to it?', 'Who are the winners and losers from this in {place}?'] },
  { id: 'ecosystems', label: 'Ecosystems and biodiversity', words: 'forest|deforest|rainforest|biodiversity|species|wildlife|extinct|coral|reef|ocean|marine|desert|conservation|national park|habitat',
    q: ['Which human activities are putting pressure on this environment?', 'How could this environment be managed more sustainably?'] },
  { id: 'development', label: 'Development and inequality', words: 'poverty|poorest|inequalit|aid\\b|debt|development|health|disease|outbreak|education|famine|hunger|malnutri|humanitarian|life expectancy',
    q: ['What does this story suggest about quality of life in {place}?', 'Which development indicators could you use to measure this problem?'] },
  { id: 'migration', label: 'Migration and population', words: 'migra|migrant|refugee|asylum|displac|population|birth rate|ageing|census',
    q: ['What are the push and pull factors in this story?', 'What are the impacts on the places people leave and the places they move to?'] },
  { id: 'urban', label: 'Urban issues', words: 'city|cities|urban|housing|slum|informal settlement|megacit|traffic|congestion|metro\\b|homeless',
    q: ['What challenges does urban growth create in {place}?', 'How could this city become more sustainable?'] },
  { id: 'resources', label: 'Resource management', words: 'water|food|energy|electricity|oil|gas\\b|coal|mining|mineral|lithium|cobalt|copper|rare earth|farm|crop|harvest|renewable|solar|wind',
    q: ['Is this a story about the supply of a resource, the demand for it, or who controls it?', 'How could this resource be managed more sustainably?'] },
  { id: 'economy', label: 'Economy and trade', words: 'trade|tariff|export|import|econom|gdp|recession|inflation|jobs|industr|manufactur|supply chain|shipping|touris|invest',
    q: ['How does this story show countries being interconnected?', 'Who gains and who loses from this economic change?'] },
  { id: 'geopolitics', label: 'Geopolitics', words: 'border|territor|sovereign|annex|sanction|treaty|conflict|war\\b|ceasefire|nato|united nations|\\bun\\b|election|summit|independence',
    q: ['Why does geography (location, borders or resources) matter in this story?', 'How might this decision affect ordinary people living in {place}?'] },
];
export const DEFAULT_Q = ['Which SEEP themes does this story cover, and which is most important?', 'How might this story affect people in {place} and elsewhere?'];

// ---------- Safety ----------
// Stories matching these are never published.
export const BLOCK = 'murder|murdered|rape|raped|sexual|\\bsex\\b|paedophil|pedophil|child abuse|abused|grooming|stabb|shooting|shot dead|gunm[ae]n|suicide|beheaded|behead|execut(ed|ion)|tortur|massacre|hostage|kidnap|terror|bomb|explosive|porn|assault|traffick|lynch|mutilat|genocide|graphic|self-harm|overdose|cartel|serial killer|prostitut|strip club|obscen|heroin|cocaine|opioid|fentanyl|methamphetamine|drug dealer|drug gang';
// Stories matching these are about armed conflict. They are shown with a
// "Conflict" label and can be switched off in the app.
export const CONFLICT = 'war\\b|wars\\b|airstrike|air strike|drone strike|missile|shelling|troops|militar|militant|rebel|armed group|fighting|offensive|invasion|ceasefire|occupied|killed in (an )?attack|attacks?\\b|soldiers|hamas|hezbollah|houthi|isis|al-shabab|jihad';
// Stories matching these are not geography (sport, celebrity, entertainment).
export const NOT_GEOGRAPHY = 'football|premier league|champions league|nations league|world cup|olympic|tennis|cricket|golf|rugby|formula 1|f1\\b|grand prix|nba|nfl|squash|boxing|match\\b|goalkeeper|striker|transfer window|celebrit|film|movie|album|singer|actor|actress|oscars?|grammy|box office|tv show|netflix|royal family|prince\\b|princess|king charles|fashion|recipe|horoscope|quiz\\b|crossword|obituar|dies aged|died aged|lottery|politics live|live updates|as it happened|country diary|the takeaway|in quotes|week in pictures';
// These lower a story's score (it can still get in if it is strongly geographical).
export const SOFT_PENALTY = '\\bpope\\b|trial\\b|court|jailed|sentenced|arrested|police|crash|plane|helicopter|zoo\\b|scandal|gossip';
// Phrases that contain a place name but are not about that place.
export const FALSE_PLACES = ['Paris Agreement', 'Paris climate', 'New York Times', 'Washington Post', 'Wall Street', 'Bank of England', 'Bank of Japan', 'Hong Kong-listed', 'Dubai-based', 'London-based', 'London Stock Exchange', 'Bretton Woods', 'Kyoto Protocol', 'Montreal Protocol', 'Brussels sprouts', 'Turkey Point', 'Jordan River', 'Chad Smith', 'Georgia State', 'Congo River'];
