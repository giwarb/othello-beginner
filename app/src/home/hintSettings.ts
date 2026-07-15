const HINT_STORAGE_KEY = 'othello-beginner:hint-enabled'

/** localStorage 相当の最小インターフェース(テストでは差し替えて使う)。 */
export interface SettingsStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

function resolveStorage(storage?: SettingsStorage): SettingsStorage | undefined {
  if (storage) {
    return storage
  }
  return typeof localStorage === 'undefined' ? undefined : localStorage
}

/** ヒント設定を読み込む。保存されていない・保存先がない場合は既定オフ。 */
export function loadHintEnabled(storage?: SettingsStorage): boolean {
  try {
    return resolveStorage(storage)?.getItem(HINT_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

/** ヒント設定を保存する。次回起動時も維持するために使う。 */
export function saveHintEnabled(enabled: boolean, storage?: SettingsStorage): void {
  try {
    resolveStorage(storage)?.setItem(HINT_STORAGE_KEY, enabled ? 'true' : 'false')
  } catch {
    // 保存できない環境でも、App が持つセッション内の設定はそのまま使う。
  }
}
