import type { Color } from '../core/othello'

export type StrategyCategory = 'corner' | 'avoid-x' | 'min-mobility'
export type Difficulty = 1 | 2 | 3

interface PuzzleBase {
  id: string
  board: string
  turn: Color
  difficulty: Difficulty
}

export interface RulePuzzle extends PuzzleBase {
  mode: 'rule'
  category?: never
  answers?: never
}

export interface StrategyPuzzle extends PuzzleBase {
  mode: 'strategy'
  category: StrategyCategory
  answers: number[]
}

export type Puzzle = RulePuzzle | StrategyPuzzle
