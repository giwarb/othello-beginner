import { describe, expect, it, vi } from 'vitest'
import { legalMoves, parseBoard, serializeBoard } from '../core/othello'
import { addCompleted, addWin, loadRecords, type RecordsStorage } from '../records/records'
import { chooseCpuMove } from './cpu'
import {
  advanceCpuAndRecord,
  createGameState,
  enteredGameOver,
  finishCpuPass,
  playCpuTurn,
  pressGameOk,
  pressGameOkAndRecord,
  tapGameCell,
  type GameState,
} from './gameMachine'

function memoryStorage(): RecordsStorage {
  const store = new Map<string, string>()
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
  }
}

function recordersFor(storage: RecordsStorage) {
  return {
    addCompleted: vi.fn(() => addCompleted(storage)),
    addWin: vi.fn(() => addWin(storage)),
  }
}

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

describe('game record transitions', () => {
  const PLAYER_FINAL_BOARD = '-w' + 'b'.repeat(62)
  const CPU_FINAL_BOARD = '-b' + 'w'.repeat(62)

  function finishWinningPlayerGame(
    recorders: ReturnType<typeof recordersFor>,
    initial: GameState = createGameState(parseBoard(PLAYER_FINAL_BOARD)),
  ): GameState {
    let state = initial
    state = tapGameCell(state, 0)
    state = tapGameCell(state, 1)
    return pressGameOkAndRecord(state, recorders)
  }

  it('records completed and wins exactly once on the player OK terminal path', () => {
    const storage = memoryStorage()
    const recorders = recordersFor(storage)

    const gameOver = finishWinningPlayerGame(recorders)
    const processedAgain = pressGameOkAndRecord(gameOver, recorders)

    expect(gameOver.phase).toBe('gameOver')
    expect(processedAgain).toBe(gameOver)
    expect(recorders.addCompleted).toHaveBeenCalledTimes(1)
    expect(recorders.addWin).toHaveBeenCalledTimes(1)
    expect(loadRecords(storage)).toEqual({ greatSuccess: 0, completed: 1, wins: 1 })
  })

  it('records completed but not wins on the CPU timer terminal path', () => {
    const storage = memoryStorage()
    const recorders = recordersFor(storage)
    const board = parseBoard(CPU_FINAL_BOARD)
    const cpuState: GameState = {
      phase: 'cpu', board, misses: { placing: 0, flipping: 0, earlyOk: 0 },
      message: 'あいての　ばん', messageSeq: 1,
    }

    const gameOver = advanceCpuAndRecord(cpuState, recorders, () => 0)

    expect(gameOver.phase).toBe('gameOver')
    expect(recorders.addCompleted).toHaveBeenCalledTimes(1)
    expect(recorders.addWin).not.toHaveBeenCalled()
    expect(loadRecords(storage)).toEqual({ greatSuccess: 0, completed: 1, wins: 0 })
  })

  it('records another completion and win after もういちど starts a new game', () => {
    const storage = memoryStorage()
    const recorders = recordersFor(storage)

    const firstGameOver = finishWinningPlayerGame(recorders)
    expect(firstGameOver.phase).toBe('gameOver')
    const restarted = createGameState(parseBoard(PLAYER_FINAL_BOARD))
    expect(restarted.phase).toBe('player')
    finishWinningPlayerGame(recorders, restarted)

    expect(recorders.addCompleted).toHaveBeenCalledTimes(2)
    expect(recorders.addWin).toHaveBeenCalledTimes(2)
    expect(loadRecords(storage)).toEqual({ greatSuccess: 0, completed: 2, wins: 2 })
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
