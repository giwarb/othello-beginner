import { describe, expect, it } from 'vitest'
import { initialBoard, parseBoard, type Cell } from '../core/othello'
import {
  BOARD_SIZE,
  CELL_SIZE,
  cellCenter,
  cellOrigin,
  flippedPositions,
  normalizeBoard,
  posToRowColumn,
} from './boardGeometry'

describe('posToRowColumn', () => {
  it('maps position 0 to the top-left cell', () => {
    expect(posToRowColumn(0)).toEqual({ row: 0, column: 0 })
  })

  it('maps the last position to the bottom-right cell', () => {
    expect(posToRowColumn(63)).toEqual({ row: 7, column: 7 })
  })

  it('wraps to the next row after BOARD_SIZE columns', () => {
    expect(posToRowColumn(BOARD_SIZE)).toEqual({ row: 1, column: 0 })
  })
})

describe('cellOrigin / cellCenter', () => {
  it('places the origin of position 0 at (0, 0)', () => {
    expect(cellOrigin(0)).toEqual({ x: 0, y: 0 })
  })

  it('offsets the center by half a cell from the origin', () => {
    const origin = cellOrigin(9)
    expect(cellCenter(9)).toEqual({ x: origin.x + CELL_SIZE / 2, y: origin.y + CELL_SIZE / 2 })
  })
})

describe('normalizeBoard', () => {
  it('passes an already-parsed board through unchanged', () => {
    const board = initialBoard()
    expect(normalizeBoard(board)).toBe(board)
  })

  it('parses a 64-character serialization into a board', () => {
    const serialized = '-'.repeat(64)
    expect(normalizeBoard(serialized)).toEqual(parseBoard(serialized))
  })

  it('rejects an invalid serialization, same as parseBoard', () => {
    expect(() => normalizeBoard('too-short')).toThrow()
  })
})

describe('flippedPositions', () => {
  function boardWith(cells: Readonly<Record<number, Cell>>) {
    const board: Cell[] = Array<Cell>(64).fill('-')
    for (const [index, cell] of Object.entries(cells)) {
      board[Number(index)] = cell
    }
    return board
  }

  it('reports no change between identical boards', () => {
    expect(flippedPositions(initialBoard(), initialBoard())).toEqual([])
  })

  it('does not treat placing a disc on an empty cell as a flip', () => {
    const before = boardWith({})
    const after = boardWith({ 10: 'b' })
    expect(flippedPositions(before, after)).toEqual([])
  })

  it('reports a position that changed from white to black', () => {
    const before = boardWith({ 20: 'w' })
    const after = boardWith({ 20: 'b' })
    expect(flippedPositions(before, after)).toEqual([20])
  })

  it('reports every position that changed color', () => {
    const before = boardWith({ 1: 'b', 2: 'w', 3: 'b' })
    const after = boardWith({ 1: 'w', 2: 'b', 3: 'b' })
    expect(flippedPositions(before, after)).toEqual([1, 2])
  })

  it('does not report a disc being removed entirely', () => {
    const before = boardWith({ 5: 'b' })
    const after = boardWith({})
    expect(flippedPositions(before, after)).toEqual([])
  })
})
