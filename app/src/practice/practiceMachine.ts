import {
  flippedDiscs,
  legalMoves as findLegalMoves,
  parseBoard,
  type Board,
  type Color,
} from '../core/othello'
import type { Puzzle, StrategyCategory } from '../puzzles/types'

export type PracticePuzzle = Puzzle

export interface MissCounts {
  placing: number
  flipping: number
  earlyOk: number
}

interface CommonState {
  board: Board
  turn: Color
  puzzleIndex: number
  legalMoves: ReadonlyArray<number>
  category?: StrategyCategory
  answers?: ReadonlyArray<number>
  misses: MissCounts
  message: string
  prompt: string
  hint: string
  /** メッセージが更新されるたびに増える連番。同一文言でも MessageBar のポップを再発火させるために使う。 */
  messageSeq: number
}

export interface PlacingState extends CommonState {
  phase: 'placing'
}

export interface FlippingState extends CommonState {
  phase: 'flipping'
  placedPosition: number
  discsToFlip: ReadonlySet<number>
  flippedPositions: ReadonlySet<number>
}

export interface ResultState extends CommonState {
  phase: 'result'
  placedPosition: number
  discsToFlip: ReadonlySet<number>
  flippedPositions: ReadonlySet<number>
  result: 'だいせいこう' | 'せいこう'
}

export type PracticeState = PlacingState | FlippingState | ResultState

const EMPTY_MISSES: MissCounts = { placing: 0, flipping: 0, earlyOk: 0 }

function puzzleState(puzzles: ReadonlyArray<PracticePuzzle>, puzzleIndex: number): PlacingState {
  if (puzzles.length === 0) {
    throw new Error('Practice needs at least one puzzle')
  }

  const normalizedIndex = ((puzzleIndex % puzzles.length) + puzzles.length) % puzzles.length
  const puzzle = puzzles[normalizedIndex]
  const board = parseBoard(puzzle.board)
  const moves = findLegalMoves(board, puzzle.turn)
  if (moves.length === 0) {
    throw new Error(`Puzzle ${normalizedIndex} must have at least one legal move`)
  }

  return {
    phase: 'placing',
    board,
    turn: puzzle.turn,
    puzzleIndex: normalizedIndex,
    legalMoves: moves,
    category: puzzle.mode === 'strategy' ? puzzle.category : undefined,
    answers: puzzle.mode === 'strategy' ? puzzle.answers : undefined,
    misses: { ...EMPTY_MISSES },
    message: '',
    prompt: puzzle.mode === 'strategy' ? STRATEGY_TEXT[puzzle.category].prompt : '',
    hint: '',
    messageSeq: 0,
  }
}

export function createPracticeState(
  puzzles: ReadonlyArray<PracticePuzzle>,
  puzzleIndex = 0,
): PlacingState {
  return puzzleState(puzzles, puzzleIndex)
}

export function tapCell(state: PracticeState, position: number): PracticeState {
  if (state.phase === 'result') {
    return state
  }

  if (state.phase === 'placing') {
    if (!state.legalMoves.includes(position)) {
      return {
        ...state,
        misses: { ...state.misses, placing: state.misses.placing + 1 },
        message: 'そこには　おけないよ！',
        hint: '',
        messageSeq: state.messageSeq + 1,
      }
    }

    const puzzleAnswers = state.answers
    if (puzzleAnswers !== undefined && !puzzleAnswers.includes(position)) {
      return {
        ...state,
        misses: { ...state.misses, placing: state.misses.placing + 1 },
        message: 'ちがうよ！　もういちど',
        hint: state.category === undefined ? '' : STRATEGY_TEXT[state.category].hint,
        messageSeq: state.messageSeq + 1,
      }
    }

    const positions = flippedDiscs(state.board, state.turn, position)
    const nextBoard = [...state.board]
    nextBoard[position] = state.turn
    return {
      ...state,
      phase: 'flipping',
      board: nextBoard,
      placedPosition: position,
      discsToFlip: new Set(positions),
      flippedPositions: new Set(),
      message: 'ひっくりかえそう',
      hint: '',
      messageSeq: state.messageSeq + 1,
    }
  }

  if (state.flippedPositions.has(position)) {
    return state
  }

  if (!state.discsToFlip.has(position)) {
    return {
      ...state,
      misses: { ...state.misses, flipping: state.misses.flipping + 1 },
      message: 'そのこまは　ひっくりかえせないよ！',
      messageSeq: state.messageSeq + 1,
    }
  }

  const nextBoard = [...state.board]
  nextBoard[position] = state.turn
  return {
    ...state,
    board: nextBoard,
    flippedPositions: new Set([...state.flippedPositions, position]),
    message: 'ひっくりかえそう',
    messageSeq: state.messageSeq + 1,
  }
}

