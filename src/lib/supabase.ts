import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Created on first use (not when the file loads), so a missing variable cannot
// crash the build. Callers check that the variables exist before using it.
let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anonKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set')
    }
    client = createClient(url, anonKey)
  }
  return client
}

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
