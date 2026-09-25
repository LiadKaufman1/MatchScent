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

// The catalogue (perfumes + similar scents) is read by every page render, and it holds thousands of rows: reading it
// afresh for each of ~3,000 pages of a build or for every visit moved gigabytes out of the database. This client
// lets Next keep each answer for 5 minutes and share it between all renders (the tag "catalog" is refreshed at once
// after an admin edit). Only for reads that may be a few minutes old; votes and reviews use getSupabase().
let catalogClient: SupabaseClient | null = null

export function getCatalogSupabase(): SupabaseClient {
  if (!catalogClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anonKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set')
    }
    catalogClient = createClient(url, anonKey, {
      global: { fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 300, tags: ['catalog'] } }) },
    })
  }
  return catalogClient
}

// Top / heart / base notes (English names). A fragrance without that split uses only "notes".
export type NotePyramid = { top?: string[]; heart?: string[]; base?: string[]; notes?: string[] }

export type Perfume = {
  id: string
  name: string
  brand: string
  image_url: string
  description: string
  price_usd: number
  price_ils: number
  gender: string
  note_pyramid?: NotePyramid | null
  year?: number | null
  perfumers?: string[] | null
  accords?: string[] | null
}

export type LivePrice = {
  store: string;
  price: string;
  link: string;
}

export type Profile = {
  id: string
  display_name: string
  created_at: string
}

export type Rating = {
  id: string
  perfume_id: string
  user_id: string
  score: number
  scent?: number | null
  longevity?: number | null
  sillage?: number | null
  bottle?: number | null
  value?: number | null
  created_at: string
}

export type Review = {
  id: string
  perfume_id: string
  user_id: string
  body: string
  created_at: string
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
  note_pyramid?: NotePyramid | null
  // The perfume row of this fragrance (its own page); added by the v5 migration.
  inspired_perfume_id?: string | null
  live_prices_il?: LivePrice[]
  live_prices_amazon?: LivePrice[]
}
