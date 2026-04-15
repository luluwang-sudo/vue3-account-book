<template>
  <div class="home">
    <!-- Header -->
    <header class="header">
      <span class="h-title">记账本</span>
      <span class="h-date">{{ currentYM }}</span>
    </header>

    <!-- Stat Card -->
    <section class="stat-card">
      <div class="stat-top">
        <span class="stat-label">本月结余</span>
        <span class="stat-balance">¥ {{ formatMoney(store.monthlyStats.balance) }}</span>
      </div>
      <div class="stat-row">
        <div class="stat-box">
          <span class="sub-label">收入</span>
          <span class="sub-amt">+ ¥{{ formatMoney(store.monthlyStats.income) }}</span>
        </div>
        <div class="stat-box">
          <span class="sub-label">支出</span>
          <span class="sub-amt">- ¥{{ formatMoney(store.monthlyStats.expense) }}</span>
        </div>
      </div>
    </section>

    <!-- Quick Record -->
    <section class="card quick">
      <div class="q-title">快捷记账</div>
      <div class="q-row">
        <button
          v-for="q in quickItems"
          :key="q.key"
          class="q-btn"
          :style="{ background: q.bg }"
          @click="handleQuick(q)"
        >
          <span class="q-icon" :style="{ color: q.icon }" v-html="q.svg" />
          <span class="q-text" :style="{ color: q.text }">{{ q.label }}</span>
        </button>
      </div>
    </section>

    <!-- Bill List -->
    <section class="card list">
      <div class="l-head">
        <span class="l-title">收支明细</span>
        <span class="l-more" @click="goAll">查看全部 ›</span>
      </div>

      <template v-if="groupedByDay.length">
        <template v-for="g in groupedByDay" :key="g.key">
          <div class="day-label">{{ g.label }}</div>
          <div
            v-for="b in g.bills"
            :key="b.id"
            class="bill-item"
            @click="handleDelete(b.id)"
          >
            <div class="bi-icon" :style="{ background: catColor(b).bg }">
              <span class="bi-svg" :style="{ color: catColor(b).icon }" v-html="catColor(b).svg" />
            </div>
            <div class="bi-mid">
              <div class="bi-title">{{ b.remark || b.category || (b.type === 'income' ? '收入' : '支出') }}</div>
              <div class="bi-sub">{{ (b.category || (b.type === 'income' ? '收入' : '支出')) }} · {{ formatTime(b.date) }}</div>
            </div>
            <div class="bi-amt" :class="b.type === 'income' ? 'positive' : 'negative'">
              {{ b.type === 'income' ? '+' : '-' }} ¥{{ formatMoney(b.amount) }}
            </div>
          </div>
        </template>
      </template>
      <div v-else class="empty">还没有账单，点「更多」添加吧～</div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBillStore } from '../store/bill'

const router = useRouter()
const store = useBillStore()

const now = new Date()
const currentYM = `${now.getFullYear()}年${now.getMonth() + 1}月`

const SVG = {
  utensils: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h1v11h2V11h1a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>',
  car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>',
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>'
}

const quickItems = [
  { key: 'food',  label: '餐饮', bg: '#FEF3C7', icon: '#D97706', text: '#92400E', svg: SVG.utensils, category: '餐饮' },
  { key: 'trans', label: '交通', bg: '#DBEAFE', icon: '#2563EB', text: '#1E40AF', svg: SVG.car,      category: '交通' },
  { key: 'shop',  label: '购物', bg: '#FCE7F3', icon: '#DB2777', text: '#9D174D', svg: SVG.bag,      category: '购物' },
  { key: 'more',  label: '更多', bg: '#DCFCE7', icon: '#16A34A', text: '#14532D', svg: SVG.plus }
]

const CATEGORY_STYLE = {
  '餐饮':  { bg: '#FEF3C7', icon: '#D97706', svg: SVG.utensils },
  '交通':  { bg: '#DBEAFE', icon: '#2563EB', svg: SVG.car },
  '购物':  { bg: '#FCE7F3', icon: '#DB2777', svg: SVG.bag },
  '收入':  { bg: '#DCFCE7', icon: '#16A34A', svg: SVG.wallet },
  'default': { bg: '#E0E7FF', icon: '#6366F1', svg: SVG.plus }
}

