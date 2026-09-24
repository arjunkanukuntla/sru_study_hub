import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ltuiaawnuwmhkrbdvqnn.supabase.co'
const supabaseAnonKey = 'sb_publishable_b_6j80p0guOAp9YOF6_tGQ_rX49nSxk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testInsert() {
  const subId = crypto.randomUUID()
  console.log('Testing insert into subjects with UUID:', subId)
  const testSub = {
    id: subId,
    name: 'Electrical Engineering',
    code: `EEE${Math.floor(Math.random() * 1000)}`,
    branch_id: null,
    semester_id: 'sem1',
    semester_num: 1,
    credits: 3,
    type: 'theory',
    units_count: 5
  }
  const { data: sData, error: sErr } = await supabase.from('subjects').insert([testSub]).select()
  console.log('Subject Insert Result:', sData, 'Error:', sErr)

  const paperId = crypto.randomUUID()
  console.log('Testing insert into papers with UUID:', paperId)
  const testPaper = {
    id: paperId,
    subject_id: subId,
    subject_name: 'Electrical Engineering',
    branch_code: 'CSE-AIML',
    exam_type: 'mid1',
    exam_label: 'Mid Term 1',
    academic_year: '2025-26',
    semester_number: 1,
    file_url: 'data:text/plain;base64,VGVzdA==',
    uploaded_by: 'user_test',
    verification_status: 'verified',
    file_size: 100,
    sha256: `sha-${Date.now()}`
  }
  const { data: pData, error: pErr } = await supabase.from('papers').insert([testPaper]).select()
  console.log('Paper Insert Result:', pData, 'Error:', pErr)
}

testInsert()
