---
id: T007
title: ホーム画面・モード/カテゴリ選択・ヒント設定(初期スコープ仕上げ)
status: review
assignee: implementer
attempts: 0
---

# T007: ホーム画面・モード/カテゴリ選択・ヒント設定(初期スコープ仕上げ)

## 目的

設計書 §6 のホーム画面を実装し、モードA/モードB(カテゴリ別)を選んで練習を始められるようにする。あわせて §2.1 の「ヒントあり」設定(合法手ハイライト)を入れる。これで初期スコープ(設計書 §1〜§6)が完成する。

## 背景・コンテキスト

- 設計書 `othello-beginner-design.md` §6(画面構成)・§2.1(ヒント既定オフ・設定で切替)・§1(幼児向け方針: 全ひらがな・タップのみ・大きな操作対象)。
- 現在のアプリは起動直後に PracticeScreen が開き、モードA(難度1→2→3)→モードB全カテゴリ混合を直列に流す暫定配線(T006)。
- 問題プール: `app/src/puzzles/generated.ts`(rule 難度別30問+strategy カテゴリ別90問)+`samplePuzzles.ts`。
- 状態機械は placing で合法手集合を公開済み(T004)。Board はハイライト表示に対応済み(T003)。

## 変更対象

- `app/src/home/HomeScreen.tsx`(+CSS) — ホーム画面(新規)
- `app/src/app.tsx` — ホーム⇔練習画面の切替(ルーティングライブラリ不要、状態での切替でよい)
- `app/src/practice/PracticeScreen.tsx` / `practiceMachine.ts` — 選択されたモード/カテゴリの問題プールだけで出題する対応、ヒント表示対応、ホームに戻るボタン
- 設定の保持(localStorage。キー名は実装者裁量)
- 関連テスト

## 要件

1. **ホーム画面**: 大きなボタンで以下を選べる(全ひらがな・アイコン/絵文字併用可):
   - 「おいて　ひっくりかえす」(モードA。難度1→2→3の順で出題、現行ロジック流用)
   - 「すみを　とろう」(モードB corner のみ)
   - 「ばつの　ばしょは　やめよう」(モードB avoid-x のみ)
   - 「うてる　ばしょを　へらそう」(モードB min-mobility のみ。ボタンラベルは短くてよいが、問題中のお題文言は既存のまま)
2. 選んだモード/カテゴリの問題プールのみからシャッフル出題(既存のシャッフル・非連続ロジックを流用)。プールを一巡したら再シャッフルして継続。
3. **ヒント設定**: ホーム画面に「ヒント」トグル(「ひんと　あり／なし」)。既定オフ。オンのとき、placing 段階で置ける場所(モードAは合法手、モードBは answers)を Board のハイライトで表示する。設定は localStorage に保存し次回起動時も維持。
4. **ホームに戻る**: 練習画面に「おわる」(または家アイコン)ボタン。タップでホームへ(確認ダイアログ不要)。
5. 練習画面のモード/カテゴリ表示は既存のお題表示で足りる(モードAは従来どおり)。
6. 全文言ひらがな・分かち書き(「OK」のみ例外)。タップ領域は大きく。スマホ縦/タブレット横両対応。
7. 既存テストを壊さない。プール選択ロジック(モード/カテゴリ→問題集合)とヒント集合(モードA=合法手/モードB=answers)のユニットテストを追加。

## やらないこと(スコープ外)

- 将来モード(1局とおしプレイ・スタンプ帳)
- 効果音・凝った演出
- 難度選択 UI(モードAは自動進行のまま)
- `tasks/` `CLAUDE.md` `AGENTS.md` `scripts/` の変更

## 受け入れ基準(検証コマンド)

- [ ] `cd app && npx vitest run` が全件パス(プール選択・ヒント集合のテストを含む)
- [ ] `cd app && npm run build` が成功する
- [ ] 変更がコミット・push され、GitHub Actions のデプロイ成功後、公開URLで: (a) ホームから4種の練習を選べる、(b) 選んだカテゴリのお題だけが出る(例: 「すみを　とろう」を選ぶと corner 問題のみ)、(c) ヒントオンで置ける場所がハイライトされる、(d) ヒント設定がリロード後も維持される、(e) 「おわる」でホームに戻れる、を確認(操作記録を作業ログに残す)
- [ ] スマホ縦(375px)とタブレット横(1024px)でホーム・練習画面が崩れない
- [ ] 表示文言にカタカナ・漢字・算用数字が含まれない(「OK」のみ例外。ミス回数の数字は現状どおり可)
- [ ] タスク完了時点で、当該タスク由来の差分・未追跡ファイルが `git status --short` に残っていないこと