export function pressOk(state: PracticeState): PracticeState {
  if (state.phase !== 'flipping') {
    return state
  }

  if (state.flippedPositions.size < state.discsToFlip.size) {
    return {
      ...state,
      misses: { ...state.misses, earlyOk: state.misses.earlyOk + 1 },
      message: 'まだ　ひっくりかえる　こまが　あるよ',
      messageSeq: state.messageSeq + 1,
    }
  }

  const totalMisses = state.misses.placing + state.misses.flipping + state.misses.earlyOk
  const result = totalMisses === 0 ? 'だいせいこう' : 'せいこう'
  return {
    ...state,
    phase: 'result',
    result,
    message: `${result}！`,
    messageSeq: state.messageSeq + 1,
  }
}

export function nextPuzzle(
  state: PracticeState,
  puzzles: ReadonlyArray<PracticePuzzle>,
): PracticeState {
  if (state.phase !== 'result') {
    return state
  }
  return puzzleState(puzzles, state.puzzleIndex + 1)
}

function shuffled<T>(items: ReadonlyArray<T>, random: () => number): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(random() * (index + 1))
    ;[result[index], result[otherIndex]] = [result[otherIndex], result[index]]
  }
  return result
}

/** ルール問題は難度順を保ち、各難度内と考える問題全体をシャッフルする。 */
export function shuffledPracticePuzzles(
  puzzles: ReadonlyArray<PracticePuzzle>,
  random: () => number = Math.random,
): PracticePuzzle[] {
  const rules = ([1, 2, 3] as const).flatMap((difficulty) =>
    shuffled(puzzles.filter((puzzle) => puzzle.mode === 'rule' && puzzle.difficulty === difficulty), random),
  )
  const strategies = shuffled(puzzles.filter((puzzle) => puzzle.mode === 'strategy'), random)
  return [...rules, ...strategies]
}

function rows(...values: string[]): string {
  return values.join('')
}

/** T005 まで使った、ルール練習用の仮局面。 */
export const PRACTICE_PUZZLES: ReadonlyArray<PracticePuzzle> = [
  {
    id: 'rule-opening',
    mode: 'rule',
    board: rows(
      '--------',
      '--------',
      '--------',
      '---wb---',
      '---bw---',
      '--------',
      '--------',
      '--------',
    ),
    turn: 'b',
    difficulty: 1,
  },
  {
    id: 'rule-white',
    mode: 'rule',
    board: rows(
      '--------',
      '--------',
      '--------',
      '----bw--',
      '--------',
      '--------',
      '--------',
      '--------',
    ),
    turn: 'w',
    difficulty: 1,
  },
  {
    id: 'rule-many-directions',
    mode: 'rule',
    board: rows(
      '--------',
      '-b-b-b--',
      '--www---',
      '-bw-wb--',
      '--www---',
      '-b-b-b--',
      '--------',
      '--------',
    ),
    turn: 'b',
    difficulty: 3,
  },
  {
    id: 'rule-corner-black',
    mode: 'rule',
    board: rows(
      '-wb-----',
      'w-------',
      'b-------',
      '--------',
      '--------',
      '--------',
      '--------',
      '--------',
    ),
    turn: 'b',
    difficulty: 2,
  },
  {
    id: 'rule-corner-white',
    mode: 'rule',
    board: rows(
      '-----wb-',
      '-------b',
      '-------w',
      '--------',
      '--------',
      '--------',
      '--------',
      '--------',
    ),
    turn: 'w',
    difficulty: 2,
  },
]

const STRATEGY_TEXT: Record<StrategyCategory, { prompt: string; hint: string }> = {
  corner: {
    prompt: 'すみを　とろう',
    hint: 'すみを　さがしてみよう',
  },
  'avoid-x': {
    prompt: 'ばつの　ばしょは　やめよう',
    hint: 'すみの　ななめよこは　あぶないよ',
  },
  'min-mobility': {
    prompt: 'あいてが　うてる　ばしょが　すくなくなる　ところに　うとう',
    hint: 'あいての　おけるばしょを　かぞえてみよう',
  },
}
