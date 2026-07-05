# Number Ball Run

数字ボールを左右にドラッグして操作し、同じ数字のボールと合体しながらゴールを目指す 3D ブラウザランゲームです。スマートフォン縦画面とタブレット操作を優先した MVP です。

## 使用技術

- Vite
- React
- TypeScript
- Three.js
- React Three Fiber
- drei
- CSS
- npm

## 作業ディレクトリ

```bash
D:\Codex\number_ball_run
```

## セットアップ

```bash
npm install
```

## 開発サーバー

```bash
npm run dev
```

標準では Vite が表示する localhost URL をブラウザで開きます。GitHub Pages 用に `base: '/number_ball_run/'` を設定しているため、ローカルで直接確認する場合は `/number_ball_run/` 付きの URL でも確認できます。

## 本番ビルド

```bash
npm run build
npm run preview
```

型チェックのみ:

```bash
npm run typecheck
```

lint:

```bash
npm run lint
```

## 操作方法

- スマートフォン/タブレット: 画面のどこでも左右にドラッグ
- PC: マウス左右ドラッグ、または `A`/`D`、左右キー
- 同じ数字のボールに触れると合体して数字が 2 倍になります
- 異なる数字や障害物に触れると弾かれ、短時間だけ減速します
- コース端や穴に落ちるとゲームオーバーです

## ディレクトリ構成

```text
src/
  components/
    game/        3Dシーン、プレイヤー、コース、障害物、ゴール、カメラ
    ui/          HUD、ポーズ、結果画面
  config/        ゲーム定数、数字ごとの色・サイズ
  data/          ステージデータ
  hooks/         入力制御
  types/         型定義
  utils/         LocalStorage、フィードバック、コース判定
```

## ステージデータの編集

`src/data/stageOne.ts` を編集します。

- `track`: コース区間。`zStart`/`zEnd`、幅、左右カーブ用の中心位置を設定します
- `balls`: 配置ボール。`value`、`x`、`z` を設定します
- `obstacles`: 障害物。位置とサイズを設定します
- `gaps`: 落下判定のある穴。位置とサイズを設定します

## 数字ごとの色やサイズの変更

`src/config/numberConfig.ts` の `NUMBER_STYLES` を編集します。

- `color`: ボール色
- `emissive`: 発光色
- `textColor`: 数字の色
- `radius`: ボール半径
- `glow`: 発光強度

## GitHub Pages

このプロジェクトはリポジトリ名 `number_ball_run` を想定しています。`vite.config.ts` の `base` は以下です。

```ts
base: '/number_ball_run/'
```

リポジトリ名を変更した場合は、`base` を `/<repository-name>/` に変更してください。

公開 URL の想定:

```text
https://<github-user>.github.io/number_ball_run/
```

## GitHub Pages の有効化手順

1. GitHub に `number_ball_run` リポジトリを作成
2. ローカルリポジトリに remote を追加
3. `main` ブランチへ push
4. GitHub の Settings > Pages を開く
5. Source を `GitHub Actions` に設定

## GitHub Actions によるデプロイ

`.github/workflows/deploy.yml` が `main` ブランチへの push で実行されます。

処理内容:

- `npm ci`
- `npm run typecheck`
- `npm run build`
- `dist` を GitHub Pages にデプロイ

## LocalStorage

以下を保存します。

- 最高到達数字
- ベストクリアタイム
- 操作説明を確認済みかどうか
- サウンド設定

LocalStorage が使えない環境でもゲーム本体は動作します。
