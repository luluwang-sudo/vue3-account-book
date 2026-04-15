<template>
  <div class="add-page">
    <header class="header">
      <button class="back" @click="$router.back()">‹</button>
      <span class="title">添加账单</span>
      <span class="placeholder"></span>
    </header>

    <div class="type-switch">
      <button
        :class="['type-btn', { active: form.type === 'expense' }]"
        @click="form.type = 'expense'"
      >
        支出
      </button>
      <button
        :class="['type-btn', { active: form.type === 'income' }]"
        @click="form.type = 'income'"
      >
        收入
      </button>
    </div>

    <div class="form">
      <div class="field">
        <label>金额</label>
        <input
          v-model="form.amount"
          type="number"
          inputmode="decimal"
          placeholder="0.00"
        />
      </div>
      <div class="field">
        <label>分类</label>
        <div class="cat-list">
          <button
            v-for="c in currentCategories"
            :key="c"
            :class="['cat-btn', { active: form.category === c }]"
            @click="form.category = c"
          >
            {{ c }}
          </button>
        </div>
      </div>
      <div class="field">
        <label>日期</label>
        <input v-model="form.date" type="date" />
      </div>
      <div class="field">
        <label>备注</label>
        <input v-model="form.remark" type="text" placeholder="选填" maxlength="30" />
      </div>
    </div>

    <button class="submit" @click="submit">保存</button>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBillStore } from '../store/bill'

const router = useRouter()
const store = useBillStore()

const expenseCategories = ['餐饮', '交通', '购物', '娱乐', '居家', '医疗', '其他']
const incomeCategories = ['工资', '奖金', '兼职', '理财', '其他']

const today = new Date().toISOString().slice(0, 10)

const form = reactive({
  type: 'expense',
  amount: '',
  category: '餐饮',
  date: today,
  remark: ''
})

const currentCategories = computed(() =>
  form.type === 'expense' ? expenseCategories : incomeCategories
)

function submit() {
  const amt = Number(form.amount)
  if (!amt || amt <= 0) {
    alert('请输入有效金额')
    return
  }
  if (!form.category) {
    alert('请选择分类')
    return
  }
  if (!currentCategories.value.includes(form.category)) {
    form.category = currentCategories.value[0]
  }
  store.addBill({
    type: form.type,
    amount: +amt.toFixed(2),
    category: form.category,
    date: form.date,
    remark: form.remark.trim()
  })
  router.back()
}
</script>

<style scoped>
.add-page {
  min-height: 100vh;
  padding-bottom: 32px;
}
.header {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  background: #fff;
  border-bottom: 1px solid #f0f1f5;
}
.back {
  width: 40px;
  height: 40px;
  font-size: 26px;
  color: #333;
}
.title {
  font-size: 17px;
  font-weight: 600;
}
.placeholder {
  width: 40px;
}
.type-switch {
  display: flex;
  gap: 12px;
  padding: 16px;
}
.type-btn {
  flex: 1;
  height: 38px;
  border-radius: 19px;
  background: #fff;
  font-size: 14px;
  color: #666;
  border: 1px solid #e5e6eb;
}
.type-btn.active {
  background: linear-gradient(135deg, #5b8def, #3f6ad8);
  color: #fff;
  border-color: transparent;
}
.form {
  margin: 0 16px;
  background: #fff;
  border-radius: 12px;
  padding: 4px 16px;
}
.field {
  display: flex;
  align-items: flex-start;
  padding: 14px 0;
  border-bottom: 1px solid #f0f1f5;
}
.field:last-child {
  border-bottom: none;
}
.field label {
  width: 56px;
  font-size: 14px;
  color: #666;
  padding-top: 6px;
  flex-shrink: 0;
}
.field input {
  flex: 1;
  height: 32px;
  font-size: 15px;
  color: #222;
}
.cat-list {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.cat-btn {
  padding: 6px 12px;
  border-radius: 14px;
  background: #f5f6fa;
  font-size: 13px;
  color: #555;
}
.cat-btn.active {
  background: #3f6ad8;
  color: #fff;
}
.submit {
  display: block;
  margin: 24px 16px 0;
  width: calc(100% - 32px);
  height: 46px;
  border-radius: 23px;
  background: linear-gradient(135deg, #5b8def, #3f6ad8);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 6px 16px rgba(63, 106, 216, 0.3);
}
.submit:active {
  opacity: 0.9;
}
</style>
