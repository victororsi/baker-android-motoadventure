
var useBookmark = false;
var limitWebAppToDevice = true;
var stopIFrameOnNewPage = true;
var useSmoothSwipeOnImageSequences = true;
var bookmarkName = 'in5_bookmark_' + location.href.substr(location.host.length);
var touchEnabled = 'ontouchstart' in document.documentElement;
var clickEv = (touchEnabled) ? 'vclick' : 'click';
var pre = (document.createElement('div').style['WebkitTransform'] != undefined) ? '-webkit-' : '';
var useSwipe = false;
var pageMode = 'liquid';
var multifile = false;
var arrowNav = false;
var lazyLoad = false;
var webAppType = '';
var useTracker = false;
var shareInfo = {btns:[], align:"left"};
var sliderSettings = {}, nav = {}, in5 = {activeSeq:[]};
var isIPad = (navigator.userAgent.indexOf("iPad") != -1);
var isIPhone = (navigator.userAgent.indexOf("iPhone") != -1);
var isAndroid = (navigator.userAgent.toLowerCase().indexOf('android') != -1);
var isBaker = (navigator.userAgent.indexOf("BakerFramework") != -1);
var isLocal = (location.protocol === 'file:');
var animationTrigger, seqPos = 0;
navigator.standalone = navigator.standalone || checkStandalone();
if(isLocal) $('html').addClass('local');
if(location.href.indexOf('OverlayResources') !== -1) $('html').addClass('dps');
if(isBaker) $('html').addClass('baker');
if(isIPad || isIPhone) $('html').addClass('ios');

function checkStandalone(){
	if(isAndroid){
		if(navigator.userAgent.match(/chrome.(?:(3[8-9])|(?:[4-9][0-9]))/i) ){ return (screen.height-window.outerHeight<80); }
		return true; /*bypass install screen until better implementation is available*/
		return (screen.height-document.documentElement.clientHeight<40); /*old android hack*/
	}
}

function go(e, objArr, triggerEvent){
	animationTrigger = triggerEvent;
	if(objArr.length>1) {
		in5.activeSeq = objArr;
		seqNext(e);
	} else {
		var data = objArr[0];
		prepAnim(e,$('[data-id=' + data.id + ']'),data);
	}	
}

function prepAnim(e,elem,data){
	switch(data.act) {
		case 'reverse': data.rev = 1;
		case 'play':
			playAnim(e,elem,data);
			break;
		case 'stop':
			elem.css(pre+'animation', 'none');
			break;
		case 'pause':
			elem.css(pre+'animation-play-state','paused');
			break;
		case 'resume':
			elem.css(pre+'animation-play-state','running');
			break;
		case 'stopall':
			$('.activePage').find('[data-ani]').css(pre+'animation','none');
			break;
	}
}

function seqNext(e) {
	if(!in5.activeSeq.length || seqPos > in5.activeSeq.length-1) return;
	var cAnim = in5.activeSeq.splice(seqPos,1)[0];
	var elem = $('[data-id=' + cAnim.id + ']');
	elem.data('sequenced',true);
	prepAnim(e,elem,cAnim);
	seqPos = (animationTrigger === 'pageclick') ? seqPos+1 : 0;
	if(cAnim.link || !elem.length) seqNext(e);
}

