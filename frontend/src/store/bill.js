import { defineStore } from 'pinia'
import { loadBills, saveBills } from '../utils/storage'

export const useBillStore = defineStore('bill', {
  state: () => ({
    bills: loadBills()
  }),
  getters: {
    sortedBills(state) {
      return [...state.bills].sort((a, b) => (a.date < b.date ? 1 : -1))
    },
    // 按月分组：返回 [{ ym, label, income, expense, bills }]，外层按月倒序，内层按日期倒序
    groupedBills(state) {
      const map = new Map()
      for (const b of state.bills) {
        if (typeof b.date !== 'string' || b.date.length < 7) continue
        const ym = b.date.slice(0, 7)
        if (!map.has(ym)) {
          map.set(ym, { ym, bills: [], income: 0, expense: 0 })
        }
        const g = map.get(ym)
        g.bills.push(b)
        const amt = Number(b.amount) || 0
        if (b.type === 'income') g.income += amt
        else g.expense += amt
      }
      const groups = Array.from(map.values())
      for (const g of groups) {
        g.bills.sort((a, b) => (a.date < b.date ? 1 : -1))
        g.income = +g.income.toFixed(2)
        g.expense = +g.expense.toFixed(2)
        const [y, m] = g.ym.split('-')
        g.label = `${y}年${Number(m)}月`
      }
      groups.sort((a, b) => (a.ym < b.ym ? 1 : -1))
      return groups
    },
    monthlyStats(state) {
      const now = new Date()
      const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      let income = 0
      let expense = 0
      for (const b of state.bills) {
        if (typeof b.date === 'string' && b.date.startsWith(ym)) {
          const amt = Number(b.amount) || 0
          if (b.type === 'income') income += amt
          else expense += amt
        }
      }
      return {
        income: +income.toFixed(2),
        expense: +expense.toFixed(2),
        balance: +(income - expense).toFixed(2)
      }
    }
  },
  actions: {
    addBill(bill) {
      this.bills.push({
        id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        ...bill
      })
      this.persist()
    },
    removeBill(id) {
      this.bills = this.bills.filter((b) => b.id !== id)
      this.persist()
    },
    persist() {
      saveBills(this.bills)
    }
  }
})
