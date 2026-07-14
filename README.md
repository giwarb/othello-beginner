# othello-beginner

オセロ初心者(幼児を想定)向けの学習アプリ。

## ゴール

1. **ルールをちゃんと覚えられる** — 石を挟むと裏返る、置ける場所(合法手)、パス、終局と石数勝負を、文字に頼らず遊びながら理解できる
2. **1局を最後までプレイしきれる** — 途中で詰まらない・飽きない UI/UX で、最低限ゲームを完走できる

「勝つための強さ」は目的ではない(強いオセロ学習アプリは姉妹リポジトリ [othello-trainer](https://github.com/giwarb/othello-trainer) を参照)。

## 状態

設計フェーズ。技術スタック・設計書は未確定(`tasks/STATUS.md` 参照)。

## 開発体制

Claude Code(オーケストレーター)+ サブエージェント + Codex CLI ワーカーによるマルチエージェント開発。

- `CLAUDE.md` — オーケストレーターの運用ルール
- `AGENTS.md` — Codex ワーカー向けガイド
- `.claude/agents/` — サブエージェント定義(explorer / implementer / verifier)
- `scripts/codex-*.ps1|sh` — Codex CLI への委譲ラッパー(実装 / 設計コンサル / 最終レビュー)
- `tasks/` — タスク仕様と進捗ボード(`tasks/STATUS.md`)

## 開発コマンド

アプリ本体は `app/` にある(Vite + Preact + TypeScript)。

```sh
cd app

npm install       # 依存関係のインストール
npm run dev       # 開発サーバー起動
npm run build     # 本番ビルド(dist/ に出力)
npm run test      # Vitest でテスト実行
```

main ブランチへの push で GitHub Actions が `app/` をビルドし、GitHub Pages(https://giwarb.github.io/othello-beginner/)に自動デプロイする。
