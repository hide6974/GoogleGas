// 20210418 add START
//API取得し、parseしてメッセージに返却
function get_meigen() {
  const url = "http://meigen.doodlenote.net/api/?c=1";
  const res = UrlFetchApp.fetch(url);
  
  var xmlDoc = XmlService.parse(res.getContentText());
  var rootDoc = xmlDoc.getRootElement();
  var data = rootDoc.getChildren("data");
  
  //var erab = new Erab(MEIGEN_BOARDID);
  for (var i=0; i<data.length; i++) {
    var message = data[i].getChildText("meigen") + "  \n by" + data[i].getChildText("auther");
  }
    console.log(message);
  return message;
}
// 20210418 add END

function lineSendMeigen() {
  var accessToken = PropertiesService.getScriptProperties().getProperty('LINE_TOKEN');
  // 引数により取得する日付を変えられるようにしたいので、
  var message = get_meigen();
  var options =
   {
     'method'  : 'post'
    ,'payload' : 'message=' + message
    ,'headers' : {'Authorization' : 'Bearer '+ accessToken}
    ,muteHttpExceptions:true
   };
  UrlFetchApp.fetch('https://notify-api.line.me/api/notify',options);
}