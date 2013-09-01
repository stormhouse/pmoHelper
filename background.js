/**
 * Created with JetBrains WebStorm.
 * User: wenjun
 * Date: 13-8-29
 * Time: 下午10:55
 * To change this template use File | Settings | File Templates.
 */
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  if (request.method == "getDailyJob")
    sendResponse({dailyJob: localStorage['dailyJob']});
  else
    sendResponse({}); // snub them.
});