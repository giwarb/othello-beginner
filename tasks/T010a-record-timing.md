---
id: T010a
title: 記録加算のタイミング堅牢化(effect 依存の取りこぼし解消)
status: in_progress
assignee: implementer
attempts: 0
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

(なし)

## 作業ログ(担当エージェントが追記)
