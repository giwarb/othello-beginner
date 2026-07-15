import { useState } from 'preact/hooks'
import { HomeScreen } from './home/HomeScreen'
import { loadHintEnabled, saveHintEnabled } from './home/hintSettings'
import { PracticeScreen } from './practice/PracticeScreen'
import type { PracticeSelection } from './practice/practiceMachine'

type Screen = { name: 'home' } | { name: 'practice'; selection: PracticeSelection }

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

  return (
    <HomeScreen
      hintEnabled={hintEnabled}
      onHintChange={handleHintChange}
      onSelect={(selection) => setScreen({ name: 'practice', selection })}
    />
  )
}
