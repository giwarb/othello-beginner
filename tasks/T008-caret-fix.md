---
id: T008
title: メッセージ等のテキストにキャレットが出る問題の修正
status: done
assignee: implementer
attempts: 0
---

# T008: メッセージ等のテキストにキャレットが出る問題の修正

## 目的

ユーザー報告(2026-07-15): ブラウザでプレイ中、メッセージ帯の文字(「だいせいこう！」等)の位置にキャレット(文字カーソル)が表示された。幼児向けアプリとして、タップ/クリックでテキスト選択やキャレットが出ない状態にする(設計書「UI 共通の追加方針」参照)。

## 背景・コンテキスト

- 報告のスクリーンショットでは、結果表示時に MessageBar の「だいせいこう！」の直前に点滅キャレットが見えている。
- MessageBar は再ポップ演出のため key 変更で DOM ノードを再マウントしている(T004a)。フォーカス・選択状態との相互作用の可能性がある。
- 原因の候補: テキスト選択(ダブルタップ/連打による selection)、要素への意図しないフォーカス、contenteditable 相当の状態。**まず実際に再現・特定してから直すこと**(闇雲に CSS を足すだけで閉じない)。

## 変更対象

- 原因に応じて `app/src/index.css` / `app/src/components/MessageBar.*` / 各画面 CSS 等(調査結果に従う)
- 必要なら再発防止テスト

## 要件

1. 原因を特定し、作業ログに再現手順と原因を記録する。
2. アプリ UI 全体(盤面・メッセージ・ボタン・結果表示・ホーム画面)で、クリック/タップ/ダブルクリック/連打によりテキスト選択・キャレットが表示されないようにする(`user-select: none` の全体適用が素直。入力要素は存在しないため副作用はないはず)。
3. 既存の操作(マスタップ・ボタン)を壊さない。

## やらないこと(スコープ外)

- 新機能(T009/T010)
- `tasks/` `CLAUDE.md` `AGENTS.md` `scripts/` の変更

## 受け入れ基準(検証コマンド)

- [ ] `cd app && npx vitest run` 全件パス、`npm run build` 成功
- [ ] 変更がコミット・push され、デプロイ成功後、公開URLで: メッセージ帯・結果パネル・見出しをクリック/ダブルクリックしてもキャレット・テキスト選択が発生しない(`window.getSelection()` が空のままであること等で機械確認)
- [ ] マスタップ・OK/つぎへ/おわるボタンの動作が従来どおり
- [ ] タスク完了時点で、当該タスク由来の差分・未追跡ファイルが `git status --short` に残っていないこと

## フィードバック(やり直し時にオーケストレーターが記入)

(なし)

## 作業ログ(担当エージェントが追記)

### 2026-07-15 implementer

**再現手順**:
1. https://giwarb.github.io/othello-beginner/ (修正前) をブラウザで開く。
2. 見出し「おせろの　れんしゅう」やボタンのラベル文字上でダブルクリック、または連打(single click 連続)する。
3. `window.getSelection().toString()` が非空になり(例: `"を　"`)、選択範囲がハイライト表示される。選択操作の境界に点滅キャレットが視認される状態を確認(スクリーンショットでも青いハイライトを確認)。

**原因**:
- アプリの CSS (`app/src/index.css` ほか全 CSS ファイル)に `user-select` の指定が一切存在しなかった(`app/src` 配下を grep して確認)。
- `<input>` / `contentEditable` 要素も存在しない。
- そのため、ブラウザ標準のテキスト選択機能がボタン文字列・メッセージ帯文字列に対して有効なままで、ダブルクリック/連打により通常のテキスト選択(および選択境界のキャレット表示)が発生していた。MessageBar の再マウント(T004a)自体は無関係で、フォーカスや contenteditable 相当の状態ではなかった。

**実施内容**:
- `app/src/index.css` の `* { box-sizing: border-box; }` ルールに `-webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; -webkit-touch-callout: none;` を追加し、アプリ全体(盤面・メッセージ・ボタン・見出し等)でテキスト選択と iOS の長押しコールアウトを無効化。入力要素は存在しないため副作用なし。

**実行コマンドと結果**:
- `cd app && npx vitest run` → `Test Files 10 passed (10)` / `Tests 93 passed (93)`
- `cd app && npm run build` → 成功 (`vite build` 完了、dist生成)
- ローカル dev サーバー (`npm run dev`) と公開URL両方で Claude Browser ツールにより検証:
  - ホーム画面見出し・ボタン、practiceScreen のメッセージ帯(「ひっくりかえそう」等)をダブルクリック/トリプルクリック/連打しても `window.getSelection().toString()` は常に空文字、`rangeCount` は 0。
  - マスタップ(有効/無効手ともにonCellTap発火を確認、有効手で石が裏返りメッセージ更新)、OKボタン、おわるボタン(ホームへ復帰)は修正前後で動作変化なし。
- `git push origin main` → `8a68c1d..35c12d5 main -> main`
- `gh run watch 29383817826` → Deploy to GitHub Pages ワークフロー成功(build/deploy 両ジョブ ✓)
- 公開URL (https://giwarb.github.io/othello-beginner/) で上記と同じ機械確認・操作確認を再実施し、修正が反映されていることを確認。

**コミットハッシュ**: `35c12d5`

**仕様どおりにできなかった点**: なし。
