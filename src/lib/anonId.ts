// Anonymous user ID — generated once per device, stored in localStorage
// No personal info, no IP tracking, just a random UUID for rate-limiting/contributor credit

const ANON_ID_KEY = 'sru_anon_id'

export function getAnonId(): string {
  let id = localStorage.getItem(ANON_ID_KEY)
  if (!id) {
    id = `user_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`
    localStorage.setItem(ANON_ID_KEY, id)
  }
  return id
}

export function clearAnonId(): void {
  localStorage.removeItem(ANON_ID_KEY)
}