## フィードバック(やり直し時にオーケストレーターが記入)

(なし)

## 作業ログ(担当エージェントが追記)

### 2026-07-15 implementer

- 実施内容:
  - `app/src/home/HomeScreen.tsx` + `HomeScreen.css`(新規): 4種の練習ボタン(おいて　ひっくりかえす/すみを　とろう/ばつの　ばしょは　やめよう/うてる　ばしょを　へらそう)とヒントトグル(「ひんと　あり／なし」)を実装。
  - `app/src/home/hintSettings.ts` + `hintSettings.test.ts`(新規): ヒント設定の localStorage 読み書き(キー `othello-beginner:hint-enabled`)。ストレージ未使用環境(Vitest node環境)でも安全に動くようガード。
  - `app/src/app.tsx`: ホーム⇔練習画面を状態(useState)で切替。ヒント設定を App で保持し両画面に受け渡し。
  - `app/src/practice/practiceMachine.ts`: `PracticeSelection` 型、`poolForSelection`(選択モード/カテゴリだけを対象にシャッフルしたプールを作る。ルールは既存の難度順シャッフルを再利用)、`hintPositions`(placing 段階でのみ、モードAは合法手・モードBは answers を返す)を追加。既存 `shuffledPracticePuzzles` は内部ヘルパー `shuffledRulePuzzles` を切り出して再利用する形にリファクタ(挙動は変更なし、既存テスト影響なし)。
  - `app/src/practice/PracticeScreen.tsx`: `selection`/`hintEnabled`/`onHome` props を受け取るよう変更。ヘッダーに「おわる」ボタンを追加。ヒント有効時は `hintPositions` の結果を Board の highlights に渡す。プールを一巡したら `poolForSelection` で再シャッフルして継続するロジックを実装(useRef でプールを保持)。
  - `app/src/practice/PracticeScreen.css`: ヘッダー行・「おわる」ボタンのスタイルを追加。
  - `app/src/practice/practiceMachine.test.ts`: `poolForSelection`(ルール選択/カテゴリ選択/シャッフル確認)と `hintPositions`(モードA=合法手・モードB=answers・placing以外は空)のユニットテストを追加。

- 実行コマンドと結果:
  - `cd app && npx vitest run` → 10ファイル・90テスト全件パス。
  - `cd app && npm run build` → 成功(`tsc -b && vite build`、dist生成確認)。

- ローカル動作確認(vite dev、`.claude/launch.json` を一時作成し確認後に削除済み):
  - ホームでヒントをオンにしてから「すみを　とろう」を選択 → corner カテゴリの問題が出題され、置ける場所(隅)がハイライト表示されることを確認。
  - ヒント設定は localStorage(`othello-beginner:hint-enabled`)に保存され、ホーム⇔練習画面の往復・ページ再読み込み後も維持されることを確認。
  - 「おわる」ボタンでホームへ戻れること、戻った後も選んだカテゴリ・モード表示が正しいことを確認。
  - 375x812(スマホ縦)・1024x768(タブレット横)でホーム画面・練習画面ともに横スクロール(overflow-x)が発生しないことを `document.documentElement.scrollWidth` で確認。

- コミット・デプロイ:
  - コミット: `6a2b089185afc28112dba51b3b5f08124d8d2104`(「app: ホーム画面・モード/カテゴリ選択・ヒント設定を追加(T007)」)。`git add` は変更対象ファイルを個別指定(`git add -A`/`.` は使用せず)。
  - `git push origin main` → 成功。GitHub Actions「Deploy to GitHub Pages」(run 29381226087)が成功(build/deployとも成功)。
  - 公開URL https://giwarb.github.io/othello-beginner/ で受け入れ基準 (a)〜(e) を確認:
    - (a) ホームから4種の練習ボタンが表示され選択できる。
    - (b) 「すみを　とろう」選択で corner カテゴリの問題のみ出題(お題文言・ハイライト位置=隅で確認)。
    - (c) ヒントオンで置ける場所(隅)がハイライト表示される(`.cell-highlight` の位置を DOM から確認)。
    - (d) ヒント設定がページ再読み込み後も「ひんと　あり」のまま維持される。
    - (e) 「おわる」ボタンでホーム画面に戻れる。
    - レスポンシブ: 375x812・1024x768 双方でホーム(1カラム/2カラムグリッド)・練習画面とも横スクロールなしを確認。
  - 作業完了時点の `git status --short` はクリーン(このタスク由来の未追跡・未コミット差分なし)。一時作成した `.claude/launch.json` は動作確認後に削除済み。

- 仕様どおりにできなかった点: なし。
