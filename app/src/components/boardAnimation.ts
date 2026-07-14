export type FlipAnimationAction =
  | { type: 'start'; positions: ReadonlyArray<number> }
  | { type: 'finish'; position: number }

export const FLIP_ANIMATION_MS = 300
export type FlipTimer = ReturnType<typeof setTimeout>

/** 複数の石が続けて反転しても、位置ごとにアニメーション状態を管理する。 */
export function updateFlippingPositions(
  current: ReadonlySet<number>,
  action: FlipAnimationAction,
): ReadonlySet<number> {
  const next = new Set(current)

  if (action.type === 'start') {
    for (const position of action.positions) {
      next.add(position)
    }
  } else {
    next.delete(action.position)
  }

  return next
}

/** 各位置の完了タイマーを独立して予約する。 */
export function scheduleFlipCompletions(
  positions: ReadonlyArray<number>,
  timers: Map<number, FlipTimer>,
  onFinish: (position: number) => void,
) {
  for (const position of positions) {
    const previousTimer = timers.get(position)
    if (previousTimer !== undefined) {
      clearTimeout(previousTimer)
    }

    const timer = setTimeout(() => {
      if (timers.get(position) !== timer) {
        return
      }
      timers.delete(position)
      onFinish(position)
    }, FLIP_ANIMATION_MS)
    timers.set(position, timer)
  }
}

export function cancelFlipCompletions(timers: Map<number, FlipTimer>) {
  for (const timer of timers.values()) {
    clearTimeout(timer)
  }
  timers.clear()
}
