import type { PracticeSelection } from '../practice/practiceMachine'
import type { StrategyCategory } from '../puzzles/types'
import './HomeScreen.css'

export interface HomeScreenProps {
  hintEnabled: boolean
  onHintChange: (enabled: boolean) => void
  onSelect: (selection: PracticeSelection) => void
}

const CATEGORY_BUTTONS: ReadonlyArray<{ category: StrategyCategory; label: string }> = [
  { category: 'corner', label: 'すみを　とろう' },
  { category: 'avoid-x', label: 'ばつの　ばしょは　やめよう' },
  { category: 'min-mobility', label: 'うてる　ばしょを　へらそう' },
]

/** ホーム画面。れんしゅうモード/カテゴリの選択とヒント設定の切り替えを行う。 */
export function HomeScreen({ hintEnabled, onHintChange, onSelect }: HomeScreenProps) {
  return (
    <main id='app-root' class='home-screen'>
      <h1>おせろの　れんしゅう</h1>
      <div class='home-buttons'>
        <button class='home-button' type='button' onClick={() => onSelect({ mode: 'rule' })}>
          おいて　ひっくりかえす
        </button>
        {CATEGORY_BUTTONS.map(({ category, label }) => (
          <button
            key={category}
            class='home-button'
            type='button'
            onClick={() => onSelect({ mode: 'strategy', category })}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        class='home-hint-toggle'
        type='button'
        aria-pressed={hintEnabled}
        onClick={() => onHintChange(!hintEnabled)}
      >
        ひんと　{hintEnabled ? 'あり' : 'なし'}
      </button>
    </main>
  )
}
