import {
  applyMove,
  countDiscs,
  initialBoard,
  isGameOver,
  legalMoves,
  serializeBoard,
  type Board,
} from '../core/othello'
import {
  createPracticeState,
  pressOk,
  tapCell,
  type FlippingState,
  type MissCounts,
  type PlacingState,
  type PracticePuzzle,
} from '../practice/practiceMachine'
import { chooseCpuMove } from './cpu'

export type GameOutcome = 'win' | 'loss' | 'draw'

export interface GameResult {
  outcome: GameOutcome
  discs: { b: number; w: number }
  misses: MissCounts
  totalMisses: number
  completed: true
}

interface GameCommon {
  board: Board
  misses: MissCounts
  message: string
  messageSeq: number
  lastMove?: number
}

export interface PlayerTurnState extends GameCommon {
  phase: 'player'
  practice: PlacingState | FlippingState
}

export interface PlayerPassState extends GameCommon { phase: 'playerPass' }
export interface CpuTurnState extends GameCommon { phase: 'cpu' }
export interface CpuPassState extends GameCommon { phase: 'cpuPass' }
export interface GameOverState extends GameCommon { phase: 'gameOver'; result: GameResult }

export type GameState = PlayerTurnState | PlayerPassState | CpuTurnState | CpuPassState | GameOverState

const EMPTY_MISSES: MissCounts = { placing: 0, flipping: 0, earlyOk: 0 }

function totalMisses(misses: MissCounts): number {
  return misses.placing + misses.flipping + misses.earlyOk
}

function finishGame(board: Board, misses: MissCounts, messageSeq: number, lastMove?: number): GameOverState {
  const discs = countDiscs(board)
  const outcome: GameOutcome = discs.b > discs.w ? 'win' : discs.b < discs.w ? 'loss' : 'draw'
  const message = outcome === 'win' ? 'あなたの　かち！' : outcome === 'loss' ? 'あなたの　まけ' : 'ひきわけ'
  return {
    phase: 'gameOver', board, misses, message, messageSeq: messageSeq + 1, lastMove,
    result: { outcome, discs, misses, totalMisses: totalMisses(misses), completed: true },
  }
}

function playerPractice(board: Board, misses: MissCounts, messageSeq: number): PlacingState {
  const puzzle: PracticePuzzle = {
    id: 'game-turn', mode: 'rule', board: serializeBoard(board), turn: 'b', difficulty: 1,
  }
  return { ...createPracticeState([puzzle]), misses, messageSeq }
}

function beginPlayerTurn(board: Board, misses: MissCounts, messageSeq: number, lastMove?: number): GameState {
  if (isGameOver(board)) return finishGame(board, misses, messageSeq, lastMove)
  if (legalMoves(board, 'b').length === 0) {
    return {
      phase: 'playerPass', board, misses,
      message: 'おける　ばしょが　ないよ！　ぱす！', messageSeq: messageSeq + 1, lastMove,
    }
  }
  const practice = playerPractice(board, misses, messageSeq)
  return { phase: 'player', board, misses, message: '', messageSeq, lastMove, practice }
}

function beginCpuTurn(board: Board, misses: MissCounts, messageSeq: number, lastMove?: number): GameState {
  if (isGameOver(board)) return finishGame(board, misses, messageSeq, lastMove)
  if (legalMoves(board, 'w').length === 0) {
    return {
      phase: 'cpuPass', board, misses,
      message: 'あいては　ぱす！', messageSeq: messageSeq + 1, lastMove,
    }
  }
  return {
    phase: 'cpu', board, misses,
    message: 'あいての　ばん', messageSeq: messageSeq + 1, lastMove,
  }
}

/** 開始局面から新しい対局を作る。board 引数は状態機械の局面テストにも使う。 */
export function createGameState(board: Board = initialBoard()): GameState {
  return beginPlayerTurn(board, { ...EMPTY_MISSES }, 0)
}

/**
 * `previous` から `next` への遷移で終局状態に入ったかどうか。
 * 完走・勝ちの加算をこの遷移そのものと同期させるために使う(描画やアンマウントのタイミングに依存しない)。
 */
export function enteredGameOver(previous: GameState, next: GameState): next is GameOverState {
  return previous.phase !== 'gameOver' && next.phase === 'gameOver'
}

export function tapGameCell(state: GameState, position: number): GameState {
  if (state.phase !== 'player') return state
  const practice = tapCell(state.practice, position)
  if (practice.phase === 'result') return state
  return {
    ...state,
    board: practice.board,
    misses: practice.misses,
    message: practice.message,
    messageSeq: practice.messageSeq,
    lastMove: practice.phase === 'flipping' ? practice.placedPosition : state.lastMove,
    practice,
  }
}

export function pressGameOk(state: GameState): GameState {
  if (state.phase === 'playerPass') {
    return beginCpuTurn(state.board, state.misses, state.messageSeq, state.lastMove)
  }
  if (state.phase !== 'player') return state
  const practice = pressOk(state.practice)
  if (practice.phase !== 'result') {
    return {
      ...state, board: practice.board, misses: practice.misses,
      message: practice.message, messageSeq: practice.messageSeq, practice,
    }
  }
  return beginCpuTurn(practice.board, practice.misses, practice.messageSeq, practice.placedPosition)
}

/** CPU の思考待ち後に呼び、選択した着手を自動適用する。 */
export function playCpuTurn(state: GameState, random: () => number = Math.random): GameState {
  if (state.phase !== 'cpu') return state
  const move = chooseCpuMove(state.board, 'w', random)
  if (move === undefined) return beginPlayerTurn(state.board, state.misses, state.messageSeq, state.lastMove)
  return beginPlayerTurn(applyMove(state.board, 'w', move), state.misses, state.messageSeq, move)
}

/** CPU のパスメッセージを読める時間だけ表示した後に呼ぶ。 */
export function finishCpuPass(state: GameState): GameState {
  if (state.phase !== 'cpuPass') return state
  return beginPlayerTurn(state.board, state.misses, state.messageSeq, state.lastMove)
}
