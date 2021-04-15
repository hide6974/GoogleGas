//スプレッドシートを開いた時に呼ばれる関数
function onOpen() {
  SpreadsheetApp
  .getUi()
  .createMenu('スクリプト')
  .addItem('アルバム一覧を取得', 'getAlbumInformation')
  .addItem('認証のリセット', 'reset')
  .addToUi()
}