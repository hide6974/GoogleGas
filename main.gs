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

  // 1.画像URL一覧を取得する
  var rawPhotoUrlList = getPhotoUrl()
  if (!rawPhotoUrlList) {
    return Browser.msgBox('画像取得に失敗しました')
  }

  //2.画像URLを二元配列に変換、URL後ろにオプション=w2028-h1024add
  var classPhotoURLList = rawPhotoUrlList.map(function(e) {
    return [e['baseUrl'] + '=' + width + '-' + height]
  })

  // 2-3.画像URLの中から１つだけの画像にランダムで設定する。一覧を取得する
  var classPhotoRandom = classPhotoURLList[Math.floor(Math.random()*classPhotoURLList.length)]
  
  if (!classPhotoRandom) {
    return Browser.msgBox('画像１つだけ取得失敗しました')
  }

  //4.セルに書き出す
  sheet.getRange(1, 1).setValue(classPhotoRandom)
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

function setVal(){
//スクリプトプロパティで「TEST」キーに値を格納する
PropertiesService.getScriptProperties().setProperty("LINE_TOKEN", "zXFQK11RXi6ejbg2Tacp7D5wjSd9k3GK1d6z6CCKcPu");
//スクリプトプロパティを取得する
Logger.log(PropertiesService.getScriptProperties().getProperty("LINE_TOKEN"));
}


/**
* LINE送信メイン処理
*/
function sendTodaySchedule() {
  var accessToken = PropertiesService.getScriptProperties().getProperty('LINE_TOKEN');
  // 引数により取得する日付を変えられるようにしたいので、
  // 今日から何日後かを渡すようにします。
  var message = getMessage(0);
  var options =
   {
     'method'  : 'post'
    ,'payload' : 'message=' + message
    ,'headers' : {'Authorization' : 'Bearer '+ accessToken}
    ,muteHttpExceptions:true
   };
  UrlFetchApp.fetch('https://notify-api.line.me/api/notify',options);
}
// 明日送信する処理
function sendTomorrowSchedule() {
  var accessToken = PropertiesService.getScriptProperties().getProperty('LINE_TOKEN');
  var message = getMessage(1);
  var options =
   {
     'method'  : 'post'
    ,'payload' : 'message=' + message
    ,'headers' : {'Authorization' : 'Bearer '+ accessToken}
    ,muteHttpExceptions:true
   };
  UrlFetchApp.fetch('https://notify-api.line.me/api/notify',options);
}
/**
* メッセージ内容取得
* @param {number} 今日起算の日数
* @return {string} メッセージ内容
*/
function getMessage(prm) {
  const week = ['日','月','火','水','木','金','土'];
  var cal = CalendarApp.getCalendarById('hide6974@gmail.com');
  var date = new Date();
  var strBody = '';
  var strHeader = '';
  // タイトル
  if ( prm==0 ) {
    strHeader = '今日 ';
  } else if ( prm==1 ) {
    strHeader = '明日 ';
  } 
  date = new Date(date.getFullYear(),date.getMonth(),date.getDate() + prm);
  strHeader += Utilities.formatDate(date,'JST','yyyy/M/d')
                + '(' +week[date.getDay()] + ') の予定\n';
  // 内容
  strBody = getEvents(cal,date);
  if ( _isNull(strBody) ) strBody = '予定はありません。';
  return strHeader + strBody;
}