function catColor(b) {
  if (b.type === 'income') return CATEGORY_STYLE['收入']
  return CATEGORY_STYLE[b.category] || CATEGORY_STYLE.default
}

function formatMoney(n) {
  const v = Number(n) || 0
  return v.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function formatTime(date) {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return String(date).slice(11, 16) || ''
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function dayKey(date) {
  if (!date) return ''
  return String(date).slice(0, 10)
}

function dayLabel(key) {
  if (!key) return ''
  const today = new Date()
  const y = new Date(today); y.setDate(today.getDate() - 1)
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const yKey = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`
  const [yr, m, d] = key.split('-')
  const suffix = `${Number(m)}月${Number(d)}日`
  if (key === todayKey) return `今天 · ${suffix}`
  if (key === yKey) return `昨天 · ${suffix}`
  return `${yr}年${suffix}`
}

const groupedByDay = computed(() => {
  const list = store.sortedBills.slice(0, 30)
  const map = new Map()
  for (const b of list) {
    const k = dayKey(b.date)
    if (!map.has(k)) map.set(k, { key: k, label: dayLabel(k), bills: [] })
    map.get(k).bills.push(b)
  }
  return Array.from(map.values())
})

function handleQuick(q) {
  if (q.key === 'more') {
    router.push('/add')
  } else {
    router.push({ path: '/add', query: { category: q.category, type: 'expense' } })
  }
}

function goAll() {
  router.push('/add')
}

function handleDelete(id) {
  if (confirm('确定删除这笔账单？')) {
    store.removeBill(id)
  }
}
</script>

<style scoped>
.home {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  background: #F5F7FA;
  padding: 16px 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  box-sizing: border-box;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 4px;
}
.h-title {
  font-size: 22px;
  font-weight: 700;
  color: #1F2937;
  letter-spacing: 0.2px;
}
.h-date {
  font-size: 14px;
  color: #6B7280;
}

/* Stat Card */
.stat-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border-radius: 20px;
  background: linear-gradient(135deg, #4510c3 7%, #898aee 100%);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.2);
  color: #fff;
}
.stat-top {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.stat-label {
  font-size: 13px;
  color: #E0E7FF;
}
.stat-balance {
  font-size: 32px;
  font-weight: 700;
  color: #FFFFFF;
  line-height: 1.1;
}
.stat-row {
  display: flex;
  gap: 16px;
  padding-top: 14px;
}
.stat-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.13);
}
.sub-label {
  font-size: 12px;
  color: #E0E7FF;
}
.sub-amt {
  font-size: 17px;
  font-weight: 600;
  color: #FFFFFF;
}

/* White Cards */
.card {
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06);
}

/* Quick Record */
.quick {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.q-title {
  font-size: 15px;
  font-weight: 600;
  color: #1F2937;
}
.q-row {
  display: flex;
  gap: 12px;
}
.q-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 4px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: transform 0.1s ease;
}
.q-btn:active {
  transform: scale(0.96);
}
.q-icon {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.q-icon :deep(svg) {
  width: 22px;
  height: 22px;
}
.q-text {
  font-size: 12px;
  font-weight: 500;
}

/* List */
.list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.l-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.l-title {
  font-size: 15px;
  font-weight: 600;
  color: #1F2937;
}
.l-more {
  font-size: 12px;
  color: #6366F1;
  cursor: pointer;
}
.day-label {
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 2px;
}
.bill-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  cursor: pointer;
}
.bi-icon {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.bi-svg {
  width: 18px;
  height: 18px;
  display: inline-flex;
}
.bi-svg :deep(svg) {
  width: 18px;
  height: 18px;
}
.bi-mid {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.bi-title {
  font-size: 14px;
  font-weight: 500;
  color: #1F2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bi-sub {
  font-size: 11px;
  color: #9CA3AF;
}
.bi-amt {
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}
.bi-amt.positive { color: #16A34A; }
.bi-amt.negative { color: #EF4444; }

.empty {
  padding: 24px 0;
  text-align: center;
  color: #9CA3AF;
  font-size: 13px;
}

.h-title,
.h-date,
.stat-balance,
.sub-amt,
.bi-title,
.bi-amt {
  white-space: nowrap;
}
</style>
