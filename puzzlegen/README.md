# puzzlegen

ランダム合法手どうしの自己対戦から、ルール練習と考える練習の局面を生成します。考える練習の採否には、アプリ本体の `validateStrategy` をそのまま使用します。

```powershell
cd app
npm run puzzlegen
```

乱数シードは `20260715` です。同じソースと Node.js では `app/src/puzzles/generated.ts` を再現できます。実行後、難度・カテゴリごとの候補数、採用数、およびルール問題の空きマス帯別件数が表示されます。
