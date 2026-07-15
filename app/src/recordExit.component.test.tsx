// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GameScreen } from './game/GameScreen'
import { PracticeScreen } from './practice/PracticeScreen'
import { addCompleted, addGreatSuccess, addWin } from './records/records'

vi.mock('./records/records', () => ({
  addCompleted: vi.fn(),
  addGreatSuccess: vi.fn(),
  addWin: vi.fn(),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function expectNoRecordsAdded() {
  expect(addGreatSuccess).not.toHaveBeenCalled()
  expect(addCompleted).not.toHaveBeenCalled()
  expect(addWin).not.toHaveBeenCalled()
}

describe('途中でおわる', () => {
  it('練習の placing 中はホームに戻り、記録を加算しない', () => {
    const onHome = vi.fn()
    render(
      <PracticeScreen
        selection={{ mode: 'rule' }}
        hintEnabled={false}
        onHome={onHome}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'おわる' }))

    expect(onHome).toHaveBeenCalledTimes(1)
    expectNoRecordsAdded()
  })

  it('対局の終局前はホームに戻り、記録を加算しない', () => {
    const onHome = vi.fn()
    render(<GameScreen onHome={onHome} />)

    fireEvent.click(screen.getByRole('button', { name: 'おわる' }))

    expect(onHome).toHaveBeenCalledTimes(1)
    expectNoRecordsAdded()
  })
})