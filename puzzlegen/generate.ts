import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  applyMove,
  initialBoard,
  legalMoves,
  serializeBoard,
  type Board,
  type Color,
} from '../app/src/core/othello.ts'
import { SAMPLE_STRATEGY_PUZZLES } from '../app/src/puzzles/samplePuzzles.ts'
import type {
  Difficulty,
  Puzzle,
  RulePuzzle,
  StrategyCategory,
  StrategyPuzzle,
} from '../app/src/puzzles/types.ts'
import { validateStrategy } from '../app/src/puzzles/validate.ts'

const SEED = 20260715
const TARGET_RULE_PER_DIFFICULTY = 10
const TARGET_STRATEGY_PER_CATEGORY = 30
const MAX_GAMES = 20_000
const X_SQUARES = new Set([9, 14, 49, 54])
const CORNERS = new Set([0, 7, 56, 63])
const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1], [-1, 0], [-1, 1], [0, -1],
  [0, 1], [1, -1], [1, 0], [1, 1],
]

type EmptyRange = 'opening' | 'middle' | 'ending'

function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 0x1_0000_0000
  }
}

function other(color: Color): Color {
  return color === 'b' ? 'w' : 'b'
}

function emptyRange(board: Board): EmptyRange {
  const empty = board.filter((cell) => cell === '-').length
  if (empty >= 40) return 'opening'
  if (empty >= 16) return 'middle'
  return 'ending'
}

function flipDirectionCount(board: Board, color: Color, position: number): number {
  if (board[position] !== '-') return 0
  const row = Math.floor(position / 8)
  const column = position % 8
  const opponent = other(color)
  let count = 0

  for (const [rowStep, columnStep] of DIRECTIONS) {
    let nextRow = row + rowStep
    let nextColumn = column + columnStep
    let sawOpponent = false
    while (nextRow >= 0 && nextRow < 8 && nextColumn >= 0 && nextColumn < 8) {
      const cell = board[nextRow * 8 + nextColumn]
      if (cell === opponent) {
        sawOpponent = true
        nextRow += rowStep
        nextColumn += columnStep
        continue
      }
      if (sawOpponent && cell === color) count += 1
      break
    }
  }
  return count
}

function ruleDifficulty(board: Board, turn: Color): Difficulty | undefined {
  const moves = legalMoves(board, turn)
  if (moves.length === 0) return undefined
  const directions = moves.map((move) => flipDirectionCount(board, turn, move))
  if (moves.length <= 3 && directions.every((count) => count === 1)) return 1
  if (directions.every((count) => count >= 1 && count <= 2)) return 2
  if (directions.some((count) => count >= 3)) return 3
  return undefined
}

function strategyAnswers(
  category: StrategyCategory,
  board: Board,
  turn: Color,
): number[] {
  const moves = legalMoves(board, turn)
  if (category === 'corner') return moves.filter((move) => CORNERS.has(move))
  if (category === 'avoid-x') return moves.filter((move) => !X_SQUARES.has(move))

  return moves
    .map((move) => ({ move, replies: legalMoves(applyMove(board, turn, move), other(turn)).length }))
    .sort((left, right) => left.replies - right.replies)
    .slice(0, 1)
    .map(({ move }) => move)
}

function puzzleKey(board: string, turn: Color): string {
  return `${board}:${turn}`
}

const random = mulberry32(SEED)
const rules = new Map<Difficulty, RulePuzzle[]>([[1, []], [2, []], [3, []]])
const strategies = new Map<StrategyCategory, StrategyPuzzle[]>([
  ['corner', []], ['avoid-x', []], ['min-mobility', []],
])
const candidates = new Map<string, number>([
  ['rule-1', 0], ['rule-2', 0], ['rule-3', 0],
  ['corner', 0], ['avoid-x', 0], ['min-mobility', 0],
])
const sampleKeys = new Set(
  SAMPLE_STRATEGY_PUZZLES.map((puzzle) => puzzleKey(puzzle.board, puzzle.turn)),
)
const usedKeys = new Set<string>()

function incrementCandidate(name: string): void {
  candidates.set(name, (candidates.get(name) ?? 0) + 1)
}

