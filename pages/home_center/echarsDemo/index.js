// import * as echarts from '../../components/ec-canvas/echarts';
import { getDevFunctions, getDeviceDetails, deviceControl ,getElectricity,getTotalElectricity,getDayElectricity,getMonthElectricity,getHourElectricity} from '../../../utils/api/device-api'
import wxMqtt from '../../../utils/mqtt/wxMqtt'
import request from '../../../utils/request';

var wxCharts = require('../../../utils/wxcharts.js');
const app = getApp();
var lineChart = null;
var windowW=0;

Page({

  /**
   * 页面的初始数据
   */
  data: {

    loading: true,
    device_name: '',
    titleItem: {
      name: '',
      value: '',
    },
    
    roDpList: {}, //只上报功能点
    rwDpList: {}, //可上报可下发功能点
    isRoDpListShow: false,
    isRwDpListShow: false,
    
    Power:'',
    Volage:'',
    Current:'',
    TotalPower:'0',
    keys:'',
    value:'',
    StartDay:"选择起始日期",
    EndDay:"选择结束日期",
    StartMonth:"选择起始月份",
    EndMonth:"选择结束月份",
    StartHours:"选择起始小时",
    EndHours:"选择结束小时",
    Searchflag:''
  },

 /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const { device_id } = options
    this.setData({ device_id })
    // console.log(device_id);

    // mqtt消息监听
    wxMqtt.on('message', (topic, newVal) => {
        const { status } = newVal
        this.updateStatus(status)
        // console.log(status);
        var num =Object.getOwnPropertyNames(status).length;
        // console.log(num);
        // console.log(typeof(status));

        var a='0';
        var b='1';
        var c='2';
        if ( Object.getOwnPropertyNames(status).length > 3 ){
          this.setData({
            Power:status[b].value/10,
            Volage:status[c].value/10,
            Current:status[a].value/1000
          })
        }
        else{
          this.setData({
            Power:this.data.Power,
            Volage:this.data.Volage,
            Current:this.data.Current,
          })
        }
    })

    // 屏幕宽度
    this.setData({
        imageWidth: wx.getSystemInfoSync().windowWidth
    });
    // console.log(this.data.imageWidth) ;
     
    //计算屏幕宽度比列
    windowW = this.data.imageWidth/375;
    // console.log(windowW);

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: async  function () {
    const { device_id } = this.data

    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 1 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    var endDayCode = year + month + strDate;
    date.setDate(date.getDate() - 7);       //天数-7
    var nd=date.getFullYear()+ '-' + (date.getMonth()+1)+ '-' + date.getDate();//新日期

    var starDayCode = nd.toString();
    var startYear = starDayCode.split('-')[0];        //将年离出
    var startMonth = starDayCode.split('-')[1];         //将月数据分离出
    var startDay = starDayCode.split('-')[2];         //将日数据分离出
    if (startMonth >= 1 && startMonth <= 9) {
       startMonth = "0" + startMonth;
    }
    if (startDay >= 1 && startDay <= 9) {
        startDay = "0" + startDay;
    }
    starDayCode = startYear.toString()+startMonth.toString()+startDay.toString();
    if ( this.data.Searchflag == '')
    {
      var xx = await getDayElectricity(device_id,'add_ele',starDayCode,endDayCode).then(res => {
          // console.log(res.days); 
          this.setData({
              keys : Object.keys(res.days),
              value :Object.values(res.days)
          })   
      })
    }
    await this.UpdateEchars();
    // console.log(keys)
    // console.log(value);
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: async function () {
    const { device_id } = this.data
    const [{ name, status, icon }, { functions = [] }] = await Promise.all([
      getDeviceDetails(device_id),
      getDevFunctions(device_id),
    ]);
    // console.log(device_id);
    this.setData({
      loading: false
    })

    //查询本月用电总量
    this.queryMonthElectricity();

    //自定义toast的调用
    this.toast = this.selectComponent("#toast");

    //获得上传下发list
    const { roDpList, rwDpList } = this.reducerDpList(status, functions)

    // 获取头部展示功能点信息
    let titleItem = {
      name: '',
      value: '',
    };
    if (Object.keys(roDpList).length > 0) {
      let keys = Object.keys(roDpList)[0];
      titleItem = roDpList[keys];
    } else {
      let keys = Object.keys(rwDpList)[0];
      titleItem = rwDpList[keys];
    }

    const roDpListLength = Object.keys(roDpList).length
    const isRoDpListShow = Object.keys(roDpList).length > 0
    const isRwDpListShow = Object.keys(rwDpList).length > 0

    this.setData({ titleItem, roDpList, rwDpList, device_name: name, isRoDpListShow, isRwDpListShow, roDpListLength, icon })
  },

  // 分离只上报功能点，可上报可下发功能点
  reducerDpList: function (status, functions) {
    // 处理功能点和状态的数据
    let roDpList = {};
    let rwDpList = {};
    if (status && status.length) {
      status.map((item) => {
        const { code, value } = item;
        let isExit = functions.find(element => element.code == code);
        if (isExit) {
          let rightvalue = value
          // 兼容初始拿到的布尔类型的值为字符串类型
          if (isExit.type === 'Boolean' && typeof value === 'string') {
            rightvalue = value === 'true'
          }
          rwDpList[code] = {
            code,
            value: rightvalue,
            type: isExit.type,
            values: isExit.values,
            name: isExit.name,
          };
        } else {
          roDpList[code] = {
            code,
            value,
            name: code,
          };
        }
      });
    }
    return { roDpList, rwDpList }
  },

  // 发送dp点
  sendDp: function (dpCode, value) {
    const { device_id } = this.data
    deviceControl(device_id, dpCode, value)
  },

  updateStatus: function (newStatus) {
    let { roDpList, rwDpList, titleItem } = this.data

    newStatus.forEach(item => {
      const { code, value } = item

      if (typeof roDpList[code] !== 'undefined') {
        roDpList[code]['value'] = value;
      } else if (rwDpList[code]) {
        rwDpList[code]['value'] = value;
      }
    })

    // 更新titleItem
    if (Object.keys(roDpList).length > 0) {
      let keys = Object.keys(roDpList)[0];
      titleItem = roDpList[keys];
    } else {
      let keys = Object.keys(rwDpList)[0];
      titleItem = rwDpList[keys];
    }

    this.setData({ titleItem, roDpList: { ...roDpList }, rwDpList: { ...rwDpList } })
  },

  //  查询本月总用电量
  queryMonthElectricity:function(){
    const { device_id } = this.data;
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth()+ 1;
    if (month >= 1 && month <= 9) {
      month = "0" + month;
    }
    var MonthCode = year + month ;

    getMonthElectricity(device_id,'add_ele',MonthCode,MonthCode).then(res => {
      // console.log(res.months);
      var a = MonthCode;
      // console.log(res.months[a]);
      this.setData({
        TotalPower : res.months[a]
      })
    })
  },

  //  设置查询起始日期(设置查询开始天数)
  SelectStartDay: async function(event){
      var Day_t =event.detail.value;

      var year = Day_t.split('-')[0];          //将年数据分离出
      var month = Day_t.split('-')[1];         //将月数据分离出
      var day = Day_t.split('-')[2];           //将日数据分离出
        
      var tempday = year + month + day         //将数据合并（例如2021 01 01 => 20210101）
      // console.log(tempday);
      // console.log(typeof(tempday));
      this.setData({
        StartDay:tempday
      })
  },

  //  设置查询结束日期(设置查询结束天数)
  SelectEndDay: async function(event){
      var Day_t =event.detail.value;
      
      var year = Day_t.split('-')[0];          //将年数据分离出
      var month = Day_t.split('-')[1];         //将月数据分离出
      var day = Day_t.split('-')[2];           //将日数据分离出
        
      var tempday = year + month + day         //将数据合并（例如2021 01 01 => 20210101）
      // console.log(tempday);
      // console.log(typeof(tempday));
      this.setData({
        EndDay:tempday
      })
  },

  //  开始查询日期(按照设置的天数)
  StartDaySearch: async function (event) {
      const { device_id } = this.data;
      if ( ( this.data.StartDay  != '') && ( this.data.EndDay  != '')) {

        var xx = await getDayElectricity(device_id,'add_ele',this.data.StartDay,this.data.EndDay).then(res => {
          console.log(res.days);
          this.setData({
              keys : Object.keys(res.days),
              value :Object.values(res.days),
              Searchflag: 1
          })
        })
        console.log(this.data.keys);
        console.log(this.data.value);
        await this.UpdateEchars();
      }
  },

  //  设置查询起始月份 （设置查询开始月份)
  SelectStartMonth: async function(event){

  var Day_t =event.detail.value;
  console.log(Day_t);
  var year = Day_t.split('-')[0];          //将年数据分离出
  var month = Day_t.split('-')[1];         //将月数据分离出   
  var tempday = year + month         //将数据合并（例如2021 01  => 202101）

  this.setData({
    StartMonth:tempday
  })
  },

  //  设置查询结束月份 (设置查询结束月份)
  SelectEndMonth: async function(event){

    var Day_t =event.detail.value;
    var year = Day_t.split('-')[0];          //将年数据分离出
    var month = Day_t.split('-')[1];         //将月数据分离出   
    var tempday = year + month        //将数据合并（例如2021 01 => 20210101）

    this.setData({
       EndMonth:tempday
   })
  },

  //  开始查询月份 (按照设置的月份 )
  StartMonthSearch: async function (event) {
      const { device_id } = this.data;
      if ( ( this.data.StartMonth  != '') && ( this.data.EndMonth  != '')) {

        var xx = await getMonthElectricity(device_id,'add_ele',this.data.StartMonth,this.data.EndMonth).then(res => {
            console.log(res.months);
            this.setData({
                keys : Object.keys(res.months),
                value :Object.values(res.months),
                Searchflag: 2
            })
        })
        console.log(this.data.keys);
        console.log(this.data.value);
        await this.UpdateEchars();
      }
      
  },

  //  设置查询起始小时 （设置查询开始小时)
  SelectStartHour: async function(event){

      var date = new Date();
      var year = date.getFullYear();
      var month = date.getMonth() + 1;
      var strDate = date.getDate();
      if (month >= 1 && month <= 9) {
          month = "0" + month;
      }
      if (strDate >= 1 && strDate <= 9) {
          strDate = "0" + strDate;
      }
      var endDayCode = year + month + strDate;

      var Day_t = event.detail.value;
      console.log(Day_t);
      var hour = Day_t.split(':')[0];          //将小时数据分离出
      var tempday = endDayCode + hour;        //将数据合并（例如2021 01  => 202101）
      console.log(tempday);
      this.setData({
          StartHours:tempday
      })
  },

  //  设置查询结束小时 (设置查询结束小时)
  SelectEndHour: async function(event){

      var date = new Date();
      var year = date.getFullYear();
      var month = date.getMonth() + 1;
      var strDate = date.getDate();
      if (month >= 1 && month <= 9) {
          month = "0" + month;
      }
      if (strDate >= 1 && strDate <= 9) {
          strDate = "0" + strDate;
      }

      var Day_t =event.detail.value;
      var hour = Day_t.split(':')[0];          //将小时数据分离出 
      var tempday = year + month + strDate+ hour        //将数据合并（例如2021 01 => 20210101）
      console.log(tempday);
      this.setData({
          EndHours:tempday
      })
  },

  //  开始查询月份 (按照设置的月份 )
  StartHourSearch: async function (event) {

      const { device_id } = this.data;
      if ( ( this.data.StartHour  != '') && ( this.data.EndHour  != '')) {
        var xx = await getHourElectricity(device_id,'add_ele',this.data.StartHours,this.data.EndHours).then(res => {
          console.log(res.hours);
          this.setData({
              keys : Object.keys(res.hours),
              value :Object.values(res.hours),
              Searchflag: 3
          })
        })
        console.log(this.data.keys);
        console.log(this.data.value);
        await this.UpdateEchars();
      }  
  },

  //更新图表数据内容
  UpdateEchars: async function(){
    new wxCharts({
      canvasId: 'lineCanvas',
      type: 'line',
      categories: this.data.keys,
      animation: true,
      background: '#f5f5f5',
      series: [{
      name: '用电量',
      data: this.data.value,
          format: function (val, name) {
            return val + 'kwh';
          }
        }],
        xAxis: {
          disableGrid: true
        },
        yAxis: {
          title: '用电量( Kwh )',
          format: function (val) {
            return val;
          },
          min: 0
        },
        width: (375 * windowW),
        height: (200 * windowW),
        dataLabel: false,
        dataPointShape: true,
        extra: {
          lineStyle: 'curve'
        }
    });
  }
})
