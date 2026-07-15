import { describe, expect, it } from 'vitest'
import { loadHintEnabled, saveHintEnabled, type SettingsStorage } from './hintSettings'

function memoryStorage(): SettingsStorage {
  const store = new Map<string, string>()
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
  }
}

describe('hintSettings', () => {
  it('defaults to disabled when nothing was saved', () => {
    expect(loadHintEnabled(memoryStorage())).toBe(false)
  })

  it('remembers a saved value', () => {
    const storage = memoryStorage()
    saveHintEnabled(true, storage)
    expect(loadHintEnabled(storage)).toBe(true)

    saveHintEnabled(false, storage)
    expect(loadHintEnabled(storage)).toBe(false)
  })

  it('defaults to disabled when no storage is available', () => {
    expect(loadHintEnabled(undefined)).toBe(false)
  })
})
