// pages/home_center/power_statistics/index.js
var wxCharts = require('../../../utils/wxcharts.js');
import request from '../../../utils/request'
var lineChart = null;

Date.prototype.Format = function(fmt)
{
    var o = {
        "M+" : this.getMonth()+1,                 //月份
        "d+" : this.getDate(),                    //日
        "h+" : this.getHours(),                   //小时
        "m+" : this.getMinutes(),                 //分
        "s+" : this.getSeconds(),                 //秒
        "q+" : Math.floor((this.getMonth()+3)/3), //季度
        "S"  : this.getMilliseconds()             //毫秒
    };

    if(/(y+)/.test(fmt))
    {
        fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    }

    for(var k in o)
    {
        if(new RegExp("("+ k +")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
    }

    return fmt;
}

// 对 Date 扩展
// 得到当前日期所在周周几的时间
// 注意：Date 一周从周日开始计算，周日是 0
// 另：超过 0 - 6 的数值则发生跨周
Date.prototype.getWeekDate = function(weekDay)
{
    return new Date(this.getTime() + (weekDay - this.getDay()) * 1000 * 24 * 3600);
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    device_id: "",
    device_name: "",
    start_date: "",
    start_time: "",
    end_date : "",
    end_time : ""
  },
  bindPickerChange: async function(e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    console.log(e);
    this.setData({[e.currentTarget.dataset.data_name] : e.detail.value});
    this.refreshStatistics();
    console.log("eeeeeeeeee");
  },

  touchHandler: function (e) {
    console.log(lineChart.getCurrentDataIndex(e));
    lineChart.showToolTip(e, {
        // background: '#7cb5ec',
        format: function (item, category) {
            return category + ' ' + item.name + ':' + item.data 
        }
    });
}, 

refreshStatistics : async function (periodType)
{
  const { start_date, end_date, start_time, end_time } = this.data;
  console.log({ start_date, end_date, start_time, end_time });
  if ((start_date + " " + start_time) > (end_date + " " + end_time))
  {
    wx.showToast({
      title: '错误：\n开始时间大于结束时间。',
      icon: 'none',
      duration: 2000
    });
    return;
  }

  let statisticData, chartData;

  if (periodType=="day")
  {

    if (start_time.slice(0, 2) == end_time.slice(0, 2))
    {
      wx.showToast({
        title: '错误：小于一小时不能查询',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    statisticData = await this.getHourPowerStatistic(start_date.replaceAll("-", "") + start_time.slice(0, 2), end_date.replaceAll("-", "") + end_time.slice(0, 2));

    console.log("statisticData:");
    console.log(statisticData.hours);
    
    var  hours_keys = Object.keys(statisticData.hours)
    // console.log("hours_keys:");
    // console.log(hours_keys);

    // var  hours_values = Object.values(statisticData.hours)
    // console.log("hours_values:");
    // console.log(hours_values);
    
    var newhours = {};
   
     hours_keys.forEach(element => {
         //取出日期的后两位（2021061600、2021061601），即：00、01 时间点
         //console.log(element);
         newhours[" "+element.substr(8,2)] = statisticData.hours[element];   
     });

    console.log("newhours:");
    console.log(newhours);
        
    chartData = 
    {
      categories: Object.keys(newhours),
      data: Object.values(newhours)
    };
  }
  
  else
  {
      statisticData = await this.getDayPowerStatistic(start_date.replaceAll("-", ""), end_date.replaceAll("-", ""));
      console.log(statisticData);
      chartData = 
      {
        categories: Object.keys(statisticData.days),
        data: Object.values(statisticData.days)
      };
  }
  
  
  this.updateData(chartData);
  
},

showTodayStatistics : async function ()
{
  console.log("TTTTTTTTTTTTTTTTTTTT")
  let today = new Date();
  let start_date = today.Format("yyyy-MM-dd");
  let end_date = today.Format("yyyy-MM-dd");
  let start_time = "00:00";
  let end_time = "23:59";

  this.setData({start_date, start_time, end_date, end_time});
  this.refreshStatistics("day");

},

showCurWeekStatistics : async function ()
{
  let today = new Date();
  let weekStart = today.getWeekDate(0).Format("yyyy-MM-dd") ;
  let weekEnd = today.getWeekDate(6).Format("yyyy-MM-dd");
  let start_date = weekStart;
  let end_date = weekEnd;
  let start_time = "00:00";
  let end_time = "23:59";

  this.setData({start_date, start_time, end_date, end_time});
  this.refreshStatistics("week");

},

showCurMonthStatistics : async function ()
{
  let today = new Date();
  let monthStart = today.Format("yyyy-MM-01") ;
  let monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).Format("yyyy-MM-dd");
  let start_date = monthStart;
  let end_date = monthEnd;
  let start_time = "00:00";
  let end_time = "23:59";

  this.setData({start_date, start_time, end_date, end_time});
  this.refreshStatistics("month");

},

showCurYearStatistics : async function ()
{
  let today = new Date();
  let yearStart = new Date(today.getFullYear(), 0, 1).Format("yyyy-MM-dd") ;
  let yearEnd = new Date(today.getFullYear(), 12, 0).Format("yyyy-MM-dd");
  let start_date = yearStart;
  let end_date = yearEnd;
  let start_time = "00:00";
  let end_time = "23:59";

  console.log("yearStart:" + yearStart);
  console.log("yearEnd:" + yearEnd);

  this.setData({start_date, start_time, end_date, end_time});
  this.refreshStatistics("year");


},

getStatisticsData: function () {
  var categories = [];
  var data = [];
  for (var i = 0; i < 10; i++) {
      categories.push('2016-' + (i + 1));
      data.push(Math.random()*(20-10)+10);
  }
  // data[4] = null;
  return {
      categories: categories,
      data: data
  }
},

updateData: function (statisticData) {
  var chartData = statisticData;
  var series = [{
      name: this.data.device_name,
      data: chartData.data,
      format: function (val, name) {
          return val + '千瓦时';
      }
  }];
  lineChart.updateData({
      categories: chartData.categories,
      series: series
  });
},

getMonthPowerStatistic: async function (start_month, end_month)
{
  const params = {
    // name 云函数的名称，必须使用 ty-service
    name: "ty-service",
    data: {
        "action": "statistics.months",
        // params 接口参数
        "params": {
          "device_id": this.data.device_id, // 填写自己的设备 id
          "code":"add_ele",
          "start_month":start_month,
          "end_month":end_month
        }
    }
  };

  return await request(params);
},

getDayPowerStatistic: async function (start_day, end_day)
{
  const params = {
    // name 云函数的名称，必须使用 ty-service
    name: "ty-service",
    data: {
        "action": "statistics.days",
        // params 接口参数
        "params": {
          "device_id": this.data.device_id, // 填写自己的设备 id
          "code":"add_ele",
          "start_day":start_day,
          "end_day":end_day
        }
    }
  };

  return await request(params);
},

getHourPowerStatistic: async function (start_hour, end_hour)
{
  const params = {
    // name 云函数的名称，必须使用 ty-service
    name: "ty-service",
    data: {
        "action": "statistics.hours",
        // params 接口参数
        "params": {
          "device_id": this.data.device_id, // 填写自己的设备 id
          "code":"add_ele",
          "start_hour":start_hour,
          "end_hour":end_hour
        }
    }
  };

  return await request(params);
},

showPowerStatistic: async function (e)
{
  console.log(e);
  console.log(this.data);

  const params = {
    // name 云函数的名称，必须使用 ty-service
    name: "ty-service",
    data: {
        // action: "device.status",
        action: "statistics.quarters",
        // params 接口参数
        params: {
        "device_id": this.data.device_id, // 填写自己的设备 id
        "code":"add_ele",
        "start_quarter":"202105120000",
        "end_quarter":"202105121000"
        }
    }
  };

  const params1 = {
    // name 云函数的名称，必须使用 ty-service
    name: "ty-service",
    data: {
        // action: "device.status",
        "action": "statistics.days",
        // params 接口参数
        "params": {
          "device_id": this.data.device_id, // 填写自己的设备 id
          "code":"add_ele",
          "start_day":"20210410",
          "end_day":"20210512"
        }
    }
  };

  const params2 = {
    // name 云函数的名称，必须使用 ty-service
    name: "ty-service",
    data: {
        action: "statistics.allType",
        // params 接口参数
        params: {
        "device_id": this.data.device_id, // 填写自己的设备 id
        }
    }
  };

  const params3 = {
    // name 云函数的名称，必须使用 ty-service
    name: "ty-service",
    data: {
        // action: "device.status",
        "action": "statistics.hours",
        // params 接口参数
        "params": {
          "device_id": this.data.device_id, // 填写自己的设备 id
          "code":"add_ele",
          "start_hour":"2021051400",
          "end_hour":"2021051414"
        }
    }
  };

  const params4 = {
    // name 云函数的名称，必须使用 ty-service
    name: "ty-service",
    data: {
        action: "statistics.total",
        // params 接口参数
        params: {
        "device_id": this.data.device_id, // 填写自己的设备 id
        code : "add_ele"
        }
    }
  };
  console.log("----------------------------");
  console.log(await request(params3));
  console.log("----------------------------");
},

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    const { device_icon, device_name, device_id } = options;
    this.setData({ device_icon: `https://images.tuyacn.com/${device_icon}`, device_name, device_id });
    
    var windowWidth = 320;
    try {
        var res = wx.getSystemInfoSync();
        windowWidth = res.windowWidth;
    } catch (e) {
        console.error('getSystemInfoSync failed!');
    }
    
    var chartData = {categories: [""], data: [0]};
    console.log(chartData);
    lineChart = new wxCharts({
        canvasId: 'lineCanvas',
        type: 'line',
        categories: chartData.categories,
        animation: true,
        background: '#f5f5f5',
        series: [{
            name: device_name,
            data: chartData.data,
            format: function (val, name) {
                return val.toFixed(2) + '千瓦时';
            }
        }],
        xAxis: {
            title: '时间',
            disableGrid: true
        },
        yAxis: {
            title: '用电量 (千瓦时)',
            format: function (val) {
                return val;
            },
            min: 0
        },
        width: windowWidth,
        height: 200,
        dataLabel: false,
        dataPointShape: true,
        extra: {
            lineStyle: 'curve'
        }
    });

    this.showTodayStatistics();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})