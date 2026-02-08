/**
 * Word Generation Utilities
 * Pure functions that don't need 'use server'
 */

export interface WordConstraints {
  minLen: number;
  maxLen: number;
  difficulty: 'easy' | 'medium' | 'hard';
  theme?: string;
}

// Deterministic difficulty mapping based on level
export function levelToConstraints(level: number): WordConstraints {
  if (level <= 5) {
    return { minLen: 4, maxLen: 6, difficulty: 'easy' };
  }
  if (level <= 10) {
    return { minLen: 5, maxLen: 7, difficulty: 'easy' };
  }
  if (level <= 15) {
    return { minLen: 6, maxLen: 8, difficulty: 'medium' };
  }
  if (level <= 20) {
    return { minLen: 7, maxLen: 9, difficulty: 'medium' };
  }
  if (level <= 30) {
    return { minLen: 8, maxLen: 10, difficulty: 'hard' };
  }
  return { minLen: 9, maxLen: 12, difficulty: 'hard' };
}

// Normalize word (lowercase, trim, remove special chars)
export function normalizeWord(word: string): string {
  return word.toLowerCase().trim().replace(/[^a-z]/g, '');
}

// Validate word meets constraints
export function isValidWord(word: string, constraints: WordConstraints): boolean {
  if (!word || typeof word !== 'string') return false;
  
  const normalized = normalizeWord(word);
  if (normalized.length < constraints.minLen) return false;
  if (normalized.length > constraints.maxLen) return false;
  if (!/^[a-z]+$/.test(normalized)) return false; // Only letters
  
  return true;
}

// Fallback word list (deterministic backup)
type FallbackWord = { word: string; definition: string };

