# downloader

MisskeyとTwitterの投稿に含まれるメディアをダウンロードするためのCLIツールです。

## 機能

- Misskeyの投稿に含まれるメディアのダウンロード
- Twitterの投稿に含まれるメディアのダウンロード
- URLの直接入力、またはクリップボード監視による自動ダウンロード
- ダウンロード済みファイルとのハッシュ比較による重複ダウンロード防止
- Misskeyの限定公開投稿のダウンロード（要設定）
- デスクトップ通知による完了通知

## 使い方

### 1. 準備

Node.jsをインストールしてください。

リポジトリをクローンし、依存パッケージをインストールします。


```bash
git clone https://github.com/notoiro/downloader.git
cd downloader
npm install
```

### 2. 実行

#### 通常モード

以下のコマンドで起動します。
起動後、保存先ディレクトリを指定すると、URLの入力待機状態になります。
MisskeyまたはTwitterの投稿URLを入力すると、ダウンロードが開始されます。

```bash
node index.js
```

#### クリップボード監視モード

`-c` または `--clipboard` オプションを付けて起動すると、クリップボードを監視します。
クリップボードにMisskeyまたはTwitterの投稿URLがコピーされると、自動的にダウンロードが開始されます。

```bash
node index.js -c
```

### 補足: Twitterのダウンロードについて

現在の仕様では、Twitterのダウンロードは通常のツイートURL (`https://twitter.com/...`) には対応していません。
[oldtwitter-copy-info.user.js](./resources/oldtwitter-copy-info.user.js ) などのユーザースクリプトを使用して取得できる特殊な形式の文字列をクリップボードにコピーすることで動作します。

## 設定

Misskeyの非公開投稿などをダウンロードしたい場合は、設定ファイルを作成する必要があります。

1.  `config.json5` という名前のファイルをプロジェクトのルートディレクトリに作成します。
2.  以下の内容を参考に、ご自身のMisskeyインスタンスのホスト名とAPIトークンを記述します。

```json5
// config.json5
{
  // あなたのMisskeyインスタンスのホスト名 (例: "misskey.io")
  MISSKEY_HOST: "YOUR_HOST",
  // あなたのMisskey APIトークン
  MISSKEY_TOKEN: "YOUR_TOKEN",
}
```

APIトークンは、Misskeyにログイン後、 `設定 > API` から取得できます。

## ライセンス

[BSD-3-Clause](./LICENSE )