/**
* カレンダーイベント内容取得
* @param {object} カレンダー
* @param {date} 日付
* @return {string} イベント内容
*/
function getEvents(prmCal,prmDate) {
  var strEvents = '';
  var strStart = '';
  var strEnd = '';
  var strTime = '';
  var strLocation = '';
  var strDescription = '';
  if ( !_isNull(prmCal) ) {
     var arrEvents = prmCal.getEventsForDay(new Date(prmDate));
     for (var i=0; i<arrEvents.length; i++) {
       if ( !_isNull(strEvents) ) strEvents += '\n';
       strStart = _HHmm(arrEvents[i].getStartTime());
       strEnd = _HHmm(arrEvents[i].getEndTime());
       if ( strStart===strEnd ) {
         strTime = '終日';
       } else {
         strTime = strStart + '～' + strEnd;
       }
       strEvents += '･' + strTime + '【' + arrEvents[i].getTitle() + '】';
       strLocation = arrEvents[i].getLocation();
       strDescription = arrEvents[i].getDescription();
       if ( !_isNull(strLocation) ) strEvents += '\n　場所：' + strLocation;
       //if ( !_isNull(strDescription) ) strEvents += '\n　説明：' + strDescription;
     }
  }
  return strEvents;
}
/**
* 時刻フォーマット
*/
function _HHmm(str){
  return Utilities.formatDate(str,'JST','HH:mm');
}
/**
* NULL判定
* @param {object} 判定対象
* @return {bool} NULLの場合TRUE
*/
function _isNull(prm) {
  if ( prm=='' || prm===null || prm===undefined ) {
    return true;
  } else {
    return false;
  }
}

function test(){
  let message = getMessage(0);
  Logger.log('今日\n' + message);
  message = getMessage(1);
  Logger.log('\n明日\n' + message);
}

//LINEBOTで画像メッセージを送るサンプル
function pushmessage_image() {
  const rawMainPhotoURL ='https://lh3.googleusercontent.com/lr/AFBm1_Z7GLUCxbGW8jdGETVpk4y7uAQiPTkk4gN5RAQXRe_y52CevN6EKYTleWqQrVe3wY59g0wC-Ir6PwsWRDmHYroSkacokpT4XfOTkxBuNDvytbyYG2k7neC5nKoiB1xT_cfkqp9Y_PLLR1_OWN39qQav1PbVP0oFWR8RC7AyqVrtYVSboK9y5OMzXrnywgqjT8Ya6FHBmHx7hZVXBLv719FhM1keuTxSZP8j61cbq3o0zDQlbekRS7QvhuWgojfUckh4-ALWOSIE5iyoxfGgn3DN77qi7iAMGhhdReVsyO8xGZS8zlWz0hCgS0qyjx6vqX4-n4qgGl1pYKD0Y55_m2r6XTZC-G9tIvwjI0ycMmp4X1LsjUbftbzy-ZFj8klS5hG_mbeEPcZvKxUxo9WFJV5nVLbg0usOmY4wmk99aqjMy_TIP1QY3k1HVmqvYhgbLwNBBfrXqFCtJuwPJ9KEK2_lK_YQClpqoWKyKYGCFxgMAtroAFOwQDyQBFWnRht2NUrE1ibxuXv8u2xZQCssutEHcx9Wxfj4z9e0ZFLNZJpy1yqQil7gJZnzBRPLJPpW7PBaU54D4_RH2ndvNjx5bxDGbhKutIppXin3cTc0vk-E2RF0Z4jTkj-ZOwqsCFYrXL_y3flKDFwyggJRDb61-3PcK7zk536iVlClAzBJAVIyCHc2LbU_SGPzkTGxfI4ywTcrGd9gGlGpPrZLcFjP32rHwb8xZsy9VSM_jUEUbcMoU27-66-fvZuzGOlVkFnhLkSdKHbN0H7f9L1-9dKuZqEZLSMl6zo86z0BSnQCIbA3kEwgwyBcVh8SCZD9wG6yfgKNoGLu=w240-h240';
  const rawpreviewImageUrl ='https://lh3.googleusercontent.com/lr/AFBm1_Z7GLUCxbGW8jdGETVpk4y7uAQiPTkk4gN5RAQXRe_y52CevN6EKYTleWqQrVe3wY59g0wC-Ir6PwsWRDmHYroSkacokpT4XfOTkxBuNDvytbyYG2k7neC5nKoiB1xT_cfkqp9Y_PLLR1_OWN39qQav1PbVP0oFWR8RC7AyqVrtYVSboK9y5OMzXrnywgqjT8Ya6FHBmHx7hZVXBLv719FhM1keuTxSZP8j61cbq3o0zDQlbekRS7QvhuWgojfUckh4-ALWOSIE5iyoxfGgn3DN77qi7iAMGhhdReVsyO8xGZS8zlWz0hCgS0qyjx6vqX4-n4qgGl1pYKD0Y55_m2r6XTZC-G9tIvwjI0ycMmp4X1LsjUbftbzy-ZFj8klS5hG_mbeEPcZvKxUxo9WFJV5nVLbg0usOmY4wmk99aqjMy_TIP1QY3k1HVmqvYhgbLwNBBfrXqFCtJuwPJ9KEK2_lK_YQClpqoWKyKYGCFxgMAtroAFOwQDyQBFWnRht2NUrE1ibxuXv8u2xZQCssutEHcx9Wxfj4z9e0ZFLNZJpy1yqQil7gJZnzBRPLJPpW7PBaU54D4_RH2ndvNjx5bxDGbhKutIppXin3cTc0vk-E2RF0Z4jTkj-ZOwqsCFYrXL_y3flKDFwyggJRDb61-3PcK7zk536iVlClAzBJAVIyCHc2LbU_SGPzkTGxfI4ywTcrGd9gGlGpPrZLcFjP32rHwb8xZsy9VSM_jUEUbcMoU27-66-fvZuzGOlVkFnhLkSdKHbN0H7f9L1-9dKuZqEZLSMl6zo86z0BSnQCIbA3kEwgwyBcVh8SCZD9wG6yfgKNoGLu=w240-h240';

  const TOKEN = PropertiesService.getScriptProperties().getProperty('LINEBOT_ACCESS_TOKEN');
  const userID='Uf10823628074d8ca6e7700309f685a7c';
  //画像メッセージを送る
  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + TOKEN,
    },
    'method': 'POST',
    'payload': JSON.stringify({
      'to': userID, //LINEのユーザIDを指定
      'messages': [{
        'type': 'image',
        'originalContentUrl': rawMainPhotoURL,
        'previewImageUrl': rawpreviewImageUrl
      }],
      'notificationDisabled': false // trueだとユーザーに通知されない
    }),
  });
}

