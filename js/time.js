/**
 * Created by wukangning on 4/11/16.
 */

/**
 * 为元素添加事件
 * @param option =
 * {
        startTime: '2016-01-01 00:00:00',  //时间线开始的时间
        endTime: '2016-01-02 00:00:00',  //时间线结束时间
        interval: '1',  //时间线滚动的时候滚动的间隔, 比如:一天  默认:1
        intervalUnit: 'hour',  //时间线滚动的时候的时间间隔单位,  比如:小时-hour (其他参数: minute, hour, day, month, year), 默认hour
        width: '800',  //时间轴的宽度, 单位px, 默认800px
        speed: '5',  //播放速度, 范围: 1~10, 默认5
        bgColor: '#333',  //时间线背景色
        frontColor: '#fff',  //时间线前景色
    }
 */

/**
 * 创建闭包, 实现私有函数和全局函数
 */
(function ($) {

    //声明需要用到全局变量
    var elem = null,
        controlBtnInitWidth = 29,  //控制按钮默认宽度
        playTimer = null,  //播放暂停的setInterval
        alreadyPlayCount = 0,  //已经循环播放的次数
        timeBubbleTimer = null,  //时间气泡改变setInterval
        startTime = 0,  //起始时间的时间戳
        endTime = 0,  //结束时间的时间戳
        timeBubbleArr = [],  //时间气泡的时间数组
        option = {};

    //dom节点
    var controlBar, timeBubble, startEndTime, timeLine,
        controlBtn, playBtn, railWay;

    //需要暴露出的初始化函数
    $.fn.timeLine = function (optionObj) {
        elem = $(this);
        option = optionObj;

        /**
         * 根据传入参数option, 设置时间轴的初始值
         */
        var setElementVal = function () {
            controlBar = $('#controlBar');
            timeBubble = $('#timeBubble');
            startEndTime = $('#startEndTime');
            timeLine = $('#timeLine');
            controlBtn = $('#controlBtn');
            playBtn = $('#playBtn');
            railWay = $('#railWay');

            //设置起始结束时间值
            startEndTime.find('p').eq(0).html(option.startTime);
            startEndTime.find('p').eq(1).html(option.endTime);

            //如果不是数字的话, 恢复默认值
            if (isNaN(option.interval))
                option.interval = 1;
            if (isNaN(option.width))
                option.width = 800;
            if (isNaN(option.intervalTime))
                option.intervalTime = 1000;
            if (!option.frontColor)
                option.frontColor = '#337AB7';
            if (!option.bgColor)
                option.bgColor = '#333';

            //判断传入日期是否合法
            if (option.startTime.split(' ').length != 2 && option.startTime.split('-').length != 3)
                return;

            //设置样式
            timeLine.css({
                'background-color': option.bgColor,
                'width': option.width + 'px'
            });
            railWay.css({
                'width': option.width - 100 + 'px'
            });
            startEndTime.css({
                'width': option.width - 50 + 'px'
            });
            timeBubble.css({
                'background-color': option.bgColor
            });
            controlBtn.css({
                'background-color': option.frontColor
            });
            playBtn.find('span').css({
                'border-right-color': option.frontColor,
                'border-left-color': option.frontColor
            });

            //计算时间气泡间隔数组
            fillTimeBubbleArr();

            //设置时间气泡值
            //判断时间间隔的单位
            switch (option.intervalUnit) {
                case 'minute':
                    if (option.interval > 60 || option.interval <= 0) {
                        option.interval = 1;
                    }

                    timeBubble.html(option.startTime.split(' ')[1]);
                    break;
                case 'hour':
                    if (option.interval > 24 || option.interval <= 0) {
                        option.interval = 1;
                    }

                    timeBubble.html(option.startTime);
                    break;
                case 'day':
                    if (option.interval > 30 || option.interval <= 0) {
                        option.interval = 1;
                    }

                    timeBubble.html(option.startTime);
                    break;
                case 'month':
                    if (option.interval > 12 || option.interval <= 0) {
                        option.interval = 1;
                    }

                    timeBubble.html(option.startTime);
                    break;
                case 'year':
                    if (option.interval > 100 || option.interval <= 0) {
                        option.interval = 1;
                    }

                    timeBubble.html(option.startTime);
                    break;
            }

            //如果是第一次初始化
            if(!option.isReset){
                //播放暂停按钮点击事件, 注册
                playBtnCLick();
            }

            //控制按钮播放进度控制
            controlBtnDrag();

            //轨道点击事件绑定
            railWayClick();

            //是否自动播放
            if (option.autoPlay) {
                if(option.callback){
                    controlBarPlay(option.callback);
                }else {
                    controlBarPlay();
                }

                //时间气泡自动改变函数
                timeBubbleChange();

                //改变按钮状态
                playBtnChange('playing');
            } else {
                //改变按钮状态
                playBtnChange('pause');
            }
        };

        /**
         * 初始化
         */
        var init = function () {
            //如果重复是次数
            if (!isNaN(option.repeat))
                alreadyPlayCount = option.repeat;

            //为元素添加时间线, 初始化绑定函数
            if(!option.isReset){
                elem.load('../html/time.html', setElementVal);
            }else {
                setElementVal();
            }
        };

        //执行初始化函数
        init();
    };

    /**
     * 所有用到的私有函数
     */
    /**
     * 计算时间气泡间隔, 并且填充到数组里面
     */
    function fillTimeBubbleArr() {
        var startYear = option.startTime.split('-')[0],
            startMonth = option.startTime.split('-')[1],
            startDay = option.startTime.split('-')[2].split(' ')[0],
            startHour = option.startTime.split(' ')[1].split(':')[0],
            startMinute = option.startTime.split(' ')[1].split(':')[1],
            startSecond = option.startTime.split(' ')[1].split(':')[2];

        var endYear = option.endTime.split('-')[0],
            endMonth = option.endTime.split('-')[1],
            endDay = option.endTime.split('-')[2].split(' ')[0],
            endHour = option.endTime.split(' ')[1].split(':')[0],
            endMinute = option.endTime.split(' ')[1].split(':')[1],
            endSecond = option.endTime.split(' ')[1].split(':')[2];

        //清空时间旗袍的数组
        timeBubbleArr.length = 0;

        startTime = (new Date(startYear, startMonth - 1, startDay, startHour, startMinute, startSecond, 0)).valueOf();
        endTime = (new Date(endYear, endMonth - 1, endDay, endHour, endMinute, endSecond, 0)).valueOf();

        var midTime = new Date(startTime);

        switch (option.intervalUnit) {
            case 'minute':
                //计算每个时间间隔的毫秒数
                for (; midTime <= endTime;) {
                    //设置气泡时间的值
                    timeBubbleArr.push(midTime.getHours() + ':' + midTime.getMinutes() + ':' + midTime.getSeconds());

                    //设置增加一个时间间隔后的时间
                    midTime.setMinutes(midTime.getMinutes() + option.interval);
                }
                break;
            case 'hour':
                //计算每个时间间隔的毫秒数
                for (; midTime <= endTime;) {
                    //设置气泡时间的值
                    timeBubbleArr.push(midTime.getFullYear() + '-' + (midTime.getMonth() + 1) + '-' + midTime.getDate() + ' ' + midTime.getHours() + ':' + midTime.getMinutes() + ':' + midTime.getSeconds());

                    //设置增加一个时间间隔后的时间
                    midTime.setHours(midTime.getHours() + option.interval);
                }
                break;
            case 'day':
                //计算每个时间间隔的毫秒数
                for (; midTime <= endTime;) {
                    //设置气泡时间的值
                    timeBubbleArr.push(midTime.getFullYear() + '-' + (midTime.getMonth() + 1) + '-' + midTime.getDate());

                    //设置增加一个时间间隔后的时间
                    midTime.setDate(Number(midTime.getDate() + option.interval));
                }
                break;
            case 'month':
                //计算每个时间间隔的毫秒数
                for (; midTime <= endTime;) {
                    //设置气泡时间的值
                    timeBubbleArr.push(midTime.getFullYear() + '-' + (midTime.getMonth() + 1) + '-' + midTime.getDate());

                    //设置增加一个时间间隔后的时间
                    midTime.setMonth(Number(midTime.getMonth() + option.interval));
                }
                break;
            case 'year':
                //计算每个时间间隔的毫秒数
                for (; midTime <= endTime;) {
                    //设置气泡时间的值
                    timeBubbleArr.push(midTime.getFullYear() + '-' + (midTime.getMonth() + 1) + '-' + midTime.getDate());

                    //设置增加一个时间间隔后的时间
                    midTime.setYear(Number(midTime.getYear() + option.interval));
                }
                break;
        }
    }

    /**
     * 播放按钮效果
     */
    function playBtnChange(state) {
        var playBtn = $('#playBtn');

        if (state == 'pause') {
            //按钮变成播放状态
            $("#playBtnRight").animate({
                borderTopWidth: "5px",
                borderBottomWidth: "5px",
                borderRightWidth: "0",
                borderLeftWidth: "8px",
                marginLeft: '0',
                marginTop: '5px',
                width: "0",
                height: "0"
            });
            $("#playBtnLeft").animate({
                borderTopWidth: "5px",
                borderBottomWidth: "5px",
                borderRightWidth: "0",
                borderLeftWidth: "8px",
                width: "0",
                height: "10px"
            });

            playBtn.attr('state', 'playing');
        } else {
            //变成暂停状态
            $("#playBtnRight").animate({
                borderTopWidth: "0px",
                borderBottomWidth: "0px",
                borderRightWidth: "0px",
                borderLeftWidth: "6px",
                marginLeft: '4px',
                marginTop: '0px',
                width: "0px",
                height: "20px"
            });
            $("#playBtnLeft").animate({
                borderTopWidth: "0px",
                borderBottomWidth: "0px",
                borderRightWidth: "0px",
                borderLeftWidth: "6px",
                width: "0px",
                height: "20px"
            });

            playBtn.attr('state', 'pause');
        }
    }


    /**
     * 播放暂停按钮点击事件
     */
    function playBtnCLick() {
        // var playBtn = $('#playBtn');
        elem.on('click', '#playBtn', function (e) {
            var state = $(this).attr('state');

            if (state == 'pause') {
                //执行播放处理...
                controlBarPause();

                $(this).attr('state', 'playing');

                //气泡日期停止改变
                timeBubbleTimerPause();
            } else {
                //执行暂停处理...
                controlBarPlay();

                $(this).attr('state', 'pause');

                //气泡日期继续改变
                timeBubbleChange();
            }
        });
    }

    /**
     * 控制按钮播放进度控制
     */
    function controlBtnDrag() {
        var mouseState = 'unpress',  //鼠标按下状态
            offsetLeft = 0;  //control bar 左边距离浏览器左边的距离

        //鼠标按下控制按钮
        elem.on('mousedown', '#controlBtn', function (e) {
            $(this).css('opacity', .8);
            mouseState = 'press';

            //气泡日期停止改变
            timeBubbleTimerPause();
        });

        //鼠标拖动控制按钮
        elem.on('mousemove', '#timeLine', function (e) {
            var railWayWidth = $('#railWay').width();

            //获取control bar距离浏览器左边的距离
            offsetLeft = controlBar.offset().left;

            //计算控制条的宽度值
            var controlBarWidth = e.pageX - offsetLeft + 25;

            //设置控制按钮位置
            if (mouseState == 'press' && controlBarWidth >= controlBtnInitWidth && controlBarWidth <= railWayWidth) {
                if (controlBar.width() < controlBtnInitWidth) {
                    controlBar.width(controlBtnInitWidth);
                } else {
                    controlBar.width(controlBarWidth);
                }

                //设置时间气泡应该显示的日期
                toChangeTimeBubble(controlBar.width());
            }

            //设置时间气泡位置
            timeBubble.css('left', controlBar.width() - 25 + 'px');
        });

        //鼠标松开控制按钮
        elem.on('mouseup', '#timeLine', function (e) {
            $(this).css('opacity', 1);
            mouseState = 'unpress';
        });

        //鼠标离开控制按钮
        elem.on('mouseleave', '#timeLine', function (e) {
            $(this).css('opacity', 1);
            mouseState = 'unpress';
        });
    }

    /**
     * 自动播放动画
     * @param callback  --每播放一个间隔的回调函数
     */
    function controlBarPlay(callback) {
        var count = 0;

        //改变播放暂停按钮状态
        playBtnChange('playing');

        //播放
        playTimer = setInterval(function () {
            controlBar.width(controlBar.width() + 1);

            //设置时间气泡位置
            timeBubble.css('left', controlBar.width() - 25 + 'px');

            //判断是否达到了间隔一次的时间, 如果达到, 执行回调函数
            if (!(count % (railWay.width() / timeBubbleArr.length)) && callback) {
                callback(timeBubble.html());
            }

            //如果宽度到达轨道的宽度, 恢复到按钮宽度大小
            if (controlBar.width() >= railWay.width()) {
                controlBar.width(controlBtnInitWidth);

                //根据传入参数判断是否循环执行
                if (option.repeat == 'forever') {
                    controlBar.width(controlBtnInitWidth);
                    timeBubble.css('left', '3px');
                } else if (alreadyPlayCount <= 1) {
                    clearInterval(playTimer);

                    //改变播放暂停按钮状态
                    playBtnChange('pause');

                    //气泡日期停止改变
                    timeBubbleTimerPause();

                    //改变时间气泡
                    toChangeTimeBubble(controlBar.width());

                    controlBar.width(controlBtnInitWidth);
                    timeBubble.css('left', '3px');
                } else if (alreadyPlayCount > 0) {
                    controlBar.width(controlBtnInitWidth);
                    timeBubble.css('left', '3px');
                    //更新播放次数
                    alreadyPlayCount--;
                } else {
                    //改变播放暂停按钮状态
                    playBtnChange('pause');
                    clearInterval(playTimer);

                    //气泡日期停止改变
                    timeBubbleTimerPause();

                    //改变时间气泡
                    toChangeTimeBubble(controlBar.width());
                }
            }

            count++;
        }, timeBubbleArr.length * option.intervalTime / railWay.width());
    }

    /**
     * 控制栏暂停按钮
     */
    function controlBarPause() {
        //改变播放按钮样式
        playBtnChange('pause');

        //停止播放
        clearInterval(playTimer);

        console.log("暂停")
        //气泡日期停止改变
        timeBubbleTimerPause();
    }

    /**
     * 轨道点击事件处理, 改变播放进度
     */
    function railWayClick() {
        var railWay = $('#railWay'),
            controlBar = $('#controlBar'),
            timeBubble = $('#timeBubble'),
            offsetLeft = 0;  //control bar 左边距离浏览器左边的距离

        railWay.on('mousedown', function (e) {
            //改变播放按钮状态
            playBtnChange('pause');

            //获取control bar距离浏览器左边的距离
            offsetLeft = controlBar.offset().left;

            //计算控制条的宽度值
            var controlBarWidth = e.pageX - offsetLeft + 15;

            controlBar.width(controlBarWidth);

            //设置时间气泡应该显示的日期
            toChangeTimeBubble(controlBar.width());

            //设置时间气泡位置
            timeBubble.css('left', controlBar.width() - 25 + 'px');

            //暂停播放
            controlBarPause();

            //气泡日期停止改变
            timeBubbleTimerPause();
        });
    }

    /**
     * 气泡日期改变
     */
    function timeBubbleChange() {
        var sumTime = option.width * option.width / 10 / option.speed,  //一个循环的总毫秒数
            count,  //间隔数量
            timeDuration = 1000;  //默认的时间间隔毫秒数


        //间隔次数
        count = Math.floor((endTime - startTime) / timeDuration + 1);

        timeBubbleTimer = setInterval(function () {
            toChangeTimeBubble(controlBar.width());
        }, Math.floor(sumTime / (count + 1)));
    }

    /**
     * 暂停气泡时间改变
     */
    function timeBubbleTimerPause() {
        clearInterval(timeBubbleTimer);
    }

    /**
     * 根据点击轨道的位置或者控制按钮滑动到的位置, 设置时间气泡应该显示的日期
     * @param distance  --当前controlBar的宽度, 也就是当前播放的进度
     */
    function toChangeTimeBubble(distance) {
        var range = railWay.width() / (timeBubbleArr.length);

        //计算当前按钮在哪个区域
        var number = parseInt(distance / range);

        timeBubble.html(timeBubbleArr[number]);
    }



    /**
     * 需要暴露出的设置函数, 用户使用
     */
    /**
     * 获取气泡时间
     */
    $.fn.timeLine.getBubbleTime = function () {
        return timeBubble.html();
    };

    /**
     * 停止播放
     */
    $.fn.timeLine.stopPlay = function () {
        clearInterval(playTimer);

        //改变播放暂停按钮状态
        playBtnChange('pause');

        //气泡日期停止改变
        timeBubbleTimerPause();

        controlBar.width(controlBtnInitWidth);

        //改变时间气泡
        toChangeTimeBubble(controlBar.width());

        timeBubble.css('left', '3px');
    };

    /**
     * 暂停播放
     */
    $.fn.timeLine.pausePlay = function () {
        controlBarPause();
    };

    /**
     * 播放
     */
    $.fn.timeLine.resumePlay = function () {
        //时间气泡改变
        timeBubbleChange();

        if(option.callback){
            controlBarPlay(option.callback);
        }else {
            controlBarPlay();
        }
    };

    /**
     * 重新设置属性
     * @param optionBySet  ---重设属性对象
     */
    $.fn.timeLine.setOption = function (optionBySet) {
        //先停止播放
        $.fn.timeLine.stopPlay();

        //循环复制原本属性, 为了保证原本的属性有效
        for(var prop in option){
            //如果此属性没有被重新赋值, 取旧值
            if(!optionBySet[prop]){
                optionBySet[prop] = option[prop];
            }
        }

        //告诉控件, 这是重设option
        optionBySet.isReset = true;

        //重新设置传入的属性
        elem.timeLine(optionBySet);
    };

})(jQuery);

