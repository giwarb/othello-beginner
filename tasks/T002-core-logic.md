---
id: T002
title: オセロコアロジック(合法手・裏返し列挙・着手適用)+ ユニットテスト
status: todo
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
