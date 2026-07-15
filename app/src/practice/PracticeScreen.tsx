import { useState } from 'preact/hooks'
import { Board } from '../components/Board'
import { MessageBar } from '../components/MessageBar'
import { TurnBadge } from '../components/TurnBadge'
import { GENERATED_PUZZLES } from '../puzzles/generated'
import {
  createPracticeState,
  nextPuzzle,
  pressOk,
  shuffledPracticePuzzles,
  tapCell,
  type PracticeState,
} from './practiceMachine'
import './PracticeScreen.css'

export function PracticeScreen() {
  const [puzzles] = useState(() => shuffledPracticePuzzles(GENERATED_PUZZLES))
  const [state, setState] = useState<PracticeState>(() => createPracticeState(puzzles))

  return (
    <main id='app-root'>
      <h1>おせろの　れんしゅう</h1>
      <TurnBadge color={state.turn} />
      {state.prompt && <p>{state.prompt}</p>}
      <Board
        board={state.board}
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
          <button
            class='practice-button practice-button-next'
            type='button'
            onClick={() => setState((current) => nextPuzzle(current, puzzles))}
          >
            つぎへ
          </button>
        </section>
      )}
    </main>
  )
}
