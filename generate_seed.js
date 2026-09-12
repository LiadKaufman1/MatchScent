const fs = require('fs');

const crypto = require('crypto');
function uuidv4() {
  return crypto.randomUUID();
}

// 100 Highly Accurate Perfumes & Dupes
const data = [
  // Tom Ford
  { o: { n: 'Tobacco Vanille', b: 'Tom Ford', g: 'unisex', p_usd: 295, p_ils: 1100, d: 'Iconic spicy tobacco and vanilla.' }, d: [{ n: 'Tobacco Touch', b: 'Maison Alhambra', s: 92, p_usd: 35, p_ils: 130 }, { n: 'Amber Oud Tobacco Edition', b: 'Al Haramain', s: 94, p_usd: 60, p_ils: 220 }] },
  { o: { n: 'Lost Cherry', b: 'Tom Ford', g: 'unisex', p_usd: 395, p_ils: 1450, d: 'Luscious, tempting cherry and almond.' }, d: [{ n: 'Lovely Chèrie', b: 'Maison Alhambra', s: 90, p_usd: 35, p_ils: 130 }, { n: 'Cherry Smash', b: 'Alt Fragrances', s: 85, p_usd: 40, p_ils: 150 }] },
  { o: { n: 'Oud Wood', b: 'Tom Ford', g: 'unisex', p_usd: 295, p_ils: 1100, d: 'Rare, exotic, distinctive oud.' }, d: [{ n: 'Woody Oud', b: 'Maison Alhambra', s: 93, p_usd: 30, p_ils: 110 }, { n: 'Carved Oud', b: 'Thameen', s: 95, p_usd: 250, p_ils: 950 }] },
  { o: { n: 'Tuscan Leather', b: 'Tom Ford', g: 'unisex', p_usd: 295, p_ils: 1100, d: 'Raw, refined leather.' }, d: [{ n: 'La Yuqawam Pour Homme', b: 'Rasasi', s: 96, p_usd: 65, p_ils: 240 }, { n: 'Toscano Leather', b: 'Maison Alhambra', s: 88, p_usd: 35, p_ils: 130 }] },
  { o: { n: 'Ombré Leather', b: 'Tom Ford', g: 'unisex', p_usd: 235, p_ils: 890, d: 'Vast, untethered, driven floral leather.' }, d: [{ n: 'Rare Carbon', b: 'Afnan', s: 92, p_usd: 40, p_ils: 150 }] },
  { o: { n: 'Neroli Portofino', b: 'Tom Ford', g: 'unisex', p_usd: 295, p_ils: 1100, d: 'Vibrant, sparkling, transportive.' }, d: [{ n: 'Porto Neroli', b: 'Maison Alhambra', s: 90, p_usd: 35, p_ils: 130 }] },
  { o: { n: 'Bitter Peach', b: 'Tom Ford', g: 'unisex', p_usd: 395, p_ils: 1450, d: 'Intoxicating pêche de vigne.' }, d: [{ n: 'Bright Peach', b: 'Maison Alhambra', s: 89, p_usd: 35, p_ils: 130 }] },
  { o: { n: 'Fucking Fabulous', b: 'Tom Ford', g: 'unisex', p_usd: 395, p_ils: 1450, d: 'Explicit, exclusive, fabulous.' }, d: [{ n: 'Fabulo Intense', b: 'Maison Alhambra', s: 87, p_usd: 35, p_ils: 130 }] },
  { o: { n: 'Soleil Blanc', b: 'Tom Ford', g: 'unisex', p_usd: 295, p_ils: 1100, d: 'Addictive solar floral amber.' }, d: [{ n: 'Blanc', b: 'Alt Fragrances', s: 85, p_usd: 40, p_ils: 150 }] },
  { o: { n: 'Noir Extreme', b: 'Tom Ford', g: 'male', p_usd: 235, p_ils: 890, d: 'Amber, woody oriental.' }, d: [{ n: 'Odyssey Homme', b: 'Armaf', s: 88, p_usd: 30, p_ils: 115 }] },
  
  // Creed
  { o: { n: 'Aventus', b: 'Creed', g: 'male', p_usd: 495, p_ils: 1800, d: 'Iconic, bold and powerful.' }, d: [{ n: 'Club de Nuit Intense Man', b: 'Armaf', s: 95, p_usd: 35, p_ils: 140 }, { n: 'Supremacy Silver', b: 'Afnan', s: 92, p_usd: 45, p_ils: 170 }, { n: 'Explorer', b: 'Montblanc', s: 85, p_usd: 65, p_ils: 240 }] },
  { o: { n: 'Silver Mountain Water', b: 'Creed', g: 'unisex', p_usd: 470, p_ils: 1700, d: 'Fresh, crisp and alpine.' }, d: [{ n: 'Club de Nuit Sillage', b: 'Armaf', s: 94, p_usd: 35, p_ils: 140 }] },
  { o: { n: 'Green Irish Tweed', b: 'Creed', g: 'male', p_usd: 470, p_ils: 1700, d: 'Classic, refined, masculine.' }, d: [{ n: 'Tres Nuit', b: 'Armaf', s: 91, p_usd: 30, p_ils: 110 }, { n: 'Cool Water', b: 'Davidoff', s: 80, p_usd: 25, p_ils: 95 }] },
  { o: { n: 'Virgin Island Water', b: 'Creed', g: 'unisex', p_usd: 470, p_ils: 1700, d: 'A tropical vacation in a bottle.' }, d: [{ n: 'Hawaii Volcano', b: 'Alexandria Fragrances', s: 93, p_usd: 60, p_ils: 220 }] },
  { o: { n: 'Millésime Impérial', b: 'Creed', g: 'unisex', p_usd: 470, p_ils: 1700, d: 'Warm, romantic, unforgettable.' }, d: [{ n: 'Club de Nuit Milestone', b: 'Armaf', s: 95, p_usd: 35, p_ils: 140 }] },
  { o: { n: 'Aventus for Her', b: 'Creed', g: 'female', p_usd: 495, p_ils: 1800, d: 'Empowering, confident, mesmerizing.' }, d: [{ n: 'Club de Nuit Woman', b: 'Armaf', s: 88, p_usd: 35, p_ils: 140 }] },

  // Maison Francis Kurkdjian
  { o: { n: 'Baccarat Rouge 540', b: 'Maison Francis Kurkdjian', g: 'unisex', p_usd: 325, p_ils: 1200, d: 'A luminous and sophisticated fragrance.' }, d: [{ n: 'Cloud', b: 'Ariana Grande', s: 85, p_usd: 45, p_ils: 170 }, { n: 'Red Temptation', b: 'Zara', s: 90, p_usd: 29, p_ils: 120 }, { n: 'Club de Nuit Untold', b: 'Armaf', s: 95, p_usd: 45, p_ils: 170 }] },
  { o: { n: 'Baccarat Rouge 540 Extrait', b: 'Maison Francis Kurkdjian', g: 'unisex', p_usd: 465, p_ils: 1750, d: 'Intensified signature.' }, d: [{ n: 'Amber Oud Ruby Edition', b: 'Al Haramain', s: 96, p_usd: 65, p_ils: 240 }] },
  { o: { n: 'Grand Soir', b: 'Maison Francis Kurkdjian', g: 'unisex', p_usd: 240, p_ils: 900, d: 'Majestic ambery warmth of Paris.' }, d: [{ n: 'Ambre Eve', b: 'Maison Alhambra', s: 92, p_usd: 35, p_ils: 130 }] },
  { o: { n: 'Oud Satin Mood', b: 'Maison Francis Kurkdjian', g: 'unisex', p_usd: 310, p_ils: 1150, d: 'A shimmering desert fabric.' }, d: [{ n: 'Oud Silk Mood', b: 'Maison Alhambra', s: 88, p_usd: 35, p_ils: 130 }] },

  // Parfums de Marly
  { o: { n: 'Layton', b: 'Parfums de Marly', g: 'male', p_usd: 350, p_ils: 1300, d: 'A seductive oriental floral.' }, d: [{ n: 'Detour Noir', b: 'Al Haramain', s: 96, p_usd: 35, p_ils: 130 }, { n: 'Dusk', b: 'The Woods Collection', s: 93, p_usd: 55, p_ils: 200 }] },
  { o: { n: 'Delina', b: 'Parfums de Marly', g: 'female', p_usd: 355, p_ils: 1300, d: 'A beautiful bouquet of Turkish rose.' }, d: [{ n: 'Club de Nuit Imperiale', b: 'Armaf', s: 94, p_usd: 40, p_ils: 150 }, { n: 'Delilah', b: 'Maison Alhambra', s: 89, p_usd: 35, p_ils: 130 }] },
  { o: { n: 'Pegasus', b: 'Parfums de Marly', g: 'male', p_usd: 350, p_ils: 1300, d: 'An exhilarating blend of almond and vanilla.' }, d: [{ n: 'Craze', b: 'Armaf', s: 95, p_usd: 30, p_ils: 110 }] },
  { o: { n: 'Herod', b: 'Parfums de Marly', g: 'male', p_usd: 350, p_ils: 1300, d: 'A smoky vanilla and tobacco scent.' }, d: [{ n: 'Radical Brown', b: 'Armaf', s: 85, p_usd: 30, p_ils: 110 }] },
  { o: { n: 'Oajan', b: 'Parfums de Marly', g: 'unisex', p_usd: 350, p_ils: 1300, d: 'Sweet, spicy, and warm honey.' }, d: [{ n: 'Ambre Tabac', b: 'Daniel Josier', s: 90, p_usd: 150, p_ils: 550 }] },
  { o: { n: 'Carlisle', b: 'Parfums de Marly', g: 'unisex', p_usd: 395, p_ils: 1450, d: 'A wave of patchouli, vanilla, and nutmeg.' }, d: [{ n: 'Red Tobacco', b: 'Mancera', s: 80, p_usd: 120, p_ils: 450 }] },
  { o: { n: 'Delina Exclusif', b: 'Parfums de Marly', g: 'female', p_usd: 395, p_ils: 1450, d: 'A richer, sweeter Turkish rose.' }, d: [{ n: 'Delilah Exclusif', b: 'Maison Alhambra', s: 88, p_usd: 35, p_ils: 130 }] },
  { o: { n: 'Greenley', b: 'Parfums de Marly', g: 'male', p_usd: 350, p_ils: 1300, d: 'Fresh, green, and woody.' }, d: [{ n: 'Glacier', b: 'Maison Alhambra', s: 85, p_usd: 35, p_ils: 130 }] },

  // Byredo
  { o: { n: 'Gypsy Water', b: 'Byredo', g: 'unisex', p_usd: 225, p_ils: 850, d: 'An ode to Romani culture, fresh and earthy.' }, d: [{ n: 'Water of Arabia', b: 'Alexandria Fragrances', s: 90, p_usd: 60, p_ils: 220 }] },
  { o: { n: 'Bal d\'Afrique', b: 'Byredo', g: 'unisex', p_usd: 225, p_ils: 850, d: 'A warm, romantic vetiver.' }, d: [{ n: 'Only You', b: 'Paris Corner', s: 88, p_usd: 35, p_ils: 130 }] },
  { o: { n: 'Mojave Ghost', b: 'Byredo', g: 'unisex', p_usd: 225, p_ils: 850, d: 'A woody composition inspired by the soulful beauty of the Mojave Desert.' }, d: [{ n: 'Sand Dance', b: 'Alexandria Fragrances', s: 89, p_usd: 60, p_ils: 220 }] },

  // Le Labo
  { o: { n: 'Santal 33', b: 'Le Labo', g: 'unisex', p_usd: 320, p_ils: 1150, d: 'The defining scent of a generation.' }, d: [{ n: 'No.04 Bois de Balincourt', b: 'Maison Louis Marie', s: 89, p_usd: 93, p_ils: 350 }, { n: 'Santal Sky', b: 'Kierin NYC', s: 85, p_usd: 85, p_ils: 320 }] },
  { o: { n: 'Another 13', b: 'Le Labo', g: 'unisex', p_usd: 320, p_ils: 1150, d: 'A unique, hypnotic musk.' }, d: [{ n: 'Not A Perfume', b: 'Juliette Has A Gun', s: 80, p_usd: 135, p_ils: 500 }] },

  // Kilian
  { o: { n: 'Angels\' Share', b: 'Kilian', g: 'unisex', p_usd: 245, p_ils: 950, d: 'Cognac derived, deliciously sweet.' }, d: [{ n: 'Kismet Angel', b: 'Maison Alhambra', s: 96, p_usd: 35, p_ils: 130 }, { n: 'Khamrah', b: 'Lattafa', s: 85, p_usd: 40, p_ils: 150 }] },
  { o: { n: 'Good Girl Gone Bad', b: 'Kilian', g: 'female', p_usd: 295, p_ils: 1100, d: 'A luscious floral explosion.' }, d: [{ n: 'Kismet for Women', b: 'Maison Alhambra', s: 92, p_usd: 35, p_ils: 130 }] },
  { o: { n: 'Love, Don\'t Be Shy', b: 'Kilian', g: 'female', p_usd: 295, p_ils: 1100, d: 'Marshmallow and neroli perfection.' }, d: [{ n: 'Floral Marshmallow', b: 'Dossier', s: 90, p_usd: 39, p_ils: 150 }, { n: 'Destiny', b: 'La Ree Fragrances', s: 94, p_usd: 45, p_ils: 170 }] },
  { o: { n: 'Black Phantom', b: 'Kilian', g: 'unisex', p_usd: 295, p_ils: 1100, d: 'Deadly coffee and rum.' }, d: [{ n: 'Dark Knight', b: 'Alexandria Fragrances', s: 93, p_usd: 60, p_ils: 220 }] },
  { o: { n: 'Intoxicated', b: 'Kilian', g: 'unisex', p_usd: 295, p_ils: 1100, d: 'Turkish coffee and cardamom.' }, d: [{ n: 'A*Men', b: 'Mugler', s: 85, p_usd: 90, p_ils: 340 }] },
  
  // Xerjoff
  { o: { n: 'Erba Pura', b: 'Xerjoff', g: 'unisex', p_usd: 250, p_ils: 950, d: 'A delicious blend of Mediterranean citrus and sweet fruits.' }, d: [{ n: 'Amber Oud Gold Edition', b: 'Al Haramain', s: 95, p_usd: 60, p_ils: 220 }, { n: 'Ana Abiyedh', b: 'Lattafa', s: 90, p_usd: 25, p_ils: 95 }] },
  { o: { n: 'Naxos', b: 'Xerjoff', g: 'unisex', p_usd: 250, p_ils: 950, d: 'A classic Italian heritage scent.' }, d: [{ n: '1981X', b: 'Alexandria Fragrances', s: 92, p_usd: 60, p_ils: 220 }] },
  { o: { n: 'Alexandria II', b: 'Xerjoff', g: 'unisex', p_usd: 350, p_ils: 1300, d: 'A masterpiece of rose and oud.' }, d: [{ n: 'Alexander', b: 'Fragrance World', s: 88, p_usd: 40, p_ils: 150 }] },

  // Dior
  { o: { n: 'Sauvage', b: 'Dior', g: 'male', p_usd: 145, p_ils: 520, d: 'Radically fresh, raw and noble.' }, d: [{ n: 'Ventana', b: 'Armaf', s: 88, p_usd: 30, p_ils: 110 }, { n: 'Pride of Armaf', b: 'Armaf', s: 90, p_usd: 35, p_ils: 130 }] },
  { o: { n: 'Sauvage Elixir', b: 'Dior', g: 'male', p_usd: 180, p_ils: 680, d: 'A highly concentrated interpretation of Sauvage.' }, d: [{ n: 'Asad', b: 'Lattafa', s: 95, p_usd: 30, p_ils: 110 }] },
  { o: { n: 'Dior Homme Intense', b: 'Dior', g: 'male', p_usd: 150, p_ils: 560, d: 'The ultimate iris and woods.' }, d: [{ n: 'Kayaan Classic', b: 'Al Wataniah', s: 94, p_usd: 35, p_ils: 130 }] },
  { o: { n: 'Ambre Nuit', b: 'Dior', g: 'unisex', p_usd: 300, p_ils: 1100, d: 'A passionate encounter between rose and amber.' }, d: [{ n: 'Amber Night', b: 'Alexandria Fragrances', s: 92, p_usd: 60, p_ils: 220 }] },
  { o: { n: 'Hypnotic Poison', b: 'Dior', g: 'female', p_usd: 130, p_ils: 480, d: 'A magnetic vanilla and almond.' }, d: [{ n: 'Sweet Hope', b: 'La Rive', s: 85, p_usd: 15, p_ils: 50 }] },

  // Chanel
  { o: { n: 'Bleu de Chanel', b: 'Chanel', g: 'male', p_usd: 160, p_ils: 580, d: 'An intensely masculine, aromatic-woody trail.' }, d: [{ n: 'Missoni Parfum Pour Homme', b: 'Missoni', s: 87, p_usd: 45, p_ils: 170 }, { n: 'Club de Nuit Iconic', b: 'Armaf', s: 92, p_usd: 45, p_ils: 170 }] },
  { o: { n: 'Coco Mademoiselle', b: 'Chanel', g: 'female', p_usd: 160, p_ils: 580, d: 'Irresistibly sexy, irrepressibly spirited.' }, d: [{ n: 'Club de Nuit Woman', b: 'Armaf', s: 90, p_usd: 30, p_ils: 110 }, { n: 'Suddenly Madame Glamour', b: 'Lidl', s: 85, p_usd: 10, p_ils: 40 }] },
  { o: { n: 'Chance Eau Tendre', b: 'Chanel', g: 'female', p_usd: 150, p_ils: 550, d: 'A delicate and radiant floral fruity fragrance.' }, d: [{ n: 'Applejuice', b: 'Zara', s: 88, p_usd: 20, p_ils: 75 }] },

  // Yves Saint Laurent
  { o: { n: 'Black Opium', b: 'Yves Saint Laurent', g: 'female', p_usd: 155, p_ils: 550, d: 'A seductive coffee floral.' }, d: [{ n: 'Gardenia', b: 'Zara', s: 85, p_usd: 29, p_ils: 120 }] },
  { o: { n: 'Libre', b: 'Yves Saint Laurent', g: 'female', p_usd: 150, p_ils: 540, d: 'The fragrance of freedom.' }, d: [{ n: 'Golden Decade', b: 'Zara', s: 90, p_usd: 29, p_ils: 120 }] },
  { o: { n: 'Y Eau de Parfum', b: 'Yves Saint Laurent', g: 'male', p_usd: 145, p_ils: 520, d: 'A bold, fresh, and woody scent.' }, d: [{ n: 'Fakhar Black', b: 'Lattafa', s: 93, p_usd: 30, p_ils: 110 }] },
  { o: { n: 'La Nuit de l\'Homme', b: 'Yves Saint Laurent', g: 'male', p_usd: 130, p_ils: 480, d: 'A dark, handsome cardamom and lavender.' }, d: [{ n: 'F Black', b: 'Salvatore Ferragamo', s: 80, p_usd: 35, p_ils: 130 }] },
  { o: { n: 'Tuxedo', b: 'Yves Saint Laurent', g: 'unisex', p_usd: 270, p_ils: 1000, d: 'A spicy and woody oriental.' }, d: [{ n: 'Moustache Eau de Parfum', b: 'Rochas', s: 95, p_usd: 50, p_ils: 180 }, { n: 'Kismet for Men', b: 'Maison Alhambra', s: 92, p_usd: 35, p_ils: 130 }] },

  // Maison Margiela (REPLICA)
  { o: { n: 'By the Fireplace', b: 'Maison Margiela', g: 'unisex', p_usd: 160, p_ils: 580, d: 'Warm and sweet chestnut and vanilla.' }, d: [{ n: 'Ameer Al Oudh Intense Oud', b: 'Lattafa', s: 94, p_usd: 25, p_ils: 95 }] },
  { o: { n: 'Jazz Club', b: 'Maison Margiela', g: 'unisex', p_usd: 160, p_ils: 580, d: 'A smooth cocktail of rum and tobacco.' }, d: [{ n: 'Brooklyn Fragrance Lover', b: 'Alexandria Fragrances', s: 90, p_usd: 60, p_ils: 220 }] },

  // Mugler
  { o: { n: 'Alien', b: 'Mugler', g: 'female', p_usd: 130, p_ils: 480, d: 'A rich, mysterious jasmine.' }, d: [{ n: 'Sacrifice for Her', b: 'Ajmal', s: 90, p_usd: 25, p_ils: 95 }] },
  { o: { n: 'Angel', b: 'Mugler', g: 'female', p_usd: 130, p_ils: 480, d: 'A delicious blend of patchouli and chocolate.' }, d: [{ n: 'Wish', b: 'Chopard', s: 85, p_usd: 30, p_ils: 110 }] },

  // Giorgio Armani
  { o: { n: 'Acqua di Giò Profumo', b: 'Giorgio Armani', g: 'male', p_usd: 140, p_ils: 520, d: 'A deeply sophisticated marine and incense scent.' }, d: [{ n: 'Jorge Di Profumo', b: 'Maison Alhambra', s: 90, p_usd: 30, p_ils: 110 }] },
  { o: { n: 'Stronger With You', b: 'Giorgio Armani', g: 'male', p_usd: 110, p_ils: 400, d: 'A warm, sweet chestnut and vanilla.' }, d: [{ n: 'Your Touch', b: 'Maison Alhambra', s: 92, p_usd: 30, p_ils: 110 }] },
  { o: { n: 'My Way', b: 'Giorgio Armani', g: 'female', p_usd: 130, p_ils: 480, d: 'A bright floral bouquet.' }, d: [{ n: 'Sublime Epoque', b: 'Zara', s: 88, p_usd: 25, p_ils: 95 }] },
  { o: { n: 'Armani Code', b: 'Giorgio Armani', g: 'male', p_usd: 120, p_ils: 450, d: 'A timeless oriental.' }, d: [{ n: 'Black Tie', b: 'Fragrance World', s: 85, p_usd: 25, p_ils: 95 }] },

  // Paco Rabanne
  { o: { n: '1 Million', b: 'Paco Rabanne', g: 'male', p_usd: 105, p_ils: 390, d: 'A spicy leather and cinnamon bomb.' }, d: [{ n: 'Club de Nuit Man', b: 'Armaf', s: 88, p_usd: 30, p_ils: 110 }, { n: 'Halloween Man', b: 'Halloween', s: 85, p_usd: 35, p_ils: 130 }] },
  { o: { n: 'Invictus', b: 'Paco Rabanne', g: 'male', p_usd: 105, p_ils: 390, d: 'A fresh and sporty aquatic.' }, d: [{ n: 'Najdia', b: 'Lattafa', s: 90, p_usd: 25, p_ils: 95 }, { n: 'Hawas', b: 'Rasasi', s: 88, p_usd: 55, p_ils: 200 }] },
  { o: { n: 'Olympea', b: 'Paco Rabanne', g: 'female', p_usd: 105, p_ils: 390, d: 'A salty vanilla goddess.' }, d: [{ n: 'In Flames', b: 'La Rive', s: 85, p_usd: 15, p_ils: 50 }] },

  // Versace
  { o: { n: 'Eros', b: 'Versace', g: 'male', p_usd: 100, p_ils: 370, d: 'A loud, sweet mint and vanilla.' }, d: [{ n: 'Versencia Oro', b: 'Maison Alhambra', s: 92, p_usd: 25, p_ils: 95 }] },
  { o: { n: 'Crystal Noir', b: 'Versace', g: 'female', p_usd: 95, p_ils: 350, d: 'A dark, creamy coconut and gardenia.' }, d: [{ n: 'Versencia Crystal', b: 'Maison Alhambra', s: 88, p_usd: 25, p_ils: 95 }] },
  { o: { n: 'Bright Crystal', b: 'Versace', g: 'female', p_usd: 95, p_ils: 350, d: 'A fresh, vibrant floral.' }, d: [{ n: 'Woman', b: 'La Rive', s: 85, p_usd: 15, p_ils: 50 }] },
  
  // Carolina Herrera
  { o: { n: 'Good Girl', b: 'Carolina Herrera', g: 'female', p_usd: 130, p_ils: 480, d: 'A complex, sweet, and dark floral.' }, d: [{ n: 'Deep Garden', b: 'Zara', s: 85, p_usd: 25, p_ils: 95 }, { n: 'Miss Dream', b: 'La Rive', s: 80, p_usd: 15, p_ils: 50 }] },
  { o: { n: 'Bad Boy', b: 'Carolina Herrera', g: 'male', p_usd: 110, p_ils: 400, d: 'A spicy, sweet cacao.' }, d: [{ n: 'Bad Homme', b: 'Maison Alhambra', s: 90, p_usd: 30, p_ils: 110 }] },

  // Tom Ford (more)
  { o: { n: 'Plum Japonais', b: 'Tom Ford', g: 'unisex', p_usd: 395, p_ils: 1450, d: 'A discontinued masterpiece of plum and spices.' }, d: [{ n: 'Forbidden Plum', b: 'Alexandria Fragrances', s: 95, p_usd: 60, p_ils: 220 }] },
  { o: { n: 'Rose Prick', b: 'Tom Ford', g: 'unisex', p_usd: 395, p_ils: 1450, d: 'A wild bouquet of roses.' }, d: [{ n: 'Rose Petals', b: 'Maison Alhambra', s: 90, p_usd: 35, p_ils: 130 }] },

  // Jo Malone
  { o: { n: 'Wood Sage & Sea Salt', b: 'Jo Malone', g: 'unisex', p_usd: 165, p_ils: 600, d: 'A fresh, salty coastal breeze.' }, d: [{ n: 'Ebony Wood', b: 'Zara', s: 80, p_usd: 35, p_ils: 130 }] },
  { o: { n: 'Myrrh & Tonka', b: 'Jo Malone', g: 'unisex', p_usd: 220, p_ils: 800, d: 'A rich, warm, and sweet resinous scent.' }, d: [{ n: 'Rich Warm Addictive', b: 'Zara', s: 85, p_usd: 25, p_ils: 95 }] },

  // Le Male & Flankers
  { o: { n: 'Le Male Le Parfum', b: 'Jean Paul Gaultier', g: 'male', p_usd: 120, p_ils: 450, d: 'An elegant, spicy vanilla and cardamom.' }, d: [{ n: 'Glacier Le Noir', b: 'Maison Alhambra', s: 92, p_usd: 30, p_ils: 110 }] },
  { o: { n: 'Ultra Male', b: 'Jean Paul Gaultier', g: 'male', p_usd: 110, p_ils: 400, d: 'A sweet, loud pear and vanilla.' }, d: [{ n: '9pm', b: 'Afnan', s: 96, p_usd: 35, p_ils: 130 }] },
  { o: { n: 'Scandal Pour Homme', b: 'Jean Paul Gaultier', g: 'male', p_usd: 110, p_ils: 400, d: 'A sweet caramel and tonka.' }, d: [{ n: 'Odyssey Tyrant', b: 'Armaf', s: 90, p_usd: 35, p_ils: 130 }] },

  // Lancome
  { o: { n: 'La Vie Est Belle', b: 'Lancôme', g: 'female', p_usd: 150, p_ils: 550, d: 'A joyful, sweet praline and iris.' }, d: [{ n: 'Queen of Life', b: 'La Rive', s: 85, p_usd: 15, p_ils: 50 }] },
  { o: { n: 'Idôle', b: 'Lancôme', g: 'female', p_usd: 130, p_ils: 480, d: 'A modern, clean rose.' }, d: [{ n: 'Aura', b: 'Armaf', s: 88, p_usd: 35, p_ils: 130 }] },

  // Bvlgari
  { o: { n: 'Tygar', b: 'Bvlgari', g: 'male', p_usd: 400, p_ils: 1500, d: 'A sparkling grapefruit and ambroxan masterpiece.' }, d: [{ n: 'Turathi Blue', b: 'Afnan', s: 95, p_usd: 40, p_ils: 150 }, { n: 'Theoreme', b: 'Rue Broca', s: 94, p_usd: 30, p_ils: 110 }] },

  // Marc Jacobs
  { o: { n: 'Daisy', b: 'Marc Jacobs', g: 'female', p_usd: 120, p_ils: 450, d: 'A youthful, sunny floral.' }, d: [{ n: 'Applejuice', b: 'Zara', s: 80, p_usd: 20, p_ils: 75 }] },

  // Roja Parfums
  { o: { n: 'Elysium Pour Homme', b: 'Roja Parfums', g: 'male', p_usd: 315, p_ils: 1180, d: 'An ultra-fresh, sparkling citrus and vetiver.' }, d: [{ n: 'Zion', b: 'Alexandria Fragrances', s: 92, p_usd: 65, p_ils: 240 }, { n: 'Imperium', b: 'Fragrance World', s: 85, p_usd: 35, p_ils: 130 }] },

  // Initio
  { o: { n: 'Oud for Greatness', b: 'Initio', g: 'unisex', p_usd: 390, p_ils: 1450, d: 'A majestic, spicy oud and saffron.' }, d: [{ n: 'Oud for Glory', b: 'Lattafa', s: 96, p_usd: 35, p_ils: 130 }] },
  { o: { n: 'Side Effect', b: 'Initio', g: 'unisex', p_usd: 350, p_ils: 1300, d: 'A boozy, sweet vanilla and rum.' }, d: [{ n: 'After Effect', b: 'Fragrance World', s: 93, p_usd: 40, p_ils: 150 }] },

  // Tiziana Terenzi
  { o: { n: 'Kirke', b: 'Tiziana Terenzi', g: 'unisex', p_usd: 250, p_ils: 950, d: 'A luscious, tropical fruit bomb.' }, d: [{ n: 'Confidential Private Gold', b: 'Lattafa', s: 94, p_usd: 30, p_ils: 110 }] },

  // Nishane
  { o: { n: 'Hacivat', b: 'Nishane', g: 'unisex', p_usd: 260, p_ils: 980, d: 'A mossy, pineapple powerhouse.' }, d: [{ n: 'Supremacy Not Only Intense', b: 'Afnan', s: 92, p_usd: 55, p_ils: 200 }] },
  { o: { n: 'Ani', b: 'Nishane', g: 'unisex', p_usd: 260, p_ils: 980, d: 'A spicy, green vanilla.' }, d: [{ n: 'Nasheet', b: 'Lattafa', s: 85, p_usd: 25, p_ils: 95 }] },

  // Louis Vuitton
  { o: { n: 'Ombre Nomade', b: 'Louis Vuitton', g: 'unisex', p_usd: 385, p_ils: 1450, d: 'A powerful, dark raspberry and oud.' }, d: [{ n: 'Jean Lowe Ombre', b: 'Maison Alhambra', s: 92, p_usd: 40, p_ils: 150 }] },
  { o: { n: 'L\'Immensité', b: 'Louis Vuitton', g: 'male', p_usd: 320, p_ils: 1200, d: 'A sharp, fresh ginger and amber.' }, d: [{ n: 'Jean Lowe Immortal', b: 'Maison Alhambra', s: 94, p_usd: 40, p_ils: 150 }] },
  { o: { n: 'Nouveau Monde', b: 'Louis Vuitton', g: 'male', p_usd: 320, p_ils: 1200, d: 'A rich cocoa and oud.' }, d: [{ n: 'Jean Lowe Nouveau', b: 'Maison Alhambra', s: 93, p_usd: 40, p_ils: 150 }] },

  // Bond No. 9
  { o: { n: 'Bleecker Street', b: 'Bond No. 9', g: 'unisex', p_usd: 320, p_ils: 1200, d: 'A fresh, green, blueberry scent.' }, d: [{ n: 'Emerald Street', b: 'Alexandria Fragrances', s: 92, p_usd: 60, p_ils: 220 }] },
  { o: { n: 'Lafayette Street', b: 'Bond No. 9', g: 'unisex', p_usd: 320, p_ils: 1200, d: 'An amber fougere with vanilla and apple.' }, d: [{ n: 'Vanguard', b: 'Alexandria Fragrances', s: 90, p_usd: 60, p_ils: 220 }] },

  // Penhaligon's
  { o: { n: 'Halfeti', b: 'Penhaligon\'s', g: 'unisex', p_usd: 275, p_ils: 1050, d: 'A dark, spicy rose and oud.' }, d: [{ n: 'Chants Tenderina', b: 'Maison Alhambra', s: 80, p_usd: 35, p_ils: 130 }] },
  { o: { n: 'The Tragedy of Lord George', b: 'Penhaligon\'s', g: 'male', p_usd: 310, p_ils: 1180, d: 'A boozy, shaving soap barbershop.' }, d: [{ n: 'Monarch', b: 'Fragrance World', s: 90, p_usd: 35, p_ils: 130 }] },

  // Amouage
  { o: { n: 'Interlude Man', b: 'Amouage', g: 'male', p_usd: 360, p_ils: 1350, d: 'The blue beast of oregano and incense.' }, d: [{ n: 'Midnight Oud', b: 'Ard Al Zaafaran', s: 94, p_usd: 25, p_ils: 95 }, { n: 'Shaghaf Oud Abyad', b: 'Swiss Arabian', s: 92, p_usd: 45, p_ils: 170 }] },
  { o: { n: 'Reflection Man', b: 'Amouage', g: 'male', p_usd: 360, p_ils: 1350, d: 'A clean, powdery white floral for men.' }, d: [{ n: 'Shiyaaka', b: 'Khadlaj', s: 92, p_usd: 35, p_ils: 130 }] },

  // Hermes
  { o: { n: 'Terre d\'Hermes', b: 'Hermès', g: 'male', p_usd: 140, p_ils: 520, d: 'An earthy, woody orange.' }, d: [{ n: 'Fattan', b: 'Rasasi', s: 90, p_usd: 25, p_ils: 95 }] },
  
  // Prada
  { o: { n: 'L\'Homme', b: 'Prada', g: 'male', p_usd: 120, p_ils: 450, d: 'The ultimate clean, soapy iris office scent.' }, d: [{ n: 'Evoke Gold for Him', b: 'Ajmal', s: 92, p_usd: 35, p_ils: 130 }] },
  { o: { n: 'Prada Paradoxe', b: 'Prada', g: 'female', p_usd: 140, p_ils: 520, d: 'A sweet, ambery white floral.' }, d: [{ n: 'Paradox', b: 'Maison Alhambra', s: 90, p_usd: 30, p_ils: 110 }] },

  // Mancera
  { o: { n: 'Cedrat Boise', b: 'Mancera', g: 'unisex', p_usd: 180, p_ils: 680, d: 'A fruity, woody, slightly smoky scent.' }, d: [{ n: 'Intense Cedrat Boise', b: 'Mancera', s: 95, p_usd: 200, p_ils: 750 }] },

  // Dolce & Gabbana
  { o: { n: 'Light Blue Eau Intense', b: 'Dolce & Gabbana', g: 'female', p_usd: 115, p_ils: 430, d: 'A refreshing blast of lemon and crisp apple.' }, d: [{ n: 'Donna', b: 'La Rive', s: 80, p_usd: 15, p_ils: 50 }] },
  { o: { n: 'The One for Men EDP', b: 'Dolce & Gabbana', g: 'male', p_usd: 115, p_ils: 430, d: 'A warm, romantic amber and tobacco.' }, d: [{ n: 'Dream Catcher', b: 'Paris Corner', s: 90, p_usd: 35, p_ils: 130 }] },

  // Givenchy
  { o: { n: 'L\'Interdit', b: 'Givenchy', g: 'female', p_usd: 130, p_ils: 480, d: 'A bold, dark underground flower.' }, d: [{ n: 'Fakhar Rose', b: 'Lattafa', s: 92, p_usd: 30, p_ils: 110 }] },
  { o: { n: 'Gentleman Reserve Privee', b: 'Givenchy', g: 'male', p_usd: 125, p_ils: 470, d: 'A whiskey-infused iris.' }, d: [{ n: 'Kayaan Classic', b: 'Al Wataniah', s: 85, p_usd: 35, p_ils: 130 }] },

  // BDK Parfums
  { o: { n: 'Gris Charnel', b: 'BDK Parfums', g: 'unisex', p_usd: 210, p_ils: 780, d: 'A creamy, spicy fig and sandalwood tea.' }, d: [{ n: 'Francique 79.9', b: 'Fragrance World', s: 93, p_usd: 40, p_ils: 150 }] },
  { o: { n: 'Rouge Smoking', b: 'BDK Parfums', g: 'unisex', p_usd: 210, p_ils: 780, d: 'A sweet cherry and vanilla tobacco.' }, d: [{ n: 'Francique 63.55', b: 'Fragrance World', s: 90, p_usd: 40, p_ils: 150 }] },

  // Clive Christian
  { o: { n: 'X for Men', b: 'Clive Christian', g: 'male', p_usd: 395, p_ils: 1480, d: 'A commanding spicy woody oriental.' }, d: [{ n: 'X-Centric', b: 'Alexandria Fragrances', s: 88, p_usd: 65, p_ils: 240 }] },

  // Memo Paris
  { o: { n: 'African Leather', b: 'Memo Paris', g: 'unisex', p_usd: 310, p_ils: 1180, d: 'A warm, spicy cardamom and leather.' }, d: [{ n: 'Afro Leather', b: 'Maison Alhambra', s: 92, p_usd: 35, p_ils: 130 }] },
  { o: { n: 'Irish Leather', b: 'Memo Paris', g: 'unisex', p_usd: 310, p_ils: 1180, d: 'A green, aromatic leather.' }, d: [{ n: 'Irish', b: 'Maison Alhambra', s: 89, p_usd: 35, p_ils: 130 }] },

  // Stephane Humbert Lucas
  { o: { n: 'God of Fire', b: 'Stéphane Humbert Lucas', g: 'unisex', p_usd: 350, p_ils: 1300, d: 'A vibrant mango and ginger.' }, d: [{ n: 'God of Flame', b: 'Alexandria Fragrances', s: 94, p_usd: 65, p_ils: 240 }] }
];

