---
id: T005
title: モードB「いいてを　みつける」(問題データ形式・カテゴリ判定・練習フロー拡張)
status: todo
assignee: codex
attempts: 0
---

# T005: モードB「いいてを　みつける」(問題データ形式・カテゴリ判定・練習フロー拡張)

## 目的

設計書 §3 モードB を実装する。お題(「すみを　とろう」等)付きの局面で正解の手を置かせ、置いた後は既存のひっくり返し練習に合流する。問題データ形式と「明白さ」の機械検証関数もここで定め、T006 の問題量産の土台にする。

## 背景・コンテキスト

- 設計書 `othello-beginner-design.md` §3(カテゴリ・正解定義・明白さ基準)・§5(データ形式)参照。**C 打ちには一切言及しない**(2026-07-15 ユーザー指示。正解判定は「X 以外」であり、C の良し悪しを教えない)。
- T004 で `app/src/practice/practiceMachine.ts`(placing→flipping→result 状態機械)と `PracticeScreen.tsx` が完成済み(モードA)。T004a でメッセージ再通知(messageId 等)とひらがなラベルが入っている前提(コミット済みの最新 main を参照)。
- モードBの1問は「placing がお題付き・正解制約あり」になる以外、flipping/result はモードAと同一。

## 変更対象

- `app/src/puzzles/types.ts` — Puzzle 型(設計書 §5 準拠: id/mode/category/board/turn/answers/difficulty)(新規)
- `app/src/puzzles/validate.ts` — カテゴリ条件+明白さ基準の機械検証関数(新規。T006 の生成フィルタと共用)
- `app/src/puzzles/validate.test.ts` — 検証関数のテスト(新規)
- `app/src/puzzles/samplePuzzles.ts` — 手作りのモードB問題(各カテゴリ3問以上。validate を通ること)(新規)
- `app/src/practice/practiceMachine.ts` — strategy モード対応(placing の正解制約・お題・不正解メッセージ+ヒント)(拡張)
- `app/src/practice/practiceMachine.test.ts` — strategy 分岐のテスト(拡張)
- `app/src/practice/PracticeScreen.tsx` — お題表示・不正解時ヒント表示(拡張)

## 要件

### データ形式・検証関数

1. Puzzle 型は設計書 §5 のとおり。`mode: 'rule' | 'strategy'`、strategy は `category: 'corner' | 'avoid-x' | 'min-mobility'` と `answers: number[]` 必須。
2. `validate.ts` にカテゴリごとの検証関数を実装する(引数: board/turn/answers。戻り値: ok/違反理由):
   - **corner**: 隅(0,7,56,63)のうち少なくとも1つが合法手で、answers = 合法手である隅すべて。かつ「隅を取った直後に相手がその隣接隅…は存在しないので: 隅に置いた結果の局面で相手が別の隅を即取りできない」こと(迷い要素の排除)。
   - **avoid-x**: X マス(9,14,49,54)のいずれかが合法手で、そのX に打つと「相手の応手に対応する隅(9→0, 14→7, 49→56, 54→63)を相手が即座に合法手として取れるようになる」ことが `legalMoves` で機械確認できる。answers = X マス以外の全合法手(空でないこと)。
   - **min-mobility**: answers = 「着手後の相手の合法手数」が唯一最少になる1手で、次点との差が 2 以上。
   - 共通: board が 64 文字形式として妥当、turn の合法手が存在、answers ⊆ 合法手。
3. `samplePuzzles.ts` の全問題が validate を通ることをテストで担保する(データ検証テスト)。

### 練習フロー拡張

4. strategy 問題の placing: お題文言を表示(corner=「すみを　とろう」、avoid-x=「ばつの　ばしょは　やめよう」、min-mobility=「あいてが　うてる　ばしょが　すくなくなる　ところに　うとう」)。
   - answers に含まれる手をタップ → モードA同様に石を置いて flipping へ
   - 合法手だが answers 外をタップ → メッセージ「ちがうよ！　もういちど」+ カテゴリ別ヒント(corner=「すみを　さがしてみよう」、avoid-x=「すみの　ななめよこは　あぶないよ」、min-mobility=「あいての　おけるばしょを　かぞえてみよう」)。**おくミス +1**(モードAの非合法と同じカウンタでよい)
   - 非合法マスをタップ → モードAと同じ「そこには　おけないよ！」+おくミス
5. flipping/result はモードAと完全共通(コードも共通のまま)。
6. 暫定の画面切替: PracticeScreen にモードA問題列とモードB問題列を続けて流す等の簡易配線でよい(ホーム画面でのモード選択は T007)。ただし現在どちらのモードかが分かる表示(お題の有無で自明なら追加表示不要)。

### テスト

7. strategy placing の分岐(正解タップ/合法だが不正解タップ/非合法タップ)と、各カテゴリのヒント文言をユニットテストで担保。
8. validate 関数のテスト: 各カテゴリについて「通るべき局面」と「弾かれるべき局面」(例: X に打っても隅を取られない局面は avoid-x として不合格、次点との差が1しかない min-mobility は不合格)を最低1組ずつ。

## やらないこと(スコープ外)

- 問題の量産・生成スクリプト(/puzzlegen) — T006
- ホーム画面・モード/カテゴリ選択 UI — T007
- 「明白さ」基準自体の変更(変えたい場合は停止してオーケストレーターに確認)
- C 打ちへの言及(ヒント・メッセージ・判定のいずれにも入れない)
- `tasks/` `CLAUDE.md` `AGENTS.md` `scripts/` の変更

## 受け入れ基準(検証コマンド)

- [ ] `cd app && npx vitest run` が全件パス(validate テスト・strategy 分岐テスト・サンプル問題のデータ検証テストを含む)
- [ ] `cd app && npm run build` が成功する
- [ ] 表示文言にカタカナ・漢字・算用数字が含まれない(「OK」のみ例外)
- [ ] 変更がコミット・push され、GitHub Actions のデプロイ成功後、公開URLでモードB問題(お題表示→不正解タップでヒント→正解タップ→ひっくりかえし→結果)が1問通しで動作する(操作記録を作業ログに残す)
- [ ] タスク完了時点で、当該タスク由来の差分・未追跡ファイルが `git status --short` に残っていないこと(Codex はコミット不可のため、コミット対象一覧の報告で代替)

## フィードバック(やり直し時にオーケストレーターが記入)

(なし)

## 作業ログ(担当エージェントが追記)
