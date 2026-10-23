import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

console.log('🔍 DEBUG - URL:', supabaseUrl)
console.log('🔍 DEBUG - KEY exists:', !!supabaseKey, 'Length:', supabaseKey?.length)
console.log('🔍 DEBUG - KEY starts with:', supabaseKey?.substring(0, 20))

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ MISSING ENV! Check .env file!')
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '')

export function initDB() {
  return true
}

export default supabase