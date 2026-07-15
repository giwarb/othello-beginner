import {
  flippedDiscs,
  legalMoves as findLegalMoves,
  parseBoard,
  type Board,
  type Color,
} from '../core/othello'

export interface PracticePuzzle {
  board: string
  turn: Color
}

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
  misses: MissCounts
  message: string
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
    misses: { ...EMPTY_MISSES },
    message: '',
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

function rows(...values: string[]): string {
  return values.join('')
}

/** T005/T006 まで使う、ルール練習用の仮局面。 */
export const PRACTICE_PUZZLES: ReadonlyArray<PracticePuzzle> = [
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
]
