// MediaItemAPIのURL
var api_url = "https://photoslibrary.googleapis.com/v1/mediaItems"
var accessToken = ''

//認証用各種変数
var tokenurl = "https://accounts.google.com/o/oauth2/token"
var authurl = "https://accounts.google.com/o/oauth2/auth"
var clientid = PropertiesService.getScriptProperties().getProperty('CLIENT_ID');// 作成したclientIdを用いる
var clientsecret = PropertiesService.getScriptProperties().getProperty('CLIENT_SECRET');// 作成したclientsecret
var scope = "https://www.googleapis.com/auth/photoslibrary.readonly"// 利用したいAPIで変更可

//共通定数
//var sheet = SpreadsheetApp.getActive();不採用->これはパラメータ（String,number,number）が SpreadsheetApp.Spreadsheet.getRange のメソッドのシグネチャと一致しませんとエラーになる
var sheet = SpreadsheetApp.getActiveSheet();

var width ='w2048'
var height ='h1024'
var plusop ='=' + width + '-' + height

// googleSpredsheet スクリプトボタンを押した時に呼ぶ関数
function getAlbumInformation() {
  var ui = SpreadsheetApp.getUi()

  //1. 認証の確認
  var service = checkOAuth()
  if (!service.hasAccess()) {
    //認証画面を出力
    var output = HtmlService.createHtmlOutputFromFile('template').setHeight(310).setWidth(500).append(authpage()).setSandboxMode(HtmlService.SandboxMode.IFRAME)
    ui.showModalDialog(output, 'OAuth2.0認証')
  } else {
    //2. 認証されている場合、Albumを取得する
    getAllAlbums() //後ほど記述します。
  }
}

//アクセストークンURLを含んだHTMLを返す関数
function authpage(){
  var service = checkOAuth();
  var authorizationUrl = service.getAuthorizationUrl();
  var html = "<center><b><a href='" + authorizationUrl + "' target='_blank' onclick='closeMe();'>アクセス承認</a></b></center>"
  return html;
}

//認証チェック
function checkOAuth() {
  return OAuth2.createService("PhotosAPI")
    .setAuthorizationBaseUrl(authurl)
    .setTokenUrl(tokenurl)
    .setClientId(clientid)
    .setClientSecret(clientsecret)
    .setCallbackFunction("authCallback")　//認証を受けたら受け取る関数を指定する
    .setPropertyStore(PropertiesService.getScriptProperties())  //スクリプトプロパティに保存する
    .setScope(scope)
    .setParam('login_hint', Session.getActiveUser().getEmail())
    .setParam('access_type', 'offline')
    .setParam('approval_prompt', 'force');
}

//認証コールバック
function authCallback(request) {
  var service = checkOAuth();
  var isAuthorized = service.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput("認証に成功しました。ページを閉じて再度実行ボタンを押してください");
  } else {
    return HtmlService.createHtmlOutput("認証に失敗しました。再度お試しください");
  }
}

//認証が通っている場合呼ばれる関数
function getAllAlbums() {
  // OAuth認証情報を取得
  const service = checkOAuth()
  // Access Tokenを取得
  accessToken = service.getAccessToken()

  // //1. アルバム一覧を取得する
  // var rawAlbums = getAlbums()
  // if (!rawAlbums) {
  //   return Browser.msgBox('アルバムの取得に失敗しました')
  // }

  // //2.アルバムを二元配列に変換する
  // var classAlbums = rawAlbums.map(function(e) {
  //   // e['title']でアルバムの名前を取得できる
  //   return [e['title']]
  // })

  // 2-1.画像URL一覧を取得する
  var rawPhotoUrlList = getPhotoUrl()
  if (!rawPhotoUrlList) {
    return Browser.msgBox('画像取得に失敗しました')
  }

  //2-2.画像URLを二元配列に変換する
  var classPhotoURLList = rawPhotoUrlList.map(function(e) {
    return [e['baseUrl'] + plusop]
  })

 　// 2-3.画像URLの中から１つだけの画像にランダムで設定する。一覧を取得する
  //var classPhotoRandom = getPhotoRandom(classPhotoURLList)
  var classPhotoRandom = classPhotoURLList[Math.floor(Math.random()*classPhotoURLList.length)]
  
  if (!classPhotoRandom) {
    return Browser.msgBox('画像１つだけ取得失敗しました')
  }

  //4.セルに書き出す
// sheet.getRange(1, 1, classAlbums.length).setValues(classAlbums)
 sheet.getRange(1, 2).setValue(classPhotoRandom)

}

//アルバム一覧を取得する
function getAlbums(){  
  //defalutで20件しか取得できないのでparamaterを設定して50件取得する
  var response = UrlFetchApp.fetch(baseUrl + '?pageSize=50', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + accessToken
    },
    contentType: "application/json",
    muteHttpExceptions: true
  });
  var responseCode = response.getResponseCode()
  // 50件しか取得できない
  if (responseCode === 200) {
    var result = JSON.parse(response.getContentText())
    return result['albums']
  } else {
    return null
  }  
}

//MediaItemsから共有アルバムIDを取得し、画像URLを取得する
function getPhotoUrl(){  
  //defalutで20件しか取得できないのでparamaterを設定して50件取得する
  var response = UrlFetchApp.fetch(api_url + '?pageSize=50', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + accessToken
    },
    contentType: "application/json",
    muteHttpExceptions: true
  });
  
  var responseCode = response.getResponseCode()
  // 50件しか取得できない
  if (responseCode === 200) {
    var result = JSON.parse(response.getContentText())
    return result['mediaItems']
  } else {
    return null
  }  
}