function playAnim(e, elem, opts) {
	if(typeof elem === 'number') elem = $('[data-id=' + elem + ']');
	if(!elem.length) return;
	if(e.target != elem[0] && elem.attr('data-unroll')) return false;
	elem.css(pre+'animation','none');
	elem[0].offsetWidth = elem[0].offsetWidth;
	var ani = elem.attr('data-ani');
	var delay = (opts.del) ? opts.del+'s' : '0s';
	var dir = (opts.rev) ? 'reverse' : 'normal';
	if(opts.unroll) {
		opts.rev = 1;
		var btn = $(opts.unroll);
		var optStr = (opts.hasOwnProperty('toSource')) ? opts.toSource() :
			(function(){
				var arr = [];
				for(var prop in opts){ arr.push(prop+':'+opts[prop]); }
				return '{' + arr.toString() + '}';
			})();
		btn.attr('data-unroll', 'playAnim({target:this},'+elem.attr('data-id')+','+optStr+');');
		btn.one('mouseleave',  function(e) {
			eval(btn.attr('data-unroll'));
			btn.removeAttr('data-unroll');
		});
	}
	elem.css({animation:ani, '-webkit-animation':ani, 
	'animation-delay':delay, '-webkit-animation-delay':delay, 
	'animation-direction':dir, '-webkit-animation-direction':dir});
	elem.removeClass('hidden');
}
function toggleAudio(btn){
	var elem = $(btn).siblings('audio')[0];
	if(elem == undefined) elem = $(btn).siblings().find('audio')[0];
	if(elem == undefined) return;
	try{
	var player = elem.player || elem;
	var media = player.media || elem;
	if(media.paused) player.play();
	else player.pause();
	} catch(e){}
}

function playMedia(dataID, from) {
	var elem = $('[data-id=' + dataID + ']')[0];
	if(elem == undefined) return;
	try{
		var player = elem.player || elem;
		player.play();
		if(from != undefined && from != -1) try{ setTimeout(function(){player.setCurrentTime(from);}, 500); }catch(e){}
	} catch(e){console.log(e);}
}

function pauseMedia(dataID, rewind) {
	var elem = $('[data-id=' + dataID + ']')[0];
	if(elem == undefined) return;
	try{
	var player = elem.player || elem;
	player.pause();
	} catch(e){}
}

function stopAllMedia(targ) {
	if(!targ) targ = document;
	$(targ).find('audio,video').each(function() {
		var media = $(this)[0];
		var player = media.player || media;
		try{player.pause(); media.currentTime = 0;}catch(e){}
	});
}

function stopIframe(targ){
	$(targ).find('iframe').each(function(index,elem){
		var j = $(elem);
		var src = j.attr('src');
		j.attr('src', '');
		if(j.attr('data-src')) j.siblings('.cover').show();
		else j.attr('src', src);
	});
}

function autoPlayMedia(i,elem) {
	if($(elem).parents('.state').not('.active').length) return; /*skip hidden video in MSOs*/
	var delay = parseFloat($(elem).attr('data-autodelay'))* 1000 || 250+i;
	try{ setTimeout(function(){var player = elem.player || elem; player.play();}, delay); }catch(e){}
}	

function onNewPage(e, data){
	seqPos = 0;
	if(!multifile) stopAllMedia();
	if(data == undefined || data.index == undefined) return;
	if(!multifile) {
		$('.page [data-hidestart]').addClass('hidden');
		if(stopIFrameOnNewPage && nav.previousPageIndex != undefined) { stopIframe($('.page').eq(nav.previousPageIndex)); };
		nav.current = data.index+1;
		nav.previousPageIndex = data.index;
		if(useBookmark && localStorage) localStorage[bookmarkName] = nav.current;
		if(lazyLoad) loadImages(data.index);
	}
	$('.page').removeClass('activePage').eq(data.index).addClass('activePage').find('audio,video').filter('[data-autoplay]').each(function(i,elem){autoPlayMedia(i, elem)});
	var aniLoad = $('.activePage').attr('data-ani-load');
	if(aniLoad && aniLoad.length) eval(aniLoad);
	$('.activePage .cover').filter('[data-delay]').each(function(index,el){
		setTimeout(function(){ $(el).trigger(clickEv); }, parseFloat($(el).attr('data-delay'))*1000 );
		return false;
	});
	$('.activePage .mso > .state.active').trigger('newState');
}

function loadImages(pageIndex) {
	var pages = $('.page');
	loadPageImages(pages.eq(pageIndex));
	loadPageImages(pages.eq(pageIndex+1));
	if(pageIndex > 0){ loadPageImages(pages.eq(pageIndex-1)); }
}

function loadPageImages(targPage){
	if(!targPage.data('loaded')){
		targPage.find('img').filter('[data-src]').each(function(index, elem){ $(elem).attr('src', $(elem).attr('data-src')); });
		targPage.data('loaded', true);
	}
}

