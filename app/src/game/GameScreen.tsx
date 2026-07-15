import { useEffect, useRef, useState } from 'preact/hooks'
import { Board } from '../components/Board'
import { MessageBar } from '../components/MessageBar'
import { TurnBadge } from '../components/TurnBadge'
import {
  createGameState, finishCpuPass, playCpuTurn, pressGameOk, tapGameCell,
  type GameResult, type GameState,
} from './gameMachine'
import './GameScreen.css'

export interface GameScreenProps {
  onHome: () => void
  onComplete?: (result: GameResult) => void
}

export function GameScreen({ onHome, onComplete }: GameScreenProps) {
  const [state, setState] = useState<GameState>(createGameState)
  const notifiedResult = useRef<GameResult | undefined>(undefined)

  useEffect(() => {
    if (state.phase !== 'cpu' && state.phase !== 'cpuPass') return
    const timer = window.setTimeout(() => {
      setState((current) => current.phase === 'cpu' ? playCpuTurn(current) : finishCpuPass(current))
    }, state.phase === 'cpu' ? 800 : 1000)
    return () => window.clearTimeout(timer)
  }, [state.phase, state.messageSeq])

  useEffect(() => {
    if (state.phase === 'gameOver' && notifiedResult.current !== state.result) {
      notifiedResult.current = state.result
      onComplete?.(state.result)
    }
  }, [state, onComplete])

  const restart = () => {
    notifiedResult.current = undefined
    setState(createGameState())
  }
  const isPlayer = state.phase === 'player' || state.phase === 'playerPass'
  const canPressOk = state.phase === 'playerPass' || (state.phase === 'player' && state.practice.phase === 'flipping')

  return (
    <main id='app-root'>
      <div class='game-header'>
        <h1>さいごまで　うとう</h1>
        <button class='game-button game-button-home' type='button' onClick={onHome}>おわる</button>
      </div>
      <TurnBadge color='b' />
      {!isPlayer && state.phase !== 'gameOver' && <p class='game-turn-text'>あいての　ばん</p>}
      <Board
        board={state.board}
        lastMove={state.lastMove}
        onCellTap={(position) => setState((current) => tapGameCell(current, position))}
      />
      <MessageBar message={state.message} messageSeq={state.messageSeq} />

      {canPressOk && (
        <button class='game-button game-button-ok' type='button' onClick={() => setState(pressGameOk)}>OK</button>
      )}

      {state.phase === 'gameOver' && (
        <section class={`game-result game-result-${state.result.outcome}`} aria-label='けっか'>
          {state.result.outcome === 'win' && <div class='game-hanamaru' aria-hidden='true'>◎</div>}
          <p class='game-score'>くろ　{state.result.discs.b}こ　しろ　{state.result.discs.w}こ</p>
          <dl class='game-misses'>
            <div><dt>おいた　ばしょの　まちがい</dt><dd>{state.misses.placing}かい</dd></div>
            <div><dt>ひっくりかえしの　まちがい</dt><dd>{state.misses.flipping}かい</dd></div>
            <div><dt>はやおしの　かず</dt><dd>{state.misses.earlyOk}かい</dd></div>
          </dl>
          <button class='game-button game-button-again' type='button' onClick={restart}>もういちど</button>
        </section>
      )}
    </main>
  )
}
