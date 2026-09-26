
export const audienceLabel = (gender?: string | null) =>
  gender === 'male' ? 'For him' : gender === 'female' ? 'For her' : 'Unisex';
