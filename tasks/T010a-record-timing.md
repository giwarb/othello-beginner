---
id: T010a
title: 記録加算のタイミング堅牢化(effect 依存の取りこぼし解消)
status: review
assignee: codex
attempts: 2
---

# T010a: 記録加算のタイミング堅牢化(effect 依存の取りこぼし解消)

## 目的

T010 の codex-review 中指摘(`tasks/review/T010-stamp-book-codex-review.md` (b))の解消。すたんぷの加算を「結果状態への遷移」と確実に同期させ、画面遷移タイミングによる取りこぼしをなくす。

## 背景・コンテキスト

- 現状、`app/src/practice/PracticeScreen.tsx` と `app/src/game/GameScreen.tsx` は結果状態を描画した**後の** `useEffect` で `addGreatSuccess()`/`addCompleted()`/`addWin()` を呼んでいる。effect 実行前にアンマウントされると(終局直後に「おわる」タップ等)加算されない。
- 記録 API は `app/src/records/records.ts`。

## 変更対象

- `app/src/practice/PracticeScreen.tsx` / `app/src/game/GameScreen.tsx` — 加算を状態遷移と同期する形に変更(結果状態を作るハンドラ内で加算する、等。重複加算は引き続き防止)
- 加算タイミングの回帰テスト(状態遷移ハンドラを純関数化してテストする等、既存のテスト方針に合わせる)

## 要件

1. 「だいせいこう到達」「終局到達」「勝ち」の加算が、結果状態が成立した時点で同期的に(描画やアンマウントに依存せず)ちょうど1回行われる。
2. 「おわる」による途中終了では加算されない(現行どおり)。
3. 「もういちど」→再び終局、で再度加算される(1局ごとに加算)。
4. 既存テストを壊さず、加算回数の回帰テストを追加する。

## やらないこと(スコープ外)

- 記録項目・表示の変更
- `tasks/` `CLAUDE.md` `AGENTS.md` `scripts/` の変更

## 受け入れ基準(検証コマンド)

- [ ] `cd app && npx vitest run` が全件パス(加算回数テストを含む)
- [ ] `cd app && npm run build` が成功する
- [ ] 変更がコミット・push され、デプロイ成功後、公開URLで: だいせいこう→すたんぷ+1、対局完走→完走+1(勝てば かち+1)、途中おわる→加算なし、を確認
- [ ] タスク完了時点で、当該タスク由来の差分・未追跡ファイルが `git status --short` に残っていないこと

## フィードバック(やり直し時にオーケストレーターが記入)

### redo 1回目(2026-07-15、codex-review 不合格。レポート: `tasks/review/T010a-record-timing-codex-review.md`)

初回修正(コミット 5b949a8)の加算タイミング変更自体は妥当と評価済み。**不足は要件4の「加算回数の回帰テスト」のみ**。以下だけを追加すること(実装ロジックの変更は原則不要。テスト可能にするための最小限のリファクタ — 記録関数を注入できる形への抽出 — は可):

1. 状態遷移+記録加算をまとめた処理を、記録関数(またはストレージ)を注入できる形でテスト可能にし、**加算関数の呼び出し回数・記録値の増分**を検証するテストを追加する。最低限のケース:
   - だいせいこう遷移で greatSuccess がちょうど1増える
   - 通常の「せいこう」・途中終了では増えない
   - 終局で completed がちょうど1増える
   - 勝利時だけ wins がちょうど1増える
   - 同じ終局状態の再処理では重複加算されない
   - 「もういちど」後の再対局の終局でもう一度加算される
   - プレイヤー手番起因(OK押下)と CPU 手番起因(タイマー)の両終局経路で加算される
2. 既存テストを壊さない。

受け入れ基準は元のものに加えて、上記テストが `npx vitest run` に含まれること。

### redo 2回目(2026-07-15、codex-review 再不合格。レポート: `tasks/review/T010a-record-timing-codex-review-redo1.md`)

redo 1回目(コミット a5a9cff)で加算ロジックと6ケースのテストは合格評価。**残る不足は「途中終了では加算されない」テストが実際の終了経路を通していない**こと1点のみ:

- 練習側のテストは途中状態の phase を確認しているだけで「おわる」処理を呼んでいない(自明に通る)。対局側には途中終了テスト自体がない。
- `PracticeScreen.tsx` / `GameScreen.tsx` の「おわる」ハンドラに誤って加算が追加されても現テストは通ってしまう。

