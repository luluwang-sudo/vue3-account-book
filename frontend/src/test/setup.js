// Per-test helper: clean localStorage before each test
import { beforeEach } from 'vitest'

beforeEach(() => {
  localStorage.clear()
})
