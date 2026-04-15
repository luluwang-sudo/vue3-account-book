# 前端单元测试 (Vitest + @vue/test-utils)

本目录存放 vue3-account-book 前端的所有单元测试用例。

## 1. 依赖安装

测试相关依赖已加入 `frontend/package.json`，进入 `frontend/` 目录后执行：

```bash
pnpm install
```

如需手动安装（首次接入时）：

```bash
pnpm add -D vitest@^2.1.0 @vitest/coverage-v8@^2.1.0 @vue/test-utils@^2.4.6 happy-dom@^15
```

> 说明：
> 1. 本项目当前 vite 版本为 `^5.4.10`，因此选择 `vitest@^2.1.0`（vitest 4.x 要求 vite >= 6）。
> 2. DOM 环境采用 `happy-dom`。最初尝试 `jsdom@29`，在当前 Node 环境下因子依赖
>    `html-encoding-sniffer` -> `@exodus/bytes` 的 ESM/CJS 互操作问题无法加载，
>    切换到 happy-dom 后可正常运行。

## 2. 运行方式

进入 `frontend/` 目录：

```bash
# 一次性运行所有用例
pnpm test

# watch 模式
pnpm test:watch

# 生成覆盖率报告
pnpm test:coverage
```

## 3. 目录结构

```
frontend/src/test/
  ├─ setup.js              # 全局 setup：每个 case 前清理 localStorage
  ├─ store.spec.js         # Pinia store + localStorage 持久化
  ├─ Statistics.spec.js    # 顶部统计组件 StatCard + monthlyStats getter
  ├─ BillList.spec.js      # BillItem 组件 + Home 页列表/删除
  ├─ AddBill.spec.js       # AddBill 页面：切换/校验/备注/提交
  └─ README.md
```

测试配置文件位于 `frontend/vitest.config.js`，使用 `happy-dom` 环境，
`include` 为 `src/test/**/*.spec.js`。

## 4. 覆盖范围

| 模块 | 用例文件 | 关键场景 |
| ---- | -------- | -------- |
| Pinia store | `store.spec.js` | 初始化读 localStorage / 损坏 JSON 容错 / addBill / removeBill / persist |
| 统计组件 | `Statistics.spec.js` | StatCard 渲染 / monthlyStats 当月过滤 / 收支汇总 / 异常 amount / 未知 type |
| 账单列表 | `BillList.spec.js` | BillItem 收入/支出样式与符号 / delete 事件 / Home 倒序 / 空态 / confirm 删除 / 总数 |
| 添加账单 | `AddBill.spec.js` | 收入支出切换分类 / 金额空/0/负数 alert / 备注 maxlength=30 与 trim / 写入 localStorage / 金额保留两位 |

## 5. 与需求描述的差异说明

阅读源码后，以下几点与最初的"需求描述"略有差异，**测试以真实代码为准**：

1. 顶部统计组件实际命名为 `StatCard.vue`，而非 `Statistics.vue`。
   规范要求的 `Statistics.spec.js` 名称仍保留，便于按业务语义检索。
2. "当月过滤"逻辑由 store 的 getter `monthlyStats` 完成，组件本身只负责展示。
   因此过滤/汇总相关用例放在 `Statistics.spec.js` 中（针对 getter）。
3. 备注 30 字限制由 `<input maxlength="30">` 在浏览器侧硬限制实现，
   组件 JS 内并未额外做长度校验。测试断言 `maxlength` 属性 = `'30'` 并验证 `trim()`。
4. 删除确认使用浏览器原生 `window.confirm`，测试通过 `vi.spyOn(window, 'confirm')` mock。
5. AddBill 内当 `category` 不在当前类型分类列表时，会被自动重置为分类列表首项
   （例如切到"收入"后未手动选分类，提交时 category 自动变为"工资"）。

## 6. 已知潜在问题（仅记录，不修改业务代码）

- `monthlyStats` 中 `else expense += amt` 会把任何 **非 income** 的 type
  （包括拼写错误或脏数据）都计入支出，可能产生误统计。
- `store.bills` 初始化只在模块首次加载时读一次 localStorage；
  多 tab / 外部修改 localStorage 不会自动同步。
- AddBill 没有对未来日期做限制，可输入任意 `<input type="date">` 值。
- `addBill` 生成的 `id` 使用 `Date.now() + Math.random()`，理论上仍可能极小概率冲突。