対応(これだけをやる):

1. **@testing-library/preact(+ jsdom 環境)を最小限導入**し、`PracticeScreen` と `GameScreen` をコンポーネントテストで描画する。記録関数は `vi.mock('../records/records')`(または既存の注入手段)でスパイ化する。
2. テストケース: (a) 練習で途中(placing または flipping)に「おわる」をクリック → `onHome` が呼ばれ、加算関数はすべて0回。(b) 対局で途中(終局前)に「おわる」をクリック → 同様に加算0回。(c) 可能なら対局で終局到達時に加算が呼ばれることもコンポーネント経由で1ケース確認(既存の機械レベルテストの重複でよい)。
3. Testing Library の導入は devDependencies 追加と vitest 設定(環境切替)の最小変更に留める。既存テスト(node 環境)を壊さない。
4. STATUS.md の既存申し送り(T003: アニメーションの実DOM回帰テストは Testing Library 導入後)には**手を出さない**(導入だけしておけば将来タスクで使える)。

受け入れ基準: 上記コンポーネントテストが `npx vitest run` に含まれ全件パスすること(他は元の基準のまま)。

## 作業ログ(担当エージェントが追記)

### 2026-07-15 implementer 実施

- codex-review (b) の指摘どおり、加算処理を「結果状態を描画した後の `useEffect`」から「結果状態を作る `setState` ハンドラそのもの」へ移動した。`useEffect` は画面遷移(アンマウント)前に実行が保証されないため、遷移そのものと同期する形にした。
- `app/src/practice/practiceMachine.ts`: 純関数 `enteredGreatSuccess(previous, next)` を追加(`previous !== next && next.phase === 'result' && next.result === 'だいせいこう'`)。
- `app/src/practice/PracticeScreen.tsx`: `useEffect`/`recordedResult` ref を削除。OK ボタンの `handlePressOk` 内で `setState(current => { const next = pressOk(current); if (enteredGreatSuccess(current, next)) addGreatSuccess(); return next })` に変更(`pressOk` 呼び出しと加算判定が同一 setState 更新内で完結)。
- `app/src/game/gameMachine.ts`: 純関数 `enteredGameOver(previous, next): next is GameOverState` を追加(`previous.phase !== 'gameOver' && next.phase === 'gameOver'`)。
- `app/src/game/GameScreen.tsx`: `recordGameResult(previous, next)` ローカル関数(`enteredGameOver` が真なら `addCompleted()`、`outcome==='win'` なら `addWin()`)を、(1) OK ボタンの `handlePressGameOk`、(2) CPU応答タイマー(`playCpuTurn`/`finishCpuPass` を呼ぶ `setState` 内)の両方の遷移箇所に適用。`onComplete` コールバック用の既存 `useEffect`(`notifiedResult` ref)は記録加算とは無関係な用途としてそのまま残した。
- 回帰テスト追加: `app/src/practice/practiceMachine.test.ts` に `enteredGreatSuccess` の3ケース(だいせいこう遷移で true / せいこう遷移で false / pressOk が no-op のとき false)。`app/src/game/gameMachine.test.ts` に `enteredGameOver` の3ケース(1局通しで遷移が厳密に1回だけ true になることを確認するループテスト / 通常の player→cpu 受け渡しでは false / 既に gameOver のときに再度呼んでも false=二重加算されない)。

実行コマンドと結果:
- `cd app && npx vitest run` → `Test Files 12 passed (12)` `Tests 122 passed (122)`(既存116 + 追加6件)
- `cd app && npm run build` → 成功(`tsc -b && vite build`、警告なし)

コミット・デプロイ:
- コミット `5b949a8` — `app: 記録加算をuseEffectでなく状態遷移ハンドラに同期させ取りこぼしを解消(T010a)`(変更対象は `app/src/practice/PracticeScreen.tsx` `app/src/practice/practiceMachine.ts` `app/src/practice/practiceMachine.test.ts` `app/src/game/GameScreen.tsx` `app/src/game/gameMachine.ts` `app/src/game/gameMachine.test.ts` の6ファイルのみ)。
- `git push origin main` 済み。`gh run watch 29386250765 --exit-status` で GitHub Actions「Deploy to GitHub Pages」の build/deploy とも success を確認。

