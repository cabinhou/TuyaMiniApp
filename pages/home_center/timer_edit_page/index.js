// pages/home_center/timer_edit_page/index.js
import request from '../../../utils/request'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    device_name: "",
    alias_name:"",
    timer_list: [],
    timer_category: "timer",
    time_zone_id: "Asia/Shanghai",
    time_zone: "+8:00",
    switch_action_on: true,
    time: "00:00",
    is_loop: true,
    loops: "0000000",
    loops_ar : [],
    date: "2021-12-20",
    week_name: "日一二三四五六".split(""),
    is_countdown: false,
    countdown : "00:00",
    categorys : [ "timer", "countdown" ],
    today: new Date()
  },
  
  getTimerInfo: async function (timer_group_id)
  {
    const param = {
      name: "ty-service",
      data:
      {
        "action": "timer.listByCategory",
        "params": {
          "device_id": this.data.device_id,
          "category": this.data.timer_category
        }
      }
    };

    let timer_list = await request(param);
    for (let timer_info of timer_list["groups"])
    {
      if (timer_info.id == timer_group_id)
      {
        return timer_info["timers"][0];
      }
    }

    return {};
  },

  addOrEditTimer: async function()
  {
    this.data.timer_category = "timer";
    if (this.data.is_countdown)
    {
      let ar = this.data.countdown.split(":");
      let timer_time = new Date(new Date().getTime() + (ar[0] * 60 + ar[1]) * 1000);
      this.data.date = timer_time.Format("yyyyMMdd");
      this.data.time = timer_time.Format("hh:mm");
      this.data.loops = "0000000";
      // 没做区分，最后都显示为定时器
      // this.data.timer_category = "countdown";
    }
    
    let param = {
      name: "ty-service",
      data:
      {
        "action": "timer.add",
        "params": {
          "device_id":this.data.device_id,
          "loops":this.data.loops,
          "alias_name": this.data.alias_name,
          "category":this.data.timer_category,
          "timezone_id":this.data.time_zone_id,
          "time_zone":this.data.time_zone,
          "status": 1,
          "instruct":[
              {
                "functions":[
                  {
                    "code":"switch",
                    "value":this.data.switch_action_on
                  }
                ],
                "date":this.data.date.replaceAll("-", ""),
                "time":this.data.time
              }
          ]
        }
      }
    };

    console.log("param");
    console.log(param);
    console.log(this.data);
    if (! this.data.is_loop)
    {
      this.data.loops = "0000000";
      param.data.params.loops = "0000000";
    }

    if (this.data.loops != "0000000")
    {
      delete(param.data.params.instruct[0].date);
    }

    // 如果有组 id，说明是编辑定时器
    if (this.data.timer_group_id)
    {
      param.data.params.group_id = this.data.timer_group_id;
      param.data.action = "timer.edit";
    }
    console.log(param);
    console.log(await request(param));
    wx.navigateBack({
      delta: 1,
    });
  },

  onInputBlur: function (e)
  {
     let alias_name = e.detail.value;
     this.setData({alias_name});
     console.log({alias_name});
  },

  onSwitchChange: function(e)
  {
    console.log(e);
    this.setData({ [e.currentTarget.dataset.bind_var_name] : e.detail.value });
    console.log(this.data)
  },

  onWeekdayChange: function(e)
  {
    console.log(e.currentTarget);
    console.log(this.data.loops_ar)
    this.data.loops_ar[e.currentTarget.dataset.weekday] = e.detail.value ? "1" : "0";
    let loops = this.data.loops_ar.join("");
    console.log(this.data.loops_ar);
    this.setData({loops});
  },

  bindPickerChange: async function(e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({[e.currentTarget.dataset.bind_var_name] : e.detail.value});
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    const { device_icon, device_name, device_id, timer_group_id } = options;
    // const { device_icon, device_name, device_id } = {device_id: "327508562cf43233d493", device_name: "aaa", device_icon: "smart/icon/1547483729ogjp5rjrqb_0.png"};
    console.log(timer_group_id);
    this.setData({ device_icon: `https://images.tuyacn.com/${device_icon}`, device_name, device_id, timer_group_id});

    let loops, status, time, timer_id, date, alias_name, loops_ar, switch_action_on, is_loop;
    var timer_info;
    
    switch_action_on = true;
    loops = this.data.loops;
    date = new Date().Format("yyyy-MM-dd");
    time = "00:00";
    is_loop = true;
    
    if (timer_group_id)
    {
      timer_info = await this.getTimerInfo(timer_group_id);
      console.log(timer_info);
      if (timer_info.hasOwnProperty("timer_id"))
      {
        loops = timer_info.loops;
        time = timer_info.time;
        if (loops == "0000000")
          date = timer_info.date.slice(0, 4) + "-" + timer_info.date.slice(4, 6)+ "-" + timer_info.date.slice(6, 8);
        alias_name = timer_info.alias_name;
        timer_id = timer_info.timer_id;
        status = timer_info.status;
        switch_action_on = timer_info.functions[0].value;
      }
    }
    loops_ar = loops.split("");
    if (loops == "0000000")
      is_loop = false;

    console.log({ loops, status, time, timer_id, date, alias_name, switch_action_on })
    this.setData({ loops_ar, loops, is_loop, status, time, timer_id, date, alias_name, switch_action_on });
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