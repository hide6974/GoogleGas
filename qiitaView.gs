function myFunction() {
  // usersシート取得
  const SHEET_ID = "16se0ozdBruQzfZcEMPmDOqq9PVuF3Xj6ndEs99EQAFo";
  const SHEET_NAME = "users";
  const sheet = getSheet(SHEET_ID, SHEET_NAME);
  const sheetData = sheet.getDataRange().getValues();

  // 対象データが存在する行番号の配列を取得
  const dataIndexes = getDataIndexes(sheetData);

  // 対象データが存在する行をログに出力
  const userIdLists = getUserIdList(sheetData, dataIndexes);

  // userListの数だけシートタイトルAPI取得し設定する
  const userQiitaDatas = getQiitaviewAPI(userIdLists);
  
  // insertSheet
  insertSheetQiitaview(userQiitaDatas);

}

function getSheet(ssId, targetSheetName) {
  ss = SpreadsheetApp.openById(ssId);
  if (typeof targetSheetName === 'string' && targetSheetName !== '') {
    return ss.getSheetByName(targetSheetName);
  }
  return ss.getSheets()[targetSheetName];
}

function getDataIndexes(data) {
  const settlementColumnIndex = 0; // A列
  const settlementRows = convertTwoDimensionToOneDimension(data, settlementColumnIndex); // A列のみの一次元配列を取得
  const settlementIndexes = []; // 行番号の格納用配列

  // A列に 'UserID' を含む行番号を配列に格納
  settlementRows.forEach(function(value, index) {
    if (value.indexOf('UserID') != -1) {
      settlementIndexes.push(index);
    }
  });
  return settlementIndexes;
}

function getUserIdList(data, indexes) {
  const userIdList = []; // UserIdlist格納用配列
  indexes.forEach(function() {
    for (var i = 1; i < data.length; i++) { // iは列番号
      Logger.log(data[i][0]); // i行目の0列目の値表示
      userIdList.push(data[i][0]);
    }
  });
  return userIdList;
}

// 第一引数の二次元配列を第二引数のインデックスの値の一次元配列に変換する関数
function convertTwoDimensionToOneDimension(twoDimensionalArray, targetIndex) {
  oneDimensionalArray = []
  twoDimensionalArray.forEach(function(value) {
    oneDimensionalArray.push(value[targetIndex]);
  });
  return oneDimensionalArray;
}

// function getTableFromSheet() {
//   const SHEET_ID = "16se0ozdBruQzfZcEMPmDOqq9PVuF3Xj6ndEs99EQAFo";
//   const SHEET_NAME = "users";
//   const  spreadSheet = SpreadsheetApp.openById(SHEET_ID);
//   const  sheet = spreadSheet.getSheetByName(SHEET_NAME);
//   let sheetData = sheet.getDataRange().getValues();

//   // 対象データが存在する行番号の配列を取得
//   const fullYearSettlementIndexes = getFullYearSettlementIndexes(sheetData);

//   // 対象データが存在する行をログに出力
//   showFullYearSettlement(sheetData, fullYearSettlementIndexes); 
// }

// API呼び出しいいね、タイトル、記事リスト格納処理
function getQiitaviewAPI(userIdList){
  const userQiitaData = [];
  const QIITA_TOKEN  = '7f566baac3cc5969c28a2418d1da59b6e1e7b1a3';
  const API_ENDPOINT = 'https://qiita.com/api/v2';
  var i=0;
  while(i < userIdList.length){ 

    if(""== userIdList[i]){
      break;
    }
    const API_USER_ITEMS = API_ENDPOINT + '/users/' + userIdList[i] +'/items'; // /api/v2/users/:user_id/items	指定されたユーザの投稿一覧取得URL

    //APIヘッダ
    var headers = {'Authorization' : 'Bearer ' + QIITA_TOKEN};
    var params = {'headers' : headers ,"muteHttpExceptions" : true,};

    //ユーザ投稿一覧取得API
    var paramstr = "?per_page=100&page=1"; //投稿が100件を超えたらページネーションしないといけない
    console.log(API_USER_ITEMS);
    i++　

    try {
      var res = UrlFetchApp.fetch(API_USER_ITEMS + paramstr, params);
        if(res.getResponseCode() == 200) {
          var userListArray = JSON.parse(res.getContentText());
          userListArray.forEach(function(usreData) {
            userQiitaData.push(usreData);
          });
        }else{
          Logger.log(userIdList[i-1]+', ' + res.getResponseCode());
          continue;
        }
    }catch(e){
      Logger.log(userIdList[i-1]+', ' + e);
      continue;
    }
  }
  return userQiitaData
}　

