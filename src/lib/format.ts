export const usd = (n?: number | null) => (n ? `$${Math.round(n).toLocaleString('en-US')}` : null);
export const ils = (n?: number | null) => (n ? `₪${Math.round(n).toLocaleString('en-US')}` : null);

export const audienceLabel = (gender?: string | null) =>
  gender === 'male' ? 'For him' : gender === 'female' ? 'For her' : 'Unisex';
