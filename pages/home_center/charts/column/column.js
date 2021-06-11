var wxCharts = require('../../../../utils/wxcharts.js');
var app = getApp();
var columnChart = null;
var chartData = {
    main: {
        title: '本月总电量',
        data: [205, 120, 250, 150],
        categories: ['第1周', '第2周', '第3周', '第4周']
       },
    sub: [{
        title: '第1周电量',
        data: [70, 40, 65, 100, 34, 18, 30],
        categories: ['1', '2', '3', '4', '5', '6','7']
    }, {
        title: '第2周电量',
        data: [55, 30, 45, 36, 56, 13, 30],
        categories: ['1', '2', '3', '4', '5', '6','7']
    }, {
        title: '第3周电量',
        data: [76, 45, 32, 74, 54, 35, 30],
        categories: ['1', '2', '3', '4', '5', '6','7']             
    }, {
        title: '第4周电量',
        data: [76, 54, 23, 12, 45, 65, 30],
        categories: ['1', '2', '3', '4', '5', '6','7']
    }]
};
Page({
    data: {
        chartTitle: '总电量',
        isMainChartDisplay: true
    },
    backToMainChart: function () {
        this.setData({
            chartTitle: chartData.main.title,
            isMainChartDisplay: true
        });
        columnChart.updateData({
            categories: chartData.main.categories,
            series: [{
                name: '电量',
                data: chartData.main.data,
                format: function (val, name) {
                    return val + '度';
                }
            }]
        });
    },
    touchHandler: function (e) {
        var index = columnChart.getCurrentDataIndex(e);
        if (index > -1 && index < chartData.sub.length && this.data.isMainChartDisplay) {
            this.setData({
                chartTitle: chartData.sub[index].title,
                isMainChartDisplay: false
            });
            columnChart.updateData({
                categories: chartData.sub[index].categories,
                series: [{
                    name: '电量',
                    data: chartData.sub[index].data,
                    format: function (val, name) {
                        return val + '度';
                    }
                }]
            });

        }
    },
    onReady: function (e) {
        var windowWidth = 320;
        try {
          var res = wx.getSystemInfoSync();
          windowWidth = res.windowWidth;
        } catch (e) {
          console.error('getSystemInfoSync failed!');
        }

        columnChart = new wxCharts({
            canvasId: 'columnCanvas',
            type: 'column',
            animation: true,
            categories: chartData.main.categories,
            series: [{
                name: '电量',
                data: chartData.main.data,
                format: function (val, name) {
                    return val + '度';
                }
            }],
            yAxis: {
                format: function (val) {
                    return val + '度';
                },
                title: 'hello',
                min: 0
            },
            xAxis: {
                disableGrid: false,
                type: 'calibration'
            },
            extra: {
                column: {
                    width: 15
                }
            },
            width: windowWidth,
            height: 200,
        });
    }
});