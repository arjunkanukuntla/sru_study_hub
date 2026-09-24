import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ltuiaawnuwmhkrbdvqnn.supabase.co'
const supabaseAnonKey = 'sb_publishable_b_6j80p0guOAp9YOF6_tGQ_rX49nSxk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testInsert() {
  console.log('Testing insert into subjects...')
  const testSub = {
    id: `sub-test-${Date.now()}`,
    name: 'Test Subject',
    code: `TEST${Math.floor(Math.random() * 1000)}`,
    branch_id: 'cse',
    semester_id: 'sem1',
    credits: 3,
    type: 'theory',
    units_count: 5
  }
  const { data: sData, error: sErr } = await supabase.from('subjects').insert([testSub]).select()
  console.log('Subject Insert Result:', sData, 'Error:', sErr)

  console.log('Testing insert into papers...')
  const testPaper = {
    id: `paper-test-${Date.now()}`,
    subject_id: testSub.id,
    subject_name: 'Test Subject',
    branch_code: 'CSE',
    exam_type: 'midterm',
    exam_label: 'Mid Term',
    academic_year: '2025-26',
    semester_number: 1,
    file_url: 'data:text/plain;base64,VGVzdA==',
    uploaded_by: 'user_test',
    verification_status: 'verified',
    file_size: 100,
    sha256: 'testsha256'
  }
  const { data: pData, error: pErr } = await supabase.from('papers').insert([testPaper]).select()
  console.log('Paper Insert Result:', pData, 'Error:', pErr)
}

testInsert()