/*to do: check for when multiple pages are visible*/
function checkScroll(e, mode){
	if(window.scrolling) return;
	var docMin, docMax, docSpan, elemSpan, elemMin, elemMax, elemCenter;
	var vertMode = (mode === 'v');
	docMin = (vertMode) ? $(window).scrollTop() : $(window).scrollLeft();
	docMax = (vertMode) ? docMin + $(window).height(): docMin + $(window).width();
	docSpan = docMax - docMin;
    $('.pages .page').not('.activePage').each(function(index,elem) {
    	elemMin = (vertMode) ? $(elem).offset().top : $(elem).offset().left;
    	elemMax = (vertMode) ? elemMin + $(elem).height() : elemMin + $(elem).width();
    	elemSpan = elemMax - elemMin;
    	if(docSpan <= elemSpan) {
    		elemCenter = elemMin + elemSpan*.5;
    		if(elemCenter < docMax && elemCenter > docMin){
    			$(document).trigger('newPage', {index:$(elem).index()});
				return;
    		}
    	}else if((elemMax <= docMax) && (elemMin >= docMin)) {
    		$(document).trigger('newPage', {index:$(elem).index()});
    		return;
		}
    });
}

function onNewState(e){
	var targState = $(e.target).show();
	var aniLoad = targState.attr('data-ani-load');
	if(aniLoad && aniLoad.length) eval(aniLoad);
	stopAllMedia(targState.siblings('.state'));
	targState.find('audio,video').each(function(i,elem){autoPlayMedia(i, elem)});
	targState.find('[data-autostart="1"]').each(function(i,el){toFirstState(el); startSlideShowDelayed(el); });
	targState.siblings('.state').find('[data-hidestart]').addClass('hidden');
}

function nextState(dataID, loop) {
	var mso = $('[data-id=' + dataID + ']');
	var states = mso.first().children('.state');
	var current = states.siblings('.active').index();
	if(current+1 < states.length) {
		mso.each(function(index,elem) {
			if(elem.crossfade > 0) {
				var el = $(elem).removeClass('hidden');
				var last = el.children('.state.active').removeClass('active').addClass('transition').show().fadeOut(elem.crossfade, function(){$(this).removeClass('transition')});
				el.children('.state').eq(current+1).addClass('active').hide().fadeIn(elem.crossfade, function(e) { last.hide(); $(this).trigger('newState'); });
			} else $(elem).removeClass('hidden').children('.state').removeClass('active').eq(current+1).addClass('active').trigger('newState');
		});
	} else if(loop) {
		mso.each(function(index,elem) {
			if(elem.hasOwnProperty('loopcount')) {
				elem.loopcount++;
				if(elem.loopmax != -1 && elem.loopcount >= elem.loopmax) {
					stopSlideShow(elem);
					return;	
				}
			}
	 		if(elem.crossfade > 0) {
				var el = $(elem).removeClass('hidden');
				var last = el.children('.state.active').removeClass('active').addClass('transition').show().fadeOut(elem.crossfade, function(){$(this).removeClass('transition')});
				el.children('.state').first().addClass('active').hide().fadeIn(elem.crossfade, function(e) { last.hide(); $(this).trigger('newState');});
			} else $(elem).removeClass('hidden').children('.state').removeClass('active').first().addClass('active').trigger('newState');
	 	});
	}
}

