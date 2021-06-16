// pages/home_center/timer_manage/index.js
import request from '../../../utils/request'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    device_name: "",
    timer_list: [],
    timer_category: "timer",
    catetorys: [ "timer", "countdown" ],
    time_zone_id: "Asia/Shanghai",
    time_zone: "+8:00",
    week_name: "日一二三四五六".split(""),
  },

  getTimerList: async function ()
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
    console.log("timer_list");
    console.log(timer_list);
    this.setData({timer_list});
  },

  jumpToEditTimerPage : function ()
  {
    const {device_id, device_name, device_icon } = this.data;
    wx.navigateTo({
      url: `../timer_edit_page/index?device_id=${device_id}&device_name=${device_name}&device_icon=${device_icon}`
    });
  },

  toggleEnableTimer: async function (e)
  {
    console.log(e);

    const param = {
      name: "ty-service",
      data:
      {
        "action": "timer.status",
        "params": {
          "device_id":this.data.device_id,
          "category":this.data.timer_category,
          "group_id":e.target.dataset.group_id,
          "status":e.detail.value ? "1" : "0"
        }
      }
    };
    
    console.log(await request(param));
    this.getTimerList();
  },

  nullFunction : function (e) {},
  
  deleteTimer: async function (group_id)
  {
    const param = {
      name: "ty-service",
      data:
      {
        "action": "timer.deleteByGroup",
        "params": {
          "device_id": this.data.device_id,
          "category": this.data.timer_category,
          "group_id": group_id
        }
      }
    };

    console.log(await request(param));
    this.getTimerList();
  },

  editTimer : async function (e)
  {
    let func = this.deleteTimer;
    const {device_id, device_name, device_icon } = this.data;
    wx.showActionSheet({
      itemList: ['编辑', '删除'],
       async success (res) {
        switch (res.tapIndex)
        {
          case 0:
            // 编辑定时器
            wx.navigateTo({
              url: `../timer_edit_page/index?timer_group_id=${e.currentTarget.dataset.timer_group_id}&device_id=${device_id}&device_name=${device_name}&device_icon=${device_icon}` ,
            });
            break;

          case 1:
            // 删除定时器
            func(e.currentTarget.dataset.timer_group_id);
            break;
        }
      },
      fail (res) {
        console.log(res.errMsg)
      }
    });
    console.log(e);
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const { device_icon, device_name, device_id } = options;
    // const { device_icon, device_name, device_id } = {device_id: "327508562cf43233d493", device_name: "aaa", device_icon: "smart/icon/1547483729ogjp5rjrqb_0.png"};
    
    console.log("options (device_name + device_id):");
    console.log(options.device_name +":" + options.device_id);

    this.setData({ device_icon: `https://images.tuyacn.com/${device_icon}`, device_name, device_id });

    this.getTimerList();
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
    this.getTimerList();
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