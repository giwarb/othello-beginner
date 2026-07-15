import { useEffect, useRef, useState } from 'preact/hooks'
import { shouldPulse } from './messageBarLogic'
import './MessageBar.css'

export interface MessageBarProps {
  message: string
  /** メッセージ更新のたびに増える連番。同一文言でもポップを再発火させる。 */
  messageSeq: number
}

/**
 * ひらがなメッセージ帯。メッセージが空でも高さを保ち、変化時にポップする。
 */
export function MessageBar({ message, messageSeq }: MessageBarProps) {
  const previousSeqRef = useRef(messageSeq)
  const [pulseKey, setPulseKey] = useState(0)

  useEffect(() => {
    if (shouldPulse(previousSeqRef.current, messageSeq, message)) {
      setPulseKey((key) => key + 1)
    }
    previousSeqRef.current = messageSeq
  }, [message, messageSeq])

  return (
    <div class="message-bar" role="status" aria-live="polite">
      <p key={pulseKey} class="message-bar-text message-bar-text-pulse">
        {message}
      </p>
    </div>
  )
}