function prevState(dataID, loop) {
	var mso = $('[data-id=' + dataID + ']');
	var states = mso.first().children('.state');
	var current = states.siblings('.active').index();
	if(current-1 > -1) {
		mso.each(function(index,elem) {
	 		if(elem.crossfade > 0) {
				var el = $(elem).removeClass('hidden');
				var last = el.children('.state.active').removeClass('active').addClass('transition').show().fadeOut(elem.crossfade,function(){$(this).removeClass('transition')});
				el.children('.state').eq(current-1).addClass('active').hide().fadeIn(elem.crossfade,function(e) { last.hide(); $(this).trigger('newState');});
			} else $(elem).removeClass('hidden').children('.state').removeClass('active').eq(current-1).addClass('active').trigger('newState');
		});
	} else if(loop) {
		mso.each(function(index,elem) {
			if(elem.hasOwnProperty('loopcount')) {
				elem.loopcount++;
				if(elem.loopmax != -1 && elem.loopcount >= elem.loopmax) {
					stopSlideShow(elem);
					return;	
				}
			}
	 		if(elem.crossfade > 0) {
				var el = $(elem).removeClass('hidden');
				var last = el.children('.state.active').removeClass('active').addClass('transition').show().fadeOut(elem.crossfade,function(){$(this).removeClass('transition')});
				el.children('.state').last().addClass('active').hide().fadeIn(elem.crossfade,function(e) { last.hide(); $(this).trigger('newState');});
			} else $(elem).removeClass('hidden').children('.state').removeClass('active').last().addClass('active').trigger('newState');
	 	});
	}
}

function toState(dataID, stateIndex, restoreOnRollOut, restoreTarg){
	if(restoreOnRollOut) {
		var current = $('[data-id=' + dataID + ']').children('.state.active').first().index();
		$(restoreTarg).mouseout(function() { toState(dataID, current); });
	}
	$('[data-id=' + dataID + ']').each(function(index,elem) {
		if(elem.playing) stopSlideShow(elem);
		$(elem).children('.state').removeClass('active').eq(stateIndex).addClass('active').trigger('newState').parent('.mso').removeClass('hidden');
	});
}

function toFirstState(el) { var f = (el.reverse) ? $(el).children('.state').length-1 : 0; toState($(el).attr('data-id'), f); }

function startSlideShowDelayed(el) { 
	var mso=$(el); 
	setTimeout(function(){ startSlideShow(el); }, parseFloat(mso.attr('data-autostartdelay'))*1000 + (mso.is(':visible')?el.duration*1000:0)); 
}

function startSlideShow(el){
	if(el.playing || $(el).is(':hidden')) return;
	el.playing = true;
	el.loopcount = 0;
	var func = (el.reverse) ? prevState : nextState;
	func($(el).attr('data-id'), true );
	el.playint = setInterval(function(){ func($(el).attr('data-id'), true ); }, el.duration*1000);
}

function stopSlideShow(elem) {
	elem.playing = false;
	if(elem.hasOwnProperty('playint')) clearInterval(elem.playint);
	$(elem).find('.state').css('display','').css('opacity','1');
}

function hide(dataID) { $('[data-id=' + dataID + ']').addClass('hidden'); }
function show(dataID) { $('[data-id=' + dataID + ']').removeClass('hidden'); }
function loadFrame(iframe){ iframe.src = $(iframe).attr('data-src'); }
function initWebApp(){
	var isDevice, deviceName, nameForNonDeviceFile = webAppType, nameForDeviceFile = webAppType;
	switch(webAppType){
		case 'ipad':
			deviceName2 = deviceName = 'iPad';
			isDevice = isIPad;
			break;
		case 'iphone':
			deviceName2 = deviceName = 'iPhone';
			isDevice = isIPhone;
			break;
		case 'android':
			deviceName2 = deviceName = 'Android';
			isDevice = isAndroid;
			break;
		default:
			deviceName = 'Mobile';
			deviceName2 = 'Mobile Device';
			isDevice = (isAndroid || isIPad || isIPhone);
			nameForDeviceFile = (isAndroid) ? 'android' : ((isIPad) ? 'ipad' : 'iphone');
	}
	if(isDevice){
		if(!navigator.standalone) {
			$('#container').hide();
			if(window.stop && !$('html').is('[manifest]')/*does not have app cache*/){
				window.stop();
				$('body').addClass('loaded');
			}
		$('body').css('background','#fff)').append('<img src="assets/images/add_to_home_'+nameForDeviceFile+'.png" />');
			return true;
		}
	} else if(limitWebAppToDevice) {
		$('#container').hide();
		if(window.stop){
			window.stop();
			$('body').addClass('loaded');
		}
		var sendLinkURL = 'mailto:?subject=Check%20out%20this%20Web%20App%20for%20'+deviceName+'&amp;body=Add%20this%20Web%20App%20to%20Your%20'+deviceName2+'%20by%20visiting:%20'+
		(location.protocol == 'file:' ? '%28Post%20to%20a%20web%20server%20to%20show%20URL%29' : location.href) +'"><img src="assets/images/non_'+nameForNonDeviceFile+'.png';
		$('body').css('background','#fff').append('<a href="'+sendLinkURL+'" /></a>');
		return true;
	}
	return false;
}

