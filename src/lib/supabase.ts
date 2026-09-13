import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Perfume = {
  id: string
  name: string
  brand: string
  image_url: string
  description: string
  price_usd: number
  price_ils: number
  gender: string
}

export type LivePrice = {
  store: string;
  price: string;
  link: string;
}

export type Dupe = {
  id: string
  original_perfume_id: string
  name: string
  brand: string
  image_url: string
  similarity_score: number
  price_usd: number
  price_ils: number
  purchase_link_il: string
  purchase_link_amazon: string
  notes: string
  live_prices_il?: LivePrice[]
  live_prices_amazon?: LivePrice[]
}
