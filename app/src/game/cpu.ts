import { legalMoves, type Board, type Color } from '../core/othello'

/** 合法手から一様ランダムに1手を選ぶ。合法手がなければ undefined。 */
export function chooseCpuMove(
  board: Board,
  color: Color,
  random: () => number = Math.random,
): number | undefined {
  const moves = legalMoves(board, color)
  if (moves.length === 0) return undefined
  const index = Math.min(Math.floor(random() * moves.length), moves.length - 1)
  return moves[index]
}
