---
id: T011
title: 文言修正(えっくす　うち / あいての　うてる　ばしょ)
status: done
assignee: implementer
attempts: 0
---

# T011: 文言修正(えっくす　うち / あいての　うてる　ばしょ)

## 目的

ユーザー指示(2026-07-15)による文言変更2件を反映する。

## 背景・コンテキスト

- 現在、avoid-x カテゴリのお題は「ばつの　ばしょは　やめよう」(ホームのボタンと問題中のお題プロンプトの両方)。min-mobility のホームボタンは「うてる　ばしょを　へらそう」。
- 文言の定義箇所: `app/src/practice/practiceMachine.ts`(お題プロンプト)、`app/src/home/HomeScreen.tsx`(ボタンラベル)。テストにも期待値として文言が入っている。

## 変更対象

- `app/src/practice/practiceMachine.ts` — avoid-x のお題プロンプト
- `app/src/home/HomeScreen.tsx` — avoid-x / min-mobility のボタンラベル
- 上記文言を期待値に持つテストファイル

## 要件

1. avoid-x のお題・ボタンラベル「ばつの　ばしょは　やめよう」を **「えっくす　うちは　やめよう」** に変更する(ホームボタン・問題中のお題プロンプトの両方。分かち書きは全角スペースで既存表記に合わせる)。
2. min-mobility のホームボタンラベル「うてる　ばしょを　へらそう」を **「あいての　うてる　ばしょを　へらそう」** に変更する(問題中のお題プロンプト「あいてが　うてる　ばしょが　すくなくなる　ところに　うとう」は変更しない)。
3. avoid-x のヒント「すみの　ななめよこは　あぶないよ」等、その他の文言は変更しない。
4. 文言変更に伴うテスト期待値の修正はテストの意図を保って行う。

## やらないこと(スコープ外)

- 上記以外の文言・機能の変更
- `tasks/` `CLAUDE.md` `AGENTS.md` `scripts/` の変更

## 受け入れ基準(検証コマンド)

- [ ] `cd app && npx vitest run` が全件パス
- [ ] `cd app && npm run build` が成功する
- [ ] 変更がコミット・push され、デプロイ成功後、公開URLで: ホームに「えっくす　うちは　やめよう」「あいての　うてる　ばしょを　へらそう」が表示され、avoid-x の問題中のお題も「えっくす　うちは　やめよう」になっている
- [ ] リポジトリ内(app/src)に旧文言「ばつの　ばしょは　やめよう」が残っていない(grep で確認)
- [ ] タスク完了時点で、当該タスク由来の差分・未追跡ファイルが `git status --short` に残っていないこと

## フィードバック(やり直し時にオーケストレーターが記入)

(なし)

## 作業ログ(担当エージェントが追記)

- 2026-07-15 implementer: 文言変更を実施。
  - 変更ファイル: `app/src/practice/practiceMachine.ts`(avoid-x お題プロンプト)、`app/src/home/HomeScreen.tsx`(avoid-x / min-mobility ボタンラベル)、`app/src/practice/practiceMachine.test.ts`(avoid-x プロンプト期待値)。
  - 内容: 「ばつの　ばしょは　やめよう」→「えっくす　うちは　やめよう」(お題・ボタン両方)、「うてる　ばしょを　へらそう」→「あいての　うてる　ばしょを　へらそう」(ホームボタンのみ)。min-mobility のお題プロンプトは変更なし。
  - 実行コマンドと結果:
    - `cd app && npx vitest run` → 13 test files / 129 tests すべてパス。
    - `cd app && npm run build` → 成功(`dist/` 生成)。
    - `grep -rn "ばつの　ばしょは　やめよう\|うてる　ばしょを　へらそう" app/src` → マッチなし(旧文言は残存しない)。
  - コミット: `cd8e7dba91dd28f342526edc353baa674771fe8d`(`app: 文言修正(えっくす うち / あいての うてる ばしょ) (T011)`)。`git push` 実行し、GitHub Actions Run 29388671008(Deploy to GitHub Pages)が成功したことを `gh run watch` で確認。
  - 公開URL確認: https://giwarb.github.io/othello-beginner/ にてブラウザ操作。ホーム画面のボタンラベルが「えっくす　うちは　やめよう」「あいての　うてる　ばしょを　へらそう」であることを確認。avoid-x ボタンをクリックし、問題中のお題プロンプトが「えっくす　うちは　やめよう」と表示されることを確認。
  - タスク完了時点で `git status --short` に差分・未追跡ファイルなし(クリーン)。
