import { useEffect, useRef, useState } from 'preact/hooks'
import { shouldPulse } from './messageBarLogic'
import './MessageBar.css'

export interface MessageBarProps {
  message: string
}

/**
 * ひらがなメッセージ帯。メッセージが空でも高さを保ち、変化時にポップする。
 */
export function MessageBar({ message }: MessageBarProps) {
  const previousMessageRef = useRef(message)
  const [pulseKey, setPulseKey] = useState(0)

  useEffect(() => {
    if (shouldPulse(previousMessageRef.current, message)) {
      setPulseKey((key) => key + 1)
    }
    previousMessageRef.current = message
  }, [message])

  return (
    <div class="message-bar" role="status" aria-live="polite">
      <p key={pulseKey} class="message-bar-text message-bar-text-pulse">
        {message}
      </p>
    </div>
  )
}
