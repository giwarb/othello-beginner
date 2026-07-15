import { describe, expect, it, vi } from 'vitest'
import { flippedDiscs, parseBoard, serializeBoard } from '../core/othello'
import { addGreatSuccess, loadRecords, type RecordsStorage } from '../records/records'
import {
  createPracticeState,
  enteredGreatSuccess,
  hintPositions,
  nextPuzzle,
  poolForSelection,
  PRACTICE_PUZZLES,
  pressOk,
  pressOkAndRecord,
  tapCell,
  type FlippingState,
  type PracticePuzzle,
  type PracticeState,
} from './practiceMachine'

const OPENING = '--------'.repeat(3) + '---wb---' + '---bw---' + '--------'.repeat(3)
const PUZZLES: ReadonlyArray<PracticePuzzle> = [
  { id: 'test-one', mode: 'rule', board: OPENING, turn: 'b', difficulty: 1 },
  {
    id: 'test-two',
    mode: 'rule',
    board: '-bwwwwww' + 'wwwwwwww'.repeat(7),
    turn: 'w',
    difficulty: 1,
  },
]

function strategyPuzzle(
  category: 'corner' | 'avoid-x' | 'min-mobility',
): ReadonlyArray<PracticePuzzle> {
  return [{
    id: `strategy-${category}`,
    mode: 'strategy',
    category,
    board: OPENING,
    turn: 'b',
    answers: [19],
    difficulty: 1,
  }]
}

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

function memoryStorage(): RecordsStorage {
  const store = new Map<string, string>()
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
  }
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

  it('advances messageSeq even when the same illegal tap repeats', () => {
    const before = createPracticeState(PUZZLES)
    const once = tapCell(before, 0)
    const twice = tapCell(once, 0)
    expect(twice.message).toBe(once.message)
    expect(twice.messageSeq).not.toBe(once.messageSeq)
    expect(twice.messageSeq).toBe(once.messageSeq + 1)
  })
})