//   userIdList.forEach(function(user) {
//     //定義
//     const QIITA_TOKEN  = '7f566baac3cc5969c28a2418d1da59b6e1e7b1a3';
//     const API_ENDPOINT = 'https://qiita.com/api/v2';
//     const API_USER_ITEMS = API_ENDPOINT + '/users/' + user +'/items'; // /api/v2/users/:user_id/items	指定されたユーザの投稿一覧取得URL

//     //APIヘッダ
//     var headers = {'Authorization' : 'Bearer ' + QIITA_TOKEN};
//     var params = {'headers' : headers ,"muteHttpExceptions" : true,};

//     //ユーザ投稿一覧取得API
//     var paramstr = "?per_page=100&page=1"; //投稿が100件を超えたらページネーションしないといけない
//     console.log(API_USER_ITEMS);
//     try {
//       var res = UrlFetchApp.fetch(API_USER_ITEMS + paramstr, params);
//         if(res.getResponseCode() == 200) {
//           var userListArray = JSON.parse(res.getContentText());
//           userListArray.forEach(function(usreData) {
//             userQiitaData.push(usreData);
//           });
//         }else{
//           Logger.log(user+', ' + res.getResponseCode());
//           return;
//         }
//     }catch(e){
//       Logger.log(user+', ' + e);
//       return;
//     }
//   });
//   return userQiitaData
// }

// スプレッドシートへ登録する処理
function insertSheetQiitaview(userQiitaDataList) {
  const COL_LGTM   = 1;
  const COL_TITLE  = 2;
  const COL_URL  = 3;
  const COL_UPDATED_AT = 4;
  const COL_POSTS_NUM  = 5;
  const COL_USER_NAME  = 6;
  const COL_LATEST = 7;
  const SHEET_ID = "16se0ozdBruQzfZcEMPmDOqq9PVuF3Xj6ndEs99EQAFo";
  const SHEET_NAME = "view";
  var spreadSheet = SpreadsheetApp.openById(SHEET_ID);
  var sheet = spreadSheet.getSheetByName(SHEET_NAME);
  //シート初期化
  sheet.clear();
  sheet.getRange(1, COL_LGTM).setValue("lgtm");
  sheet.getRange(1, COL_TITLE).setValue("title");
  sheet.getRange(1, COL_URL).setValue("url");
  sheet.getRange(1, COL_UPDATED_AT).setValue("updated_at");
  sheet.getRange(1, COL_POSTS_NUM).setValue("posts_num");
  sheet.getRange(1, COL_USER_NAME).setValue("user_name");

  var now = Moment.moment();
  sheet.getRange(1, COL_LATEST).setValue("【確認日時】" + now.format('YYYY/MM/DD HH:mm:ss'));

  userQiitaDataList.forEach(function(item, i){
    sheet.getRange(i + 2, COL_LGTM).setValue(item["likes_count"]);
    sheet.getRange(i + 2, COL_TITLE).setValue(item["title"]);
    sheet.getRange(i + 2, COL_URL).setValue(item["url"]);
    var latest = Moment.moment(item["updated_at"]);
    sheet.getRange(i + 2, COL_UPDATED_AT).setValue(now.diff(latest, 'd') + "日前").setHorizontalAlignment("right");
    sheet.getRange(i + 2, COL_POSTS_NUM).setValue(item["user"]["items_count"]);
    sheet.getRange(i + 2, COL_USER_NAME).setValue(item["user"]["id"]);
  });
}

