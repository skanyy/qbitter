const FormData = require('/wx-formdata/formData.js')
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

function formatSize(size,de=1024,pointLength, units,) {
  if (typeof (size) == "undefined") return "0"
  var unit;
  units = units || ['B', 'K', 'M', 'G', 'T'];
  while ((unit = units.shift()) && size >= de) {
    size = size / de;
  }
  return (unit === 'B' ? size : size.toFixed(pointLength || 1)) +
    unit;
};

function timeago(dateTimeStamp) {
  var result;
  var minute = 1000 * 60; //把分，时，天，周，半个月，一个月用毫秒表示
  var hour = minute * 60;
  var day = hour * 24;
  var week = day * 7;
  var halfamonth = day * 15;
  var month = day * 30;
  var now = new Date().getTime(); //获取当前时间毫秒
  var diffValue = now - dateTimeStamp; //时间差

  if (diffValue < 0) {
    return;
  }
  var minC = diffValue / minute; //计算时间差的分，时，天，周，月
  var hourC = diffValue / hour;
  var dayC = diffValue / day;
  var weekC = diffValue / week;
  var monthC = diffValue / month;
  if (monthC >= 1 && monthC <= 3) {
    result = " " + parseInt(monthC) + "月前"
  } else if (weekC >= 1 && weekC <= 3) {
    result = " " + parseInt(weekC) + "周前"
  } else if (dayC >= 1 && dayC <= 6) {
    result = " " + parseInt(dayC) + "天前"
  } else if (hourC > 23 && dayC < 1) {
    var time = new Date(dateTimeStamp - day);
    result = "昨天" + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds()
  } else if (hourC >= 1 && hourC <= 23) {
    result = " " + parseInt(hourC) + "小时前"
  } else if (minC >= 1 && minC <= 59) {
    result = " " + parseInt(minC) + "分钟前"
  } else if (diffValue >= 0 && diffValue <= minute) {
    result = "刚刚"
  } else {
    var datetime = new Date();
    datetime.setTime(dateTimeStamp);
    var Nyear = datetime.getFullYear();
    var Nmonth = datetime.getMonth() + 1 < 10 ? "0" + (datetime.getMonth() + 1) : datetime.getMonth() + 1;
    var Ndate = datetime.getDate() < 10 ? "0" + datetime.getDate() : datetime.getDate();
    var Nhour = datetime.getHours() < 10 ? "0" + datetime.getHours() : datetime.getHours();
    var Nminute = datetime.getMinutes() < 10 ? "0" + datetime.getMinutes() : datetime.getMinutes();
    var Nsecond = datetime.getSeconds() < 10 ? "0" + datetime.getSeconds() : datetime.getSeconds();
    result = Nyear + "-" + Nmonth + "-" + Ndate
  }
  return result;
};

function formatSecToStr(seconds, moreyeardetail = false) {
  let daySec = 24 * 60 * 60;
  let hourSec = 60 * 60;
  let minuteSec = 60;
  let dd = Math.floor(seconds / daySec);
  let hh = Math.floor((seconds % daySec) / hourSec);
  let mm = Math.floor((seconds % hourSec) / minuteSec);
  let ss = seconds % minuteSec;
  if (dd > 365) {
    if (moreyeardetail) return dd.toFixed(2) + "天"
    return "超过一年";
  } else if (dd > 0 && dd <= 365) {
    // return dd + "天" + hh + "小时" + mm + "分钟" + ss + "秒";
    return dd + "天" + hh.toFixed(0) + "小时";
  } else if (hh > 0) {
    // return hh + "小时" + mm + "分钟" + ss + "秒";
    return hh + "小时" + mm.toFixed(0) + "分钟";
  } else if (mm > 0) {
    return mm + "分钟" + ss.toFixed(0) + "秒";
  } else {
    return ss.toFixed(1) + "秒";
  }
};

