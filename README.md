# 漢字作り遊び

![創作漢字「歴ソファー」の見出し画像](og-image.png)

まだ存在しない概念を、創作漢字一字で表すブラウザゲームです。ひとりで作るモードと、1台の端末を順番に回す対戦モードがあります。

## ローカルで確認する

追加のビルド処理は不要です。リポジトリのルートで簡易HTTPサーバーを起動してください。

Pythonの場合:

```sh
python -m http.server 8000
```

起動後、ブラウザで `http://localhost:8000/` を開きます。

## お題を編集する

お題は `topics.js` の `topics` 配列で管理しています。文字列を追加・削除して保存するだけで反映されます。

## GitHub Pagesで公開する

1. GitHubでリポジトリの `Settings` を開きます。
2. 左メニューの `Pages` を開きます。
3. `Build and deployment` の `Source` で `Deploy from a branch` を選びます。
4. `Branch` で `main`、フォルダーで `/(root)` を選び、`Save` を押します。
5. 公開処理の完了後、`https://monon10.github.io/kanji-making-game/` にアクセスします。

GitHub Actionsや追加のビルド設定は不要です。

## 権利表記

Copyright © 2026 monon10. All rights reserved.
