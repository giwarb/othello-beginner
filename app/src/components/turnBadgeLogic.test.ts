import { describe, expect, it } from 'vitest'
import { turnLabel } from './turnBadgeLogic'

describe('turnLabel', () => {
  it('describes black turn in hiragana', () => {
    expect(turnLabel('b')).toBe('あなたは　くろ　です')
  })

  it('describes white turn in hiragana', () => {
    expect(turnLabel('w')).toBe('あなたは　しろ　です')
  })
})
