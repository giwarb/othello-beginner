import { describe, expect, it } from 'vitest'
import { flippedDiscs, parseBoard, serializeBoard } from '../core/othello'
import {
  createPracticeState,
  nextPuzzle,
  PRACTICE_PUZZLES,
  pressOk,
  tapCell,
  type FlippingState,
  type PracticePuzzle,
  type PracticeState,
} from './practiceMachine'

const OPENING = '--------'.repeat(3) + '---wb---' + '---bw---' + '--------'.repeat(3)
const PUZZLES: ReadonlyArray<PracticePuzzle> = [
  { board: OPENING, turn: 'b' },
  { board: '-bwwwwww' + 'wwwwwwww'.repeat(7), turn: 'w' },
]

function startFlipping(position = 19): FlippingState {
  const state = tapCell(createPracticeState(PUZZLES), position)
  expect(state.phase).toBe('flipping')
  return state as FlippingState
}

function flipAll(state: FlippingState): PracticeState {
  let current: PracticeState = state
  for (const position of state.discsToFlip) {
    current = tapCell(current, position)
  }
  return current
}

describe('placing', () => {
  it('exposes legal moves and places only the played disc after a legal tap', () => {
    const before = createPracticeState(PUZZLES)
    expect(before.legalMoves).toEqual([19, 26, 37, 44])

    const expectedFlips = flippedDiscs(before.board, before.turn, 19)
    const after = tapCell(before, 19)
    expect(after.phase).toBe('flipping')
    if (after.phase !== 'flipping') return

    expect([...after.discsToFlip]).toEqual(expectedFlips)
    expect(after.board[19]).toBe('b')
    expect(after.board[27]).toBe('w')
    expect(after.flippedPositions.size).toBe(0)
    expect(after.message).toBe('ひっくりかえそう')
    expect(serializeBoard(before.board)).toBe(OPENING)
  })

  it.each([0, 27])('counts an illegal empty or occupied tap at %i', (position) => {
    const before = createPracticeState(PUZZLES)
    const after = tapCell(before, position)
    expect(after.phase).toBe('placing')
    expect(after.misses.placing).toBe(1)
    expect(after.message).toBe('そこには　おけないよ！')
    expect(after.board).toBe(before.board)
  })
})

describe('temporary puzzles', () => {
  it.each([
    [0, 19, [27]],
    [1, 27, [28]],
    [2, 27, [18, 19, 20, 26, 28, 34, 35, 36]],
    [3, 0, [1, 8]],
    [4, 7, [6, 15]],
  ])('puzzle %i includes the intended move variation', (puzzleIndex, move, expected) => {
    const puzzle = PRACTICE_PUZZLES[puzzleIndex]
    expect(puzzle.board).toHaveLength(64)
    expect(flippedDiscs(parseBoard(puzzle.board), puzzle.turn, move)).toEqual(expected)
  })
})

describe('flipping', () => {
  it('flips one required disc without advancing automatically', () => {
    const before = startFlipping()
    const target = [...before.discsToFlip][0]
    const after = tapCell(before, target)
    expect(after.phase).toBe('flipping')
    if (after.phase !== 'flipping') return
    expect(after.board[target]).toBe('b')
    expect(after.flippedPositions.has(target)).toBe(true)
    expect(after.message).toBe('ひっくりかえそう')
  })

  it.each([0, 28])('counts a non-flippable square or disc at %i', (position) => {
    const after = tapCell(startFlipping(), position)
    expect(after.misses.flipping).toBe(1)
    expect(after.message).toBe('そのこまは　ひっくりかえせないよ！')
  })

  it('ignores a disc that was already flipped', () => {
    const before = startFlipping()
    const target = [...before.discsToFlip][0]
    const once = tapCell(before, target)
    const twice = tapCell(once, target)
    expect(twice).toBe(once)
    expect(twice.misses.flipping).toBe(0)
  })

  it('counts an early OK and remains in flipping', () => {
    const after = pressOk(startFlipping())
    expect(after.phase).toBe('flipping')
    expect(after.misses.earlyOk).toBe(1)
    expect(after.message).toBe('まだ　ひっくりかえる　こまが　あるよ')
  })

  it('advances only after every required disc is flipped', () => {
    const after = pressOk(flipAll(startFlipping()))
    expect(after.phase).toBe('result')
    expect(after.message).toBe('だいせいこう！')
  })
})

describe('result and next puzzle', () => {
  it('uses だいせいこう when all three miss counts are zero', () => {
    const result = pressOk(flipAll(startFlipping()))
    expect(result.phase).toBe('result')
    if (result.phase === 'result') expect(result.result).toBe('だいせいこう')
  })

  it('uses せいこう when any miss was made', () => {
    const withMiss = tapCell(createPracticeState(PUZZLES), 0)
    const flipping = tapCell(withMiss, 19)
    expect(flipping.phase).toBe('flipping')
    const result = pressOk(flipAll(flipping as FlippingState))
    expect(result.phase).toBe('result')
    if (result.phase === 'result') expect(result.result).toBe('せいこう')
  })

  it('starts the next puzzle with reset misses and loops to the first', () => {
    const firstResult = pressOk(flipAll(startFlipping()))
    const second = nextPuzzle(firstResult, PUZZLES)
    expect(second.phase).toBe('placing')
    expect(second.puzzleIndex).toBe(1)
    expect(second.turn).toBe('w')
    expect(second.misses).toEqual({ placing: 0, flipping: 0, earlyOk: 0 })

    const secondFlipping = tapCell(second, second.legalMoves[0])
    expect(secondFlipping.phase).toBe('flipping')
    const secondResult = pressOk(flipAll(secondFlipping as FlippingState))
    expect(nextPuzzle(secondResult, PUZZLES).puzzleIndex).toBe(0)
  })
})