export const THEME_FALLBACK_WORDS: Record<string, Record<WordConstraints['difficulty'], FallbackWord[]>> = {
  current: {
    easy: [
      { word: 'apple', definition: 'A round fruit with red or green skin and crisp flesh.' },
      { word: 'beach', definition: 'A sandy or pebbly shore by the ocean or lake.' },
      { word: 'cloud', definition: 'A visible mass of water droplets suspended in the atmosphere.' },
      { word: 'dance', definition: 'To move rhythmically to music.' },
      { word: 'eagle', definition: 'A large bird of prey with keen vision.' },
      { word: 'flame', definition: 'A hot glowing body of ignited gas.' },
      { word: 'grape', definition: 'A small round fruit that grows in clusters.' },
      { word: 'house', definition: 'A building for human habitation.' },
      { word: 'island', definition: 'A piece of land surrounded by water.' },
      { word: 'jungle', definition: 'A dense tropical forest.' },
    ],
    medium: [
      { word: 'balance', definition: 'An even distribution of weight or amount.' },
      { word: 'capture', definition: 'To take into custody or gain control of.' },
      { word: 'deliver', definition: 'To bring and hand over to the proper recipient.' },
      { word: 'embrace', definition: 'To hold closely in one\'s arms.' },
      { word: 'fortune', definition: 'Chance or luck as an external force.' },
      { word: 'genuine', definition: 'Truly what it is said to be; authentic.' },
      { word: 'harmony', definition: 'Agreement or concord in feeling or action.' },
      { word: 'inspire', definition: 'To fill with the urge or ability to do something.' },
      { word: 'journey', definition: 'An act of traveling from one place to another.' },
      { word: 'kingdom', definition: 'A country ruled by a king or queen.' },
    ],
    hard: [
      { word: 'abundance', definition: 'A very large quantity of something.' },
      { word: 'benevolent', definition: 'Well-meaning and kindly.' },
      { word: 'catastrophe', definition: 'A sudden disaster or misfortune.' },
      { word: 'diligent', definition: 'Having or showing care in one\'s work.' },
      { word: 'eloquent', definition: 'Fluent or persuasive in speaking or writing.' },
      { word: 'formidable', definition: 'Inspiring fear or respect through being powerful.' },
      { word: 'gratitude', definition: 'The quality of being thankful.' },
      { word: 'hypothesis', definition: 'A proposed explanation based on limited evidence.' },
      { word: 'illuminate', definition: 'To light up or make clear.' },
      { word: 'jubilant', definition: 'Feeling or expressing great happiness.' },
    ],
  },
  'science-safari': {
    easy: [
      { word: 'atom', definition: 'The smallest unit of a chemical element.' },
      { word: 'cell', definition: 'The basic structural unit of living organisms.' },
      { word: 'orbit', definition: 'The curved path of an object around a body in space.' },
      { word: 'comet', definition: 'An icy body that releases gas and dust near the sun.' },
      { word: 'fossil', definition: 'The preserved remains or traces of ancient life.' },
      { word: 'planet', definition: 'A large body that orbits a star.' },
      { word: 'galaxy', definition: 'A massive system of stars, gas, and dust.' },
      { word: 'nebula', definition: 'A cloud of gas and dust in space.' },
      { word: 'pollen', definition: 'Fine powder produced by plants for reproduction.' },
      { word: 'plasma', definition: 'A hot, ionized state of matter.' },
      { word: 'meteor', definition: 'A streak of light from a meteoroid entering the atmosphere.' },
      { word: 'fungus', definition: 'A spore-producing organism such as mold or mushroom.' },
    ],
    medium: [
      { word: 'biology', definition: 'The study of living organisms.' },
      { word: 'ecology', definition: 'The study of relationships between organisms and their environment.' },
      { word: 'gravity', definition: 'The force that attracts objects toward one another.' },
      { word: 'mineral', definition: 'A naturally occurring inorganic substance.' },
      { word: 'nucleus', definition: 'The central part of an atom or cell.' },
      { word: 'climate', definition: 'The long-term pattern of weather in a region.' },
      { word: 'habitat', definition: 'The natural home of an organism.' },
      { word: 'asteroid', definition: 'A small rocky body orbiting the sun.' },
      { word: 'molecule', definition: 'A group of atoms bonded together.' },
      { word: 'particle', definition: 'A very small piece of matter.' },
      { word: 'organism', definition: 'An individual living thing.' },
      { word: 'spectrum', definition: 'A range of wavelengths of radiation.' },
      { word: 'eclipse', definition: 'The blocking of light by a celestial body.' },
      { word: 'mutation', definition: 'A change in genetic material.' },
      { word: 'telescope', definition: 'An instrument for observing distant objects in space.' },
    ],
    hard: [
      { word: 'ecosystem', definition: 'A community of organisms and their environment.' },
      { word: 'evolution', definition: 'The process of change in species over time.' },
      { word: 'radiation', definition: 'Energy emitted as waves or particles.' },
      { word: 'biosphere', definition: 'All regions of Earth where life exists.' },
      { word: 'atmosphere', definition: 'The layer of gases surrounding a planet.' },
      { word: 'tectonic', definition: 'Relating to the structure of Earth\'s crust.' },
      { word: 'magnetism', definition: 'The force produced by magnets or electric currents.' },
      { word: 'satellite', definition: 'An object that orbits a planet.' },
      { word: 'microscopy', definition: 'The study of objects using microscopes.' },
      { word: 'meteorite', definition: 'A meteoroid that reaches the ground.' },
      { word: 'chemistry', definition: 'The science of substances and their reactions.' },
      { word: 'astronaut', definition: 'A person trained to travel in space.' },
    ],
  },
  'history-quest': {
    easy: [
      { word: 'king', definition: 'A male ruler of a kingdom.' },
      { word: 'queen', definition: 'A female ruler of a kingdom.' },
      { word: 'roman', definition: 'Relating to ancient Rome.' },
      { word: 'greek', definition: 'Relating to ancient Greece.' },
      { word: 'egypt', definition: 'An ancient kingdom along the Nile.' },
      { word: 'maya', definition: 'A civilization of Mesoamerica.' },
      { word: 'sumer', definition: 'An ancient civilization of Mesopotamia.' },
      { word: 'relic', definition: 'An object surviving from the past.' },
      { word: 'siege', definition: 'A military blockade of a city.' },
      { word: 'crown', definition: 'A head ornament worn by a ruler.' },
      { word: 'tribe', definition: 'A traditional social group.' },
      { word: 'tomb', definition: 'A burial place.' },
    ],
    medium: [
      { word: 'empire', definition: 'A group of territories ruled by one power.' },
      { word: 'temple', definition: 'A building devoted to worship.' },
      { word: 'battle', definition: 'A combat between armed forces.' },
      { word: 'dynasty', definition: 'A line of hereditary rulers.' },
      { word: 'artifact', definition: 'An object made by humans, often historical.' },
      { word: 'ancient', definition: 'From the distant past.' },
      { word: 'legion', definition: 'A large unit of Roman soldiers.' },
      { word: 'kingdom', definition: 'A country ruled by a monarch.' },
      { word: 'pharaoh', definition: 'A ruler of ancient Egypt.' },
      { word: 'medieval', definition: 'Relating to the Middle Ages.' },
      { word: 'crusade', definition: 'A medieval religious military expedition.' },
      { word: 'monarch', definition: 'A king or queen.' },
      { word: 'archive', definition: 'A collection of historical records.' },
    ],
    hard: [
      { word: 'monument', definition: 'A structure commemorating a person or event.' },
      { word: 'cuneiform', definition: 'An ancient writing system of wedge-shaped marks.' },
      { word: 'gladiator', definition: 'A fighter in ancient Roman arenas.' },
      { word: 'imperator', definition: 'A title for a Roman commander or emperor.' },
      { word: 'chronicle', definition: 'A factual written account of events.' },
      { word: 'armistice', definition: 'An agreement to stop fighting.' },
      { word: 'republic', definition: 'A state without a monarch.' },
      { word: 'expedition', definition: 'A journey made for a specific purpose.' },
      { word: 'revolution', definition: 'A major political upheaval.' },
      { word: 'heritage', definition: 'Something handed down from the past.' },
      { word: 'colonial', definition: 'Relating to colonies and imperial rule.' },
    ],
  },
  'geo-genius': {
    easy: [
      { word: 'ocean', definition: 'A vast body of salt water.' },
      { word: 'river', definition: 'A large natural stream of water.' },
      { word: 'delta', definition: 'A landform at a river mouth.' },
      { word: 'plain', definition: 'A broad area of flat land.' },
      { word: 'coast', definition: 'The land along the edge of the sea.' },
      { word: 'island', definition: 'A piece of land surrounded by water.' },
      { word: 'desert', definition: 'A dry region with little rainfall.' },
      { word: 'valley', definition: 'A low area between hills or mountains.' },
      { word: 'canyon', definition: 'A deep gorge carved by a river.' },
      { word: 'tundra', definition: 'A treeless plain in cold regions.' },
      { word: 'globe', definition: 'A spherical representation of Earth.' },
      { word: 'forest', definition: 'A large area covered with trees.' },
    ],
    medium: [
      { word: 'capital', definition: 'A city that is the seat of government.' },
      { word: 'country', definition: 'A nation with its own government.' },
      { word: 'continent', definition: 'One of Earth\'s major landmasses.' },
      { word: 'peninsula', definition: 'Land surrounded by water on three sides.' },
      { word: 'mountain', definition: 'A large natural elevation of land.' },
      { word: 'latitude', definition: 'Distance north or south of the equator.' },
      { word: 'longitude', definition: 'Distance east or west of the prime meridian.' },
      { word: 'equator', definition: 'The line around Earth equidistant from the poles.' },
      { word: 'plateau', definition: 'A high, flat area of land.' },
      { word: 'border', definition: 'A dividing line between regions.' },
      { word: 'harbor', definition: 'A sheltered body of water for ships.' },
      { word: 'volcano', definition: 'A mountain that can erupt lava.' },
    ],
    hard: [
      { word: 'archipelago', definition: 'A chain of islands.' },
      { word: 'hemisphere', definition: 'Half of the Earth.' },
      { word: 'watershed', definition: 'An area drained by a river system.' },
      { word: 'topography', definition: 'The arrangement of natural features of an area.' },
      { word: 'coastline', definition: 'The outline of a coast.' },
      { word: 'rainforest', definition: 'A dense forest with heavy rainfall.' },
      { word: 'earthquake', definition: 'A sudden shaking of the ground.' },
      { word: 'seismology', definition: 'The study of earthquakes.' },
      { word: 'landforms', definition: 'Natural features of Earth\'s surface.' },
      { word: 'hydrology', definition: 'The study of water on Earth.' },
      { word: 'altitude', definition: 'Height above sea level.' },
    ],
  },
};

