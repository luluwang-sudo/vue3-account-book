<template>
  <li class="bill-item">
    <div class="left">
      <div class="category">{{ bill.category }}</div>
      <div class="meta">
        <span>{{ bill.date }}</span>
        <span v-if="bill.remark" class="remark">· {{ bill.remark }}</span>
      </div>
    </div>
    <div class="right">
      <div :class="['amount', bill.type]">
        {{ bill.type === 'income' ? '+' : '-' }}{{ formatMoney(bill.amount) }}
      </div>
      <button class="del-btn" @click="$emit('delete', bill.id)">删除</button>
    </div>
  </li>
</template>

<script setup>
defineProps({
  bill: {
    type: Object,
    required: true
  }
})
defineEmits(['delete'])

function formatMoney(n) {
  const v = Number(n) || 0
  return v.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}
</script>

<style scoped>
.bill-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f1f5;
}
.bill-item:last-child {
  border-bottom: none;
}
.left {
  flex: 1;
  min-width: 0;
}
.category {
  font-size: 15px;
  font-weight: 600;
  color: #222;
}
.meta {
  margin-top: 4px;
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.remark {
  margin-left: 4px;
}
.right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.amount {
  font-size: 16px;
  font-weight: 600;
}
.amount.income {
  color: #2bb673;
}
.amount.expense {
  color: #e7553e;
}
.del-btn {
  font-size: 12px;
  color: #999;
  padding: 4px 8px;
  border-radius: 6px;
  background: #f5f6fa;
}
.del-btn:active {
  background: #e8eaf0;
}
</style>
