export type Color = 'b' | 'w'
export type Cell = Color | '-'
export type Board = ReadonlyArray<Cell>

const BOARD_SIZE = 8
const CELL_COUNT = BOARD_SIZE * BOARD_SIZE
const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
]

function isCell(value: unknown): value is Cell {
  return value === '-' || value === 'b' || value === 'w'
}

function assertValidBoard(board: Board): void {
  if (board.length !== CELL_COUNT || !board.every(isCell)) {
    throw new Error('Board must contain exactly 64 cells using only -, b, or w')
  }
}

function isOnBoard(row: number, column: number): boolean {
  return row >= 0 && row < BOARD_SIZE && column >= 0 && column < BOARD_SIZE
}

function opponent(color: Color): Color {
  return color === 'b' ? 'w' : 'b'
}

export function parseBoard(serialized: string): Board {
  if (serialized.length !== CELL_COUNT) {
    throw new Error('Serialized board must be exactly 64 characters long')
  }

  const cells = [...serialized]
  if (!cells.every(isCell)) {
    throw new Error('Serialized board may contain only -, b, or w')
  }

  return cells
}

export function serializeBoard(board: Board): string {
  assertValidBoard(board)
  return board.join('')
}

export function initialBoard(): Board {
  const cells: Cell[] = Array<Cell>(CELL_COUNT).fill('-')
  cells[27] = 'w'
  cells[28] = 'b'
  cells[35] = 'b'
  cells[36] = 'w'
  return cells
}

export function flippedDiscs(board: Board, color: Color, pos: number): number[] {
  assertValidBoard(board)
  if (!Number.isInteger(pos) || pos < 0 || pos >= CELL_COUNT || board[pos] !== '-') {
    return []
  }

  const startRow = Math.floor(pos / BOARD_SIZE)
  const startColumn = pos % BOARD_SIZE
  const otherColor = opponent(color)
  const flipped: number[] = []

  for (const [rowStep, columnStep] of DIRECTIONS) {
    let row = startRow + rowStep
    let column = startColumn + columnStep
    const candidates: number[] = []

    while (isOnBoard(row, column)) {
      const index = row * BOARD_SIZE + column
      if (board[index] !== otherColor) {
        break
      }
      candidates.push(index)
      row += rowStep
      column += columnStep
    }

    if (
      candidates.length > 0 &&
      isOnBoard(row, column) &&
      board[row * BOARD_SIZE + column] === color
    ) {
      flipped.push(...candidates)
    }
  }

  return flipped
}

export function legalMoves(board: Board, color: Color): number[] {
  assertValidBoard(board)
  const moves: number[] = []
  for (let pos = 0; pos < CELL_COUNT; pos += 1) {
    if (flippedDiscs(board, color, pos).length > 0) {
      moves.push(pos)
    }
  }
  return moves
}

export function applyMove(board: Board, color: Color, pos: number): Board {
  const flipped = flippedDiscs(board, color, pos)
  if (flipped.length === 0) {
    throw new Error('Illegal move at position ' + pos)
  }

  const nextBoard = [...board]
  nextBoard[pos] = color
  for (const index of flipped) {
    nextBoard[index] = color
  }
  return nextBoard
}

export function hasAnyMove(board: Board, color: Color): boolean {
  assertValidBoard(board)
  for (let pos = 0; pos < CELL_COUNT; pos += 1) {
    if (flippedDiscs(board, color, pos).length > 0) {
      return true
    }
  }
  return false
}

export function isGameOver(board: Board): boolean {
  return !hasAnyMove(board, 'b') && !hasAnyMove(board, 'w')
}

export function countDiscs(board: Board): { b: number; w: number } {
  assertValidBoard(board)
  let b = 0
  let w = 0
  for (const cell of board) {
    if (cell === 'b') b += 1
    if (cell === 'w') w += 1
  }
  return { b, w }
}
