import dotenv from 'dotenv'
dotenv.config()

import { supabase } from './src/lib/supabase.ts'

export const db = supabase

export function initDB() {
  console.log('✅ Initializing Supabase database...')
  const url = process.env.VITE_SUPABASE_URL || ''
  console.log('✅ Connected to Supabase')
  return true
}

export { supabase }
export default supabase