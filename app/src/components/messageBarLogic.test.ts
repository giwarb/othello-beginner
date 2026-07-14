import { describe, expect, it } from 'vitest'
import { shouldPulse } from './messageBarLogic'

describe('shouldPulse', () => {
  it('pulses when the message changes to new, non-empty text', () => {
    expect(shouldPulse('', 'せいこう！')).toBe(true)
    expect(shouldPulse('せいこう！', 'つぎのもんだい')).toBe(true)
  })

  it('does not pulse when the message is cleared', () => {
    expect(shouldPulse('せいこう！', '')).toBe(false)
  })

  it('does not pulse when the message is unchanged', () => {
    expect(shouldPulse('せいこう！', 'せいこう！')).toBe(false)
  })

  it('does not pulse when staying empty', () => {
    expect(shouldPulse('', '')).toBe(false)
  })
})
