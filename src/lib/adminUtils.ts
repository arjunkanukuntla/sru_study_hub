/**
 * Admin utility functions — report management, content deletion,
 * site settings (maintenance mode), and paper/resource queries.
 */
import { supabase } from './supabase'

const ADMIN_KEY = 'sru_admin_token'
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin2024sru'

export function isLocalEnvironment(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]' ||
    host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    host.endsWith('.local')
  )
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export function adminLogin(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    localStorage.setItem(ADMIN_KEY, btoa(password + Date.now()))
    return true
  }
  return false
}

export function adminLogout(): void {
  localStorage.removeItem(ADMIN_KEY)
}

export function isAdminLoggedIn(): boolean {
  const token = localStorage.getItem(ADMIN_KEY)
  return !!token && isLocalEnvironment()
}

// ─── Reports ───────────────────────────────────────────────────────────────

export interface Report {
  id: string
  paper_id?: string
  resource_id?: string
  reason: string
  message?: string
  anon_id?: string
  reported_at: string
  status: 'open' | 'reviewed' | 'dismissed'
  // joined from papers
  paper_title?: string
  paper_subject?: string
}

export async function submitReport(opts: {
  paperId?: string
  resourceId?: string
  reason: string
  message?: string
  anonId: string
}): Promise<{ ok: boolean; alreadyReported?: boolean }> {
  // Check if this anon already reported this item
  const targetField = opts.paperId ? 'paper_id' : 'resource_id'
  const targetVal   = opts.paperId || opts.resourceId

  const { data: existing } = await supabase
    .from('reports')
    .select('id')
    .eq(targetField, targetVal!)
    .eq('anon_id', opts.anonId)
    .maybeSingle()

  if (existing) return { ok: false, alreadyReported: true }

  const { error } = await supabase.from('reports').insert({
    paper_id:    opts.paperId    || null,
    resource_id: opts.resourceId || null,
    reason:      opts.reason,
    message:     opts.message    || null,
    anon_id:     opts.anonId,
    status:      'open',
  })

  if (error) { console.error('submitReport:', error.message); return { ok: false } }

  // Increment report_count on the paper/resource
  if (opts.paperId) {
    try {
      const { error: rpcErr } = await supabase.rpc('increment_paper_reports', { pid: opts.paperId })
      if (rpcErr) throw rpcErr
    } catch {
      // Fallback: read then write
      const { data } = await supabase.from('papers').select('report_count').eq('id', opts.paperId).single()
      if (data) {
        await supabase.from('papers').update({ report_count: (data.report_count || 0) + 1 }).eq('id', opts.paperId)
      }
    }
  }

  return { ok: true }
}

export async function fetchAllReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('reported_at', { ascending: false })
  if (error) { console.error('fetchAllReports:', error.message); return [] }
  return (data || []) as Report[]
}

export async function updateReportStatus(reportId: string, status: 'reviewed' | 'dismissed'): Promise<void> {
  await supabase.from('reports').update({ status }).eq('id', reportId)
}

// ─── Content Management ────────────────────────────────────────────────────

export async function fetchAllPapersAdmin() {
  const { data, error } = await supabase
    .from('papers')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { console.error('fetchAllPapersAdmin:', error.message); return [] }
  return data || []
}

export async function fetchAllResourcesAdmin() {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { console.error('fetchAllResourcesAdmin:', error.message); return [] }
  return data || []
}

import { useAppStore } from './store'

export async function deleteContent(
  table: 'papers' | 'resources',
  id: string,
  fileUrl?: string
): Promise<{ ok: boolean; error?: string }> {
  // 1. Delete from DB
  const { error: dbErr } = await supabase.from(table).delete().eq('id', id)
  if (dbErr) return { ok: false, error: dbErr.message }

  // 2. Try to delete from Storage (best effort)
  if (fileUrl) {
    try {
      const bucket = table === 'papers' ? 'papers' : 'resources'
      // Extract path from URL: everything after /storage/v1/object/public/<bucket>/
      const marker = `/object/public/${bucket}/`
      const idx = fileUrl.indexOf(marker)
      if (idx !== -1) {
        const path = decodeURIComponent(fileUrl.slice(idx + marker.length))
        await supabase.storage.from(bucket).remove([path])
      }
    } catch (e) {
      console.warn('Storage delete failed (DB delete succeeded):', e)
    }
  }

  // 3. Also dismiss all reports for this item
  await supabase.from('reports').update({ status: 'dismissed' })
    .eq(table === 'papers' ? 'paper_id' : 'resource_id', id)

  // 4. Immediately update Zustand store state
  const store = useAppStore.getState()
  if (table === 'papers') store.deletePaper?.(id)
  else store.deleteResource?.(id)

  return { ok: true }
}

// ─── Site Settings (Maintenance Mode) ──────────────────────────────────────

export interface SiteSettings {
  maintenance_mode: boolean
  maintenance_message: string
  announcement: string
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data } = await supabase.from('site_settings').select('*')
  const map: Record<string, string> = {}
  ;(data || []).forEach((row: { key: string; value: string }) => { map[row.key] = row.value })
  return {
    maintenance_mode:    map['maintenance_mode'] === 'true',
    maintenance_message: map['maintenance_message'] || 'We are down for scheduled maintenance.',
    announcement:        map['announcement'] || '',
  }
}

export async function updateSiteSettings(patch: Partial<SiteSettings>): Promise<void> {
  const rows = []
  if (patch.maintenance_mode !== undefined)
    rows.push({ key: 'maintenance_mode', value: String(patch.maintenance_mode) })
  if (patch.maintenance_message !== undefined)
    rows.push({ key: 'maintenance_message', value: patch.maintenance_message })
  if (patch.announcement !== undefined)
    rows.push({ key: 'announcement', value: patch.announcement })

  for (const row of rows) {
    await supabase.from('site_settings').upsert(row, { onConflict: 'key' })
  }
}