describe('strategy placing', () => {
  it('accepts an answer and joins the shared flipping phase', () => {
    const before = createPracticeState(strategyPuzzle('corner'))
    expect(before.prompt).toBe('すみを　とろう')
    const after = tapCell(before, 19)
    expect(after.phase).toBe('flipping')
    expect(after.misses.placing).toBe(0)
    expect(after.message).toBe('ひっくりかえそう')
  })

  it.each([
    ['corner', 'すみを　さがしてみよう'],
    ['avoid-x', 'すみの　ななめよこは　あぶないよ'],
    ['min-mobility', 'あいての　おけるばしょを　かぞえてみよう'],
  ] as const)('rejects a legal non-answer and shows the %s hint', (category, hint) => {
    const before = createPracticeState(strategyPuzzle(category))
    const after = tapCell(before, 26)
    expect(after.phase).toBe('placing')
    expect(after.misses.placing).toBe(1)
    expect(after.message).toBe('ちがうよ！　もういちど')
    expect(after.hint).toBe(hint)
    expect(after.board).toBe(before.board)
  })

  it('treats a non-legal tap like rule practice without a category hint', () => {
    const after = tapCell(createPracticeState(strategyPuzzle('corner')), 0)
    expect(after.phase).toBe('placing')
    expect(after.misses.placing).toBe(1)
    expect(after.message).toBe('そこには　おけないよ！')
    expect(after.hint).toBe('')
  })

  it.each([
    ['corner', 'すみを　とろう'],
    ['avoid-x', 'ばつの　ばしょは　やめよう'],
    ['min-mobility', 'あいてが　うてる　ばしょが　すくなくなる　ところに　うとう'],
  ] as const)('uses the %s prompt', (category, prompt) => {
    expect(createPracticeState(strategyPuzzle(category)).prompt).toBe(prompt)
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

describe('enteredGreatSuccess', () => {
  it('is true only when pressOk transitions flipping into a だいせいこう result', () => {
    const flipping = flipAll(startFlipping())
    const result = pressOk(flipping)
    expect(result.phase).toBe('result')
    expect(enteredGreatSuccess(flipping, result)).toBe(true)
  })

  it('is false for a せいこう result (some misses were made)', () => {
    const withMiss = tapCell(createPracticeState(PUZZLES), 0)
    const flipping = tapCell(withMiss, 19) as FlippingState
    const flipped = flipAll(flipping)
    const result = pressOk(flipped)
    expect(result.phase).toBe('result')
    if (result.phase === 'result') expect(result.result).toBe('せいこう')
    expect(enteredGreatSuccess(flipped, result)).toBe(false)
  })

  it('is false when pressOk is a no-op (early OK, or already in result)', () => {
    const flipping = startFlipping()
    const early = pressOk(flipping)
    expect(early.phase).toBe('flipping')
    expect(enteredGreatSuccess(flipping, early)).toBe(false)

    const result = pressOk(flipAll(startFlipping()))
    const again = pressOk(result)
    expect(again).toBe(result)
    expect(enteredGreatSuccess(result, again)).toBe(false)
  })
})

describe('practice record transition', () => {
  it('increments greatSuccess exactly once when OK enters だいせいこう', () => {
    const storage = memoryStorage()
    const record = vi.fn(() => addGreatSuccess(storage))

    const result = pressOkAndRecord(flipAll(startFlipping()), record)

    expect(result.phase).toBe('result')
    expect(record).toHaveBeenCalledTimes(1)
    expect(loadRecords(storage)).toEqual({ greatSuccess: 1, completed: 0, wins: 0 })
  })

  it('does not increment for せいこう or when the user exits midway', () => {
    const storage = memoryStorage()
    const record = vi.fn(() => addGreatSuccess(storage))
    const withMiss = tapCell(createPracticeState(PUZZLES), 0)
    const flipping = tapCell(withMiss, 19) as FlippingState

    const result = pressOkAndRecord(flipAll(flipping), record)
    const exitedMidway = tapCell(createPracticeState(PUZZLES), 19)

    expect(result.phase).toBe('result')
    if (result.phase === 'result') expect(result.result).toBe('せいこう')
    expect(exitedMidway.phase).toBe('flipping')
    expect(record).not.toHaveBeenCalled()
    expect(loadRecords(storage)).toEqual({ greatSuccess: 0, completed: 0, wins: 0 })
  })
})

const MIXED_PUZZLES: ReadonlyArray<PracticePuzzle> = [
  { id: 'rule-1a', mode: 'rule', board: OPENING, turn: 'b', difficulty: 1 },
  { id: 'rule-1b', mode: 'rule', board: OPENING, turn: 'b', difficulty: 1 },
  { id: 'rule-2a', mode: 'rule', board: OPENING, turn: 'b', difficulty: 2 },
  { id: 'rule-3a', mode: 'rule', board: OPENING, turn: 'b', difficulty: 3 },
  { id: 'corner-a', mode: 'strategy', category: 'corner', board: OPENING, turn: 'b', answers: [19], difficulty: 1 },
  { id: 'corner-b', mode: 'strategy', category: 'corner', board: OPENING, turn: 'b', answers: [19], difficulty: 1 },
  { id: 'corner-c', mode: 'strategy', category: 'corner', board: OPENING, turn: 'b', answers: [19], difficulty: 1 },
  {
    id: 'avoid-x-a',
    mode: 'strategy',
    category: 'avoid-x',
    board: OPENING,
    turn: 'b',
    answers: [19],
    difficulty: 1,
  },
  {
    id: 'min-mobility-a',
    mode: 'strategy',
    category: 'min-mobility',
    board: OPENING,
    turn: 'b',
    answers: [19],
    difficulty: 1,
  },
]

describe('poolForSelection', () => {
  it('keeps only rule puzzles in difficulty order for the rule selection', () => {
    const pool = poolForSelection(MIXED_PUZZLES, { mode: 'rule' }, () => 0)
    expect(pool.map((puzzle) => puzzle.mode)).toEqual(['rule', 'rule', 'rule', 'rule'])
    expect(pool.map((puzzle) => puzzle.difficulty)).toEqual([1, 1, 2, 3])
  })

  it('keeps only the chosen category for a strategy selection', () => {
    const pool = poolForSelection(MIXED_PUZZLES, { mode: 'strategy', category: 'corner' }, () => 0)
    expect(pool.map((puzzle) => puzzle.id).sort()).toEqual(['corner-a', 'corner-b', 'corner-c'])
  })

  it('returns a single puzzle for a category with only one entry', () => {
    const pool = poolForSelection(MIXED_PUZZLES, { mode: 'strategy', category: 'avoid-x' }, () => 0)
    expect(pool.map((puzzle) => puzzle.id)).toEqual(['avoid-x-a'])
  })

  it('shuffles within the selected pool using the given random source', () => {
    const randomValues = [0.9, 0.1]
    let index = 0
    const pool = poolForSelection(
      MIXED_PUZZLES,
      { mode: 'strategy', category: 'corner' },
      () => randomValues[index++ % randomValues.length],
    )
    expect(pool.map((puzzle) => puzzle.id)).toEqual(['corner-b', 'corner-a', 'corner-c'])
  })

  it('does not repeat the previous puzzle across a reshuffle boundary', () => {
    const previousPool = poolForSelection(
      MIXED_PUZZLES,
      { mode: 'strategy', category: 'corner' },
      () => 0,
    )
    const previousPuzzleId = previousPool.at(-1)!.id
    const nextPool = poolForSelection(
      MIXED_PUZZLES,
      { mode: 'strategy', category: 'corner' },
      () => 0.9,
      previousPuzzleId,
    )

    expect(previousPuzzleId).toBe('corner-a')
    expect(nextPool.map((puzzle) => puzzle.id)).toEqual(['corner-b', 'corner-a', 'corner-c'])
    expect(nextPool[0].id).not.toBe(previousPuzzleId)
  })
})

describe('hintPositions', () => {
  it('returns the legal moves while placing in rule mode', () => {
    const state = createPracticeState(PUZZLES)
    expect(hintPositions(state)).toEqual(state.legalMoves)
  })

  it('returns the answers while placing in strategy mode', () => {
    const state = createPracticeState(strategyPuzzle('corner'))
    expect(hintPositions(state)).toEqual([19])
  })

  it('returns nothing once past the placing phase', () => {
    const flipping = startFlipping()
    expect(hintPositions(flipping)).toEqual([])

    const result = pressOk(flipAll(flipping))
    expect(hintPositions(result)).toEqual([])
  })
})