$(window).on('hashchange', function(e){ checkHashData(); });
function checkHashData(){
	if(multifile){
		var hash = location.hash.split('#').join('');
		if(hash.length){
			var pie = hash.split('&'), plen = pie.length, piece, parts;
			var offset = $('#container').offset();
			while(plen--){
				piece = pie[plen];
				parts = piece.split('=');
				switch(parts[0]){
					case 'refy':
						$(document).scrollTop(parseInt(parts[1]) + offset.top);
						break;
				}
			}
		}
	}
}

$(function(){
	if(webAppType.length && initWebApp()) return false;
	$(document).on('newPage', function(e, data) { onNewPage(e, data); });
	checkHashData();
	if(!multifile && pageMode.substr(0,2) === 'cs') $(document).on('scroll', function(e){ checkScroll(e, pageMode.substr(2)); });
	if($('ul.thumbs').length) $('#in5footer').hide();
	if(touchEnabled){ /*touch device fix for btns with multiple click events*/
		$('[onclick]').each(function(index,el){
			var j = $(el);
			j.attr('data-onclick', j.attr('onclick') ).removeAttr('onclick').on(clickEv, function(){ eval(j.attr('data-onclick')); return false; });
		});
	}
	$('.scroll-horiz > *').each(function(index,elem){
		var left = parseFloat($(elem).css('left'));
		if(left < 0){ $(elem).css({left:'auto',right:left+'px'}).attr('style', $(elem).attr('style').replace(/( \!important)*;/g,' !important;')).parent('.scroll-horiz').addClass('pulltab-left'); }
	});
	$('.scroll-vert > *').each(function(index,elem){
		var top = parseFloat($(elem).css('top'));
		if(top < 0){ $(elem).css({top:'auto',bottom:top+'px'}).attr('style', $(elem).attr('style').replace(/( \!important)*;/g,' !important;')).parent('.scroll-vert').addClass('pulltab-top'); }
	});
	$('[data-ani]').on('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend', 
		function(e){
		var jel = $(this);
		if(jel.attr('style').indexOf('reverse')<0) {
			if(jel.attr('data-hideend')=='1') jel.addClass('hidden');
		}else { 
			jel.css(pre+'animation', 'none'); 
			if(jel.attr('data-hidestart')=='1') jel.addClass('hidden');
		}
        if(jel.data('sequenced')) seqNext(e);
        jel.data('sequenced',false);
	});
	$('[data-ani-click]').on(clickEv, function(e){
		if($(e.target).closest('a,button,input,select,textarea,.mejs-overlay-button,map,[onclick],[data-useswipe="1"],[data-tapstart="1"],.panzoom',$(this)).length>0) return; /*exclude clicks on these*/
		if($(this).hasClass('activePage')) eval($(this).attr('data-ani-click'));
		return false;
	});
	$('[data-click-show]').each(function(index,el) {
		$(el).on(clickEv, function(e){ 
			$.each($(this).attr('data-click-show').split(','), function(i,val){ show(val); });
			return false;
	}); });
	$('[data-click-hide]').each(function(index,el) {
		$(el).on(clickEv, function(e){ 
			$.each($(this).attr('data-click-hide').split(','), function(i,val){ hide(val); });
			$(this).parent('a').trigger(clickEv);
			return false;
	}); });
	$('[data-click-next]').each(function(index,el) {
		$(el).on(clickEv, function(e){  
			var loop = ($(this).attr('data-loop') == '1');
			$.each($(this).attr('data-click-next').split(','), function(i,val){ nextState(val, loop); });
			return false;
	}); });
	$('[data-click-prev]').each(function(index,el) {
		$(el).on(clickEv, function(e){ 
			var loop = ($(this).attr('data-loop') == '1');
			$.each($(this).attr('data-click-prev').split(','), function(i,val){ prevState(val, loop); });
			return false;
	}); });
	$('[data-click-state]').each(function(index,el) {
		$(el).on(clickEv, function(e){  $.each($(this).attr('data-click-state').split(','), function(i,val){ 
			var targData = val.split(':');
			toState(targData[0], targData[1]); });
			return false;
	}); });
	$('[data-click-play]').each(function(index,el) {
		$(el).on(clickEv, function(e){  $.each($(this).attr('data-click-play').split(','), function(i,val){ 
			var targData = val.split(':');
			playMedia(targData[0], targData[1]); });
			return false;
	}); });
	$('[data-click-pause]').each(function(index,el) {
		$(el).on(clickEv, function(e){  $.each($(this).attr('data-click-pause').split(','), function(i,val){ 
			pauseMedia(val); return false; });
	}); });
	$('[data-click-stop]').each(function(index,el) {
		$(el).on(clickEv, function(e){  $.each($(this).attr('data-click-stop').split(','), function(i,val){ 
			pauseMedia(val, true); return false; });
	}); });
	$('[data-click-stopall]').each(function(index,el) {
		$(el).on(clickEv, function(e){  $.each($(this).attr('data-click-stopall').split(','), function(i,val){ 
			stopAllMedia(); return false; });
	}); });
	$('.mso > .state').on('newState', function(e){ onNewState(e); });
	$('.mso.slideshow').each(function(index,el) {
		var mso = $(el), msoID = mso.attr('data-id'), loopSwipe = (mso.attr('data-loopswipe') == '1');
		var msoSwipe = (mso.attr('data-useswipe') == '1');
		el.duration = parseFloat(mso.attr('data-duration'));
		el.loopmax = parseInt(mso.attr('data-loopmax'));
		el.crossfade = parseFloat(mso.attr('data-crossfade')) * 1000;
		el.reverse = mso.attr('data-reverse') == '1';
		el.pageIndex = mso.parents('.page').index();
		if(mso.attr('data-tapstart') == '1' && !msoSwipe) {
			mso.on(clickEv, function(e) {
			if(!this.playing) startSlideShow(this);
			else stopSlideShow(this);
			return false;
			});
		}
		if(mso.attr('data-autostart') == '1') {
			$(document).on('newPage', function(e, data) {
				if(data.index == el.pageIndex) startSlideShowDelayed(el);
				else if (el.playing) stopSlideShow(el);
			});
		}
		if(msoSwipe) {
			if(useSmoothSwipeOnImageSequences && mso.hasClass('seq')){
				var triggerDist, lastPos,rev = el.reverse;
				mso.swipe({
					allowPageScroll:'vertical',fingers:1,maxTimeThreshold:9000,triggerOnTouchLeave:false,
					swipeStatus:function(event, phase, direction, distance, duration, fingers) {
						switch(phase){
							case 'move':
								if(distance - lastPos < triggerDist) return;	
								switch(direction){
									case "left":
										if(rev) prevState(msoID, loopSwipe);
										else nextState(msoID, loopSwipe);
										lastPos = distance;	
										break;
									case "right":
										if(rev) nextState(msoID, loopSwipe);
										else prevState(msoID, loopSwipe);
										lastPos = distance;	
										break;
								}
								break;
							case 'start':
								lastPos = 0;
								triggerDist = mso.width()/mso.find('.state').length*.5;
								break;
						}
					},
				});
			} else {
				mso.swipe({
				allowPageScroll:'vertical', fingers:1, triggerOnTouchEnd:false, triggerOnTouchLeave:true,
				swipe:function(event, direction, distance, duration, fingerCount) {
					switch(direction) {
						case "left":
							if(el.reverse) prevState(msoID, loopSwipe);
							else nextState(msoID, loopSwipe);
							break;
						case "right":
							if(el.reverse) nextState(msoID, loopSwipe);
							else prevState(msoID, loopSwipe);
							break;		
					}
				} });
			}
		}
	});
	if($('.panzoom').length) initPanZoom();
	if($.colorbox) {
		$('.lightbox').filter(':not(svg *)').filter(':not([href*=lightbox\\=0])').filter(isBaker?':not([href*=referrer\\=Baker])':'*').colorbox({iframe:true, width:"80%", height:"80%"});
		$('svg .lightbox').each(function(index,el){
			var jel = $(el);
			var xref = jel.attr('xlink:href');
			if(xref.indexOf('lightbox=0') != -1) return;
			if(!isBaker || xref.indexOf('referrer=Baker') != -1){
				jel.on(clickEv, function(){
				$.colorbox({iframe:true, width:"80%", height:"80%", href:$(this).attr('xlink:href')});
				return false;
				});
			}
		});
		$('.thumb').colorbox({maxWidth:"85%", maxHeight:"85%"});
		$(window).on('orientationchange', function(e){ if($('#cboxWrapper:visible').length) $.colorbox.resize(); });
	}
	$('img').on('dragstart', function(event) { event.preventDefault(); });
	$('.cover').on(clickEv, function() { loadFrame($(this).hide().siblings('iframe')[0]); return false; });
	if(multifile){
		$('#prefooter').css('min-height', $('.page').height());
		nav = { numPages:1,
		previousPageIndex:nav?nav.previousPageIndex:undefined,
		current:parseInt(location.href.split('/').pop().split('.html').join('')),
		back:function(ref){nav.to(nav.current-1);},
		next:function(ref){nav.to(nav.current+1);},
		to:function(n,coords){
			if(n <= 0 || n > nav.numPages) return;
			var targPage = (n*.0001).toFixed(4).substr(2) + '.html';
			if(coords && coords.length) targPage += '#refx='+coords[0]+'&refy='+coords[1];
			if(targPage == location.href.split('/').pop()) $(window).trigger('hashchange');
			else location.assign(targPage)
		} };
		$('nav #nextBtn').on(clickEv, function(){ nav.next(); return false; });
		$('nav #backBtn').on(clickEv, function(){ nav.back(); return false; });
		if(arrowNav && $('.page').length){
			$('nav:hidden, nav #backBtn, nav #nextBtn').show();
			if(nav.current == 1) $('nav #backBtn').hide();
			if(nav.current == nav.numPages) $('nav #nextBtn').hide();
		}
	} else if(pageMode.indexOf('liquid') != -1) {
		nav = { numPages:$('.pages .page').length,
		current:1,
		previousPageIndex:nav?nav.previousPageIndex:undefined,
		back:function(ref){nav.to(nav.current-1);},
		next:function(ref){nav.to(nav.current+1);},
		first:function(){nav.to(1);},
		last:function(){nav.to(nav.numPages);},
		to:function(n){
			if(n < 1 || n > nav.numPages) return;
			$(document).trigger('newPage', {index:n-1});
			if(n < 2) $('nav #backBtn:visible').hide();
			else $('nav #backBtn:hidden').show();
			if(n >= nav.numPages) $('nav #nextBtn:visible').hide();
			else $('nav #nextBtn:hidden').show();
		} };
		$('nav #nextBtn').on(clickEv, function(){ nav.next(); return false; });
		$('nav #backBtn').on(clickEv, function(){ nav.back(); return false; });
		if(arrowNav) $('nav:hidden').show();
		nav.to(getStartPage()); /*init*/
	} else if($.hasOwnProperty('scrollTo')){
		var dir = (pageMode[2] == 'h') ? 'x' : 'y';
		nav = { numPages:$('.pages .page').length,
			previousPageIndex:nav?nav.previousPageIndex:undefined,
			back:function(ref){var ind=$(ref).parent('.page').prev().index(); if(ind!=-1) nav.to(ind+1);},
			next:function(ref){var ind=$(ref).parent('.page').next().index(); if(ind!=-1) nav.to(ind+1);},
			first:function(){nav.to(1)},
			last:function(){nav.to(nav.numPages)},
			to:function(n){
				window.scrolling = true;
				$.scrollTo($('.page').eq(n-1)[0], 500, {axis:dir, onAfter:function(){window.scrolling=false}});
				$(document).trigger('newPage', {index:n-1});} };
			nav.to(getStartPage());
	}
	if(useSwipe && !$('#container > ul.thumbs').length) {
		var container = $('#container');
		var vertMode = (pageMode.substr(0,1) == "v");
		container.swipe({
			allowPageScroll: (vertMode ? 'horizontal' : 'vertical'),
			fingers:1,
			excludedElements:$.fn.swipe.defaults.excludedElements+',.mejs-overlay-button,map,[onclick],[data-useswipe="1"],[data-tapstart="1"],.panzoom,.scroll-horiz',
			swipe:function(event, direction, distance, duration, fingerCount) {
				switch(direction) {
					case "left":
						if(!vertMode) nav.next();
						break;
					case "right":
						if(!vertMode) nav.back();
						break;
					case "up":
						if(vertMode) nav.next();
						break;
					case "down":
						if(vertMode) nav.back();
						break;		
				}
			}
		});
	}
});

