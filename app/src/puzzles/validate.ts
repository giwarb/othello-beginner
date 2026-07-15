import { applyMove, legalMoves, parseBoard, type Board, type Color } from '../core/othello'
import type { Puzzle, StrategyCategory, StrategyPuzzle } from './types'

export type ValidationResult = { ok: true } | { ok: false; reasons: string[] }

const CORNERS = [0, 7, 56, 63] as const
const X_TO_CORNER = new Map<number, number>([
  [9, 0],
  [14, 7],
  [49, 56],
  [54, 63],
])

function opponent(turn: Color): Color {
  return turn === 'b' ? 'w' : 'b'
}

function failure(...reasons: string[]): ValidationResult {
  return { ok: false, reasons }
}

function samePositions(actual: ReadonlyArray<number>, expected: ReadonlyArray<number>): boolean {
  if (actual.length !== expected.length) return false
  const actualSet = new Set(actual)
  return actualSet.size === actual.length && expected.every((position) => actualSet.has(position))
}

function commonValidation(
  serializedBoard: string,
  turn: Color,
  answers: ReadonlyArray<number>,
): { board: Board; moves: number[] } | ValidationResult {
  let board: Board
  try {
    board = parseBoard(serializedBoard)
  } catch (error) {
    return failure(error instanceof Error ? error.message : 'Invalid board')
  }

  const moves = legalMoves(board, turn)
  if (moves.length === 0) return failure('The player to move must have a legal move')
  if (!answers.every((answer) => moves.includes(answer))) {
    return failure('Every answer must be a legal move')
  }
  if (new Set(answers).size !== answers.length) {
    return failure('Answers must not contain duplicates')
  }
  return { board, moves }
}

export function validateCorner(
  serializedBoard: string,
  turn: Color,
  answers: ReadonlyArray<number>,
): ValidationResult {
  const common = commonValidation(serializedBoard, turn, answers)
  if ('ok' in common) return common

  const cornerMoves = common.moves.filter((move) => CORNERS.includes(move as (typeof CORNERS)[number]))
  if (cornerMoves.length === 0) return failure('At least one corner must be legal')
  if (!samePositions(answers, cornerMoves)) return failure('Answers must be all legal corners')

  for (const corner of cornerMoves) {
    const replyMoves = legalMoves(applyMove(common.board, turn, corner), opponent(turn))
    if (replyMoves.some((move) => CORNERS.includes(move as (typeof CORNERS)[number]))) {
      return failure('Taking a corner must not give the opponent another immediate corner')
    }
  }
  return { ok: true }
}

export function validateAvoidX(
  serializedBoard: string,
  turn: Color,
  answers: ReadonlyArray<number>,
): ValidationResult {
  const common = commonValidation(serializedBoard, turn, answers)
  if ('ok' in common) return common

  const xMoves = common.moves.filter((move) => X_TO_CORNER.has(move))
  if (xMoves.length === 0) return failure('At least one X-square must be legal')
  const safeMoves = common.moves.filter((move) => !X_TO_CORNER.has(move))
  if (safeMoves.length === 0) return failure('At least one non-X legal move must exist')
  if (!samePositions(answers, safeMoves)) return failure('Answers must be all non-X legal moves')

  for (const xMove of xMoves) {
    const correspondingCorner = X_TO_CORNER.get(xMove)!
    const replyMoves = legalMoves(applyMove(common.board, turn, xMove), opponent(turn))
    if (!replyMoves.includes(correspondingCorner)) {
      return failure('Every legal X move must give the opponent its corresponding corner')
    }
  }
  return { ok: true }
}

export function validateMinMobility(
  serializedBoard: string,
  turn: Color,
  answers: ReadonlyArray<number>,
): ValidationResult {
  const common = commonValidation(serializedBoard, turn, answers)
  if ('ok' in common) return common
  if (common.moves.length < 2) return failure('At least two legal moves are needed for comparison')

  const mobility = common.moves
    .map((move) => ({
      move,
      count: legalMoves(applyMove(common.board, turn, move), opponent(turn)).length,
    }))
    .sort((left, right) => left.count - right.count)
  if (mobility[0].count === mobility[1].count) return failure('The minimum must be unique')
  if (mobility[1].count - mobility[0].count < 2) {
    return failure('The next-best move must allow at least two more replies')
  }
  if (!samePositions(answers, [mobility[0].move])) {
    return failure('The answer must be the unique minimum-mobility move')
  }
  return { ok: true }
}

export function validateStrategy(
  category: StrategyCategory,
  board: string,
  turn: Color,
  answers: ReadonlyArray<number>,
): ValidationResult {
  if (category === 'corner') return validateCorner(board, turn, answers)
  if (category === 'avoid-x') return validateAvoidX(board, turn, answers)
  return validateMinMobility(board, turn, answers)
}

export function validatePuzzle(puzzle: Puzzle): ValidationResult {
  if (puzzle.mode === 'strategy') {
    return validateStrategy(puzzle.category, puzzle.board, puzzle.turn, puzzle.answers)
  }
  const common = commonValidation(puzzle.board, puzzle.turn, [])
  return 'ok' in common ? common : { ok: true }
}

export function validateStrategyPuzzle(puzzle: StrategyPuzzle): ValidationResult {
  return validateStrategy(puzzle.category, puzzle.board, puzzle.turn, puzzle.answers)
}
