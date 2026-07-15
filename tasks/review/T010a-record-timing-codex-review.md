# T010a 最終レビューレポート

## (a) 重大（done を止めるブロッカー）

### 1. 要件4の「加算回数の回帰テスト」を満たしていない

追加されたテストは、`enteredGreatSuccess()`／`enteredGameOver()` が状態遷移を判定できることだけを確認しています。

- [practiceMachine.test.ts](C:/Users/yoshi/work/othello-beginner/app/src/practice/practiceMachine.test.ts:221)
- [gameMachine.test.ts](C:/Users/yoshi/work/othello-beginner/app/src/game/gameMachine.test.ts:123)

実際に記録を加算する処理は画面側にあります。

- [PracticeScreen.tsx](C:/Users/yoshi/work/othello-beginner/app/src/practice/PracticeScreen.tsx:37)
- [GameScreen.tsx](C:/Users/yoshi/work/othello-beginner/app/src/game/GameScreen.tsx:18)

しかし、テストでは `addGreatSuccess()`、`addCompleted()`、`addWin()` の呼び出し回数や、記録値の増分を一切検証していません。そのため、例えば以下の回帰が起きても追加された全テストが通ります。

- `PracticeScreen` から `addGreatSuccess()` を削除する
- `recordGameResult()` の呼び出しをプレイヤー終局経路またはCPU終局経路から削除する
- `addCompleted()`／`addWin()` を重複呼び出しする
- 「もういちど」後の2局目だけ加算されなくなる

これは要件4「加算回数の回帰テストを追加する」と、受け入れ基準「加算回数テストを含む」を直接満たしていません。

状態遷移と記録加算をまとめた処理を、記録関数またはストレージを注入できる形でテスト可能にし、少なくとも次を自動テストする必要があります。

- だいせいこう遷移で `greatSuccess` がちょうど1増える
- 通常成功・途中終了では増えない
- 終局で `completed` がちょうど1増える
- 勝利時だけ `wins` がちょうど1増える
- 同じ終局状態の再処理では重複加算されない
- 再対局の終局ではもう一度加算される
- プレイヤー手番起因とCPU手番起因の両終局経路を検証する

## (b) 中（次タスクで対応すべき）

なし。

## (c) 軽微（記録のみ）

なし。

## 実装内容の評価

コード上の加算タイミング変更そのものは妥当です。

- 練習では、`pressOk()` が「だいせいこう」結果を生成した更新内で同期的に加算しています。
- 対局では、プレイヤー操作による終局とCPU処理による終局の両方で `recordGameResult()` を呼んでいます。
- `previous.phase !== 'gameOver'` の判定により、同一局の重複加算を防止しています。
- 「おわる」は記録処理を通らないため途中終了では加算されません。
- 「もういちど」は新しいゲーム状態へ戻るため、次の終局でも再度加算されます。
- 差分は指定された6ファイルだけで、スコープ外変更および `git diff --check` の問題はありません。

検証について、レビュー環境で `npx vitest run` を試行しましたが、サンドボックスのプロセス生成制限による `spawn EPERM` で起動できませんでした。これはテスト失敗ではなくレビュー環境上の制約です。read-only規律のため、成果物を生成する `npm run build` は再実行していません。コミットの作業ログには122テスト成功、build成功、デプロイ成功が記録されています。

## (d) 総合判定

**不合格**

実装本体は目的に沿っており、確認した範囲では加算漏れ・二重加算につながる明確なコード不具合はありません。しかし、タスクが明示的に要求する「加算回数の回帰テスト」がなく、今回変更した画面側の記録処理がテストで保護されていません。必須の受け入れ基準未達であるため、done を止めるブロッカーと判定します。