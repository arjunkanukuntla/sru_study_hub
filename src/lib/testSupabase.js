import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ltuiaawnuwmhkrbdvqnn.supabase.co'
const supabaseAnonKey = 'sb_publishable_b_6j80p0guOAp9YOF6_tGQ_rX49nSxk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  console.log('Testing Supabase queries...')
  const { data: papers, error: pErr } = await supabase.from('papers').select('*')
  console.log('Papers count:', papers?.length, 'Error:', pErr)

  const { data: subjects, error: sErr } = await supabase.from('subjects').select('*')
  console.log('Subjects count:', subjects?.length, 'Error:', sErr)

  const { data: resources, error: rErr } = await supabase.from('resources').select('*')
  console.log('Resources count:', resources?.length, 'Error:', rErr)
}

test()
