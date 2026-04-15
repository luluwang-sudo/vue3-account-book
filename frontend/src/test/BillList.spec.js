// 账单列表测试：
// - sortedBills 按日期倒序
// - BillItem 渲染金额/类型样式
// - Home 页通过 confirm 删除账单
// - Home 页按月分组展示 + 懒加载下一月
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import BillItem from '../components/BillItem.vue'
import Home from '../views/Home.vue'

// jsdom 没有 IntersectionObserver，mock 一个可手动触发的实现
class MockIntersectionObserver {
  constructor(cb) {
    this.cb = cb
    MockIntersectionObserver.instances.push(this)
  }
  observe(el) {
    this.el = el
  }
  unobserve() {}
  disconnect() {
    this.el = null
  }
  trigger() {
    this.cb([{ isIntersecting: true, target: this.el }])
  }
}
MockIntersectionObserver.instances = []
globalThis.IntersectionObserver = MockIntersectionObserver

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
      { path: '/add', component: { template: '<div/>' } }
    ]
  })
}

describe('BillItem 组件', () => {
  it('支出账单显示 - 号并带 expense 样式', () => {
    const bill = {
      id: '1',
      type: 'expense',
      amount: 12.5,
      category: '餐饮',
      date: '2026-04-10',
      remark: '午饭'
    }
    const wrapper = mount(BillItem, { props: { bill } })
    expect(wrapper.text()).toContain('餐饮')
    expect(wrapper.text()).toContain('2026-04-10')
    expect(wrapper.text()).toContain('午饭')
    expect(wrapper.text()).toContain('-12.50')
    expect(wrapper.find('.amount').classes()).toContain('expense')
  })

  it('收入账单显示 + 号并带 income 样式', () => {
    const bill = {
      id: '2',
      type: 'income',
      amount: 1000,
      category: '工资',
      date: '2026-04-01',
      remark: ''
    }
    const wrapper = mount(BillItem, { props: { bill } })
    expect(wrapper.text()).toContain('+1,000.00')
    expect(wrapper.find('.amount').classes()).toContain('income')
    // 没有 remark 时不渲染备注
    expect(wrapper.find('.remark').exists()).toBe(false)
  })

  it('点击删除按钮触发 delete 事件，载荷为 bill.id', async () => {
    const bill = { id: 'abc', type: 'expense', amount: 1, category: '其他', date: '2026-04-10' }
    const wrapper = mount(BillItem, { props: { bill } })
    await wrapper.find('.del-btn').trigger('click')
    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')[0]).toEqual(['abc'])
  })
})

