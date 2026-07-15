import { describe, expect, it } from 'vitest'
import { legalMoves, parseBoard, serializeBoard } from '../core/othello'
import { chooseCpuMove } from './cpu'
import {
  createGameState,
  enteredGameOver,
  finishCpuPass,
  playCpuTurn,
  pressGameOk,
  tapGameCell,
  type GameState,
} from './gameMachine'

function completePlayerMove(state: GameState, move: number): GameState {
  let current = tapGameCell(state, move)
  expect(current.phase).toBe('player')
  if (current.phase !== 'player' || current.practice.phase !== 'flipping') return current
  for (const position of current.practice.discsToFlip) {
    current = tapGameCell(current, position)
  }
  return pressGameOk(current)
}

describe('turn transitions', () => {
  it('moves from a manually completed player move through an automatic legal CPU reply', () => {
    const cpu = completePlayerMove(createGameState(), 19)
    expect(cpu.phase).toBe('cpu')
    const before = serializeBoard(cpu.board)
    const after = playCpuTurn(cpu, () => 0)
    expect(serializeBoard(after.board)).not.toBe(before)
    expect(after.lastMove).toBe(18)
    expect(after.board[18]).toBe('w')
    expect(after.board[27]).toBe('w')
    expect(['player', 'playerPass', 'gameOver']).toContain(after.phase)
  })

  it('waits for OK when the player has no legal move', () => {
    const board = parseBoard('-bwwwwww' + 'wwwwwwww'.repeat(7))
    const state = createGameState(board)
    expect(state.phase).toBe('playerPass')
    expect(state.message).toBe('おける　ばしょが　ないよ！　ぱす！')
    expect(pressGameOk(state).phase).toBe('cpu')
  })

  it('shows a CPU pass and then returns to the player', () => {
    const board = parseBoard('ww-wwwwwwwwwwwwwwwwwbwwwwwwwwwbwwwwwbwbbbbwbwbbw-wwwbwwwwwwwwwww')
    const passed = completePlayerMove(createGameState(board), 48)
    expect(passed.phase).toBe('cpuPass')
    expect(passed.message).toBe('あいては　ぱす！')
    expect(finishCpuPass(passed).phase).toBe('player')
  })

  it('ends after both colors have no move even when an empty square remains', () => {
    const state = createGameState(parseBoard('-' + 'b'.repeat(63)))
    expect(state.phase).toBe('gameOver')
    if (state.phase === 'gameOver') {
      expect(state.result.completed).toBe(true)
      expect(state.result.discs).toEqual({ b: 63, w: 0 })
    }
  })

  it('ends when the board is full', () => {
    expect(createGameState(parseBoard('b'.repeat(40) + 'w'.repeat(24))).phase).toBe('gameOver')
  })

  it('can play a complete game from the opening to a notified result', () => {
    let state = createGameState()
    for (let turn = 0; turn < 200 && state.phase !== 'gameOver'; turn += 1) {
      if (state.phase === 'player') {
        if (state.practice.phase === 'placing') {
          state = tapGameCell(state, state.practice.legalMoves[0])
        }
        if (state.phase === 'player' && state.practice.phase === 'flipping') {
          for (const position of state.practice.discsToFlip) state = tapGameCell(state, position)
          state = pressGameOk(state)
        }
      } else if (state.phase === 'playerPass') {
        state = pressGameOk(state)
      } else if (state.phase === 'cpu') {
        state = playCpuTurn(state, () => 0)
      } else if (state.phase === 'cpuPass') {
        state = finishCpuPass(state)
      }
    }
    expect(state.phase).toBe('gameOver')
    if (state.phase === 'gameOver') {
      expect(state.result.completed).toBe(true)
      expect(state.result.discs.b + state.result.discs.w).toBeGreaterThanOrEqual(4)
    }
  })
})

describe('results', () => {
  it.each([
    ['b'.repeat(40) + 'w'.repeat(24), 'win', 'あなたの　かち！'],
    ['b'.repeat(24) + 'w'.repeat(40), 'loss', 'あなたの　まけ'],
    ['b'.repeat(32) + 'w'.repeat(32), 'draw', 'ひきわけ'],
  ] as const)('judges the final position', (serialized, outcome, message) => {
    const state = createGameState(parseBoard(serialized))
    expect(state.phase).toBe('gameOver')
    if (state.phase === 'gameOver') {
      expect(state.result.outcome).toBe(outcome)
      expect(state.message).toBe(message)
      expect(state.result.completed).toBe(true)
    }
  })
})

describe('miss accumulation', () => {
  it('keeps all three miss types after the CPU reply', () => {
    let state = tapGameCell(createGameState(), 0)
    state = tapGameCell(state, 19)
    state = tapGameCell(state, 0)
    state = pressGameOk(state)
    state = tapGameCell(state, 27)
    state = pressGameOk(state)
    expect(state.phase).toBe('cpu')
    state = playCpuTurn(state, () => 0)
    expect(state.misses).toEqual({ placing: 1, flipping: 1, earlyOk: 1 })
  })
})

describe('enteredGameOver', () => {
  it('fires exactly once, at the transition into gameOver, across a full game', () => {
    let state: GameState = createGameState()
    let transitionCount = 0
    for (let turn = 0; turn < 200 && state.phase !== 'gameOver'; turn += 1) {
      const previous = state
      if (state.phase === 'player') {
        if (state.practice.phase === 'placing') {
          state = tapGameCell(state, state.practice.legalMoves[0])
        }
        if (state.phase === 'player' && state.practice.phase === 'flipping') {
          for (const position of state.practice.discsToFlip) state = tapGameCell(state, position)
          state = pressGameOk(state)
        }
      } else if (state.phase === 'playerPass') {
        state = pressGameOk(state)
      } else if (state.phase === 'cpu') {
        state = playCpuTurn(state, () => 0)
      } else if (state.phase === 'cpuPass') {
        state = finishCpuPass(state)
      }
      if (enteredGameOver(previous, state)) transitionCount += 1
    }
    expect(state.phase).toBe('gameOver')
    expect(transitionCount).toBe(1)
  })

  it('is false for a normal player-to-CPU handoff', () => {
    const previous = createGameState()
    const next = completePlayerMove(previous, 19)
    expect(next.phase).not.toBe('gameOver')
    expect(enteredGameOver(previous, next)).toBe(false)
  })

  it('is false once already in gameOver, even if a state function is called again (no double counting)', () => {
    const gameOver = createGameState(parseBoard('b'.repeat(40) + 'w'.repeat(24)))
    expect(gameOver.phase).toBe('gameOver')
    const again = pressGameOk(gameOver)
    expect(again).toBe(gameOver)
    expect(enteredGameOver(gameOver, again)).toBe(false)
  })
})

describe('CPU move choice', () => {
  it.each([
    [0, 20],
    [0.25, 29],
    [0.5, 34],
    [0.999, 43],
  ])('uses injected random value %s to select a legal move', (randomValue, expected) => {
    const board = parseBoard('--------'.repeat(3) + '---wb---' + '---bw---' + '--------'.repeat(3))
    const moves = legalMoves(board, 'w')
    const selected = chooseCpuMove(board, 'w', () => randomValue)
    expect(selected).toBe(expected)
    expect(moves).toContain(selected)
  })

  it('returns undefined when there is no legal move', () => {
    expect(chooseCpuMove(parseBoard('b'.repeat(64)), 'w', () => 0)).toBeUndefined()
  })
})
