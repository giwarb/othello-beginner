import { describe, expect, it } from 'vitest'
import { shouldPulse } from './messageBarLogic'

describe('shouldPulse', () => {
  it('pulses when the sequence advances to new, non-empty text', () => {
    expect(shouldPulse(0, 1, 'せいこう！')).toBe(true)
    expect(shouldPulse(1, 2, 'つぎのもんだい')).toBe(true)
  })

  it('pulses again when the sequence advances even if the text repeats', () => {
    expect(shouldPulse(1, 2, 'そこには　おけないよ！')).toBe(true)
    expect(shouldPulse(2, 3, 'そこには　おけないよ！')).toBe(true)
  })

  it('does not pulse when the message is cleared', () => {
    expect(shouldPulse(1, 2, '')).toBe(false)
  })

  it('does not pulse when the sequence is unchanged', () => {
    expect(shouldPulse(1, 1, 'せいこう！')).toBe(false)
  })

  it('does not pulse when staying empty', () => {
    expect(shouldPulse(0, 0, '')).toBe(false)
  })
})
