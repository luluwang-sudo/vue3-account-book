<template>
  <div class="stat-card">
    <div class="stat-title">本月结余</div>
    <div class="stat-balance">¥ {{ formatMoney(stats.balance) }}</div>
    <div class="stat-row">
      <div class="stat-item">
        <div class="stat-label">本月收入</div>
        <div class="stat-value income">¥ {{ formatMoney(stats.income) }}</div>
      </div>
      <div class="divider"></div>
      <div class="stat-item">
        <div class="stat-label">本月支出</div>
        <div class="stat-value expense">¥ {{ formatMoney(stats.expense) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stats: {
    type: Object,
    required: true
  }
})

function formatMoney(n) {
  const v = Number(n) || 0
  return v.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}
</script>

<style scoped>
.stat-card {
  margin: 16px;
  padding: 20px 18px;
  border-radius: 16px;
  background: linear-gradient(135deg, #5b8def 0%, #3f6ad8 100%);
  color: #fff;
  box-shadow: 0 8px 20px rgba(63, 106, 216, 0.25);
}
.stat-title {
  font-size: 13px;
  opacity: 0.85;
}
.stat-balance {
  margin-top: 6px;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 1px;
}
.stat-row {
  display: flex;
  align-items: center;
  margin-top: 18px;
}
.stat-item {
  flex: 1;
  text-align: center;
}
.divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.3);
}
.stat-label {
  font-size: 12px;
  opacity: 0.85;
}
.stat-value {
  margin-top: 4px;
  font-size: 16px;
  font-weight: 600;
}
</style>