$(window).load(function(){
	$('body').addClass('loaded');
	
	initMedia(sliderSettings != undefined);
});

function initMedia(hasSlider){
	if(isBaker) return;
	if(!$('video,audio').length) {
		if(multifile) $(document).trigger('newPage', {index:0});
	 	return;
	}
	if(!window.mejs || $('video,audio').mediaelementplayer == undefined) {
		setTimeout(function(){initMedia(hasSlider);}, 50);
		return;
	 }
	var playerMode = (navigator.userAgent.toLowerCase().indexOf('firefox') > -1 && isLocal) ? 'shim' : 'auto';
	if((isIPad || isIPhone) && $('audio,video').filter('[data-autoplay]').length) {
		$('.page').one('touchstart', function(e){
			$(e.currentTarget).next().find('audio,video').filter('[data-autoplay]').each(function(){ if(this.load) this.load(); });
		});
	}
	if(hasSlider && (isIPad || isIPhone)) $('video,audio').mediaelementplayer({success:onMediaLoadSuccess});
	else { $('video,audio').mediaelementplayer({pluginPath:'assets/media/',iPadUseNativeControls:true, iPhoneUseNativeControls:true, mode:playerMode,
		AndroidUseNativeControls:true, enableKeyboard:false, success:onMediaLoadSuccess});
	}
}