/**
* LINE写真画像メッセージを送る
*/
function sendToLinePhoto() {
  const DEBUGID = 'LINEのユーザIDを指定(取得方法：https://arukayies.com/gas/line_bot/get-userid)';
  //レスポンスを取得 */
  const responseLine = e.postData.getDataAsString();
  //JSON形式に変換する
  const event = JSON.parse(responseLine).events[0];
  //イベントへの応答に使用するトークンを取得
  const replyToken = event.replyToken;
  //ユーザーIDを取得
  const userID = event.source.userId;
  const accessToken = PropertiesService.getScriptProperties().getProperty('LINE_TOKEN');
  
  const rawMainPhotoURL ='https://lh3.googleusercontent.com/lr/AFBm1_aGn8nHtmAPNx4C__ru7iTOw2HMS7qb8CoUzk0d9_xRExE2wal-Wj65vrbY2_RgiiOEbgIewt5uJWJG45OBlUWJJ6CvZ2BM4ho9OfQFcX1104NXrKTwuvrKx-eHqRMgPy3Z0y4nsveeFaHTwl6ijQnKUU3KIpFmYOuWc6JBdRjsEl_6Z-zRrJDlJYGmbkhNpgMd4SCBxaV5y-OKfTKX7d4cfeUK8ih9NyjCQSGoTuT0KZnVl3z2PqMLUOY_QVOO9eJnWwuYm0uReql25rU-76umrrpk5612URN9TBN7qZyEO73_7HG-pasc3ogQ9c3RxlB-9DW_EgS-3lzBb0PS87DmRodW4Gu-i_P4QWG9Uetn40-X-JbUfzCgleYPROpU-vo1xPoHNF0x6ndSNN4cKwNcGImCwweRklAiinNMw84X_uRAlR_U6fM8V_s1JhtN3ZsXLv5gRz1KV1Ea4P4jxHebXiNkNIZ2cTqgIvkC3ASrW2ZGvjVLEGiHZtnlpc8GDjbBiWTRuEU9vfc3sKwZs3eXnpK8x4KoJ-P-xHY72pZZp2YgPsy3UP_KPVuujZCtGblFLOuRW1gGHyyb4k2LOQWARC273NlOzzkKcEUQ2eSXk0Bsas9TmcuiBX7t3sOiyBBhWxp1gHrWhV7YeybmN_AmGcpZ2r2spNr89JmWAEl2QBD2Cfy-KCbGtyVUlz51aiOe52gn5M5djgYP9r_ijpFFLqkOkWLhFHCc3rBmI0uMfnbuoOfvJCXEEioUX6lL5nJLCNtfeY24ifK6DySLbFVYqfUzN4IHFSLUuTS3UQtwv1bsAVziTxHRQSxrmU45Emn9pCqf=w200-h102';
  const rawpreviewImageUrl ='https://lh3.googleusercontent.com/lr/AFBm1_aGn8nHtmAPNx4C__ru7iTOw2HMS7qb8CoUzk0d9_xRExE2wal-Wj65vrbY2_RgiiOEbgIewt5uJWJG45OBlUWJJ6CvZ2BM4ho9OfQFcX1104NXrKTwuvrKx-eHqRMgPy3Z0y4nsveeFaHTwl6ijQnKUU3KIpFmYOuWc6JBdRjsEl_6Z-zRrJDlJYGmbkhNpgMd4SCBxaV5y-OKfTKX7d4cfeUK8ih9NyjCQSGoTuT0KZnVl3z2PqMLUOY_QVOO9eJnWwuYm0uReql25rU-76umrrpk5612URN9TBN7qZyEO73_7HG-pasc3ogQ9c3RxlB-9DW_EgS-3lzBb0PS87DmRodW4Gu-i_P4QWG9Uetn40-X-JbUfzCgleYPROpU-vo1xPoHNF0x6ndSNN4cKwNcGImCwweRklAiinNMw84X_uRAlR_U6fM8V_s1JhtN3ZsXLv5gRz1KV1Ea4P4jxHebXiNkNIZ2cTqgIvkC3ASrW2ZGvjVLEGiHZtnlpc8GDjbBiWTRuEU9vfc3sKwZs3eXnpK8x4KoJ-P-xHY72pZZp2YgPsy3UP_KPVuujZCtGblFLOuRW1gGHyyb4k2LOQWARC273NlOzzkKcEUQ2eSXk0Bsas9TmcuiBX7t3sOiyBBhWxp1gHrWhV7YeybmN_AmGcpZ2r2spNr89JmWAEl2QBD2Cfy-KCbGtyVUlz51aiOe52gn5M5djgYP9r_ijpFFLqkOkWLhFHCc3rBmI0uMfnbuoOfvJCXEEioUX6lL5nJLCNtfeY24ifK6DySLbFVYqfUzN4IHFSLUuTS3UQtwv1bsAVziTxHRQSxrmU45Emn9pCqf=w200-h102';
  const options =
   {
     'method'  : 'post'
    ,'headers' : {'Content-Type': 'application/json','Authorization' : 'Bearer '+ accessToken}
    ,'payload': JSON.stringify({
      'messages': [{
        'type': 'image',
        'originalContentUrl': rawMainPhotoURL,
        'previewImageUrl': rawpreviewImageUrl
      }]
      //,'notificationDisabled': false // trueだとユーザーに通知されない
      ,muteHttpExceptions:true
    }),
  };
  UrlFetchApp.fetch('https://notify-api.line.me/api/notify',options);
}
