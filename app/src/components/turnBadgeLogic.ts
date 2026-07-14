import type { Color } from '../core/othello'

/** 「あなたは　くろ　です」/「あなたは　しろ　です」— ひらがな・分かち書き */
export function turnLabel(color: Color): string {
  return color === 'b' ? 'あなたは　くろ　です' : 'あなたは　しろ　です'
}
