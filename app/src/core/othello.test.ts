import { describe, expect, it } from 'vitest'
import {
  applyMove,
  countDiscs,
  flippedDiscs,
  hasAnyMove,
  initialBoard,
  isGameOver,
  legalMoves,
  parseBoard,
  serializeBoard,
  type Cell,
} from './othello'

function boardWith(cells: Readonly<Record<number, Cell>>) {
  const board: Cell[] = Array<Cell>(64).fill('-')
  for (const [index, cell] of Object.entries(cells)) {
    board[Number(index)] = cell
  }
  return board
}

describe('board conversion', () => {
  it('round-trips the 64-character representation', () => {
    const serialized = '--------'.repeat(3) + '---wb---' + '---bw---' + '--------'.repeat(3)
    expect(serializeBoard(parseBoard(serialized))).toBe(serialized)
  })

  it.each(['-', '-'.repeat(63), '-'.repeat(63) + 'x'])(
    'rejects invalid serialized input: %s',
    (serialized) => {
      expect(() => parseBoard(serialized)).toThrow()
    },
  )
})

describe('move rules', () => {
  it('returns the four opening moves for black', () => {
    expect(legalMoves(initialBoard(), 'b')).toEqual([19, 26, 37, 44])
  })

  it.each([
    ['north-west', 18, 9],
    ['north', 19, 11],
    ['north-east', 20, 13],
    ['west', 26, 25],
    ['east', 28, 29],
    ['south-west', 34, 41],
    ['south', 35, 43],
    ['south-east', 36, 45],
  ])('finds discs flipped toward %s', (_direction, adjacent, closing) => {
    const board = boardWith({ [adjacent]: 'w', [closing]: 'b' })
    expect(flippedDiscs(board, 'b', 27)).toEqual([adjacent])
  })

  it('returns every disc when a move flips in multiple directions', () => {
    const board = boardWith({
      9: 'b',
      11: 'b',
      13: 'b',
      18: 'w',
      19: 'w',
      20: 'w',
      25: 'b',
      26: 'w',
      28: 'w',
      29: 'b',
      34: 'w',
      35: 'w',
      36: 'w',
      41: 'b',
      43: 'b',
      45: 'b',
    })
    expect(flippedDiscs(board, 'b', 27)).toEqual([18, 19, 20, 26, 28, 34, 35, 36])
  })

  it('handles corner moves without scanning outside the board', () => {
    const board = boardWith({ 1: 'w', 2: 'b', 8: 'w', 16: 'b' })
    expect(flippedDiscs(board, 'b', 0)).toEqual([1, 8])
  })

  it('does not wrap a scan from one row edge to the next', () => {
    const board = boardWith({ 8: 'w', 9: 'b' })
    expect(flippedDiscs(board, 'b', 7)).toEqual([])
  })

  it('rejects a line of opponent discs not closed by a friendly disc', () => {
    const board = boardWith({ 28: 'w', 29: 'w' })
    expect(flippedDiscs(board, 'b', 27)).toEqual([])
    expect(legalMoves(board, 'b')).not.toContain(27)
  })

  it('applies a move without mutating the source board', () => {
    const board = initialBoard()
    const before = serializeBoard(board)
    const result = applyMove(board, 'b', 19)

    expect(result[19]).toBe('b')
    expect(result[27]).toBe('b')
    expect(serializeBoard(board)).toBe(before)
    expect(result).not.toBe(board)
    expect(countDiscs(result)).toEqual({ b: 4, w: 1 })
  })

  it('throws when applying an illegal move', () => {
    expect(() => applyMove(initialBoard(), 'b', 0)).toThrow(/Illegal move/)
  })
})

describe('pass and game-over rules', () => {
  it('detects a position where black must pass but white can move', () => {
    const board = parseBoard('-bwwwwww' + 'wwwwwwww'.repeat(7))
    expect(hasAnyMove(board, 'b')).toBe(false)
    expect(hasAnyMove(board, 'w')).toBe(true)
    expect(legalMoves(board, 'w')).toEqual([0])
    expect(isGameOver(board)).toBe(false)
  })

  it('detects game over when neither color has a move', () => {
    const fullBoard = parseBoard('b'.repeat(32) + 'w'.repeat(32))
    const noCaptureBoard = parseBoard('-' + 'b'.repeat(63))

    expect(isGameOver(fullBoard)).toBe(true)
    expect(isGameOver(noCaptureBoard)).toBe(true)
    expect(countDiscs(fullBoard)).toEqual({ b: 32, w: 32 })
  })
})
