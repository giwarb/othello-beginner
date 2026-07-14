---
id: T003
title: 盤面 UI コンポーネント(SVG 盤・石・タップ・メッセージ帯)
status: review
assignee: implementer
attempts: 0
---

# T003: 盤面 UI コンポーネント(SVG 盤・石・タップ・メッセージ帯)

## 目的

練習フロー(T004)が使う表示部品を作る: タップできる 8x8 の盤面、石の描画と裏返しアニメーション、ひらがなメッセージ帯、手番表示。**この時点ではゲーム進行ロジックは入れない**(部品のみ)。

## 背景・コンテキスト

- 設計書 `othello-beginner-design.md` §1(幼児向け方針)・§6(画面構成)参照。
- T002 でコアロジック(`app/src/core/othello.ts`)が実装済み。盤面は 0-63 のインデックス、`'b' | 'w' | '-'`。
- 対象は幼児: タップ領域は大きく、テキストは全ひらがな・分かち書き。タブレット優先のレスポンシブ(スマホ縦でも崩れない)。
- 現在の `app/src/app.tsx` はプレースホルダ(タイトル表示のみ)。

## 変更対象

- `app/src/components/Board.tsx` — SVG 盤面コンポーネント(新規)
- `app/src/components/MessageBar.tsx` — メッセージ帯(新規)
- `app/src/components/TurnBadge.tsx` — 手番表示「あなたは　くろ　です」(新規)
- `app/src/components/*.test.tsx` 等 — テスト(新規。描画ロジックの単体テストは Testing Library 導入までは純関数部分の抽出+単体テストでよい)
- `app/src/app.tsx` — 部品を確認できるデモ表示(開始局面の盤 + メッセージ帯 + 手番表示)に差し替え
- `app/src/index.css` ほかスタイル

## 要件

1. `Board`: props で盤面(64文字 or 配列)・ハイライト対象マス(省略可)・強調石(直前に置いた石)・セルタップコールバック `(pos: number) => void` を受け取り、SVG で描画する。
   - 緑の盤・グリッド線・黒/白の石。石には軽い立体感(グラデ or 影)
   - 盤は正方形を保ち、画面幅に応じてスケール(viewBox 利用)
   - タップはマス単位(石があるマスもタップイベントを発火する — ひっくり返し練習で石をタップするため)
   - ハイライト指定マスは視覚的に目立たせる(ヒントあり設定用。点滅 or 色枠)
   - 強調石(直前に置いた石)は枠・光彩で区別
2. 石の裏返しアニメーション: 石の色が変わるとき、横方向に潰れて反転する CSS/SVG transform アニメーション(300ms 程度)。アニメーション完了を待たずに次のタップを受け付けてよい
3. `MessageBar`: メッセージ文字列を大きく表示する帯。メッセージ変更時に軽いアテンション(ポップ)アニメーション。空のときは高さを保つ(レイアウトが跳ねない)
4. `TurnBadge`: 手番の色を受け取り「あなたは　くろ　です」/「あなたは　しろ　です」+ 石アイコンを表示
5. デモ表示(`app.tsx`): 開始局面の盤を表示し、マスをタップするとそのマス番号に応じて仮メッセージが出る程度の配線(本物のルール判定・練習フローは T004)
6. 文言はすべてひらがな・分かち書き(「OK」のみ例外)。フォントサイズは幼児が見やすい大きめ設定
7. `npm run build` / `npx vitest run` が通ること

## やらないこと(スコープ外)

- 練習フロー(おく段階/ひっくりかえす段階の状態機械、ミスカウント)— T004
- 問題データ・モードB — T005 以降
- ホーム画面・ルーティング — T007
- 音声・効果音
- `tasks/` `CLAUDE.md` `AGENTS.md` `scripts/` の変更

## 受け入れ基準(検証コマンド)

- [ ] `cd app && npx vitest run` が全件パス
- [ ] `cd app && npm run build` が成功する
- [ ] 変更がコミット・push され、GitHub Actions のデプロイ成功後、`https://giwarb.github.io/othello-beginner/` で開始局面の盤(黒白2石ずつ)が表示され、マスのタップで仮メッセージが表示される(Playwright 等のブラウザ確認、または実ブラウザでの確認手順の記録)
- [ ] スマホ縦(幅 375px 相当)とタブレット横(幅 1024px 相当)で盤が正方形のまま収まる(スクリーンショットまたは確認記録)
- [ ] タスク完了時点で、当該タスク由来の差分・未追跡ファイルが `git status --short` に残っていないこと