// （使用しない）API呼び出し登録する処理
// function getQiitaView(user) {
//     //カラム番号
//   const COL_LIKE   = 1;
//   const COL_TITLE  = 2;
//   const COL_URL  = 3;
//   const COL_LATEST = 4;
//   const COL_STOCK  = 5;
//   const COL_USERNAME  = 6;
//   const COL_UPDATE = 7;

//   // (1)Spreadsheetファイルを開く
//   const SHEET_ID = "16se0ozdBruQzfZcEMPmDOqq9PVuF3Xj6ndEs99EQAFo";
//   const SHEET_NAME = "view";
//   var spreadSheet = SpreadsheetApp.openById(SHEET_ID);
//   // (2)Sheetを開く
//   var sheet = spreadSheet.getSheetByName(SHEET_NAME);
//   //シート初期化
//   sheet.clear();
//   sheet.getRange(1, COL_LIKE).setValue("いいね");
//   sheet.getRange(1, COL_TITLE).setValue("タイトル");
//   sheet.getRange(1, COL_URL).setValue("URL");
//   sheet.getRange(1, COL_LATEST).setValue("最終更新");
//   sheet.getRange(1, COL_STOCK).setValue("ストック");
//   sheet.getRange(1, COL_USERNAME).setValue("USERNAME");

//   var now = Moment.moment();
//   sheet.getRange(1, COL_UPDATE).setValue("【確認日時】" + now.format('YYYY/MM/DD HH:mm:ss'));

//   //定義
//   const QIITA_TOKEN  = '7f566baac3cc5969c28a2418d1da59b6e1e7b1a3';
//   const API_ENDPOINT = 'https://qiita.com/api/v2';
//   const API_USER_ITEMS = API_ENDPOINT + '/users/' + user +'/items'; // /api/v2/users/:user_id/items	指定されたユーザの投稿一覧を、作成日時の降順で返します。

//   //APIヘッダ
//   var headers = {'Authorization' : 'Bearer ' + QIITA_TOKEN};
//   var params = {'headers' : headers};

//   //認証している自分の投稿一覧取得API
//   // var paramstr = "?per_page=100&page=1"; //★投稿が100件を超えたらページネーションしないといけない
//   // var res = UrlFetchApp.fetch(API_ENDPOINT + API_MY_ITEMS + paramstr, params);
//   // var json = JSON.parse(res.getContentText());

//   // //ユーザ投稿一覧取得API
//   var paramstr = "?per_page=100&page=1"; //★投稿が100件を超えたらページネーションしないといけない
//   console.log(API_USER_ITEMS);
//   var res = UrlFetchApp.fetch(API_USER_ITEMS + paramstr, params);
//   var json = JSON.parse(res.getContentText());


//   json.forEach(function(item, i){
//     //var resdtl = UrlFetchApp.fetch(API_ENDPOINT + API_ITEM_DTL + "/" + item["id"], params);
//     //投稿ごとのストックユーザー取得API
//     //var resdtl = UrlFetchApp.fetch(API_ENDPOINT + API_ITEM_DTL + "/" + item["id"] + API_STOCKER, params);
//     //var jsondtl = JSON.parse(resdtl.getContentText());
//     //var count = resdtl.getAllHeaders()['total-count'];
//     sheet.getRange(i + 2, COL_LIKE).setValue(item["likes_count"]);
//     sheet.getRange(i + 2, COL_TITLE).setValue(item["title"]);
//     sheet.getRange(i + 2, COL_URL).setValue(item["url"]);
//     sheet.getRange(i + 2, COL_USERNAME).setValue(item["user"]["id"]);
//     sheet.getRange(i + 2, COL_STOCK).setValue(item["user"]["items_count"]);
//     var latest = Moment.moment(item["updated_at"]);
//     sheet.getRange(i + 2, COL_LATEST).setValue(now.diff(latest, 'd') + "日前").setHorizontalAlignment("right");  
//   });
// }