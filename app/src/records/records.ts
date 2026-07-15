const RECORDS_STORAGE_KEY = 'othello-beginner:records'

/** localStorage 相当の最小インターフェース(テストでは差し替えて使う)。 */
export interface RecordsStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/** がんばりの記録(すたんぷちょう)。すべて累積回数で、リセット機能はない。 */
export interface Records {
  /** 練習で「だいせいこう！」になった回数。 */
  greatSuccess: number
  /** 「さいごまで　うとう」を最後まで打ち切った回数。 */
  completed: number
  /** 「さいごまで　うとう」で勝った回数。 */
  wins: number
}

const EMPTY_RECORDS: Records = { greatSuccess: 0, completed: 0, wins: 0 }

function resolveStorage(storage?: RecordsStorage): RecordsStorage | undefined {
  if (storage) {
    return storage
  }
  return typeof localStorage === 'undefined' ? undefined : localStorage
}

/** 壊れた値・欠けた値は 0 として扱う。 */
function safeCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0
}

/** がんばりの記録を読み込む。保存されていない・保存先がない・壊れている場合は全項目 0。 */
export function loadRecords(storage?: RecordsStorage): Records {
  try {
    const raw = resolveStorage(storage)?.getItem(RECORDS_STORAGE_KEY)
    if (!raw) {
      return { ...EMPTY_RECORDS }
    }
    const parsed = JSON.parse(raw) as Partial<Record<keyof Records, unknown>>
    return {
      greatSuccess: safeCount(parsed?.greatSuccess),
      completed: safeCount(parsed?.completed),
      wins: safeCount(parsed?.wins),
    }
  } catch {
    return { ...EMPTY_RECORDS }
  }
}

function saveRecords(records: Records, storage?: RecordsStorage): void {
  try {
    resolveStorage(storage)?.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records))
  } catch {
    // 保存できない環境でも、その場のカウントはそのまま使う。
  }
}

function increment(field: keyof Records, storage?: RecordsStorage): Records {
  const current = loadRecords(storage)
  const next = { ...current, [field]: current[field] + 1 }
  saveRecords(next, storage)
  return next
}

/** 練習で「だいせいこう！」になったときに呼ぶ。同じ問題への再挑戦でも都度加算してよい。 */
export function addGreatSuccess(storage?: RecordsStorage): Records {
  return increment('greatSuccess', storage)
}

/** 「さいごまで　うとう」を終局まで打ち切ったときに呼ぶ。途中の「おわる」では呼ばない。 */
export function addCompleted(storage?: RecordsStorage): Records {
  return increment('completed', storage)
}

/** 「さいごまで　うとう」でプレイヤーが勝ったときに呼ぶ。 */
export function addWin(storage?: RecordsStorage): Records {
  return increment('wins', storage)
}
