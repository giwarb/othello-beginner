# T010a 最終レビューレポート

## (a) 重大（done を止めるブロッカー）

1. 「途中終了では加算されない」回帰テストが実際の途中終了経路を検証していない

[practiceMachine.test.ts](C:/Users/yoshi/work/othello-beginner/app/src/practice/practiceMachine.test.ts:276) のテストは、途中状態を作って `phase === 'flipping'` を確認しているだけです。`onHome`、アンマウント、または途中終了を表す処理を一度も呼んでいないため、`record` が呼ばれないのは自明です。

このテストは、たとえば [PracticeScreen.tsx](C:/Users/yoshi/work/othello-beginner/app/src/practice/PracticeScreen.tsx:65) や [GameScreen.tsx](C:/Users/yoshi/work/othello-beginner/app/src/game/GameScreen.tsx:54) の「おわる」処理に誤って加算が追加されても成功します。また、対局画面の途中終了については該当テスト自体がありません。

redo 指示で最低限必要とされた「途中終了では増えない」の加算回数テストを満たしていないため、要件4は未達です。画面操作テスト、または途中終了ハンドラを注入可能な形で抽出した単体テストにより、終了コールバック実行後も各加算関数が0回であることを検証する必要があります。

## (b) 中（次タスクで対応すべき）

なし。

## (c) 軽微（記録のみ）

なし。

## 実装内容の評価

記録加算ロジック自体は妥当です。

- `pressOkAndRecord` は「だいせいこう」への遷移時だけ加算します。
- `pressGameOkAndRecord` と `advanceCpuAndRecord` はプレイヤーOK・CPUタイマー双方の終局経路を処理します。
- 既に終局した状態の再処理では `enteredGameOver` が偽になり、重複加算されません。
- 勝利時だけ `addWin` が呼ばれます。
- 画面側は新しい注入可能な関数を実経路から使用しています。
- Preactの状態更新関数は呼び出し時に同期評価されるため、今回の構成は描画後のeffectやアンマウントに依存しません。
- 変更は指定された6ファイルだけで、スコープ外ファイルの差分はありません。

## 検証状況

- `git log 32a8750..a5a9cff`：対象コミットは `a5a9cff` の1件。
- `git diff --check 32a8750..a5a9cff`：問題なし。
- `git status --short`：空。
- TypeScript検査：`npx tsc -p tsconfig.app.json --pretty false --incremental false` 成功。
- `npx vitest run`：Vite設定読込時に、このread-only環境のプロセス生成制限による `spawn EPERM` でテスト開始前に停止。コード起因のテスト失敗ではありません。
- 公開URLとGitHub Actionsはネットワーク制限により独立確認できませんでした。

## (d) 総合判定

**不合格**

状態遷移と記録加算の実装、および終局・勝敗・再対局・重複防止のテストは概ね適切です。しかし、今回のredoで明示された最低限の回帰ケースである「途中終了では加算されない」が、実際の終了経路を通すテストになっていません。要件4を満たす実効性のあるテストが追加されるまでdoneにはできません。