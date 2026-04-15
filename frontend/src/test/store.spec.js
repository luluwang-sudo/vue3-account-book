import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const STORAGE_KEY = 'vue3-account-book:bills'

async function freshStore() {
  // Re-import store module so loadBills() reads current localStorage state
  vi.resetModules()
  const mod = await import('../store/bill.js')
  setActivePinia(createPinia())
  return mod.useBillStore()
}

describe('Pinia bill store - localStorage 持久化', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('初始化时 localStorage 为空 -> bills 为空数组', async () => {
    const store = await freshStore()
    expect(store.bills).toEqual([])
  })

  it('初始化时能从 localStorage 读取已有账单', async () => {
    const seed = [
      { id: 'a1', type: 'expense', amount: 10, category: '餐饮', date: '2026-04-01', remark: '' }
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    const store = await freshStore()
    expect(store.bills).toHaveLength(1)
    expect(store.bills[0].id).toBe('a1')
  })

  it('损坏的 JSON 不应抛出，bills 退化为空数组', async () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    const store = await freshStore()
    expect(store.bills).toEqual([])
  })

  it('addBill 后会同步写入 localStorage 并自动生成 id', async () => {
    const store = await freshStore()
    store.addBill({
      type: 'expense',
      amount: 20,
      category: '餐饮',
      date: '2026-04-10',
      remark: '午饭'
    })
    expect(store.bills).toHaveLength(1)
    expect(store.bills[0].id).toBeTruthy()

    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].amount).toBe(20)
    expect(parsed[0].category).toBe('餐饮')
  })

  it('removeBill 按 id 删除并同步 localStorage', async () => {
    const store = await freshStore()
    store.addBill({ type: 'expense', amount: 5, category: '餐饮', date: '2026-04-10', remark: '' })
    store.addBill({ type: 'income', amount: 100, category: '工资', date: '2026-04-11', remark: '' })
    const idToRemove = store.bills[0].id
    store.removeBill(idToRemove)

    expect(store.bills).toHaveLength(1)
    expect(store.bills.find((b) => b.id === idToRemove)).toBeUndefined()

    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(parsed).toHaveLength(1)
  })

  it('persist 显式调用也会写入 localStorage', async () => {
    const store = await freshStore()
    store.bills = [
      { id: 'x', type: 'income', amount: 1, category: '工资', date: '2026-04-01', remark: '' }
    ]
    store.persist()
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toHaveLength(1)
  })
})
