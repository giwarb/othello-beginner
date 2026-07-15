import { useState } from 'preact/hooks'
import { GameScreen } from './game/GameScreen'
import type { GameResult } from './game/gameMachine'
import { HomeScreen } from './home/HomeScreen'
import { loadHintEnabled, saveHintEnabled } from './home/hintSettings'
import { PracticeScreen } from './practice/PracticeScreen'
import type { PracticeSelection } from './practice/practiceMachine'

type Screen = { name: 'home' } | { name: 'practice'; selection: PracticeSelection } | { name: 'game' }

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const [hintEnabled, setHintEnabled] = useState(() => loadHintEnabled())

  const handleHintChange = (enabled: boolean) => {
    setHintEnabled(enabled)
    saveHintEnabled(enabled)
  }

  if (screen.name === 'practice') {
    return (
      <PracticeScreen
        selection={screen.selection}
        hintEnabled={hintEnabled}
        onHome={() => setScreen({ name: 'home' })}
      />
    )
  }

  if (screen.name === 'game') {
    const handleComplete = (result: GameResult) => console.info('game completed', result)
    return <GameScreen onHome={() => setScreen({ name: 'home' })} onComplete={handleComplete} />
  }

  return (
    <HomeScreen
      hintEnabled={hintEnabled}
      onHintChange={handleHintChange}
      onSelect={(selection) => setScreen({ name: 'practice', selection })}
      onGame={() => setScreen({ name: 'game' })}
    />
  )
}