## フィードバック(やり直し時にオーケストレーターが記入)

(なし)

## 作業ログ(担当エージェントが追記)

### 2026-07-15 実装・検証・デプロイ完了

- 実施内容:
  - `app/src/components/boardGeometry.ts`(盤ジオメトリの純関数: 位置→行列/座標変換、盤面正規化、色反転差分検出)と `boardGeometry.test.ts` を新規作成
  - `app/src/components/Board.tsx` + `Board.css`: SVGのタップ可能な8x8盤。石はグラデーションで立体感、直前手は光彩枠、ヒント用ハイライトは点滅、色が変わったマスは横潰れ反転アニメーション(300ms、次タップの受付はブロックしない)
  - `app/src/components/MessageBar.tsx` + `MessageBar.css` と純関数 `messageBarLogic.ts`(`shouldPulse`)+ `messageBarLogic.test.ts`: メッセージ帯。空でも最小高さを保持し、メッセージ変化時のみポップアニメーション
  - `app/src/components/TurnBadge.tsx` + `TurnBadge.css` と純関数 `turnBadgeLogic.ts`(`turnLabel`)+ `turnBadgeLogic.test.ts`: 「あなたは　くろ／しろ　です」+ 石アイコン
  - `app/src/app.tsx`: 開始局面の盤+手番表示(くろ)+メッセージ帯を表示し、マスタップで `${pos}ばんめの ますを おしたよ` という仮メッセージを出すデモ配線に差し替え
  - `app/src/index.css`: 幼児向けに基準フォントサイズ拡大、レイアウトをflex縦積みに変更
  - 注意点: Windowsの大文字小文字を区別しないファイルシステムで `MessageBar.tsx`/`messageBar.ts`、`TurnBadge.tsx`/`turnBadge.ts` の組がTSのモジュール解決で衝突したため、純関数ファイルを `messageBarLogic.ts` / `turnBadgeLogic.ts` にリネームして解消(この経緯により最終ファイル名は変更対象記載と異なる)
- 実行コマンドと結果:
  - `cd app && npx vitest run` → `Test Files 5 passed (5)` `Tests 41 passed (41)`
  - `cd app && npm run build` → `tsc -b && vite build` 成功(`dist/` 生成、警告なし)
- レスポンシブ確認: `npm run dev` をポート5183で起動し、Claude Browserツール(`preview_start` url指定 / `resize_window` / `javascript_tool`)でビューポート幅375px(スマホ縦相当)と1024px(タブレット横相当)それぞれで `.board-wrapper` の `getBoundingClientRect()` を計測。結果は375px時 345x345(正方形)、1024px時 640x640(正方形)、いずれも `document.documentElement.scrollWidth > window.innerWidth` は false(横スクロールなし)。確認後、開発サーバは対象PIDのみ `Stop-Process` で停止
- 本番確認: コミット `09e1a25` を `git push origin main`、`gh run watch 29375261770 --exit-status` でGitHub Actionsのbuild/deployとも成功を確認。`https://giwarb.github.io/othello-beginner/` を実ブラウザで開き、`read_page`で64マスのボタンと手番表示「あなたは　くろ　です」を確認、`javascript_tool`で開始局面の石が黒2・白2(`disc-shape-b`×2, `disc-shape-w`×2)であることを確認、マスタップで `get_page_text` によりメッセージ「45ばんめの ますを おしたよ」が表示されることを確認。同URLで375px/1024pxのレスポンシブ確認(上記と同じ計測)も実施し、いずれも正方形・横スクロールなしを確認
- 一時ファイル: スクリーンショットの保存は行わず、上記の数値・テキスト確認記録のみで代替(Browserのスクリーンショットアクションがこの環境でタイムアウトしたため、`read_page`/`get_page_text`/`javascript_tool`による確認に切り替え)。リポジトリ内に一時ファイルは残していない
- コミットハッシュ: `09e1a25`(push済み、mainに反映)
- 仕様どおりにできなかった点・判断に迷った点:
  - ファイル名衝突回避のため、`app/src/components/messageBar.ts`→`messageBarLogic.ts`、`turnBadge.ts`→`turnBadgeLogic.ts` と、タスク文中に直接名指しはされていない命名に変更(コンポーネント本体 `MessageBar.tsx`/`TurnBadge.tsx` は仕様通りの名前で維持)
  - それ以外は仕様通り実装。デモの仮メッセージ文言・アニメーション時間(300ms)・ハイライト演出(点滅)・強調石の光彩表現は要件の許容範囲内で実装側の裁量とした
