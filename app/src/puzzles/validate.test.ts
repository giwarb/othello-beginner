import { describe, expect, it } from 'vitest'
import { SAMPLE_STRATEGY_PUZZLES } from './samplePuzzles'
import { validateAvoidX, validateCorner, validateMinMobility, validatePuzzle } from './validate'

describe('strategy puzzle validation', () => {
  it('accepts a clear corner position and rejects a position without a legal corner', () => {
    const valid = SAMPLE_STRATEGY_PUZZLES.find((puzzle) => puzzle.category === 'corner')!
    expect(validateCorner(valid.board, valid.turn, valid.answers)).toEqual({ ok: true })

    const opening = '--------'.repeat(3) + '---wb---' + '---bw---' + '--------'.repeat(3)
    expect(validateCorner(opening, 'b', [19]).ok).toBe(false)
  })

  it('accepts a clear X-square trap and rejects one that does not expose its corner', () => {
    const valid = SAMPLE_STRATEGY_PUZZLES.find((puzzle) => puzzle.category === 'avoid-x')!
    expect(validateAvoidX(valid.board, valid.turn, valid.answers)).toEqual({ ok: true })

    const notExposed = '---------------------------wb------bw-------bbb-----------------'
    expect(validateAvoidX(notExposed, 'w', [20, 29, 34, 43, 52]).ok).toBe(false)
  })

  it('accepts a clear mobility minimum and rejects a next-best gap of one', () => {
    const valid = SAMPLE_STRATEGY_PUZZLES.find((puzzle) => puzzle.category === 'min-mobility')!
    expect(validateMinMobility(valid.board, valid.turn, valid.answers)).toEqual({ ok: true })

    const narrowGap = '---------------------------wb------bb-------b-------------------'
    expect(validateMinMobility(narrowGap, 'w', [45]).ok).toBe(false)
  })

  it('accepts every bundled sample and includes three of each category', () => {
    expect(SAMPLE_STRATEGY_PUZZLES).toHaveLength(9)
    for (const category of ['corner', 'avoid-x', 'min-mobility'] as const) {
      expect(SAMPLE_STRATEGY_PUZZLES.filter((puzzle) => puzzle.category === category)).toHaveLength(3)
    }
    for (const puzzle of SAMPLE_STRATEGY_PUZZLES) {
      expect(validatePuzzle(puzzle), puzzle.id).toEqual({ ok: true })
    }
  })

  it('rejects malformed boards, no-move turns, illegal answers, and incomplete answer sets', () => {
    expect(validateCorner('-'.repeat(63), 'b', [0]).ok).toBe(false)
    expect(validateCorner('b'.repeat(64), 'b', [0]).ok).toBe(false)
    const valid = SAMPLE_STRATEGY_PUZZLES.find((puzzle) => puzzle.category === 'avoid-x')!
    expect(validateAvoidX(valid.board, valid.turn, [0]).ok).toBe(false)
    expect(validateAvoidX(valid.board, valid.turn, valid.answers.slice(1)).ok).toBe(false)
  })
})