const images = [
  'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1595346083584-6338b2518c0c?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1616855364132-720c2b29598a?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1595425970377-c9703bc48b2d?q=80&w=600&auto=format&fit=crop'
];

let sql = `-- MatchScent Supabase Data Seed (100+ Perfumes)\n\n`;

// Insert perfumes
sql += `INSERT INTO perfumes (id, name, brand, gender, price_usd, price_ils, description, image_url) VALUES\n`;

const perfumeLines = [];
const allDupes = [];

data.forEach((item, index) => {
  const pId = uuidv4();
  const o = item.o;
  const image = images[index % images.length];
  
  perfumeLines.push(`  ('${pId}', '${o.n.replace(/'/g, "''")}', '${o.b.replace(/'/g, "''")}', '${o.g}', ${o.p_usd}, ${o.p_ils}, '${o.d.replace(/'/g, "''")}', '${image}')`);
  
  item.d.forEach((dupe) => {
    const dImage = images[(index + 1) % images.length]; // slightly vary dupes image
    allDupes.push(`  ('${pId}', '${dupe.n.replace(/'/g, "''")}', '${dupe.b.replace(/'/g, "''")}', ${dupe.s}, ${dupe.p_usd}, ${dupe.p_ils}, 'https://ksp.co.il', 'https://amazon.com', '${dImage}')`);
  });
});

sql += perfumeLines.join(',\n') + `\nON CONFLICT (id) DO NOTHING;\n\n`;

sql += `-- Insert Dupes\n`;
sql += `INSERT INTO dupes (original_perfume_id, name, brand, similarity_score, price_usd, price_ils, purchase_link_il, purchase_link_amazon, image_url) VALUES\n`;
sql += allDupes.join(',\n') + `;\n`;

fs.writeFileSync('seed_100_perfumes.sql', sql, 'utf8');
console.log(`Generated seed_100_perfumes.sql with ${data.length} original perfumes and ${allDupes.length} dupes.`);
