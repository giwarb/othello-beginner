import { parseBoard, type Board, type Cell } from '../core/othello'

export const BOARD_SIZE = 8
export const CELL_SIZE = 60
export const BOARD_PIXELS = BOARD_SIZE * CELL_SIZE

export function posToRowColumn(pos: number): { row: number; column: number } {
  return { row: Math.floor(pos / BOARD_SIZE), column: pos % BOARD_SIZE }
}

export function cellOrigin(pos: number): { x: number; y: number } {
  const { row, column } = posToRowColumn(pos)
  return { x: column * CELL_SIZE, y: row * CELL_SIZE }
}

export function cellCenter(pos: number): { x: number; y: number } {
  const { x, y } = cellOrigin(pos)
  return { x: x + CELL_SIZE / 2, y: y + CELL_SIZE / 2 }
}

/** Accepts either the parsed 64-cell board or its 64-character serialization. */
export function normalizeBoard(board: Board | string): Board {
  return typeof board === 'string' ? parseBoard(board) : board
}

function isDisc(cell: Cell): cell is 'b' | 'w' {
  return cell === 'b' || cell === 'w'
}

/**
 * Positions whose cell changed from one player's disc to the other player's
 * disc between two board snapshots. Used to trigger the flip animation —
 * a disc newly placed on an empty cell is not a "flip".
 */
export function flippedPositions(previous: Board, next: Board): number[] {
  const length = Math.min(previous.length, next.length)
  const positions: number[] = []
  for (let pos = 0; pos < length; pos += 1) {
    const before = previous[pos]
    const after = next[pos]
    if (before !== after && isDisc(before) && isDisc(after)) {
      positions.push(pos)
    }
  }
  return positions
}
