import type { Color } from '../core/othello'
import { turnLabel } from './turnBadgeLogic'
import './TurnBadge.css'

export interface TurnBadgeProps {
  color: Color
}

/** 手番表示: 「あなたは　くろ　です」+ 石アイコン */
export function TurnBadge({ color }: TurnBadgeProps) {
  return (
    <div class="turn-badge">
      <span class={`turn-badge-disc turn-badge-disc-${color}`} aria-hidden="true" />
      <span class="turn-badge-text">{turnLabel(color)}</span>
    </div>
  )
}
