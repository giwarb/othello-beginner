---
id: T001
title: アプリ scaffold(Vite + Preact + TS + Vitest + GitHub Pages デプロイ)
status: in_progress
assignee: implementer
attempts: 0
---

# T001: アプリ scaffold(Vite + Preact + TS + Vitest + GitHub Pages デプロイ)

## 目的

othello-beginner(幼児向けオセロ練習アプリ、設計書 `othello-beginner-design.md` 参照)の開発基盤を作る。以降のタスクはすべてこの scaffold の上に実装される。

## 背景・コンテキスト

- リポジトリは初期化直後で、まだアプリコードが1行もない。`/scripts` `/tasks` はエージェント運用ファイルなので触らない。
- 姉妹リポジトリ othello-trainer と同様に、アプリは `/app` サブディレクトリに置き、GitHub Pages(`https://giwarb.github.io/othello-beginner/`)で配信する。
- エンジン(Rust/WASM)は使わない。TypeScript のみ。

## 変更対象

- `app/` — Vite + Preact + TypeScript プロジェクト一式(新規作成)
- `app/src/` — 最小のエントリポイント(タイトル「おせろの　れんしゅう」を表示するだけのプレースホルダ画面)
- `.github/workflows/deploy.yml` — main への push で `app/` をビルドし GitHub Pages にデプロイするワークフロー(新規作成)
- `README.md` — 「開発コマンド」セクションを追記(dev/build/test の実行方法)

## 要件

1. `app/` に Vite + Preact + TypeScript のプロジェクトを作成する(`npm create vite` のテンプレート `preact-ts` 相当)。
2. Vitest を導入し、サンプルテスト1件(ダミーでよい)がパスする状態にする。
3. `vite.config.ts` の `base` を `/othello-beginner/` に設定する(GitHub Pages のサブパス配信のため)。
4. エントリ画面はプレースホルダでよいが、ひらがなタイトル「おせろの　れんしゅう」を表示し、viewport 設定(モバイル対応 meta)を入れる。
5. `.github/workflows/deploy.yml`: main push → `app/` で `npm ci && npm run build` → `actions/deploy-pages` で公開。GitHub Pages のソース設定が「GitHub Actions」である前提でよい。
6. `.gitignore` に `app/node_modules` 等が既存パターンで除外されることを確認(必要なら追記)。
7. lint/format は導入しない(スコープ外。必要になったら別タスク)。

## やらないこと(スコープ外)

- オセロのゲームロジック・盤面 UI・問題データ(T002 以降)
- PWA / Service Worker
- ESLint / Prettier の導入
- `tasks/` `CLAUDE.md` `AGENTS.md` `scripts/` の変更

## 受け入れ基準(検証コマンド)

- [ ] `cd app && npm ci && npm run build` が成功する
- [ ] `cd app && npx vitest run` が全件パス
- [ ] `app/vite.config.ts` に `base: '/othello-beginner/'` が設定されている
- [ ] 変更対象ファイルがコミットされ、main に push 済みで、GitHub Actions の deploy ワークフローが成功し、`https://giwarb.github.io/othello-beginner/` でタイトル「おせろの　れんしゅう」が表示される
- [ ] タスク完了時点で、当該タスク由来の差分・未追跡ファイルが `git status --short` に残っていないこと

## フィードバック(やり直し時にオーケストレーターが記入)

(なし)

## 作業ログ(担当エージェントが追記)
