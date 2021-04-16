// MediaItemAPIのURL
var api_url = "https://photoslibrary.googleapis.com/v1/mediaItems";
api_Albums_url ="https://photoslibrary.googleapis.com/v1/mediaItems:search"
var accessToken = '';

//認証用各種変数
var tokenurl = "https://accounts.google.com/o/oauth2/token";
var authurl = "https://accounts.google.com/o/oauth2/auth";
var clientid = PropertiesService.getScriptProperties().getProperty('CLIENT_ID');// 作成したclientIdを用いる
var clientsecret = PropertiesService.getScriptProperties().getProperty('CLIENT_SECRET');// 作成したclientsecret
var scope = "https://www.googleapis.com/auth/photoslibrary.sharing";// 利用したいAPIで変更可

//共通定数
//var sheet = SpreadsheetApp.getActive();不採用->これはパラメータ（String,number,number）が SpreadsheetApp.Spreadsheet.getRange のメソッドのシグネチャと一致しませんとエラーになる
var sheet = SpreadsheetApp.getActiveSheet();

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
    getAllAlbums() 
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

  // test アルバムID取得
  // getAlbumId();

  // 1.共有アルバムIDリストを取得する
  var rawPhotoAlbumsUrlList = getAlbumsIdList()
  if (!rawPhotoAlbumsUrlList) {
    return Browser.msgBox('アルバム画像取得に失敗しました')
  }
  // 共有アルバムIDリストをもとに画像URLリスト取得する
  var rawPhotoUrlList = getPhotoUrlList(rawPhotoAlbumsUrlList)

  // 3.画像URLの中から１つだけの画像にランダムで設定する。一覧を取得する
  var classPhotoRandom = rawPhotoUrlList[Math.floor(Math.random()*rawPhotoUrlList.length)]
  
  if (!classPhotoRandom) {
    return Browser.msgBox('画像１つだけ取得失敗しました')
  }

  // 4.Line送信する
　pushmessage_image(classPhotoRandom)

  //4.セルに書き出す
  //sheet.getRange(1, 1,rawPhotoUrlList.length).setValues(rawPhotoUrlList)
  sheet.getRange(1, 1,rawPhotoUrlList.length).setValue(rawPhotoUrlList)

}

// アルバムID一覧取得し、logに出す
function getAlbumId(){  
  //defalutで20件しか取得できないのでparamaterを設定して50件取得する
  const response = UrlFetchApp.fetch('https://photoslibrary.googleapis.com/v1/albums' + '?pageSize=50', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + accessToken
    },
    contentType: "application/json",
    muteHttpExceptions: true
  });
  
  const responseCode = response.getResponseCode()
  // 50件しか取得できない
  if (responseCode === 200) {
    const result = JSON.parse(response.getContentText())
    Logger.log(result['albums']);

    return result['albums']
  } else {
    return null
  }  
}

/**
 * 共有可能なフォルダ一覧を取得し、該当のyyyymmの共有フォルダIDをリスト取得
 * @return albumsIdList
 */
function getAlbumsIdList(){  
  //defalutで20件しか取得できないのでparamaterを設定して50件取得する
  let response = UrlFetchApp.fetch('https://photoslibrary.googleapis.com/v1/albums/' + '?pageSize=50', {
    method: 'Get',
    headers: {
      Authorization: 'Bearer ' + accessToken
    },
    contentType: "application/json",
    "pageSize":"100",
    muteHttpExceptions: true
  });
  
  let responseCode = response.getResponseCode()
  if (responseCode !== 200) return null;

  let result = JSON.parse(response.getContentText())
  let albumsIdList =[];
    for(var i=0; i<result['albums'].length; i++){
      if('6' ==result['albums'][i]['title'].length){
        albumsIdList.push(result['albums'][i]['title']);
      } 
    }
  return albumsIdList ;   
}

//MediaItemsから画像URLを取得する
function getPhotoUrl(){  
  //defalutで20件しか取得できないのでparamaterを設定して50件取得する
  const response = UrlFetchApp.fetch(api_url + '?pageSize=50', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + accessToken
    },
    contentType: "application/json",
    "pageSize":"100",
    muteHttpExceptions: true
  });
  
  const responseCode = response.getResponseCode()
  // 50件しか取得できない
  if (responseCode === 200) {
    const result = JSON.parse(response.getContentText())
    return result['mediaItems']
  } else {
    return null
  }  
}

//LINEBOTでメッセージを送るサンプル
function pushmessage_test(classPhotoRandom) {
  const url = 'https://api.line.me/v2/bot/message/push';
  const lineGroupID = PropertiesService.getScriptProperties().getProperty('LINE_GROUP_ID');//LINE_GROUP_ID
  const linebotAccessToken = PropertiesService.getScriptProperties().getProperty('LINEBOT_ACCESS_TOKEN');
  var body = 'グループにメッセージ';

  UrlFetchApp.fetch(url, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + linebotAccessToken,
    },
    'method': 'POST',
    'payload': JSON.stringify({
      'to': lineGroupID,
      'messages':[{
        'type': 'text',
        'text': body ,
      }]
     })
   })
}
//LINEBOTで画像メッセージを送る
function pushmessage_image(classPhotoRandom) {
  const rawMainPhotoURL =classPhotoRandom + '=w1024-h1024';
  const rawpreviewImageUrl =classPhotoRandom + '=w240-h240';
  const linebotAccessToken = PropertiesService.getScriptProperties().getProperty('LINEBOT_ACCESS_TOKEN');
  const lineGroupID = PropertiesService.getScriptProperties().getProperty('LINE_GROUP_ID');

  //画像メッセージを送る
  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    'headers': {
      "Content-Type": "application/json; charset=UTF-8",
      'Authorization': 'Bearer ' + linebotAccessToken,
    },
    'method': 'POST',
    'payload': JSON.stringify({
      'to': lineGroupID, //LINEユーザID
      'messages': [{
        'type': 'image',
        'originalContentUrl': rawMainPhotoURL,
        'previewImageUrl': rawpreviewImageUrl
      }],
      'notificationDisabled': true // trueだとユーザーに通知しない
    }),
  });
}

/**
* 共有フォルダIDを元に画像URLリストを取得する
* @param albumsIdList
* @return photoUrlList
*/
function getPhotoUrlList(albumsIdList){
  let photoUrlList = [];
   for(var i=0; i<albumsIdList.length; i++){
    let response = UrlFetchApp.fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + accessToken
        },
        contentType: "application/json",
        "pageSize":"100",
        "albumId":albumsIdList[i],
          muteHttpExceptions: true
        });

    let responseCode = response.getResponseCode()
    if (responseCode !== 200) return null;
    let result = JSON.parse(response.getContentText())
       for(var j=0; j<result['mediaItems'].length; j++){
       // フォルダの中からUrlを取得し返却する
       photoUrlList.push(result['mediaItems'][j]['baseUrl']) 
       }
    }
  return photoUrlList;
}