公開URL (https://giwarb.github.io/othello-beginner/) での受け入れ基準確認(Claude Browser で操作。事前に `localStorage` の `othello-beginner:records` を `{greatSuccess:0,completed:0,wins:0}` にリセットしてから検証):
- 練習(ヒントありでルールモード)を1問ノーミスで解答し「だいせいこう！」表示 → `records` が `{greatSuccess:1,...}` になることを確認。ホーム→「すたんぷ」でも「だいせいこう 1こ」表示を確認。
- 「さいごまで　うとう」を最後まで打ち切り(コーナー優先+合法手最大反転の簡易戦略をJSで自動操作)、負け(くろ28こ・しろ36こ)で終局 → `records.completed` が `1→2`(2回目のプレイ)に加算され `wins` は加算されないことを確認(1回目は `completed:1,wins:0`)。
- 「もういちど」で再対局し、今度は勝ち(あなたの　かち！、くろ19こ・しろ0こ)で終局 → `records` が `{greatSuccess:1,completed:2,wins:1}` に増分(完走・かちとも+1)されることを確認。
- 対局中盤(2手打った時点、終局前)で「おわる」タップ→ホームへ戻り、`records` が変化していない(`completed:2,wins:1` のまま)ことを確認。
- 以上より、だいせいこう→すたんぷ+1、対局完走→完走+1(勝てば かち+1)、途中おわる→加算なし、を確認。
- `git status --short` は空(当該タスク由来の差分・未追跡ファイルなし)。一時ファイル(`.claude/launch.json` 等)は今回作成していない。

仕様どおりにできなかった点: なし。

### 2026-07-15 12:47 JST implementer redo 1回目 実施

- 状態遷移と記録加算をまとめた注入可能な関数を追加した。練習は `pressOkAndRecord`、対局は `pressGameOkAndRecord` / `advanceCpuAndRecord` を画面側の実経路から使用する。
- メモリストレージと spy を注入し、だいせいこう +1、せいこう/途中終了 +0、プレイヤー OK 終局の完走/勝ち +1、CPU タイマー終局の完走 +1/勝ち +0、同一終局の再処理 +0、もういちど後の再終局 +1 を検証する5テストを追加した。

実行コマンドと結果:
- `cd app && npx vitest run` → Vite 設定読込中にサンドボックのプロセス生成制限 `spawn EPERM` で起動不可(テスト実行前)。
- 同一テスを一時設定の runner/thread 方式で実行 → `Test Files 12 passed (12)` `Tests 127 passed (127)`。一時設定は実行後に削除済み。
- `cd app && npx tsc -b --pretty false` → 成功。
- `cd app && npm run build` → `tsc -b` は成功。続く Vite 設定読込中に同じ `spawn EPERM` で起動不可。
- 同一 Vite 設定の一時 `.mjs` を native loader で読み込んだ `npx vite build` → 34 modules transformed、本番ビルド成功。一時設定は実行後に削除済み。
- `git diff --check` → 問題なし。

コミットハッシュ: なし(Codex 環境は `.git` 書き込み禁止のため、オーケストレーターが代行予定)。

### 2026-07-15 13:04 JST implementer redo 2回目 実施

- `@testing-library/preact` と `jsdom` を devDependencies に追加した。新規コンポーネントテストだけ `@vitest-environment jsdom` を指定し、既存テストの node 環境は変更していない。
- `PracticeScreen` を placing 中、`GameScreen` を終局前の player 状態で描画し、実際の「おわる」ボタンをクリックする2テストを追加した。両テストで `onHome` が1回呼ばれ、`addGreatSuccess` / `addCompleted` / `addWin` がすべて0回であることをモックで直接検証した。

実行コマンドと結果:
- `cd app && npx vitest run` → Vite 設定読込中にサンドボックスのプロセス生成制限 `spawn EPERM` で起動不可(テスト実行前)。
- 同一設定を native loader で読み込む一時設定を使って `npx vitest run` → `Test Files 13 passed (13)` `Tests 129 passed (129)`(新規コンポーネントテスト2件を含む)。一時設定は実行後に削除済み。
- `cd app && npm run build` → `tsc -b` は成功。続く Vite 設定読込中に同じ `spawn EPERM` で起動不可。
- 同一 Vite 設定を native loader で読み込んだ `npx vite build` → 34 modules transformed、本番ビルド成功。一時設定は実行後に削除済み。
- `cd app && npx tsc -b --pretty false` → 成功。
- `cd app && git diff --check` → 問題なし。

コミットハッシュ: なし(Codex 環境は `.git` 書き込み禁止のため、オーケストレーターが代行予定)。