---
id: T004a
title: 結果ラベルのひらがな化と同一メッセージ連続時の再通知
status: done
assignee: implementer
attempts: 0
---

# T004a: 結果ラベルのひらがな化と同一メッセージ連続時の再通知

## 目的

T004 の codex-review 中指摘2件(`tasks/review/T004-practice-flow-codex-review.md` (b))の解消。幼児向けの「全ひらがな」「フィードバックは即時」という設計原則の穴を塞ぐ。

## 背景・コンテキスト

- 設計書 §1: 表示テキストはすべてひらがな(「OK」のみ例外)。フィードバックは即時。
- T004 で練習フロー(`app/src/practice/`)が完成し公開済み。ただし:
  1. 結果画面のミス内訳ラベル「おく　ミス」等の「ミス」がカタカナ
  2. 同じミスを連続すると(例: 非合法マスを2回続けてタップ)、MessageBar は文言が変化した時だけポップするため、2回目以降は画面上なにも反応がないように見える

## 変更対象

- `app/src/practice/PracticeScreen.tsx` — 結果内訳ラベルのひらがな化
- `app/src/practice/practiceMachine.ts` — メッセージにイベント連番(または同等の再通知手段)を追加
- `app/src/components/MessageBar.tsx` / `app/src/components/messageBarLogic.ts`(+テスト) — 同一文言でも再通知イベントでポップが再発火する仕組み
- 関連テスト

## 要件

1. 結果画面のミス内訳ラベルからカタカナを排除する。文言は「おいた　ばしょの　まちがい」「ひっくりかえしの　まちがい」「はやおしの　かず」のような全ひらがなにする(簡潔で幼児に読みやすければ表現は実装者裁量。カタカナ・漢字・数字以外の英字を使わないこと。回数の数字表示は現状どおりでよい)。
2. 状態機械のミスイベント発生時に、メッセージ文言が前回と同一でも MessageBar のポップアニメーションが再発火するようにする(例: 状態機械が messageId/連番を持ち、MessageBar が key 変化で再アニメーション)。
3. 既存テストを壊さず、上記2の再発火ロジック(同一文言・連番違いでポップ判定が true になる等)のユニットテストを追加する。
4. 文言変更に伴う既存テストの期待値修正はテストの意図を保って行う。

## やらないこと(スコープ外)

- 練習フローの仕様変更・新機能
- モードB・問題データ(T005 以降)
- 効果音・凝った演出
- `tasks/` `CLAUDE.md` `AGENTS.md` `scripts/` の変更

## 受け入れ基準(検証コマンド)

- [ ] `cd app && npx vitest run` が全件パス(再発火ロジックのテストを含む)
- [ ] `cd app && npm run build` が成功する
- [ ] `app/src/` 配下の表示文言にカタカナが含まれない(「OK」ボタンのみ例外): `Select-String` / `rg` 等で `[ァ-ヶ]` を検索してヒットが表示文言に無いことを確認(コメント・識別子は対象外)
- [ ] 変更がコミット・push され、GitHub Actions のデプロイ成功後、公開URLで (a) 結果画面のラベルが全ひらがな、(b) 同じ非合法マスを2回連続タップして2回ともメッセージ帯がポップする、ことを確認
- [ ] タスク完了時点で、当該タスク由来の差分・未追跡ファイルが `git status --short` に残っていないこと

## フィードバック(やり直し時にオーケストレーターが記入)

(なし)

## 作業ログ(担当エージェントが追記)

- 2026-07-15 implementer
  - 実施内容:
    - `app/src/practice/PracticeScreen.tsx`: 結果内訳ラベルのカタカナ「ミス」を排除し、「おいた　ばしょの　まちがい」「ひっくりかえしの　まちがい」「はやおしの　かず」に変更。`MessageBar` へ `messageSeq` を追加で渡すよう変更。
    - `app/src/practice/practiceMachine.ts`: `CommonState` に `messageSeq: number` を追加し、`message` を設定する全遷移(placing/flipping のミス・成功メッセージ、pressOk の早押しミス・結果メッセージ)で `messageSeq: state.messageSeq + 1` をセット。`puzzleState` の初期値は `messageSeq: 0`。
    - `app/src/components/messageBarLogic.ts`: `shouldPulse(previousSeq, nextSeq, nextMessage)` に変更。`nextMessage !== '' && nextSeq !== previousSeq` でポップ判定。
    - `app/src/components/MessageBar.tsx`: props に `messageSeq` を追加し、`previousSeqRef` で連番の変化を検知して `pulseKey` を更新(同一文言でも再ポップ)。
    - `app/src/components/messageBarLogic.test.ts`: 新シグネチャに合わせて全面書き換え。連番違い・同一文言での再ポップを検証するテストを追加。
    - `app/src/practice/practiceMachine.test.ts`: 同一非合法タップ2連続で `messageSeq` がインクリメントされ `message` は同一文言のままであることを検証するテストを追加。
  - 実行コマンドと結果:
    - `cd app && npx vitest run` → 7 test files / 61 tests すべて成功。
    - `cd app && npm run build` → 成功(`tsc -b && vite build`、`dist/` 生成)。
    - `LC_ALL=en_US.UTF-8 grep -rnP '[\x{30A1}-\x{30F6}]' --include='*.tsx' --include='*.ts' app/src` → ヒットはすべてコード内コメント(JSDoc)のみで、表示文言・OK ボタン以外のカタカナは検出されず。
    - ローカル dev サーバー(`.claude/launch.json` を一時作成して `npm run dev` 実行、確認後に削除)と Claude Browser で JS 経由のクリックにより、同一非合法マスに2連続タップして `<p class="message-bar-text">` DOM ノードが key 変更により再マウントされること(expando プロパティが引き継がれない)を確認。結果画面の全ひらがな表示も確認。
    - コミット後 `git push origin main`、`gh run watch <run-id> --exit-status` で GitHub Actions「Deploy to GitHub Pages」成功を確認(run 29377944735、build/deploy 両ジョブ成功)。
    - 公開URL https://giwarb.github.io/othello-beginner/ にて Claude Browser + JS dispatch で実地確認: (a) 結果画面ラベルが「おいた　ばしょの　まちがい」「ひっくりかえしの　まちがい」「はやおしの　かず」で全ひらがな、(b) 同一非合法マス(0番目)を2連続タップし、2回とも `message-bar-text` の DOM ノードが再生成(ポップ再発火)されることを確認。
    - `git status --short` → タスク完了時点でクリーン(未追跡・差分なし)。
  - コミットハッシュ: `a2de15da221692dd2015044a1ab94bee7669f143`
  - 仕様どおりにできなかった点: なし
