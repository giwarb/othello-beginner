---
id: T001
title: アプリ scaffold(Vite + Preact + TS + Vitest + GitHub Pages デプロイ)
status: done
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

### 2026-07-15 07:34 implementer

実施内容:
- `app/` に `npm create vite@latest app -- --template preact-ts` で Vite + Preact + TS プロジェクトを新規作成。
- デモ用の装飾(`app.css` / `src/assets/*` / `public/icons.svg`)を削除し、`src/app.tsx` をプレースホルダ(タイトル「おせろの　れんしゅう」を表示するのみ)に置き換え。`src/index.css` も最小化。
- `index.html` の `lang` を `ja`、`title` を「おせろの　れんしゅう」に変更(viewport meta はテンプレート由来のものをそのまま使用)。
- `vite.config.ts` に `base: '/othello-beginner/'` を追加。
- `npm install -D vitest` でVitestを導入し、`src/sample.test.ts` にダミーテストを追加。`package.json` に `"test": "vitest run"` スクリプトを追加。
- `.github/workflows/deploy.yml` を新規作成(main push → `app/` で `npm ci && npm run build` → `actions/configure-pages` + `actions/upload-pages-artifact` + `actions/deploy-pages`)。
- `README.md` に「開発コマンド」セクションを追記(dev/build/test)。
- `.gitignore`: ルートに既存の `node_modules/` `dist/` パターンで `app/node_modules` `app/dist` は除外済みと確認(追記不要。`git check-ignore -v app/node_modules app/dist` で確認、実際には vite 生成の `app/.gitignore` がマッチ)。
- GitHub Pages のソース設定が未構成だったため、`gh api -X POST repos/giwarb/othello-beginner/pages -f build_type=workflow` で「GitHub Actions」ソースを有効化(実行結果: `"build_type":"workflow"` で成功)。

実行コマンドと結果:
- `cd app && npx vitest run` → `Test Files 1 passed (1)` / `Tests 1 passed (1)`
- `cd app && npm ci` → 成功(147 packages installed)
- `cd app && npm run build` → 成功(`tsc -b && vite build`、`dist/index.html` 等を生成)
- `dist/index.html` を確認し、`base: '/othello-beginner/'` によりアセットパスが `/othello-beginner/assets/...` になっていることを確認。
- `git status --short` (作業ツリー、ステージ前) → `app/` `.github/` が未追跡、`README.md` が変更。
- `git add app .github/workflows/deploy.yml README.md`(明示パス指定、`git add -A`/`.` は不使用)
- `git commit` → コミットハッシュ `7619d4ced745f91fb055fcd596ae81bcfe01aec5`
- `git push origin main` → `06900cf..7619d4c main -> main`
- `gh run watch 29373323013 --exit-status` → `build` `deploy` ともに ✓ (成功。Node.js 20 非推奨の警告のみ、エラーなし)
- ブラウザで `https://giwarb.github.io/othello-beginner/` を確認 → ページタイトルおよび本文に「おせろの　れんしゅう」が表示されることを確認(`get_page_text` で取得)。
- `git status --short` (最終確認) → 出力なし(クリーン)。

コミットハッシュ: `7619d4ced745f91fb055fcd596ae81bcfe01aec5`

仕様どおりにできなかった点: なし。
