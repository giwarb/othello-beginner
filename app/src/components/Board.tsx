import { useEffect, useMemo, useReducer, useRef } from 'preact/hooks'
import type { Board as BoardState } from '../core/othello'
import {
  cancelFlipCompletions,
  scheduleFlipCompletions,
  updateFlippingPositions,
  type FlipTimer,
} from './boardAnimation'
import {
  BOARD_PIXELS,
  BOARD_SIZE,
  CELL_SIZE,
  cellCenter,
  cellOrigin,
  flippedPositions,
  normalizeBoard,
} from './boardGeometry'
import './Board.css'

let boardInstanceCount = 0

export interface BoardProps {
  /** 盤面。64文字の文字列でも、解析済みの配列でもよい */
  board: BoardState | string
  /** ヒント表示用にハイライトするマスの番号(省略可) */
  highlights?: ReadonlyArray<number>
  /** 直前に置かれた石として強調するマスの番号(省略可) */
  lastMove?: number
  /** マスをタップしたときに呼ばれる(石があるマスでも発火する) */
  onCellTap?: (pos: number) => void
}

/** タップできる SVG のオセロ盤。石の裏返しはアニメーションのみで、進行ロジックは持たない。 */
export function Board({ board, highlights = [], lastMove, onCellTap }: BoardProps) {
  const idPrefix = useRef(`board-${++boardInstanceCount}`).current
  const boardKey = typeof board === 'string' ? board : board.join('')
  const cells = useMemo(() => normalizeBoard(board), [boardKey])

  const previousCellsRef = useRef<BoardState | null>(null)
  const [flipping, updateFlipping] = useReducer(updateFlippingPositions, new Set<number>())
  const flipTimersRef = useRef(new Map<number, FlipTimer>())

  useEffect(() => () => cancelFlipCompletions(flipTimersRef.current), [])

  useEffect(() => {
    const previous = previousCellsRef.current
    previousCellsRef.current = cells
    if (previous === null) {
      return
    }

    const changed = flippedPositions(previous, cells)
    if (changed.length === 0) {
      return
    }

    updateFlipping({ type: 'start', positions: changed })
    scheduleFlipCompletions(changed, flipTimersRef.current, (position) => {
      updateFlipping({ type: 'finish', position })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardKey])

  const highlightSet = useMemo(() => new Set(highlights), [highlights])

  return (
    <div class="board-wrapper">
      <svg
        class="board-svg"
        viewBox={`0 0 ${BOARD_PIXELS} ${BOARD_PIXELS}`}
        role="group"
        aria-label="おせろばん"
      >
        <defs>
          <radialGradient id={`${idPrefix}-disc-b`} cx="35%" cy="30%" r="75%">
            <stop offset="0%" stop-color="#5a5a5a" />
            <stop offset="55%" stop-color="#1e1e1e" />
            <stop offset="100%" stop-color="#000000" />
          </radialGradient>
          <radialGradient id={`${idPrefix}-disc-w`} cx="35%" cy="30%" r="75%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="60%" stop-color="#f0f0ec" />
            <stop offset="100%" stop-color="#cfcfc4" />
          </radialGradient>
        </defs>

        <rect class="board-background" x={0} y={0} width={BOARD_PIXELS} height={BOARD_PIXELS} rx={12} />

        {Array.from({ length: BOARD_SIZE + 1 }, (_, i) => (
          <g key={`grid-${i}`}>
            <line class="grid-line" x1={i * CELL_SIZE} y1={0} x2={i * CELL_SIZE} y2={BOARD_PIXELS} />
            <line class="grid-line" x1={0} y1={i * CELL_SIZE} x2={BOARD_PIXELS} y2={i * CELL_SIZE} />
          </g>
        ))}

        {cells.map((cell, pos) => {
          const origin = cellOrigin(pos)
          const center = cellCenter(pos)
          const isHighlighted = highlightSet.has(pos)
          const isLastMove = lastMove === pos
          const isFlipping = flipping.has(pos)

          return (
            <g
              key={pos}
              class="cell"
              onClick={() => onCellTap?.(pos)}
              role="button"
              aria-label={`${pos}ばんめの ます`}
            >
              <rect class="cell-hit" x={origin.x} y={origin.y} width={CELL_SIZE} height={CELL_SIZE} fill="transparent" />

              {isHighlighted && <circle class="cell-highlight" cx={center.x} cy={center.y} r={CELL_SIZE * 0.42} />}

              {cell !== '-' && (
                <g class={`disc ${isFlipping ? 'disc-flipping' : ''}`}>
                  {isLastMove && <circle class="disc-glow" cx={center.x} cy={center.y} r={CELL_SIZE * 0.46} />}
                  <circle
                    class={`disc-shape-${cell}`}
                    cx={center.x}
                    cy={center.y}
                    r={CELL_SIZE * 0.4}
                    fill={`url(#${idPrefix}-disc-${cell})`}
                  />
                </g>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