function allTargetsMet(): boolean {
  return [...rules.values()].every((items) => items.length >= TARGET_RULE_PER_DIFFICULTY)
    && [...strategies.values()].every((items) => items.length >= TARGET_STRATEGY_PER_CATEGORY)
}

function consider(board: Board, turn: Color): void {
  const serialized = serializeBoard(board)
  const key = puzzleKey(serialized, turn)
  if (sampleKeys.has(key) || usedKeys.has(key)) return

  const difficulty = ruleDifficulty(board, turn)
  if (difficulty !== undefined) {
    incrementCandidate(`rule-${difficulty}`)
    const pool = rules.get(difficulty)!
    const rangeCounts = new Map<EmptyRange, number>()
    for (const puzzle of pool) {
      const range = emptyRange([...puzzle.board] as Board)
      rangeCounts.set(range, (rangeCounts.get(range) ?? 0) + 1)
    }
    const range = emptyRange(board)
    if (pool.length < TARGET_RULE_PER_DIFFICULTY && (rangeCounts.get(range) ?? 0) < 4) {
      pool.push({
        id: `generated-rule-${difficulty}-${String(pool.length + 1).padStart(2, '0')}`,
        mode: 'rule',
        board: serialized,
        turn,
        difficulty,
      })
      usedKeys.add(key)
      return
    }
  }

  const categories: StrategyCategory[] = ['corner', 'avoid-x', 'min-mobility']
  for (const category of categories) {
    const pool = strategies.get(category)!
    if (pool.length >= TARGET_STRATEGY_PER_CATEGORY) continue
    incrementCandidate(category)
    const answers = strategyAnswers(category, board, turn)
    if (!validateStrategy(category, serialized, turn, answers).ok) continue
    pool.push({
      id: `generated-${category}-${String(pool.length + 1).padStart(2, '0')}`,
      mode: 'strategy',
      category,
      board: serialized,
      turn,
      answers,
      difficulty: 1,
    })
    usedKeys.add(key)
    return
  }
}

let gamesPlayed = 0
while (gamesPlayed < MAX_GAMES && !allTargetsMet()) {
  gamesPlayed += 1
  let board = initialBoard()
  let turn: Color = 'b'
  let passes = 0
  while (passes < 2) {
    const moves = legalMoves(board, turn)
    if (moves.length === 0) {
      passes += 1
      turn = other(turn)
      continue
    }
    passes = 0
    consider(board, turn)
    const move = moves[Math.floor(random() * moves.length)]
    board = applyMove(board, turn, move)
    turn = other(turn)
  }
}

if (!allTargetsMet()) {
  throw new Error(`Could not reach all targets after ${gamesPlayed} games`)
}

const generated: Puzzle[] = [
  ...rules.get(1)!, ...rules.get(2)!, ...rules.get(3)!,
  ...strategies.get('corner')!,
  ...strategies.get('avoid-x')!,
  ...strategies.get('min-mobility')!,
]
const outputPath = fileURLToPath(new URL('../app/src/puzzles/generated.ts', import.meta.url))
const source = `// Generated by npm run puzzlegen (seed ${SEED}). Do not edit by hand.\n`
  + `import type { Puzzle } from './types'\n\n`
  + `export const GENERATED_PUZZLES: ReadonlyArray<Puzzle> = ${JSON.stringify(generated, null, 2)}\n`
writeFileSync(outputPath, source, 'utf8')

console.log(`seed=${SEED} games=${gamesPlayed}`)
for (const difficulty of [1, 2, 3] as const) {
  const pool = rules.get(difficulty)!
  const ranges = { opening: 0, middle: 0, ending: 0 }
  for (const puzzle of pool) ranges[emptyRange([...puzzle.board] as Board)] += 1
  console.log(`rule difficulty ${difficulty}: candidates=${candidates.get(`rule-${difficulty}`)} adopted=${pool.length} ranges=${JSON.stringify(ranges)}`)
}
for (const category of ['corner', 'avoid-x', 'min-mobility'] as const) {
  console.log(`${category}: candidates=${candidates.get(category)} adopted=${strategies.get(category)!.length}`)
}
