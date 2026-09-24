// Our own colour for each scent family, used for the accord bars and the little dot on each note.
// (A palette of our own: muted, so it sits well on the white and wine design.)

type Family = { color: string; words: string[] };

const FAMILIES: Family[] = [
  { color: '#D98A9E', words: ['floral', 'rose', 'jasmine', 'tuberose', 'iris', 'orris', 'violet', 'peony', 'lily', 'magnolia', 'gardenia', 'orchid', 'ylang', 'heliotrope', 'mimosa', 'freesia', 'blossom', 'flower', 'hyacinth', 'narcissus', 'osmanthus', 'lotus', 'geranium', 'lilac', 'camellia', 'honeysuckle', 'cyclamen', 'carnation', 'hedione', 'petalia', 'pelargonium'] },
  { color: '#D9B23A', words: ['citrus', 'lemon', 'bergamot', 'orange', 'mandarin', 'grapefruit', 'lime', 'yuzu', 'neroli', 'petitgrain', 'citron', 'tangerine', 'kumquat', 'verbena'] },
  { color: '#E0795B', words: ['fruity', 'fruit', 'apple', 'pear', 'peach', 'apricot', 'plum', 'cherry', 'berry', 'berries', 'currant', 'cassis', 'raspberry', 'strawberry', 'pineapple', 'mango', 'coconut', 'fig', 'melon', 'litchi', 'lychee', 'pomegranate', 'passion', 'quince', 'rhubarb', 'grape', 'tropical'] },
  { color: '#8C6A4F', words: ['woody', 'wood', 'woods', 'cedar', 'sandalwood', 'sandal', 'vetiver', 'patchouli', 'oud', 'agarwood', 'guaiac', 'birch', 'oak', 'cypress', 'pine', 'papyrus', 'cashmeran', 'amberwood', 'moss', 'oakmoss', 'cypriol', 'nagarmotha', 'earthy', 'mossy'] },
  { color: '#C58A3C', words: ['amber', 'ambergris', 'ambroxan', 'ambrox', 'labdanum', 'benzoin', 'balsam', 'balsamic', 'resin', 'resinous', 'incense', 'olibanum', 'frankincense', 'myrrh', 'opoponax', 'styrax', 'elemi', 'copal', 'oriental'] },
  { color: '#B98A62', words: ['vanilla', 'tonka', 'caramel', 'honey', 'chocolate', 'cacao', 'cocoa', 'coffee', 'praline', 'sugar', 'sweet', 'gourmand', 'almond', 'marshmallow', 'candy', 'milk', 'cream', 'creamy', 'lactonic', 'toffee', 'pistachio', 'hazelnut', 'chestnut', 'nutty', 'mocha', 'licorice', 'liquorice', 'cotton candy'] },
  { color: '#B5553A', words: ['spicy', 'spice', 'spices', 'pepper', 'cardamom', 'cinnamon', 'clove', 'cloves', 'nutmeg', 'ginger', 'saffron', 'cumin', 'coriander', 'anise', 'pimento', 'allspice', 'turmeric', 'cassia', 'caraway'] },
  { color: '#6E8E5A', words: ['green', 'herbal', 'aromatic', 'lavender', 'sage', 'rosemary', 'thyme', 'basil', 'mint', 'tea', 'grass', 'leaf', 'leaves', 'fougere', 'fougère', 'artemisia', 'mugwort', 'galbanum', 'tomato', 'fern', 'mate', 'myrtle', 'eucalyptus'] },
  { color: '#5B8FB0', words: ['aquatic', 'marine', 'sea', 'water', 'ozonic', 'salt', 'salty', 'fresh', 'rain', 'ice', 'mineral', 'metallic', 'calone', 'aldehyde', 'aldehydes', 'aldehydic', 'soapy', 'clean'] },
  { color: '#5C4A4F', words: ['leather', 'leathery', 'suede', 'tobacco', 'smoky', 'smoke', 'tar', 'animalic', 'castoreum', 'civet', 'rum', 'whiskey', 'cognac', 'birch tar', 'cade'] },
  { color: '#B8A6C9', words: ['powdery', 'powder', 'musk', 'musky', 'synthetic', 'iso e super', 'ambrette', 'cashmere'] },
];

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// The family colour of a note or an accord ("Pink Pepper" -> spicy, "Madagascar Vanilla" -> sweet).
export function scentColor(name: string): string {
  const words = fold(name).split(/[^a-z]+/).filter(Boolean);
  const text = words.join(' ');
  for (const f of FAMILIES) {
    if (f.words.some(w => (w.includes(' ') ? text.includes(w) : words.includes(w)))) return f.color;
  }
  return '#A89A9E';
}
