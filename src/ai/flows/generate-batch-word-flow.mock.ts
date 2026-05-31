// Mock implementation for generate-batch-word-flow.ts - used during mobile builds

import type {
  BatchGenerateWordInput,
  BatchGenerateWordOutput,
} from '../schemas/batch-word';

// Mock word datasets by theme and difficulty
const mockWords = {
  current: {
    easy: [
      { word: 'happy', definition: 'Feeling or showing pleasure and contentment' },
      { word: 'swift', definition: 'Moving quickly or with great speed' },
      { word: 'bright', definition: 'Giving out much light; shining brightly' },
      { word: 'calm', definition: 'Peaceful and quiet; not excited or nervous' },
      { word: 'brave', definition: 'Courageous and willing to face danger' },
    ],
    medium: [
      { word: 'eloquent', definition: 'Fluent, expressive, and persuasive in speaking or writing' },
      { word: 'ambiguous', definition: 'Open to more than one interpretation; unclear' },
      { word: 'benevolent', definition: 'Kind and generous; showing goodwill' },
      { word: 'meticulous', definition: 'Showing great attention to detail; very careful' },
      { word: 'enigmatic', definition: 'Mysterious and difficult to understand' },
    ],
    hard: [
      { word: 'obfuscate', definition: 'To deliberately make something unclear or difficult to understand' },
      { word: 'perspicacious', definition: 'Having keen insight, discernment, and understanding' },
      { word: 'ephemeral', definition: 'Lasting for a very short time; transitory' },
      { word: 'ubiquitous', definition: 'Present, appearing, or found everywhere' },
      { word: 'serendipitous', definition: 'Occurring by lucky chance; fortunate' },
    ],
  },
  'science-safari': {
    easy: [
      { word: 'cell', definition: 'The smallest unit of life; basic structural unit of organisms' },
      { word: 'orbit', definition: 'The curved path of an object moving around another in space' },
      { word: 'photon', definition: 'A particle of light or other electromagnetic radiation' },
      { word: 'enzyme', definition: 'A protein that speeds up chemical reactions in living organisms' },
      { word: 'fossil', definition: 'Preserved remains of ancient plants or animals' },
    ],
    medium: [
      { word: 'metamorphosis', definition: 'A dramatic change in form or structure, especially in insects' },
      { word: 'chromosome', definition: 'A structure containing genes and DNA in the cell nucleus' },
      { word: 'mitochondria', definition: 'Organelle in cells that produces energy through respiration' },
      { word: 'photosynthesis', definition: 'Process by which plants convert light into chemical energy' },
      { word: 'molecular', definition: 'Relating to molecules or the structure of matter' },
    ],
    hard: [
      { word: 'bioluminescence', definition: 'Production and emission of light by living organisms' },
      { word: 'nucleoside', definition: 'Compound of a sugar and a nitrogenous base' },
      { word: 'thermodynamics', definition: 'Study of heat, energy, and their transformations' },
      { word: 'prokaryotic', definition: 'Relating to cells without a nucleus' },
      { word: 'spectroscopy', definition: 'Analysis of light emission or absorption by substances' },
    ],
  },
  'history-quest': {
    easy: [
      { word: 'pharaoh', definition: 'Ruler or king of ancient Egypt' },
      { word: 'gladiator', definition: 'Fighter in ancient Rome who fought for entertainment' },
      { word: 'dynasty', definition: 'Series of rulers from the same family' },
      { word: 'emperor', definition: 'Ruler of an empire or large territory' },
      { word: 'conquest', definition: 'Defeating and taking control of territory or people' },
    ],
    medium: [
      { word: 'medieval', definition: 'Relating to the Middle Ages in European history' },
      { word: 'renaissance', definition: 'Cultural revival and rebirth of learning in Europe' },
      { word: 'revolution', definition: 'Sudden overthrow of a government or social system' },
      { word: 'civilization', definition: 'Advanced society with developed culture and government' },
      { word: 'colonization', definition: 'Establishing settlement and control in foreign lands' },
    ],
    hard: [
      { word: 'archaeology', definition: 'Study of past human cultures through remains and artifacts' },
      { word: 'geopolitics', definition: 'Politics influenced by geographic factors and boundaries' },
      { word: 'imperialism', definition: 'Policy of extending empire control over other territories' },
      { word: 'historiography', definition: 'Study of historical writing and interpretation' },
      { word: 'hegemony', definition: 'Leadership or dominance of one group over others' },
    ],
  },
  'geo-genius': {
    easy: [
      { word: 'desert', definition: 'Arid region with very little rainfall or vegetation' },
      { word: 'mountain', definition: 'Large natural elevation of land rising above surroundings' },
      { word: 'ocean', definition: 'Large body of salt water covering most of Earth' },
      { word: 'continent', definition: 'Large landmass separated from others by oceans' },
      { word: 'island', definition: 'Land area completely surrounded by water' },
    ],
    medium: [
      { word: 'tundra', definition: 'Cold region with low vegetation and permanently frozen ground' },
      { word: 'plateau', definition: 'Elevated area with relatively flat terrain' },
      { word: 'delta', definition: 'Triangular land formation where a river meets the sea' },
      { word: 'archipelago', definition: 'Group of islands close together in water' },
      { word: 'latitude', definition: 'Measurement of distance north or south from the equator' },
    ],
    hard: [
      { word: 'topography', definition: 'Physical features and elevation patterns of a landscape' },
      { word: 'lithosphere', definition: 'Solid outer layer of Earth consisting of crust and upper mantle' },
      { word: 'stratification', definition: 'Layering of rock or sediment in geological formations' },
      { word: 'biogeography', definition: 'Study of distribution of species across different regions' },
      { word: 'geomorphology', definition: 'Study of Earth surface features and their formation' },
    ],
  },
};

export async function generateBatchWords(
  input: BatchGenerateWordInput
): Promise<BatchGenerateWordOutput> {
  console.warn('[Mobile] AI batch word generation not available in offline mode');

  const theme = input.theme || 'current';
  const difficulty = input.difficulty;
  const batchSize = Math.min(input.batchSize, 5); // Limit to 5 in mock

  // Get the appropriate word list
  const themeWords: Array<{ word: string; definition: string }> = (mockWords[theme as keyof typeof mockWords] as any)?.[difficulty] || [];
  const excludeSet = new Set(input.excludeWords?.map((w: string) => w.toLowerCase()) || []);

  // Filter out excluded words and select requested batch
  const availableWords = themeWords.filter((w: { word: string; definition: string }) => !excludeSet.has(w.word.toLowerCase()));
  const selectedWords = availableWords.slice(0, batchSize);

  return {
    words: selectedWords,
    generatedCount: selectedWords.length,
    totalRequested: input.batchSize,
  };
}
