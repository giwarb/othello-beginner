---
id: T002
title: オセロコアロジック(合法手・裏返し列挙・着手適用)+ ユニットテスト
status: done
assignee: codex
attempts: 0
---

# T002: オセロコアロジック(合法手・裏返し列挙・着手適用)+ ユニットテスト

## 目的

アプリ全体(置く練習・ひっくり返し練習・問題生成・問題検証)が依存するオセロのルールロジックを、UI から独立した純粋関数として実装する。ここが間違っていると「そこにはおけないよ！」等の判定がすべて狂うため、テストを厚くする。

## 背景・コンテキスト

- 設計書 `othello-beginner-design.md` §4・§5 参照。エンジン(探索・評価)は不要。ルール判定のみ。
- T001 で `app/` に Vite + Preact + TS + Vitest の scaffold が構築済み。
- 盤面表現は設計書 §5 のとおり: 64 文字の文字列(`'-'`=空、`'b'`=黒、`'w'`=白、左上 a1 から行優先)を外部形式とし、内部表現は実装者に任せる(8x8 配列で十分。bitboard は不要)。

## 変更対象

- `app/src/core/othello.ts` — コアロジック(新規)
- `app/src/core/othello.test.ts` — ユニットテスト(新規)

## 要件

1. 以下の API を実装する(命名は多少変えてよいが、役割は保つこと):
   - `parseBoard(s: string): Board` / `serializeBoard(b: Board): string` — 64文字形式との相互変換(不正入力は例外)
   - `initialBoard(): Board` — 対局開始局面
   - `legalMoves(board, color): number[]` — 置けるマス(0-63)の列挙
   - `flippedDiscs(board, color, pos): number[]` — pos に置いたとき裏返る相手石の位置一覧(非合法なら空配列)
   - `applyMove(board, color, pos): Board` — 着手適用(非合法なら例外)。元の board は変更しない(イミュータブル)
   - `hasAnyMove(board, color): boolean` / `isGameOver(board): boolean` — パス・終局判定
   - `countDiscs(board): { b: number; w: number }` — 石数
2. `flippedDiscs` は「どの石が返るか」を1枚単位で返すこと(ひっくり返し練習モードで、子どもがタップした石が正解かを1枚ずつ照合するため)。
3. ユニットテスト(Vitest)で最低限以下を網羅する:
   - 開始局面の合法手が黒 4 手(d3, c4, f5, e6 相当の 0-63 インデックス)であること
   - 8 方向すべての裏返りが正しいこと(方向ごとのケース)
   - 複数方向同時に返るケース
   - 端・隅での挙動(盤外にはみ出す走査がないこと)
   - 「相手石を挟んでいるが自分の石で止まっていない」ケースが非合法になること
   - パスが発生する局面・終局局面の判定
   - parse/serialize のラウンドトリップ

## やらないこと(スコープ外)

- UI・アニメーション・練習フロー(T003 以降)
- CPU の着手選択・評価関数・探索
- 問題データ形式の実装(型定義は将来タスクで)
- `tasks/` `CLAUDE.md` `AGENTS.md` `scripts/` の変更

## 受け入れ基準(検証コマンド)

- [ ] `cd app && npx vitest run` が全件パス(コアロジックのテストを含む)
- [ ] `cd app && npm run build` が成功する
- [ ] タスク完了時点で、当該タスク由来の差分・未追跡ファイルが `git status --short` に残っていないこと(Codex ワーカーはコミット不可のため、コミット対象ファイル一覧の報告で代替し、コミットはオーケストレーターが代行する)

## フィードバック(やり直し時にオーケストレーターが記入)

(なし)

## 作業ログ(担当エージェントが追記)

- 2026-07-15 Codex: 64文字盤面の変換、初期局面、8方向の合法手・裏返し列挙、イミュータブルな着手適用、パス・終局、石数の純粋関数を app/src/core/othello.ts に実装。開始局面、8方向、複数方向、端・隅、未閉鎖列、パス・終局、変換、着手適用を含むユニットテストを app/src/core/othello.test.ts に追加。
  - cd app && npx vitest run: 成功 (2 files / 22 tests passed)。実行環境が子プロセス生成を禁止するため、検証中のみ Vite の net use 呼び出しを無効化し Vitest pool を threads に設定。検証後に両方とも原状復帰済み。
  - cd app && npm run build: 成功 (tsc -b && vite build)。上記の一時的な環境回避下で実行し、回避変更は原状復帰済み。
  - git status --short: タスク成果物 app/src/core/ と本作業ログのみ。Codex 環境ではコミット不可のため、コミットハッシュなし (オーケストレーターが代行予定)。

- 2026-07-15 verifier(検証専任、コード修正なし): 対象実装 6461cd4 (main) を受け入れ基準に沿って独立検証。
  - `cd app && npx vitest run` → PASS (Test Files 2 passed / Tests 22 passed, 3.25s)。子プロセス生成回避などの特別措置なしで通過。
  - `cd app && npm run build` → PASS (`tsc -b && vite build` 成功、dist/ 生成)。
  - `git status --short` → 出力なし(クリーン)。app/dist は .gitignore 対象で未追跡混入なし。
  - 追加確認(自己参照テスト対策): `app/src/core/othello.test.ts` を精読し、期待値が実装呼び出しではなく手計算・盤面ジオメトリから独立に構築されていることを確認(例: 開始局面の合法手 `[19, 26, 37, 44]` は d3/c4/f5/e6 の行優先インデックスと手計算で一致、8方向テストは delta(±1,±7,±8,±9)から方向ごとに期待座標を手計算し一致、複数方向テストは8近傍全返しと整合、隅・端テスト(pos0, pos7)は盤外ラップが発生しないことをコード上のisOnBoard境界チェックと突き合わせて確認、パス/終局テストは手計算で hasAnyMove(b)=false/hasAnyMove(w)=true 等を再現)。自己参照(実装出力をそのまま期待値にする)パターンは見当たらず。
  - API網羅確認: `app/src/core/othello.ts` に parseBoard/serializeBoard/initialBoard/legalMoves/flippedDiscs/applyMove/hasAnyMove/isGameOver/countDiscs が全て実装済み。flippedDiscs は要件2どおり1枚単位の配列を返す実装。applyMove はスプレッドで新配列を生成しイミュータブル、非合法手は例外。parseBoard/assertValidBoard は64文字・不正文字・不正長を例外化。
  - テスト網羅確認(要件3の7項目): 開始局面4手/8方向/複数方向/端・隅(2ケース)/未閉鎖列/パス・終局(2ケース)/ラウンドトリップ(+不正入力3ケース)がすべて存在することを確認。
  - 総合判定: 合格。
