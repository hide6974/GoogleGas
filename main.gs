function sendTodaySchedule() {
  var accessToken = PropertiesService.getScriptProperties().getProperty('LINE_TOKEN');
  // 引数により取得する日付を変えられるようにしたいので、
  // 今日から何日後かを渡すようにします。
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
  var message = getMessage(0);
  Logger.log('今日\n' + message);
  message = getMessage(1);
  Logger.log('\n明日\n' + message);
}