const THEME_KEYWORDS: Record<string, string[]> = {
  'science-safari': [
    'biology', 'cell', 'organism', 'species', 'genetic', 'dna', 'ecosystem',
    'habitat', 'ecology', 'planet', 'star', 'galaxy', 'orbit', 'astronomy',
    'telescope', 'asteroid', 'comet', 'meteor', 'radiation', 'molecule',
    'atom', 'energy', 'climate', 'atmosphere', 'volcano', 'fossil', 'eclipse',
    'science', 'scientific', 'experiment', 'theory', 'hypothesis', 'physics',
    'chemistry', 'geology', 'microscope', 'evolution', 'gravity', 'spectrum',
  ],
  'history-quest': [
    'ancient', 'empire', 'dynasty', 'pharaoh', 'roman', 'greek', 'egypt',
    'mesopotamia', 'civilization', 'artifact', 'monarch', 'king', 'queen',
    'temple', 'battle', 'reign', 'chronicle', 'medieval', 'crusade',
    'republic', 'colonial', 'heritage', 'gladiator', 'legion', 'history',
    'historic', 'archaeology', 'treaty', 'revolution', 'kingdom', 'royal',
  ],
  'geo-genius': [
    'country', 'capital', 'city', 'continent', 'ocean', 'sea', 'river',
    'mountain', 'desert', 'island', 'peninsula', 'equator', 'latitude',
    'longitude', 'border', 'landmark', 'coast', 'valley', 'plateau',
    'glacier', 'volcano', 'archipelago', 'hemisphere', 'geography',
    'terrain', 'region', 'landform', 'coastline', 'elevation', 'map',
  ],
};