describe('Home 页 - 列表按日期倒序 & 删除确认', () => {
  let router
  beforeEach(async () => {
    localStorage.clear()
    router = makeRouter()
    await router.push('/')
    await router.isReady()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('账单按日期倒序展示', async () => {
    const store = await freshStore()
    store.bills = [
      { id: '1', type: 'expense', amount: 10, category: '餐饮', date: '2026-04-01', remark: '' },
      { id: '2', type: 'expense', amount: 20, category: '交通', date: '2026-04-12', remark: '' },
      { id: '3', type: 'income', amount: 30, category: '工资', date: '2026-04-05', remark: '' }
    ]
    const wrapper = mount(Home, { global: { plugins: [router] } })
    const items = wrapper.findAllComponents(BillItem)
    expect(items).toHaveLength(3)
    expect(items[0].props('bill').date).toBe('2026-04-12')
    expect(items[1].props('bill').date).toBe('2026-04-05')
    expect(items[2].props('bill').date).toBe('2026-04-01')
  })

  it('空账单显示 empty 提示', async () => {
    await freshStore()
    const wrapper = mount(Home, { global: { plugins: [router] } })
    expect(wrapper.text()).toContain('还没有账单')
  })

  it('确认弹窗返回 true 时删除账单', async () => {
    const store = await freshStore()
    store.bills = [
      { id: 'del-me', type: 'expense', amount: 5, category: '餐饮', date: '2026-04-10', remark: '' },
      { id: 'keep', type: 'income', amount: 100, category: '工资', date: '2026-04-11', remark: '' }
    ]
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    const wrapper = mount(Home, { global: { plugins: [router] } })
    const firstItem = wrapper.findAllComponents(BillItem)[0]
    // 倒序后第一个是 keep（04-11），第二个是 del-me
    await wrapper.findAllComponents(BillItem)[1].find('.del-btn').trigger('click')

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(store.bills).toHaveLength(1)
    expect(store.bills[0].id).toBe('keep')
    // 旁路用一下 firstItem 防 lint
    expect(firstItem.exists()).toBe(true)
  })

  it('确认弹窗返回 false 时不删除账单', async () => {
    const store = await freshStore()
    store.bills = [
      { id: 'a', type: 'expense', amount: 5, category: '餐饮', date: '2026-04-10', remark: '' }
    ]
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const wrapper = mount(Home, { global: { plugins: [router] } })
    await wrapper.findComponent(BillItem).find('.del-btn').trigger('click')
    expect(confirmSpy).toHaveBeenCalled()
    expect(store.bills).toHaveLength(1)
  })

  it('按月分组：同月默认全部显示，月份头含收入/支出小计', async () => {
    const store = await freshStore()
    store.bills = [
      { id: '1', type: 'expense', amount: 10, category: '餐饮', date: '2026-04-01', remark: '' },
      { id: '2', type: 'expense', amount: 20, category: '交通', date: '2026-04-12', remark: '' },
      { id: '3', type: 'income', amount: 100, category: '工资', date: '2026-04-05', remark: '' }
    ]
    const wrapper = mount(Home, { global: { plugins: [router] } })
    await flushPromises()

    const groups = wrapper.findAll('.bill-group')
    expect(groups).toHaveLength(1)
    const header = wrapper.find('.group-header')
    expect(header.text()).toContain('2026年4月')
    expect(header.text()).toContain('+100.00')
    expect(header.text()).toContain('-30.00')

    const items = wrapper.findAllComponents(BillItem)
    expect(items).toHaveLength(3)
  })

  it('多月账单：默认只渲染最近一个月，sentinel 进入视图后加载下一月', async () => {
    MockIntersectionObserver.instances = []
    const store = await freshStore()
    store.bills = [
      { id: 'a', type: 'expense', amount: 10, category: '餐饮', date: '2026-04-10', remark: '' },
      { id: 'b', type: 'expense', amount: 20, category: '餐饮', date: '2026-03-15', remark: '' },
      { id: 'c', type: 'income', amount: 30, category: '工资', date: '2026-02-01', remark: '' }
    ]
    const wrapper = mount(Home, { global: { plugins: [router] } })
    await flushPromises()

    // 默认只渲染最近一个月（2026-04）
    expect(wrapper.findAll('.bill-group')).toHaveLength(1)
    expect(wrapper.findAllComponents(BillItem)).toHaveLength(1)
    expect(wrapper.find('.group-header').text()).toContain('2026年4月')
    expect(wrapper.find('.sentinel').exists()).toBe(true)

    // 触发一次 observer → 显示第二个月
    const obs1 = MockIntersectionObserver.instances[MockIntersectionObserver.instances.length - 1]
    obs1.trigger()
    await flushPromises()
    expect(wrapper.findAll('.bill-group')).toHaveLength(2)
    expect(wrapper.findAllComponents(BillItem)).toHaveLength(2)

    // 再触发一次 → 显示第三个月
    const obs2 = MockIntersectionObserver.instances[MockIntersectionObserver.instances.length - 1]
    obs2.trigger()
    await flushPromises()
    expect(wrapper.findAll('.bill-group')).toHaveLength(3)
    expect(wrapper.findAllComponents(BillItem)).toHaveLength(3)
    // 所有月份加载完，sentinel 消失
    expect(wrapper.find('.sentinel').exists()).toBe(false)
    expect(wrapper.find('.list-end').exists()).toBe(true)
  })

  it('显示账单总数', async () => {
    const store = await freshStore()
    store.bills = [
      { id: '1', type: 'expense', amount: 1, category: '餐饮', date: '2026-04-10', remark: '' },
      { id: '2', type: 'income', amount: 2, category: '工资', date: '2026-04-11', remark: '' }
    ]
    const wrapper = mount(Home, { global: { plugins: [router] } })
    expect(wrapper.text()).toContain('共 2 笔')
  })
})
