import { afterEach, describe, expect, it, vi } from 'vitest'
import { scheduleFlipCompletions, updateFlippingPositions, type FlipTimer } from './boardAnimation'

describe('updateFlippingPositions', () => {
  afterEach(() => vi.useRealTimers())

  it('removes both positions after two board updates within one animation duration', () => {
    vi.useFakeTimers()
    let flipping: ReadonlySet<number> = new Set()
    const timers = new Map<number, FlipTimer>()

    const startFlip = (positions: ReadonlyArray<number>) => {
      flipping = updateFlippingPositions(flipping, { type: 'start', positions })
      scheduleFlipCompletions(positions, timers, (position) => {
        flipping = updateFlippingPositions(flipping, { type: 'finish', position })
      })
    }

    startFlip([20])
    vi.advanceTimersByTime(100)
    startFlip([21])

    vi.advanceTimersByTime(200)
    expect([...flipping]).toEqual([21])

    vi.advanceTimersByTime(100)
    expect([...flipping]).toEqual([])
  })
})
