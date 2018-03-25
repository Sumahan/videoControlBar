//自定义视频控制条样式
;(function($, document) {
	var VideoControl = function(element, options) {
			this.$doc = $(document);
			this.$ele = element;
			this.options = options ? options : '';

			this.$videoControl = this.$ele.next('.video-control');
			this.$videoProgress = $('.video-progress', this.$videoControl);
			this.$videoProgressBar = this.$videoProgress.find('.video-progress-bar');
			this.$videoProgressPoint = this.$videoProgress.find('.video-progress-bar');

			this.$videoVolume = $('.video-volume', this.$videoControl);
			this.$videoVolumeBar = this.$videoVolume.find('.video-volume-bar');
			this.$videoVolumePoint = this.$videoVolume.find('video-volume-point');

			this.$fullscreenSwitch = $('.fullscreen-switch', this.$videoControl);
			this.$pausePlaySwitch = $('.pause-paly-switch', this.$videoControl);
			this.$volumeSwitch = $('.volume-switch', this.$videoControl)
			this.maxduration = '';

			//判断浏览器是否支持video
			this.hasVideo = !!(this.$ele[0].canPlayType);

			this.setProgressLoca();
			this.volumeInit();
			this.videoSwitch();
			this.volumeSwitch();
			this.fullScreenSwitch();
			//视频元数据已加载
			this.$ele.on('loadedmetadata', $.proxy(function() {
				this.maxduration = this.$ele[0].duration;  //视频长度 单位s
				$('#total-time').text(this.initTimeLength(this.maxduration));//计算总时长
			}, this));

		}
		/*根据鼠标拖拽位置设置进度条*/
	VideoControl.prototype.setProgressLoca = function() {
			var flag = false;
			var flag1 = false;
			var that = this;
			this.$videoProgress.on('mousedown', function(e) {
				flag = true;
				that.setProgress(e.pageX);
			});
			this.$doc.on('mouseup', function(e) {
				if (flag) {
					flag = false;
					that.setProgress(e.pageX);
				}
			});
			this.$doc.on('mousemove', function(e) {
				if (flag) {
					that.setProgress(e.pageX);
				}
			});

			this.$videoVolume.on('mousedown', function(e) {
				flag1 = true;
				that.setVolume(e.pageX);
			});
			this.$doc.on('mouseup', function(e) {
				if (flag1) {
					flag1 = false;
					that.setVolume(e.pageX);
				}

			});
			this.$doc.on('mousemove', function(e) {
				if (flag1) {
					that.setVolume(e.pageX);
				}
			});
			if (!this.$ele.attr('autoplay')) {
				this.$pausePlaySwitch.removeClass('pause');
			}
		}
	/*获取鼠标拖拽的值设置进度条*/
	VideoControl.prototype.setProgress = function(mousepos) {
		var percenter = this.setWidth(this.$videoProgress, mousepos, 1);
		this.$ele[0].currentTime = this.maxduration * percenter / 100; //当前时间=视频总时长*进度条进度
	}
	/*volume*/
	VideoControl.prototype.setVolume = function(mousepos) {
		var percenter = this.setWidth(this.$videoVolume, mousepos, 1);
		this.$ele[0].volume = percenter / 100; 
	}
	//第一次默认最大音量，之后根据历史记录设置音量
	VideoControl.prototype.volumeInit=function(){
		this.setWidth(this.$videoVolume,'1',0)
	}
	/*switch play pause*/
	VideoControl.prototype.videoSwitch = function() {
			var that = this;
			this.$pausePlaySwitch.on('click', function(e) {
				if (that.$ele[0].ended) {
					var agent = navigator.userAgent.toLowerCase();
					//IE
					if (agent.indexOf("msie") > 0) {
						setTimeout(function() {
							that.$ele[0].play();
							that.$pausePlaySwitch.removeClass('pause');
						});
					}
				}
				if (that.$ele[0].paused) {
					that.$ele[0].play();
					that.$pausePlaySwitch.removeClass('pause');
				} else {
					that.$ele[0].pause();
					that.$pausePlaySwitch.addClass('pause');
				}
				});
			//当目前的播放位置已更改时触发timeupdate事件
			this.$ele.on('timeupdate', function() {
				var currentSource = that.$ele[0].currentTime; //随视频播放获取当前播放到的时间
				that.setWidth(that.$videoProgress, currentSource, 0); //根据当前时间设置进度条进度

				$('#current-time').text(that.initTimeLength(currentSource)); //更新当前时间
				$('#total-time').text(that.initTimeLength(that.maxduration));  
			})
		}
		
		/*switch volume*/
	VideoControl.prototype.volumeSwitch = function() {
		var that = this;
		this.$volumeSwitch.on('click', function() {
			if (!that.$ele[0].muted) {  //muted=true 视频静音  muted=false打开声音 视频音量大小0-1
				that.$ele[0].muted = true;
				that.setWidth(that.$videoVolume, '0', 0) //第二个参数0 代表视频静音
			} else {
				that.$ele[0].muted = false;
				that.setWidth(that.$videoVolume, '1', 0)  //第二个参数1 视频声音调到最大
			}
		});
	}
	/*设置进度条的宽度和原点的margin-left值*/
	VideoControl.prototype.setWidth = function(obj, pos, type) {
		var point = type ? pos - obj.offset().left : pos;   //type为1，说明通过拖拽进度条设置视频长度，鼠标位置需要去掉进度条相对文档的左边距离；
		                                                    //type为0，说明通过按钮切换（视频播放暂停和音量切换）设置的进度条位置 ，音量的切换只有最小0和最大1
		var max = typeof pos == 'number' ? this.maxduration : 1;  //如果pos是数字，即根据当前时间设置进度条，那么最大值是视频的总长度；如果是字符串，即‘0’或‘1’，就取音量最大值1
		var percenter =(type ? (point / obj.width()) : (point / max) )*100;   //如果是拖拽进度条，获取宽度百分比，如果是切换按钮，获取进度百分比
		console.log(percenter);
		obj.siblings('.volume-switch').removeClass('novolume');
		if (percenter >= 100) {//如果超出了进度条最大值范围
			percenter = 100;
			obj.parent()
				.siblings('.video-control-aside')
				.find('.pause-paly-switch').addClass('pause');
		}
		if (percenter <= 0) {  //如果小于进度条最小范围
			percenter = 0;
			obj.siblings('.volume-switch').addClass('novolume');
		}
		obj.find('span:first-child').css('width', percenter + '%');
		obj.find('span:last-child').css('margin-left', percenter + '%');
		return percenter;

	}
		//			VideoControl.prototype.fullScreenSwitch=function(){
		//				var that=this;
		//				this.$fullscreenSwitch.click(function(){
		//						 if(that.$ele[0].requestFullScreen){
		//						 	that.$ele.parent().get(0).requestFullscreen();
		//						 }
		//						 else if($.isFunction(that.$ele[0].webkitRequestFullScreen)){
		//						 	that.$ele.parent().get(0).webkitRequestFullScreen();
		//						 }
		//						 else if($.isFunction(that.$ele[0].mozRequestFullScreen)){
		//						 	that.$ele.parent().get(0).mozRequestFullScreen();
		//						 }
		//						 else if(that.$ele[0].msRequestFullScreen){
		//						 	that.$ele.parent().get(0).msRequestFullScreen();
		//						 }
		//						 else{
		//							 alert('您的浏览器不支持全屏');
		//						 }
		////						if(typeof window.ActiveXObject !== "undefined"){
		////							var wscript=new ActiveXObject('WScript.Shell');
		////							if(wscript !== null){
		////								wscript.SendKeys("{F11}");
		////							}
		////							/*if(!that.$ele.hasClass('fullScreen')){
		////								that.$ele.addClass('fullScreen');
		////							}else{
		////								that.$ele.removeClass('fullScreen');
		////							}*/
		////						}
		////						else{
		////							alert('您的浏览器不支持全屏');
		////						}
		//					});
		//					
		//
		//			}
	//设置时间格式
	VideoControl.prototype.initTimeLength = function(timeLength) {
		timeLength = parseInt(timeLength);
		var second = timeLength % 60;
		var minute = (timeLength - second) / 60;
		return (minute < 10 ? "0" + minute : minute) + ":" + (second < 10 ? "0" + second : second);
	}
	VideoControl.prototype.fullScreenSwitch = function() {

		var that = this;
		var f = true;
		var videoParent = this.$ele.parent().get(0);
		//console.log(this.$ele.parent().get(0));
		this.$fullscreenSwitch.click(function() {
			if (f) {
				requestFullScreen(videoParent);
			} else {
				exitFull();
			}

		});

		function requestFullScreen(ele) {
			var requestMethod = ele.requestFullScreen || ele.webkitRequestFullScreen || ele.mozRequestFullScreen || ele.msRequestFullscreen;
			if (requestMethod) {
				requestMethod.call(ele);
			} else {
				console.log(that.$ele);
				that.$ele.addClass('fullScreen');
				that.$fullscreenSwitch.addClass('open');
			}
			f = false;
		}

		function exitFull() {
			var exitMethod = document.exitFullscreen || document.mozCancelFullScreen ||  document.webkitExitFullscreen || document.msExitFullscreen;
			if (exitMethod) {
				exitMethod.call(document);
			} else {
				that.$ele.removeClass('fullScreen');
				that.$fullscreenSwitch.removeClass('open');
			}
			f = true;
		}

		$(document).keydown(function(event) {
			if (that.$ele.hasClass('fullScreen')) {
				var e = event || window.event || arguments.callee.caller.arguments[0];
				if (e && e.keyCode == 27) {
					that.$fullscreenSwitch.trigger('click');
				}
			}
		});

		function addFull(full) {
			if (document[full]) {
				that.$fullscreenSwitch.addClass('open');
				f = false;
			} else {

				that.$fullscreenSwitch.removeClass('open');
				f = true;
			}
		}
		document.addEventListener("fullscreenchange", function() {
			//			            if (document.fullscreen) {
			//			            	this.$fullscreenSwitch.addClass('open');
			//			                 f=false;
			//			            }else{
			//			            	this.$fullscreenSwitch.removeClass('open');
			//			                 f=true;
			//			        　　	}
			addFull('fullscreen');
		}, false);

		document.addEventListener("webkitfullscreenchange", function() {
			//			            if (document.webkitIsFullScreen) {
			//			                 fullscreenSwitch.addClass('open');
			//			                 f=false;
			//			            }else{
			//			                 fullscreenSwitch.removeClass('open');
			//			                 f=true;
			//			        　　}
			addFull('webkitIsFullScreen');
		}, false);
		document.addEventListener("mozfullscreenchange", function() {
			//			            if (document.mozFullScreen) {
			//			                 fullscreenSwitch.addClass('open');
			//			                 f=false;
			//			            }else{
			//			                 fullscreenSwitch.removeClass('open');
			//			                 f=true;
			//			        　　}
			addFull('mozFullScreen');
		}, false);
		document.addEventListener("MSFullscreenChange", function() {
			//			            if (document.msFullscreenElement) {
			//			                 fullscreenSwitch.addClass('open');
			//			                 f=false;
			//			            }else{
			//			                 fullscreenSwitch.removeClass('open');
			//			                 f=true;
			//			        　　}
			addFull('msFullscreenElement');
		}, false);
	}
	$.fn.videoControl = function(option) {
		return this.each(function() {
			var $this = $(this);
			var options = option; /*自定义样式*/
			new VideoControl($this, options);

		})
	}

})(jQuery, document)