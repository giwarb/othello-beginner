import { loadRecords, type Records } from './records'
import './StampScreen.css'

export interface StampScreenProps {
  onHome: () => void
}

const STAMP_ROW_LIMIT = 50
const STAMP_COLUMNS = 10

const STAMP_ROWS: ReadonlyArray<{ field: keyof Records; label: string; symbol: string }> = [
  { field: 'greatSuccess', label: 'だいせいこう', symbol: '⭐' },
  { field: 'completed', label: 'さいごまで　うてた', symbol: '◎' },
  { field: 'wins', label: 'かち', symbol: '🏆' },
]

interface StampRowProps {
  label: string
  symbol: string
  count: number
}

function StampRow({ label, symbol, count }: StampRowProps) {
  const shown = Math.min(count, STAMP_ROW_LIMIT)
  const remainder = count - shown

  return (
    <section class='stamp-row'>
      <div class='stamp-row-header'>
        <h2 class='stamp-label'>{label}</h2>
        <p class='stamp-count'>{count}こ</p>
      </div>
      {shown === 0
        ? <p class='stamp-empty'>まだ　ないよ</p>
        : (
          <div class='stamp-grid' style={{ gridTemplateColumns: `repeat(${STAMP_COLUMNS}, 1fr)` }}>
            {Array.from({ length: shown }, (_, index) => (
              <span key={index} class='stamp' aria-hidden='true'>{symbol}</span>
            ))}
          </div>
        )}
      {remainder > 0 && <p class='stamp-remainder'>ほかにも　{remainder}こ　あるよ</p>}
    </section>
  )
}

/** がんばりの記録(すたんぷちょう)。3項目の累積回数をスタンプで見せる。 */
export function StampScreen({ onHome }: StampScreenProps) {
  const records = loadRecords()

  return (
    <main id='app-root' class='stamp-screen'>
      <div class='stamp-header'>
        <h1>がんばりの　きろく</h1>
        <button class='stamp-button stamp-button-home' type='button' onClick={onHome}>
          もどる
        </button>
      </div>
      {STAMP_ROWS.map(({ field, label, symbol }) => (
        <StampRow key={field} label={label} symbol={symbol} count={records[field]} />
      ))}
    </main>
  )
}
