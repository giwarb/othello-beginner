---
id: T006
title: 問題量産(puzzlegen 生成スクリプト+機械検証フィルタ+アプリ組み込み)
status: review
assignee: codex
attempts: 0
---

# T006: 問題量産(puzzlegen 生成スクリプト+機械検証フィルタ+アプリ組み込み)

## 目的

モードA(ルール練習)とモードB(いいてを　みつける)の問題を生成スクリプトで量産し、アプリに組み込む。「誰が見ても明らか」は T005 の validate 関数で機械保証する。

## 背景・コンテキスト

- 設計書 `othello-beginner-design.md` §3(明白さ基準)・§4(/puzzlegen)・§5(データ形式)参照。
- T005 で `app/src/puzzles/validate.ts`(カテゴリ検証)・`types.ts`(Puzzle 型)・`samplePuzzles.ts`(手作り9問)が完成済み。**生成フィルタはこの validate を必ず共用する**(二重実装しない)。
- コアロジックは `app/src/core/othello.ts`。
- 現在アプリは `PRACTICE_PUZZLES`(モードA 5問ハードコード)+`SAMPLE_STRATEGY_PUZZLES`(9問)を直列に流している。
- **C 打ちには一切言及しない**(ユーザー指示)。

## 変更対象

- `puzzlegen/generate.ts`(+必要な補助ファイル) — 生成スクリプト(新規、リポジトリ直下 `/puzzlegen`。`app/src` のロジックを import して Node で実行)
- `puzzlegen/README.md` — 実行方法(新規)
- `app/src/puzzles/generated.json`(または `.ts`) — 生成済み問題データ(コミット対象)
- `app/src/puzzles/generatedPuzzles.test.ts` — 全生成問題が validate(モードB)・合法性(モードA)を通ることの検証テスト(新規)
- `app/src/practice/practiceMachine.ts` / `PracticeScreen.tsx` — 生成問題プールの読み込み(モードA問題→モードB問題の暫定直列のままでよいが、プール全体からのシャッフル出題にする。モード選択 UI は T007)
- `app/package.json` — 生成スクリプト実行用 npm script(例: `npm run puzzlegen`)

## 要件

### 生成方式

1. ランダム自己対戦(両者ランダム合法手)で実戦到達可能な局面を大量に作り、各局面をフィルタにかけて採否を決める。乱数はシード指定で再現可能にする(生成物の再現性のため。シードは README に記録)。
2. **モードA(rule)問題**: 目標 30 問以上。難度タグを付ける:
   - difficulty 1: どの合法手を選んでも裏返しが1方向のみ、かつ手番の合法手が3つ以下(迷わない)
   - difficulty 2: 1〜2方向、合法手数制限なし
   - difficulty 3: 3方向以上返る手が存在する局面
   - 序盤〜終盤(空きマス数)のバリエーションを持たせる。各難度 10 問以上。
3. **モードB(strategy)問題**: 各カテゴリ(corner / avoid-x / min-mobility)**30 問以上**。T005 の validate を通ったもののみ収録。
4. 重複盤面(同一 board+turn)は除外。`samplePuzzles.ts` との重複も除外。
5. 生成スクリプトは数分以内で完了する想定。実行ログに「候補何局面中何問採用」のカテゴリ別サマリを出力する。10分を超える設計になりそうな場合は停止してオーケストレーターに確認(チェックポイント設計が必要になるため)。

### アプリ組み込み

6. 生成データを `app/src/puzzles/` 配下に置き、アプリは起動ごとに(または「つぎへ」ごとに)プールからシャッフルして出題する(直前と同一問題の連続を避ける)。モードA→モードBの大きな並び順は現状の暫定配線を維持してよい。
7. モードAは difficulty 1 → 2 → 3 の順で出題が進む(簡単なものから)。

### テスト

8. `generatedPuzzles.test.ts`: 生成データ全問について (a) board が妥当、(b) rule 問題は合法手が存在し difficulty 定義を満たす、(c) strategy 問題は該当カテゴリの validate を通る、(d) 重複なし、を検証。
9. 既存テストを壊さない。

## やらないこと(スコープ外)

- ホーム画面・モード/カテゴリ選択・難度選択 UI — T007
- validate 基準自体の変更(通過率が低すぎる等の問題があれば停止して報告)
- WTHOR 等の外部棋譜データの利用(ランダム自己対戦で足りる)
- `tasks/` `CLAUDE.md` `AGENTS.md` `scripts/` の変更

## 受け入れ基準(検証コマンド)

- [ ] `cd app && npm run puzzlegen`(相当)が完了し、生成サマリ(候補数/採用数)が出力される
- [ ] `cd app && npx vitest run` が全件パス(generatedPuzzles.test.ts を含む)
- [ ] 生成データに rule 30問以上(各難度10問以上)・strategy 各カテゴリ30問以上が含まれる(テストで件数を assert する)
- [ ] `cd app && npm run build` が成功する
- [ ] 変更がコミット・push され、GitHub Actions のデプロイ成功後、公開URLで出題が生成プールから行われる(リロードや「つぎへ」で従来の固定5問と異なる局面が出ることの確認)
- [ ] タスク完了時点で、当該タスク由来の差分・未追跡ファイルが `git status --short` に残っていないこと(Codex はコミット不可のため、コミット対象一覧の報告で代替)

## フィードバック(やり直し時にオーケストレーターが記入)

(なし)

## 作業ログ(担当エージェントが追記)

- 2026-07-15 09:47:02 +09:00 Codex
  - 実施内容: 固定シードのランダム自己対戦生成器を追加し、アプリ本体の `validateStrategy` を共用して rule 各難度10問、strategy 各カテゴリ30問（計120問）を生成。盤面・合法性・難度・カテゴリ・重複・件数・空きマス帯・シャッフル順の検証テストを追加。アプリは rule 難度1→2→3の各プール内とstrategyプールを起動時にシャッフルして出題するよう変更。
  - `cd app && npm run puzzlegen`: 成功（seed=20260715、43局、rule各10問、corner/avoid-x/min-mobility各30問、約1秒）。再実行前後の生成物SHA-256一致。
  - `cd app && npx vitest run`: 実行環境の子プロセス制限により起動時 `spawn EPERM`。一時的な空configと `--pool=vmThreads --maxWorkers=1` を用いた同一テスト実行は9ファイル・80テスト全件成功。一時configは削除済み。
  - `cd app && npm run build`: `tsc -b` は成功後、同じ実行環境制限によりVite configロード時 `spawn EPERM`。別途 `npx tsc -b` 成功、Vite APIを `configFile: false` と既存Preact設定相当で実行した本番バンドルは24モジュール変換・成功。
  - `cd app && npx tsc --ignoreConfig --noEmit --target es2023 --module esnext --moduleResolution bundler --allowImportingTsExtensions --types node ../puzzlegen/generate.ts`: 成功。
  - `git diff --check`: 成功。
  - コミットハッシュ: なし（Codex環境は `.git` 書き込み不可。オーケストレーターが代行）。
