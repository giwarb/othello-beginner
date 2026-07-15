import { useRef, useState } from 'preact/hooks'
import { Board } from '../components/Board'
import { MessageBar } from '../components/MessageBar'
import { TurnBadge } from '../components/TurnBadge'
import { GENERATED_PUZZLES } from '../puzzles/generated'
import {
  createPracticeState,
  hintPositions,
  nextPuzzle,
  poolForSelection,
  pressOk,
  tapCell,
  type PracticePuzzle,
  type PracticeSelection,
  type PracticeState,
} from './practiceMachine'
import './PracticeScreen.css'

export interface PracticeScreenProps {
  /** ホーム画面で選んだ練習モード/カテゴリ。 */
  selection: PracticeSelection
  /** ヒント設定(既定オフ)。 */
  hintEnabled: boolean
  /** ホーム画面に戻るときに呼ばれる。 */
  onHome: () => void
}

export function PracticeScreen({ selection, hintEnabled, onHome }: PracticeScreenProps) {
  const puzzlesRef = useRef<PracticePuzzle[] | undefined>(undefined)
  if (puzzlesRef.current === undefined) {
    puzzlesRef.current = poolForSelection(GENERATED_PUZZLES, selection)
  }
  const [state, setState] = useState<PracticeState>(() => createPracticeState(puzzlesRef.current!))

  const handleNext = () => {
    setState((current) => {
      if (current.phase !== 'result') {
        return current
      }
      const pool = puzzlesRef.current!
      if (current.puzzleIndex + 1 >= pool.length) {
        puzzlesRef.current = poolForSelection(
          GENERATED_PUZZLES,
          selection,
          Math.random,
          pool[current.puzzleIndex].id,
        )
        return createPracticeState(puzzlesRef.current)
      }
      return nextPuzzle(current, pool)
    })
  }

  const highlights = hintEnabled ? hintPositions(state) : []

  return (
    <main id='app-root'>
      <div class='practice-header'>
        <h1>おせろの　れんしゅう</h1>
        <button class='practice-button practice-button-home' type='button' onClick={onHome}>
          おわる
        </button>
      </div>
      <TurnBadge color={state.turn} />
      {state.prompt && <p>{state.prompt}</p>}
      <Board
        board={state.board}
        highlights={highlights}
        lastMove={state.phase === 'flipping' ? state.placedPosition : undefined}
        onCellTap={(position) => setState((current) => tapCell(current, position))}
      />
      <MessageBar message={state.message} messageSeq={state.messageSeq} />
      {state.hint && <p aria-live='polite'>{state.hint}</p>}

      {state.phase === 'flipping' && (
        <button class='practice-button practice-button-ok' type='button' onClick={() => setState(pressOk)}>
          OK
        </button>
      )}

      {state.phase === 'result' && (
        <section class={`practice-result practice-result-${state.result}`} aria-label='けっか'>
          {state.result === 'だいせいこう' && <div class='practice-hanamaru' aria-hidden='true'>◎</div>}
          <dl class='practice-misses'>
            <div><dt>おいた　ばしょの　まちがい</dt><dd>{state.misses.placing}かい</dd></div>
            <div><dt>ひっくりかえしの　まちがい</dt><dd>{state.misses.flipping}かい</dd></div>
            <div><dt>はやおしの　かず</dt><dd>{state.misses.earlyOk}かい</dd></div>
          </dl>
          <button class='practice-button practice-button-next' type='button' onClick={handleNext}>
            つぎへ
          </button>
        </section>
      )}
    </main>
  )
}
