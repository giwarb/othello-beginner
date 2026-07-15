import { describe, expect, it } from 'vitest'
import { legalMoves, parseBoard, type Board, type Color } from '../core/othello'
import { shuffledPracticePuzzles } from '../practice/practiceMachine'
import { GENERATED_PUZZLES } from './generated'
import { SAMPLE_STRATEGY_PUZZLES } from './samplePuzzles'
import type { Difficulty, Puzzle, StrategyCategory } from './types'
import { validateStrategyPuzzle } from './validate'

const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1], [-1, 0], [-1, 1], [0, -1],
  [0, 1], [1, -1], [1, 0], [1, 1],
]

function other(color: Color): Color {
  return color === 'b' ? 'w' : 'b'
}

function flipDirectionCount(board: Board, color: Color, position: number): number {
  const row = Math.floor(position / 8)
  const column = position % 8
  let count = 0
  for (const [rowStep, columnStep] of DIRECTIONS) {
    let nextRow = row + rowStep
    let nextColumn = column + columnStep
    let opponents = 0
    while (nextRow >= 0 && nextRow < 8 && nextColumn >= 0 && nextColumn < 8) {
      const cell = board[nextRow * 8 + nextColumn]
      if (cell === other(color)) {
        opponents += 1
        nextRow += rowStep
        nextColumn += columnStep
        continue
      }
      if (opponents > 0 && cell === color) count += 1
      break
    }
  }
  return count
}

function key(puzzle: Pick<Puzzle, 'board' | 'turn'>): string {
  return `${puzzle.board}:${puzzle.turn}`
}

describe('generated puzzles', () => {
  it('contains the required number of every kind', () => {
    const rules = GENERATED_PUZZLES.filter((puzzle) => puzzle.mode === 'rule')
    expect(rules.length).toBeGreaterThanOrEqual(30)
    for (const difficulty of [1, 2, 3] as const) {
      expect(rules.filter((puzzle) => puzzle.difficulty === difficulty).length).toBeGreaterThanOrEqual(10)
    }
    for (const category of ['corner', 'avoid-x', 'min-mobility'] as const) {
      expect(GENERATED_PUZZLES.filter(
        (puzzle) => puzzle.mode === 'strategy' && puzzle.category === category,
      ).length).toBeGreaterThanOrEqual(30)
    }
  })

  it('has valid boards and valid rule difficulties', () => {
    for (const puzzle of GENERATED_PUZZLES) {
      const board = parseBoard(puzzle.board)
      const moves = legalMoves(board, puzzle.turn)
      expect(moves.length, puzzle.id).toBeGreaterThan(0)
      if (puzzle.mode !== 'rule') continue

      const directions = moves.map((move) => flipDirectionCount(board, puzzle.turn, move))
      const checks: Record<Difficulty, boolean> = {
        1: moves.length <= 3 && directions.every((count) => count === 1),
        2: directions.every((count) => count >= 1 && count <= 2),
        3: directions.some((count) => count >= 3),
      }
      expect(checks[puzzle.difficulty], puzzle.id).toBe(true)
    }
  })

  it('passes the shared strategy validators', () => {
    for (const puzzle of GENERATED_PUZZLES) {
      if (puzzle.mode === 'strategy') {
        expect(validateStrategyPuzzle(puzzle), puzzle.id).toEqual({ ok: true })
      }
    }
  })

  it('has no duplicate position, id, or sample position', () => {
    const keys = GENERATED_PUZZLES.map(key)
    const ids = GENERATED_PUZZLES.map((puzzle) => puzzle.id)
    const sampleKeys = new Set(SAMPLE_STRATEGY_PUZZLES.map(key))
    expect(new Set(keys).size).toBe(keys.length)
    expect(new Set(ids).size).toBe(ids.length)
    expect(keys.some((position) => sampleKeys.has(position))).toBe(false)
  })

  it('includes opening, middle, and ending positions at every rule difficulty', () => {
    for (const difficulty of [1, 2, 3] as const) {
      const ranges = new Set(
        GENERATED_PUZZLES
          .filter((puzzle) => puzzle.mode === 'rule' && puzzle.difficulty === difficulty)
          .map((puzzle) => {
            const empty = [...puzzle.board].filter((cell) => cell === '-').length
            if (empty >= 40) return 'opening'
            if (empty >= 16) return 'middle'
            return 'ending'
          }),
      )
      expect(ranges).toEqual(new Set(['opening', 'middle', 'ending']))
    }
  })

  it('keeps rule difficulty order while shuffling all pools', () => {
    const randomValues = [0.1, 0.8, 0.3, 0.6]
    let index = 0
    const shuffled = shuffledPracticePuzzles(
      GENERATED_PUZZLES,
      () => randomValues[index++ % randomValues.length],
    )
    const modes = shuffled.map((puzzle) => puzzle.mode)
    const firstStrategy = modes.indexOf('strategy')
    expect(modes.slice(0, firstStrategy).every((mode) => mode === 'rule')).toBe(true)
    const difficulties = shuffled.slice(0, firstStrategy).map((puzzle) => puzzle.difficulty)
    expect(difficulties).toEqual([...difficulties].sort())
    expect(new Set(shuffled.map(key)).size).toBe(shuffled.length)

    const strategyCounts = new Map<StrategyCategory, number>()
    for (const puzzle of shuffled.slice(firstStrategy)) {
      if (puzzle.mode === 'strategy') {
        strategyCounts.set(puzzle.category, (strategyCounts.get(puzzle.category) ?? 0) + 1)
      }
    }
    expect([...strategyCounts.values()]).toEqual([30, 30, 30])
  })
})
