/**
 * Whether a message transition should trigger the "pop" attention animation.
 * Clearing the message (next === '') should not pop, and re-showing the same
 * text should not re-pop.
 */
export function shouldPulse(previous: string, next: string): boolean {
  return next !== '' && next !== previous
}
