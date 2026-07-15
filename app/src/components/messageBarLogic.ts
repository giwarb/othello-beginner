/**
 * Whether a message transition should trigger the "pop" attention animation.
 * Clearing the message (next === '') should not pop. A new message sequence
 * number pops even when the text itself repeats, so consecutive identical
 * feedback (e.g. the same mistake twice in a row) still animates each time.
 */
export function shouldPulse(previousSeq: number, nextSeq: number, nextMessage: string): boolean {
  return nextMessage !== '' && nextSeq !== previousSeq
}
