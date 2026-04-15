// AddBill 页测试
// - 收入/支出切换时分类列表切换
// - 金额校验（空、0、负数、合法）
// - 备注 input 受 maxlength=30 限制
// - 提交时调用 store.addBill 并写入 localStorage
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import AddBill from '../views/AddBill.vue'

const STORAGE_KEY = 'vue3-account-book:bills'

async function freshStore() {
  vi.resetModules()
  const mod = await import('../store/bill.js')
  setActivePinia(createPinia())
  return mod.useBillStore()
}

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/add', component: AddBill }
    ]
  })
}

async function mountAddBill() {
  const router = makeRouter()
  await router.push('/add')
  await router.isReady()
  const wrapper = mount(AddBill, { global: { plugins: [router] } })
  return { wrapper, router }
}

describe('AddBill 页面', () => {
  beforeEach(async () => {
    localStorage.clear()
    await freshStore()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('收入/支出切换', () => {
    it('默认是支出，分类为支出分类', async () => {
      const { wrapper } = await mountAddBill()
      const expenseBtn = wrapper.findAll('.type-btn')[0]
      expect(expenseBtn.classes()).toContain('active')
      const cats = wrapper.findAll('.cat-btn').map((b) => b.text())
      expect(cats).toContain('餐饮')
      expect(cats).toContain('交通')
      expect(cats).not.toContain('工资')
    })

    it('点击收入按钮切换为收入分类', async () => {
      const { wrapper } = await mountAddBill()
      const incomeBtn = wrapper.findAll('.type-btn')[1]
      await incomeBtn.trigger('click')
      expect(incomeBtn.classes()).toContain('active')
      const cats = wrapper.findAll('.cat-btn').map((b) => b.text())
      expect(cats).toContain('工资')
      expect(cats).toContain('奖金')
      expect(cats).not.toContain('餐饮')
    })
  })

  describe('金额校验', () => {
    it('空金额 -> alert 并不调用 addBill', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      const { wrapper } = await mountAddBill()
      await wrapper.find('.submit').trigger('click')
      expect(alertSpy).toHaveBeenCalledWith('请输入有效金额')
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')).toHaveLength(0)
    })

    it('金额为 0 -> alert', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      const { wrapper } = await mountAddBill()
      await wrapper.find('input[type="number"]').setValue('0')
      await wrapper.find('.submit').trigger('click')
      expect(alertSpy).toHaveBeenCalledWith('请输入有效金额')
    })

    it('金额为负数 -> alert', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      const { wrapper } = await mountAddBill()
      await wrapper.find('input[type="number"]').setValue('-5')
      await wrapper.find('.submit').trigger('click')
      expect(alertSpy).toHaveBeenCalledWith('请输入有效金额')
    })

    it('合法金额 -> 不 alert，正常提交', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      const { wrapper } = await mountAddBill()
      await wrapper.find('input[type="number"]').setValue('12.34')
      await wrapper.find('.submit').trigger('click')
      await flushPromises()
      expect(alertSpy).not.toHaveBeenCalled()
    })
  })

  describe('备注 30 字限制', () => {
    it('备注 input 的 maxlength 属性为 30', async () => {
      const { wrapper } = await mountAddBill()
      const remarkInput = wrapper.find('input[placeholder="选填"]')
      expect(remarkInput.exists()).toBe(true)
      expect(remarkInput.attributes('maxlength')).toBe('30')
    })

    it('提交时备注会 trim', async () => {
      vi.spyOn(window, 'alert').mockImplementation(() => {})
      const { wrapper } = await mountAddBill()
      await wrapper.find('input[type="number"]').setValue('10')
      await wrapper.find('input[placeholder="选填"]').setValue('  hello  ')
      await wrapper.find('.submit').trigger('click')
      await flushPromises()
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored).toHaveLength(1)
      expect(stored[0].remark).toBe('hello')
    })
  })

  describe('提交与本地存储同步', () => {
    it('提交支出账单并写入 localStorage', async () => {
      const { wrapper } = await mountAddBill()
      await wrapper.find('input[type="number"]').setValue('25.5')
      // 选择"交通"分类
      const cats = wrapper.findAll('.cat-btn')
      const traffic = cats.find((b) => b.text() === '交通')
      await traffic.trigger('click')
      await wrapper.find('.submit').trigger('click')
      await flushPromises()

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored).toHaveLength(1)
      expect(stored[0]).toMatchObject({
        type: 'expense',
        amount: 25.5,
        category: '交通'
      })
      expect(stored[0].id).toBeTruthy()
      expect(stored[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('提交收入账单：切换收入 -> 选择工资 -> 保存', async () => {
      const { wrapper } = await mountAddBill()
      await wrapper.findAll('.type-btn')[1].trigger('click') // 收入
      await wrapper.find('input[type="number"]').setValue('5000')
      // 切到收入后默认 category 仍是"餐饮"，submit 时会被自动修正为收入分类首项"工资"
      await wrapper.find('.submit').trigger('click')
      await flushPromises()

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored).toHaveLength(1)
      expect(stored[0].type).toBe('income')
      expect(stored[0].amount).toBe(5000)
      expect(stored[0].category).toBe('工资')
    })

    it('金额会被处理为最多 2 位小数', async () => {
      const { wrapper } = await mountAddBill()
      await wrapper.find('input[type="number"]').setValue('9.999')
      await wrapper.find('.submit').trigger('click')
      await flushPromises()
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored[0].amount).toBe(10)
    })
  })
})
