import { supabase } from './lib/supabaseClient'

async function testConnection() {
  const { data, error } = await supabase
    .from('test')
    .select('*')

  if (error) {
    console.error('❌ Supabase error:', error.message)
    return
  }

  console.log('✅ Supabase data:', data)
}

testConnection()