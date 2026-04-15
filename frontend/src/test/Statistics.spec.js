// 顶部统计组件测试 —— 真实组件名 StatCard.vue
// 校验：当月账单过滤 + 收入/支出/结余计算（getter monthlyStats）
// + StatCard 组件展示。
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import StatCard from '../components/StatCard.vue'

async function freshStore() {
  vi.resetModules()
  const mod = await import('../store/bill.js')
  setActivePinia(createPinia())
  return mod.useBillStore()
}

describe('StatCard 组件 - 展示统计数字', () => {
  it('正确格式化并展示收入/支出/结余', () => {
    const stats = { income: 1234.5, expense: 234.5, balance: 1000 }
    const wrapper = mount(StatCard, { props: { stats } })
    const text = wrapper.text()
    expect(text).toContain('本月结余')
    expect(text).toContain('1,000.00')
    expect(text).toContain('1,234.50')
    expect(text).toContain('234.50')
  })

  it('收入/支出为 0 时也能渲染', () => {
    const wrapper = mount(StatCard, {
      props: { stats: { income: 0, expense: 0, balance: 0 } }
    })
    // 应出现 3 次 0.00
    expect(wrapper.text().match(/0\.00/g)?.length).toBeGreaterThanOrEqual(3)
  })
})

describe('monthlyStats getter - 当月账单过滤与汇总', () => {
  beforeEach(() => {
    localStorage.clear()
    // 固定"当前时间"为 2026-04-14，与 currentDate 对齐
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-14T08:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('空账单时全部为 0', async () => {
    const store = await freshStore()
    expect(store.monthlyStats).toEqual({ income: 0, expense: 0, balance: 0 })
  })

  it('只统计当月账单，并正确计算收入/支出/结余', async () => {
    const store = await freshStore()
    store.bills = [
      // 当月（2026-04）
      { id: '1', type: 'income', amount: 1000, category: '工资', date: '2026-04-01', remark: '' },
      { id: '2', type: 'income', amount: 200.5, category: '兼职', date: '2026-04-10', remark: '' },
      { id: '3', type: 'expense', amount: 50, category: '餐饮', date: '2026-04-12', remark: '' },
      { id: '4', type: 'expense', amount: 25.25, category: '交通', date: '2026-04-14', remark: '' },
      // 非当月，应被过滤
      { id: '5', type: 'income', amount: 9999, category: '工资', date: '2026-03-31', remark: '' },
      { id: '6', type: 'expense', amount: 8888, category: '购物', date: '2026-05-01', remark: '' },
      // 异常 date（非字符串）应被忽略
      { id: '7', type: 'expense', amount: 1, category: '其他', date: 20260410, remark: '' }
    ]
    const s = store.monthlyStats
    expect(s.income).toBe(1200.5)
    expect(s.expense).toBe(75.25)
    expect(s.balance).toBe(+(1200.5 - 75.25).toFixed(2))
  })

  it('amount 为非法值时按 0 计算', async () => {
    const store = await freshStore()
    store.bills = [
      { id: 'a', type: 'income', amount: 'abc', category: '工资', date: '2026-04-01', remark: '' },
      { id: 'b', type: 'expense', amount: null, category: '餐饮', date: '2026-04-02', remark: '' }
    ]
    expect(store.monthlyStats).toEqual({ income: 0, expense: 0, balance: 0 })
  })

  it('未知 type 默认归类为支出（与实现一致）', async () => {
    const store = await freshStore()
    store.bills = [
      { id: 'x', type: 'unknown', amount: 30, category: '其他', date: '2026-04-05', remark: '' }
    ]
    expect(store.monthlyStats.expense).toBe(30)
    expect(store.monthlyStats.income).toBe(0)
  })
})
