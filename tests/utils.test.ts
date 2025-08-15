import { describe, it, expect } from 'vitest'
import { parseMoney } from '../lib/utils'

describe('parseMoney', () => {
  it('parses brazilian style', () => {
    expect(parseMoney('R$ 12,34')).toBeCloseTo(12.34)
  })
  it('parses negative', () => {
    expect(parseMoney('-45,90')).toBeCloseTo(-45.90)
  })
  it('throws on invalid', () => {
    expect(() => parseMoney('abc')).toThrow()
  })
})
