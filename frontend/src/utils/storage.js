const KEY = 'vue3-account-book:bills'

export function loadBills() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return []
  }
}

export function saveBills(bills) {
  localStorage.setItem(KEY, JSON.stringify(bills))
}