function formatSpeedForYAxisLable(value) {
  value = value * 1024
  if ((value / (1024 * 1024 * 1024)) >= 1) {
    return (value / (1024 * 1024 * 1024)).toFixed(0) + " G";
  } else if ((value / (1024 * 1024)) >= 1) {
    return (value / (1024 * 1024)).toFixed(0) + " M";
  } else if ((value / (1024)) >= 1) {
    return (value / (1024)).toFixed(0) + " K";
  } else {
    return value.toFixed(0) + " B";
  }
}

function compareList(property,type="asc") {
    return function (obj1, obj2) {
        var value1 = obj1[property];
        var value2 = obj2[property];
        return type=="asc"?value1 - value2:value2-value1; // 升序
    }
}

function formMydata(obj = {}) {
  var formData = new FormData();
  for (let name of Object.keys(obj)) {
    let value = obj[name];
    formData.append(name, value);
  }
  return formData.getData()
}

function startWith(str, target) {
  return str.slice(0, target.length) == target;
}

function endWith(str, target) {
  return str.slice(-target.length) == target;
}

function trimAllBlank(str) {
  if (str) {
    if (typeof (str) == "number") return str + ""
    str = str.replace(/\s+/g, "");
    return str
  } else {
    return ""
  }
}
/** 
 * 
 *  Base64 encode / decode 
 *  http://www.webtoolkit.info 
 * 
 **/
var Base64 = {

  // private property 
  _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
    // public method for encoding 
    ,
  encode: function (input) {
      var output = "";
      var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
      var i = 0;
      input = this._utf8_encode(input);
      while (i < input.length) {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);
        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;
        if (isNaN(chr2)) {
          enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
          enc4 = 64;
        }
        output = output +
          this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
          this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
      }
      return output;
    } // End Function encode  


    // public method for decoding 
    ,
  decode: function (input) {
      var output = "";
      var chr1, chr2, chr3;
      var enc1, enc2, enc3, enc4;
      var i = 0;
      input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
      while (i < input.length) {
        enc1 = this._keyStr.indexOf(input.charAt(i++));
        enc2 = this._keyStr.indexOf(input.charAt(i++));
        enc3 = this._keyStr.indexOf(input.charAt(i++));
        enc4 = this._keyStr.indexOf(input.charAt(i++));
        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;
        output = output + String.fromCharCode(chr1);
        if (enc3 != 64) {
          output = output + String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
          output = output + String.fromCharCode(chr3);
        }
      }
      return output;
    } // End Function decode  


    // private method for UTF-8 encoding 
    ,
  _utf8_encode: function (string) {
      string = string.replace(/\r\n/g, "\n");
      var utftext = "";
      for (var n = 0; n < string.length; n++) {
        var c = string.charCodeAt(n);
        if (c < 128) {
          utftext += String.fromCharCode(c);
        } else if ((c > 127) && (c < 2048)) {
          utftext += String.fromCharCode((c >> 6) | 192);
          utftext += String.fromCharCode((c & 63) | 128);
        } else {
          utftext += String.fromCharCode((c >> 12) | 224);
          utftext += String.fromCharCode(((c >> 6) & 63) | 128);
          utftext += String.fromCharCode((c & 63) | 128);
        }

      }
      return utftext;
    } // End Function _utf8_encode  

    // private method for UTF-8 decoding 
    ,
  _utf8_decode: function (utftext) {
    var string = "";
    var i = 0;
    var c = c1 = c2 = 0;
    while (i < utftext.length) {
      c = utftext.charCodeAt(i);
      if (c < 128) {
        string += String.fromCharCode(c);
        i++;
      } else if ((c > 191) && (c < 224)) {
        c2 = utftext.charCodeAt(i + 1);
        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
        i += 2;
      } else {
        c2 = utftext.charCodeAt(i + 1);
        c3 = utftext.charCodeAt(i + 2);
        string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
        i += 3;
      }
    }
    return string;
  } // End Function _utf8_decode  

}
module.exports = {
  formatTime,
  formatSize,
  formatNumber,
  timeago,
  formatSecToStr,
  formMydata,
  startWith,
  endWith,
  trimAllBlank,
  Base64,
  formatSpeedForYAxisLable,
  compareList
}