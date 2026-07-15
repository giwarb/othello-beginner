import { describe, expect, it } from 'vitest'
import { addCompleted, addGreatSuccess, addWin, loadRecords, type RecordsStorage } from './records'

function memoryStorage(): RecordsStorage {
  const store = new Map<string, string>()
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
  }
}

describe('records', () => {
  it('defaults to all zero when nothing was saved', () => {
    expect(loadRecords(memoryStorage())).toEqual({ greatSuccess: 0, completed: 0, wins: 0 })
  })

  it('defaults to all zero when no storage is available', () => {
    expect(loadRecords(undefined)).toEqual({ greatSuccess: 0, completed: 0, wins: 0 })
  })

  it('accumulates each kind of record independently', () => {
    const storage = memoryStorage()
    addGreatSuccess(storage)
    addGreatSuccess(storage)
    addCompleted(storage)
    addWin(storage)

    expect(loadRecords(storage)).toEqual({ greatSuccess: 2, completed: 1, wins: 1 })
  })

  it('returns the updated records from each add function', () => {
    const storage = memoryStorage()
    expect(addGreatSuccess(storage)).toEqual({ greatSuccess: 1, completed: 0, wins: 0 })
    expect(addCompleted(storage)).toEqual({ greatSuccess: 1, completed: 1, wins: 0 })
    expect(addWin(storage)).toEqual({ greatSuccess: 1, completed: 1, wins: 1 })
  })

  it('treats broken stored values as zero', () => {
    const storage = memoryStorage()
    storage.setItem('othello-beginner:records', '{"greatSuccess":"oops","wins":-3}')

    expect(loadRecords(storage)).toEqual({ greatSuccess: 0, completed: 0, wins: 0 })
  })

  it('treats non-JSON stored values as zero', () => {
    const storage = memoryStorage()
    storage.setItem('othello-beginner:records', 'not json')

    expect(loadRecords(storage)).toEqual({ greatSuccess: 0, completed: 0, wins: 0 })
  })

  it('does not throw when reading storage fails', () => {
    const storage: RecordsStorage = {
      getItem: () => {
        throw new DOMException('blocked', 'SecurityError')
      },
      setItem: () => {},
    }
    expect(loadRecords(storage)).toEqual({ greatSuccess: 0, completed: 0, wins: 0 })
  })

  it('does not throw when writing storage fails', () => {
    const storage: RecordsStorage = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('blocked', 'SecurityError')
      },
    }
    expect(() => addGreatSuccess(storage)).not.toThrow()
  })
})
