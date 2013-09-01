// ==UserScript==
// @id             pmo-helper
// @name           pmo-helper
// @version        1.1
// @namespace      
// @author         stormhouse@yeah.net
// @description    pmo-helper
// @run-at         window-load
// ==/UserScript==
(function () {

//  var s = new StormStore('pmo');
//  var dailyObj = s.find({id: 'pmo'});
//  if(!dailyObj)
//    dailyObj = s.create({id: 'pmo'});
//  console.log(dailyObj.itemcode)
  var dailyJob;
  var currentUrl = window.location.href;

  var commit_url = "http://60.247.77.194/ultrapmo/myproject/saveDaily.action";
  var project_url = "http://60.247.77.194/ultrapmo/myproject/findProjectNo.action?q=";//up-2013-036028
  var ss = currentUrl.split('60.247.77.186')
  var isPmoPosition = ss.length > 1 ? true : false;
  var isNotifyOn = (window.webkitNotifications && window.webkitNotifications.checkPermission() == 0) ? true : false;

//  开启提醒
  if(isPmoPosition && !isNotifyOn){
    openNotify();
  }
//  每日提醒
  if(isNotifyOn){
    showDailyNotify();
  }
//  自动登录
  if(isPmoPosition){
    var image = $('#imgObj');
    image.load(function(){
      autoLogin();
    });
  }
//  批量填写日报
  chrome.extension.sendRequest({method: "getDailyJob"}, function(response) {
    var dt = $('#dailyTable');
    if(dt.length == 0) return ;
    dailyJob = JSON.parse(response.dailyJob);

    $.ajax({
      async: true,
      type: 'get',
      url: project_url+dailyJob.itemcode,
      dataType: 'json',
      success: function (data) {
        fillBathDailyTable(data.responseText, dailyJob);
      },
      error: function (data, textStatus) {
        fillBathDailyTable(data.responseText, dailyJob);
      }
    });
  });

  function fillBathDailyTable(code_name, dailyJob){
    //常量
    var manHour = 8;
    var workPlace = '公司';
    var baseSchema = 'WF:UL_DA_DLPS';//开发任务
    baseSchema = dailyJob.baseSchema;
    var jobs = dailyJob.jobs;

    var code = code_name.split('|')[0];
    var name = code_name.split('|')[1];
    var dt = $('#dailyTable');
    //TODO 判断某一天，是否已经写日志了
    addDaily();
    addDaily();
    addDaily();
    addDaily();
    var cDate = new Date();
    var cDay = cDate.getDay();
    if(cDay != 5){
      alert('今天不是周五，亲～～，您太捉鸡了吧');
      return ;
    }
    dt.find('[flag=projectNo]').val(code);
    dt.find('[flag=projectName]').val(name);
    var cm = (cDate.getMonth()+1);
    cm = cm>9 ? cm : '0'+cm
    var yymm = cDate.getFullYear()+'-'+cm;
    var h9  = ' 09:00:00';
    var h18 = ' 18:00:00';
    var monDate = new Date(cDate.getTime()-4*24*3600*1000)
    //TODO 判断某一天，是否已经写日志了
    for(var i=0; i<5; i++){
      var tempDate = new Date(monDate.getTime()+i*24*3600*1000);
      var yy = tempDate.getFullYear();
      var mm = (tempDate.getMonth()+1);
      mm = mm>9 ? mm : '0'+ mm;
      var dd = tempDate.getDate();
      dd = dd>9 ? dd : '0'+dd;
      var yymmdd = yy+'-'+mm+'-'+dd;
      dt.find('#startTimestr'+i).val(yymmdd+h9);//开始时间
      dt.find('#endTimestr'+i).val(yymmdd+h18);//结束时间
      dt.find('#manHour'+i).val(manHour);//历时
      dt.find('#workPlace'+i).val(workPlace);//工作地点
      dt.find('#baseSchema'+i).val(baseSchema);//任务类型
      dt.find('#workTitle'+i).val(yymmdd+'工作日志');//任务主题
      dt.find('#taskDescribe'+i).val(jobs['d'+(i+1)]);//任务内容
//      monDate+=1;
    }

  }

  /**
   *添加日志,从pmo那里拷过来的
   */
  function addDaily(){
    var rowcount=$("tr[name='endtr']").attr("rowIndex");
    var detailCount=(rowcount-2)/2;
    $("tr[name='endtr']").before("<tr>"+
        "<td>"+
        "	<input type='text' style='width: 97%' id='projectNo"+detailCount+"'"+
        "	flag='projectNo' name='wds["+detailCount+"].projectNo' value='US-20' onfocus=\"findProjectNo(this);\" />"+
        "</td>"+
        "<td>"+
        "	<input type='text' style='width: 97%' id='projectName"+detailCount+"'"+
        "	flag='projectName' 	name='wds["+detailCount+"].projectName' readOnly />"+
        "</td>"+
        "<td>"+
        "	<input type='text' style='width: 97%' id='startTimestr"+detailCount+"'"+
        "	flag='startTimestr'	name='startTimestr["+detailCount+"]'  onchange=\"produceHour2(this,'s')\" "+
        "		onclick=\"WdatePicker({dateFmt:'yyyy-MM-dd HH:mm:ss',startDate:'%y-%M-%d 09:00:00'});\" readOnly />"+
        "</td>"+
        "<td>"+
        "	<input type='text' style='width: 97%' id='endTimestr"+detailCount+"'  onchange=\"produceHour2(this,'e')\" "+
        "	flag='endTimestr'	name='endTimestr["+detailCount+"]'"+
        "		onclick=\"WdatePicker({dateFmt:'yyyy-MM-dd HH:mm:ss',startDate:'%y-%M-%d 18:00:00'});\"  readOnly />"+
        "</td>"+
        "<td>"+
        "	<input type='text' style='width: 97%' id='manHour"+detailCount+"' flag='manHour' name='manHours["+detailCount+"]'  onPropertyChange=\"checkHour1(this);\"  />"+
        "</td>"+
        "<td>"+
        "	<select id='baseSchema"+detailCount+"' style='width:98%'"+
        "	flag='baseSchema'	name='wds["+detailCount+"].baseSchema' >"+
        "		<option value='WF:UL_DA_CTK'>日常任务</option>"+
        "		<option value='WF:UL_DA_PAT'>售前任务</option>"+
        "		<option value='WF:UL_DA_IFT'>实施任务</option>"+
        "		<option value='WF:UL_DA_DLPS'>开发任务</option>"+
        "		<option value='WF:UL_DA_TEPS'>测试任务</option>"+
        "	</select>"+
        "</td>"+
        "<td>"+
        "	<select id='workPlace"+detailCount+"' style='width:98%'"+
        "	flag='workPlace'	name='wds["+detailCount+"].workPlace' >"+
        "		<option value='公司'>公司</option>"+
        "		<option value='现场'>现场</option>"+
        "	</select>"+
        "</td>"+
        "<td>"+
        "	<input type='text' id='workTitle"+detailCount+"' style='width: 97%'"+
        "	flag='workTitle' maxlength='85'	name='wds["+detailCount+"].workTitle' value='' />"+
        "</td>"+
        "<td align='center'>"+
        "	<a href='javascript:;' onclick='delDaily(this);'><img"+
        "			id='delImg'"+
        "			src='/ultrapmo/common/style/blue/images/del_user.jpg' /> </a>"+
        "</td>"+
        "</tr>"+
        "<tr>"+
        "	<td colspan='9'>"+
        "		<textArea id='taskDescribe"+detailCount+"' name='wds["+detailCount+"].taskDescribe'"+
        "		flag='taskDescribe'	rows='2' style='width:100%' onkeydown=\"check(this);\"></textArea>"+
        "	</td>"+
        "</tr>");
  }

  /**
   * 识别验证码，自动登录
   * @returns {*}
   */
  function autoLogin() {
    //如果要用在greasemonkey脚本里,可以把下面的代码放在image的onload事件里
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext("2d");

    var result = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
    var numbers = [

      '', //0
      '', //1
      '100000111111100000001111100111110011111111111001111101101100111111111100111111101100111111111100111011111100111111011100101111111100110111111110000000011111000000001111111111111111111111111111111',
      '100000011111100000000111110111100011111111111000111111011001111011000001111111100000011111111111000111111111110011111111111001111101111000101110000000111011100000111001111111111110111110111111011',
      '111110010011111110001111111111000111101111000011111111001001111111100100111111100110011111110011001111100000000001111000000000011111011001101111111100111111111110011011111101111111101111111111111',
      '000000000010100000000111110011111111111001101111111100111111011110000011101111000000011011101111000111111111110011111111100001011100111000011110000000111111100000110111111111111111111111111111111',
      '101000011111111000000101101001111011111100101011111100111111111110010000110111000000001111100001100011110001111001111001111100111110011000011011000000011111111000011111111111110101111111111111111',
      '100000000111110000000011111111111001111111011101011111011000011110111100111111111110111101111110011110111111011111111111001111111111100111011111100111111111110011111110111111111111011111111111111',
      '110000011111110000000111111001110011111100111001111110001101111111100000111111110000011111110011000111110011111001110001111100111100011100011111000000011011110000011111001111111111111111111111111',
      '', //9
      '111000111111111100011110111100100111111010000011111111001001111111000110011110000111001110110011100111110000000001111000000000101100110110011110111111100101010111110010111111111111111111110111111', //10-A
      '000000101111100000001111110011100110111001100011111100110011111110000001111111000000111111100111001111110011110011110001111001111100111000111110000000111101000000111111111111011111111111111111111', //11-B
      '111000001111111000000011111000110101111000111111111100011111111110001111111111001111111111100111011111110011111111101000111101111110001111011111100000001111111000001101111111111111111111111111111', //12-C
      '000000011111100000000111110010010001111001111000011100111111001110011111100111001111110011100110011001010011111100111001110100111100111100011010000000010111000000011111111111111011111111111111111', //13-D
      '000000000111100000000111110011111101011001111111111100111111110110000000111011000000011111000111111111010001111111111001111111111100111101111110000000010100000000001111111111111011111111111100111', //14-E
      '000000011111100000001111110011111111111001111110111000111011111110011111111101000000111111100000011111110011111111111001101111111100111111110110001110101111001111111101111111111111111111111111111', //15-F
      '111000000111111000000001011000111110011100111111111100111111111010001001110111001111111011100111111001110011110100110000111110011110001111001110100000000111111000000011111110111111111111111111111', //16-G
      '001111110011100011111000010011111100111001110110011000111101001110000000000110000000000011100100111001010011111100111000111110011100111111001110011111100111001111110011101111111111110111011111111', //17-H
      '', //18-I
      '100111111111110011111111111001111110111100111111111100011110110111001111111111100111111011110011111111111001011111111000111111111110011011101011001111110111100111111111100011011111110011110111110', //19-J
      '001111100110100111100011110001100111111001100111111100100010111110000011111101000011111100100100111111110001001111101000110011111100111100111110011111001111001111110011111011111111111111111111110', //20-K
      '001111110111100110111111110001111101111001111111111100111111111110011111111111000110111111100111101111110011111011111000111001111100111111111110000000011111000000001111111111111111111111111101111', //21-L
      '000111111100000001111100000000111110000000011111000000000111001000010011100100001001110010000100010011000011001001100001100100110000111000111000011100011100001111111110010111111011111111011111111', //22-M
      '001111110011100011111001110000011100111000011110011100100111001110010001100111001100110010000111001001010011100100101001111000011100111100001110011111000111001111110011001111111111111111111111011', //23-N
      '', //24-O
      '000000111111100000001110110011100011111001011001111100111100111110001100011101000000011111100000111111110011111111111001101111111100111111111110011111101111000111111110101110011111011111111111111', //25-P
      '', //26-Q
      '000000111111000000001111110011100011111001111001111100111100111100011100011111000000011110100000011111110011001111011001110010111100111000111110001111001111001111110011111110111111111101111111111', //27-R
      '100001111111100000011110110001101100111001111111011100111111111111000111111101110000111111111110001111111111100111111111110011111001111001101110000000110111100001111111111111111111111101110111111', //28-S
      '000000000111100000000011111110011111111111001111011111000110011111110011111111111001111100111100111110111110011111111111001101101111100111101111110011111111111001111111111111111111111111111111111', //29-T
      '001011100111100111110011110011111001111001101100111100110100011110011101001111001111100111100111110011110011111000111001111100111100011100011111000000011111110000011111111111111111111111111111111', //30-U
      '011111110011001111111010110011111001111001011100111110011000111101001110011111100111001111111001001111111100100110111110000010111111100011111111110001111111111111111111111111111111111111111111111', //31-V
      '011110001111001111000111100011100011100001110101110000110010011000011001001100100100100100110010000010011001001001001100100100100111000111000111100011100001110001110001111111111101111111111111111', //32-W
      '011111100111100111000111110010110011111100100011111101000011111111100001111111111001111101111000011101111100001111111100110011111100111000111110011010011101011111100111111111101011111111110111111', //33-X
      '011111100111100011100110110011110010111100110011111100011001111111100001101111111000111111111000101110111110011111111111001111111111000111111111110001111111111111111111101111111111111111111110111', //34-Y
      '000000001111100000000101111111110011110111110011111111110011111101011001110111111001111111101001111110111100111111111000111111111100111111111110000000011111000000001111110111111111011111111111111' //35-Z
    ];
    var captcha = "";                         //存放识别后的验证码
    canvas.width = 65;//image.width;
    canvas.height = 18; //image.height;
    document.body.appendChild(canvas);
    ctx.drawImage(image.get(0), 0, 0);
    for (var i = 0; i < 4; i++) {
      var pixels = ctx.getImageData(14 * i + 5, 2, 13, 15).data;
      var ldString = "";
      for (var j = 0, length = pixels.length; j < length; j += 4) {
        ldString = ldString + (+(pixels[j] * 0.3 + pixels[j + 1] * 0.59 + pixels[j + 2] * 0.11 >= 140));
      }
      var comms = numbers.map(function (value) {                      //为了100%识别率,这里不能直接判断是否和模板字符串相等,因为可能有个别0被计算成1,或者相反
        return ldString.split("").filter(function (v, index) {
          return value[index] === v
        }).length
      });
      captcha += result[comms.indexOf(Math.max.apply(null, comms))];          //添加到识别好的验证码中
    }

    $('#checkCode').val(captcha);
//    var flag = $('#emptyValidatorLi').css("visibility");
//    if(flag === 'hidden'){
      $('.login-btn').trigger('click');
//      notify('登录成功', '亲～，秘书再也不用找你回邮件了')
//    }else{
//      $('#password').val('');
//      $('#passwordtip').remove();
//      $('#password').parent().before("<div id='passwordtip' style='color: red;'>密码好像不正确噢！</div>")
//    }
    return captcha; //写入目标文本框

  }

  /**
   *
   */
  function showDailyNotify(){
    var h = (new Date()).getHours();
    if(h === 17){
      notify()
    }
    setTimeout(showDailyNotify, 1000*60*30)
  }

  /**
   * 启用桌面提醒
   */
  function openNotify(){
    var userContainer = $('.user_name');
    if(userContainer.length>0){
      var notify = $('<input>');
      notify.attr('type', 'button');
      notify.attr('value', '启用桌面提醒');
      notify.css('color', 'red')
      notify.css('padding', '10px')
      notify.click(function(){
        window.webkitNotifications.requestPermission();
      });
      userContainer.append(notify);
      userContainer.append("可以提醒你该写日报了")
    }
  }

  /**
   * 提醒
   */
  function notify(title, content) {
    if (window.webkitNotifications) {
      if (window.webkitNotifications.checkPermission() == 0) {
        var notification_test = window.webkitNotifications.createNotification("http://images.cnblogs.com/cnblogs_com/flyingzl/268702/r_1.jpg", title ? title: '标题', content ? content : '亲嘞～～是不是该写日报了');
        notification_test.display = function() {}
        notification_test.onerror = function() {}
        notification_test.onclose = function() {}
        notification_test.onclick = function() {this.cancel();}

        notification_test.replaceId = 'Meteoric';

        notification_test.show();

//        var tempPopup = window.webkitNotifications.createHTMLNotification(["http://www.baidu.com/", "http://www.soso.com"][Math.random() >= 0.5 ? 0 : 1]);
//        tempPopup.replaceId = "Meteoric_cry";
//        tempPopup.show();
      }
    }
  }
})();
