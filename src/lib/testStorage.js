import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ltuiaawnuwmhkrbdvqnn.supabase.co'
const supabaseAnonKey = 'sb_publishable_b_6j80p0guOAp9YOF6_tGQ_rX49nSxk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testStorage() {
  console.log('Testing Supabase Storage upload...')
  const testBlob = new Blob(['Hello SRU Study Hub'], { type: 'text/plain' })
  const fileName = `test_${Date.now()}.txt`

  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from('papers')
    .upload(fileName, testBlob, { upsert: true })

  console.log('Storage Upload Result:', uploadData, 'Error:', uploadErr)

  if (!uploadErr) {
    const { data: publicUrlData } = supabase.storage.from('papers').getPublicUrl(fileName)
    console.log('Public URL:', publicUrlData.publicUrl)
  }
}

testStorage()