const THEME_WORD_SETS: Record<string, Set<string>> = Object.fromEntries(
  Object.entries(THEME_FALLBACK_WORDS).map(([theme, pools]) => [
    theme,
    new Set(
      [...pools.easy, ...pools.medium, ...pools.hard].map(item => item.word)
    ),
  ])
);

// Theme validation helpers
export function isThemeMatch(word: string, definition: string, theme?: string): boolean {
  if (!theme || theme === 'current') return true;

  const normalizedWord = normalizeWord(word);
  const normalizedDefinition = (definition || '').toLowerCase();
  const wordSet = THEME_WORD_SETS[theme];

  if (wordSet?.has(normalizedWord)) return true;

  const keywords = THEME_KEYWORDS[theme];
  if (!keywords || keywords.length === 0) return true;

  if (keywords.some(keyword => normalizedWord.includes(keyword))) return true;
  return keywords.some(keyword => normalizedDefinition.includes(keyword));
}

export function getFallbackWord(
  constraints: WordConstraints,
  usedWords: Set<string>,
  theme: string = 'current'
): { word: string; definition: string } {
  const themeKey = THEME_FALLBACK_WORDS[theme] ? theme : 'current';
  const poolByTheme = THEME_FALLBACK_WORDS[themeKey];
  const pool = poolByTheme[constraints.difficulty] || THEME_FALLBACK_WORDS.current.easy;

  const validUnused = pool.filter(item => (
    !usedWords.has(item.word.toLowerCase()) && isValidWord(item.word, constraints)
  ));
  if (validUnused.length > 0) {
    return validUnused[0];
  }

  const validAny = pool.filter(item => isValidWord(item.word, constraints));
  if (validAny.length > 0) {
    const randomIndex = Math.floor(Math.random() * validAny.length);
    return validAny[randomIndex];
  }

  const currentPool = THEME_FALLBACK_WORDS.current[constraints.difficulty] || [];
  const firstUnused = currentPool.find(item => !usedWords.has(item.word.toLowerCase()));
  if (firstUnused) return firstUnused;

  const fallbackPool = currentPool.length > 0 ? currentPool : pool;
  const randomIndex = Math.floor(Math.random() * fallbackPool.length);
  return fallbackPool[randomIndex];
}