function onMediaLoadSuccess (me, domObj) {
	if(multifile) $(document).trigger('newPage', {index:0});
	else if(pageMode.indexOf('liquid') != -1 && me.pluginType) $(document).trigger('newPage', {index:$('.activePage').index()});
	if($(domObj).hasClass('mejs-fsonly')) {me.addEventListener('play',function(){ try{domObj.player.enterFullScreen(); me.enterFullScreen();}catch(e){} }) };
	if($(domObj).attr('data-stoplast') == '1') { if(domObj.hasOwnProperty('player')) domObj.player.options.autoRewind = false; };
	me.addEventListener('play',function(){ $(document).trigger('mediaPlayback', {me:me,domObj:domObj}); });
	if(me.pluginType == 'flash' && $(domObj).attr('loop') == 'loop') { me.addEventListener('ended', function() { domObj.player.play(); }); }
}

if(isBaker){
	$(window).on('blur', function(e){
		stopAllMedia(this.document);
		$(window).scrollTop(0);
		$('.page [data-hidestart]').addClass('hidden');
		$(window).data('focused', false);
	}).on('focus', function(e) {
		if(!$(window).data('focused')) $(document).trigger('newPage', {index:0});
		$(window).data('focused', true);
	});
}

function getStartPage(){
	if(multifile || !useBookmark || !localStorage) return 1;
	if(!localStorage[bookmarkName]) return 1;
	return localStorage[bookmarkName];
}



