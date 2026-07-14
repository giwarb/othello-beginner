import { useState } from 'preact/hooks'
import { Board } from './components/Board'
import { MessageBar } from './components/MessageBar'
import { TurnBadge } from './components/TurnBadge'
import { initialBoard } from './core/othello'

// この画面は部品の見た目確認用のデモ表示。ゲーム進行ロジックは T004 で実装する。
export function App() {
  const [board] = useState(() => initialBoard())
  const [lastTapped, setLastTapped] = useState<number | undefined>(undefined)
  const [message, setMessage] = useState('')

  function handleCellTap(pos: number) {
    setLastTapped(pos)
    setMessage('ここを　おしたよ')
  }

  return (
    <main id="app-root">
      <h1>おせろの　れんしゅう</h1>
      <TurnBadge color="b" />
      <Board board={board} lastMove={lastTapped} onCellTap={handleCellTap} />
      <MessageBar message={message} />
    </main>
  )
}
