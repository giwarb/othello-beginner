---
id: T010
title: がんばりの記録(すたんぷちょう)
status: review
assignee: implementer
attempts: 0
---

# T010: がんばりの記録(すたんぷちょう)

## 目的

設計書「がんばりの記録」を実装する。だいせいこう・1局完走・かちの回数をスタンプとして貯めて見られるようにし、幼児が達成を実感できるようにする。

## 背景・コンテキスト

- 設計書 `othello-beginner-design.md` の「がんばりの記録」節が仕様の正。
- T009 で対局終局時に結果(勝敗・完走)を通知する仕組みが入っている(gameMachine/GameScreen 参照)。練習の「だいせいこう」は practiceMachine の result で判定済み。
- localStorage の安全な読み書きの前例: `app/src/home/hintSettings.ts`(try/catch 保護。T007 redo)。同じ方針で実装する。

## 変更対象

- `app/src/records/records.ts` — 記録の型・localStorage 読み書き(加算 API)(新規)
- `app/src/records/records.test.ts` — テスト(例外ストレージ含む)(新規)
- `app/src/records/StampScreen.tsx`(+CSS) — すたんぷページ(新規)
- `app/src/practice/PracticeScreen.tsx` — だいせいこう時に記録を加算
- `app/src/game/GameScreen.tsx` — 完走時・勝ち時に記録を加算
- `app/src/home/HomeScreen.tsx` — 「すたんぷ」ボタン追加
- `app/src/app.tsx` — 画面切替に追加

## 要件

1. 記録項目(localStorage、キー名は実装者裁量): だいせいこう回数 / 1局完走回数 / かち回数。読み書きは try/catch 保護(hintSettings と同方針)、壊れた値は 0 扱い。
2. 加算タイミング: 練習で「だいせいこう！」表示時に +1(同一問題の再挑戦でも都度加算でよい)。対局で終局まで到達したら完走 +1、プレイヤー勝ちならさらに かち +1(途中「おわる」は加算しない)。
3. すたんぷページ: 3項目をスタンプ(◎・⭐等の絵文字/記号)を並べて表示。1行10個で折り返し。50個を超える項目は「スタンプ50個+のこりは数字」等の破綻しない表示(実装者裁量)。項目ラベルは全ひらがな(例: 「だいせいこう」「さいごまで　うてた」「かち」)。
4. リセット機能は付けない。
5. 全文言ひらがな・分かち書き(「OK」のみ例外。個数の数字は可)。

### テスト

6. records の加算・読み込み・例外ストレージ(投げても落ちない)のユニットテスト。
7. 既存テストを壊さない。

## やらないこと(スコープ外)

- 日付別・モード別の詳細統計
- リセット・エクスポート機能
- `tasks/` `CLAUDE.md` `AGENTS.md` `scripts/` の変更

## 受け入れ基準(検証コマンド)

- [ ] `cd app && npx vitest run` が全件パス
- [ ] `cd app && npm run build` が成功する
- [ ] 変更がコミット・push され、デプロイ成功後、公開URLで: (a) 練習でだいせいこうを取ると すたんぷページのスタンプが増える、(b) リロード後も維持される、(c) ホーム⇔すたんぷページの行き来ができる、を確認(操作記録を作業ログに残す)
- [ ] 表示文言にカタカナ・漢字が含まれない(「OK」のみ例外。個数の数字は可)
- [ ] タスク完了時点で、当該タスク由来の差分・未追跡ファイルが `git status --short` に残っていないこと

## フィードバック(やり直し時にオーケストレーターが記入)

(なし)

## 作業ログ(担当エージェントが追記)

### 2026-07-15 implementer 実施

- 設計書 `othello-beginner-design.md` §1・「がんばりの記録」節を確認。localStorage の扱いは `app/src/home/hintSettings.ts` の try/catch 方針(壊れた値・保存失敗は既定値扱い)に合わせて実装。
- 新規: `app/src/records/records.ts`(だいせいこう/completed/wins の3項目、`loadRecords`/`addGreatSuccess`/`addCompleted`/`addWin`。JSON.parse 失敗・型不正・負数は 0 扱い)。
- 新規: `app/src/records/records.test.ts`(既定値・累積・各 add の戻り値・壊れた値・非JSON・getItem/setItem 例外の各ケース)。
- 新規: `app/src/records/StampScreen.tsx` + `StampScreen.css`(だいせいこう⭐/さいごまでうてた◎/かち🏆 の3行。1行10個グリッド、50個超は「ほかにも　N こ　あるよ」表示。文言は全ひらがな分かち書き)。
- 変更: `app/src/practice/PracticeScreen.tsx`(result が「だいせいこう」になった state を ref で去重しつつ `addGreatSuccess()`)。
- 変更: `app/src/game/GameScreen.tsx`(gameOver 検知の既存 effect に `addCompleted()`、outcome==='win' なら `addWin()` を追加。途中「おわる」では gameOver に到達しないため加算されない)。
- 変更: `app/src/home/HomeScreen.tsx`/`HomeScreen.css`(「すたんぷ」ボタン追加)、`app/src/app.tsx`(`stamp` 画面を追加、HomeScreen に `onStamp` を配線)。

実行コマンドと結果:
- `cd app && npx vitest run` → `Test Files 12 passed (12)` `Tests 116 passed (116)`
- `cd app && npm run build` → 成功(`tsc -b && vite build`、警告なし)

公開URLでの受け入れ基準確認(Claude Browser で https://giwarb.github.io/othello-beginner/ を操作。ローカル dev サーバでも同様の手順で先に確認済み):
- ホーム→「すたんぷ」→ すたんぷページ表示、初期状態は3項目とも「0こ　まだ　ないよ」を確認。
- 「もどる」でホームへ戻れることを確認。
- ホーム→「おいて　ひっくりかえす」→ ハイライトされた合法手・裏返し対象を DOM 上のクラス(`cell-highlight`)と盤面石の並びから特定してタップ(ミスタッチ0件)→ OK →「だいせいこう！」表示を確認。
- 「おわる」でホームへ戻り「すたんぷ」→ だいせいこう欄が `1こ ⭐` に増えたことを確認。
- ページを `location.reload()` でリロード→ 再度「すたんぷ」を開き `だいせいこう1こ⭐` が維持されていることを確認(localStorage 永続化)。
- 表示文言はすべてひらがな(「OK」のみ例外、個数は算用数字)。

コミット:
- `937b9cc` — `app: がんばりの記録(すたんぷちょう)を追加。だいせいこう・1局完走・かちをスタンプで累積表示(T010)`
- push 済み。GitHub Actions「Deploy to GitHub Pages」run 29385637456 が成功(build/deploy とも success)。

仕様どおりにできなかった点: なし。
