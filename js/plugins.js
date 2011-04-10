
// usage: log('inside coolFunc', this, arguments);
// paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
window.log = function(){
  log.history = log.history || [];   // store logs to an array for reference
  log.history.push(arguments);
  arguments.callee = arguments.callee.caller;  
  if(this.console) console.log( Array.prototype.slice.call(arguments) );
};
// make it safe to use console.log always
(function(b){function c(){}for(var d="assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn".split(","),a;a=d.pop();)b[a]=b[a]||c})(window.console=window.console||{});


// place any jQuery/helper plugins in here, instead of separate, slower script files.

/* Close Pixelate
 * http://desandro.com/resources/close-pixelate/
 * 
 * Developed by
 * - David DeSandro  http://desandro.com
 * - John Schulz  http://twitter.com/jfsiii
 * 
 * Thanks to Max Novakovic for getImageData API http://www.maxnov.com/getimagedata
 * 
 * Copyright (c) 2010
 * Licensed under MIT license
 * 
 * /


/*********************** imageForgery ************************/

var imageForgery = {};

imageForgery.hasSameOrigin = (function() {

  var page = document.location,
      protocol = page.protocol,
      domain = document.domain,
      port = page.port ? ':' + page.port : '',
      sop_string = protocol + '//' + domain + port,
      sop_regex = new RegExp('^' + sop_string),
      http_regex = /^http(?:s*)/,
      data_regex = /^data:/,
      closure = function ( url )
      {
          var is_local = (!http_regex.test(url)) || data_regex.test(url),
              is_same_origin = sop_regex.test(url);

          return is_local || is_same_origin;
      };

  return closure;
  
})();

imageForgery.getRemoteImageData = function ( img_url, callback )
{
    var page_url = document.location.href,
        secure_root = "https://img-to-json.appspot.com/",
        insecure_root = "http://img-to-json.maxnov.com/",
        secure_regex = /^https:/,
        is_secure = secure_regex.test(img_url) || secure_regex.test(page_url),
        service_root = is_secure ? secure_root : insecure_root,
        cb_stack_name = "cp_remote_image_callbacks",
        cb_stack = cb_stack_name in window ? window[cb_stack_name] : window[cb_stack_name] = [],
        cb_name = cb_stack_name +'['+ cb_stack.length +']',
        service_url = service_root + "?url=" + escape(img_url) + "&callback=" + cb_name,
        script = document.createElement('script');

    cb_stack.push( callback );
    script.src = service_url;
    document.body.appendChild(script);
};

imageForgery.forgeImage = function( img, callback ) {
  
  var onImageLoaded = function( event ) {
    callback( event.target );
  };

  if ( !imageForgery.hasSameOrigin( img.src ) ) {
    // remote
    var onDataLoaded = function( obj ) {
      var proxyImage = new Image();
      proxyImage.addEventListener( 'load', onImageLoaded, false );
      proxyImage.src = obj.data;
    };
    imageForgery.getRemoteImageData( img.src, onDataLoaded );
  } else {
    // local
    if ( img.complete ) {
      callback( img )
    } else {

      img.addEventListener( 'load', onImageLoaded, false ); 
    }
  }
  
};


/*********************** Close Pixelate ************************/


var ClosePixelate = {};

ClosePixelate.proxyCanvas = document.createElement('canvas');

// checking for canvas support
ClosePixelate.supportsCanvas = !!ClosePixelate.proxyCanvas.getContext &&
  !!ClosePixelate.proxyCanvas.getContext('2d');

if ( ClosePixelate.supportsCanvas ){
  HTMLImageElement.prototype.closePixelate = function ( options ) { 
    ClosePixelate.imageNode( this, options )
  };
}

// takes an <img />, replaces it with <canvas />
ClosePixelate.imageNode = function ( img, renderOptions ) {

  var callback = function( forgedImage ) {
    ClosePixelate.replaceImageNode( forgedImage, img, renderOptions );
  };

  // this method takes any image and returns it with a copy
  // that has the same origin, thus avoiding canvas's security
  imageForgery.forgeImage( img, callback );

};

ClosePixelate.replaceImageNode = function( img, originalNode, renderOptions ) {
  var w = img.width,
      h = img.height,
      canvas = document.createElement('canvas'),
      ctx = canvas.getContext('2d');

  // render image in canvas
  canvas.width = w;
  canvas.height = h;
  canvas.className = originalNode.className;
  canvas.id = originalNode.id;
  ctx.drawImage( img, 0, 0 );

  // perform the Close pixelations
  ClosePixelate.renderClosePixels( ctx, renderOptions, w, h );

  // add canvas and remove image
  originalNode.parentNode.replaceChild( canvas, originalNode );
};


ClosePixelate.renderClosePixels = function ( ctx, renderOptions, w, h ) {
  var PI2 = Math.PI*2, 
      PI1_4 = Math.PI/4,
      imgData = ctx.getImageData(0, 0, w, h).data, 
      isArray = function ( o ){ return Object.prototype.toString.call( o ) === "[object Array]"; },
      isObject = function ( o ){ return Object.prototype.toString.call( o ) === "[object Object]"; };

  ctx.clearRect( 0, 0, w, h);

  for (var i=0, len = renderOptions.length; i < len; i++) {
    var opts = renderOptions[i],
        res = opts.resolution,
        // option defaults
        size = opts.size || res,
        alpha = opts.alpha || 1,
        offset = opts.offset || 0,
        offsetX = 0, 
        offsetY = 0,
        cols = w / res + 1,
        rows = h / res + 1,
        halfSize = size / 2,
        diamondSize = size / Math.SQRT2,
        halfDiamondSize = diamondSize / 2;

    if ( isObject( offset ) ){ 
      offsetX = offset.x || 0;
      offsetY = offset.y || 0;
    } else if ( isArray( offset) ){
      offsetX = offset[0] || 0;
      offsetY = offset[1] || 0;
    } else {
      offsetX = offsetY = offset;
    }

    for ( var row = 0; row < rows; row++ ) {
      var y = ( row - 0.5 ) * res + offsetY,
        // normalize y so shapes around edges get color
        pixelY = Math.max( Math.min( y, h-1), 0);

      for ( var col = 0; col < cols; col++ ) {
        var x = ( col - 0.5 ) * res + offsetX,
            // normalize y so shapes around edges get color
            pixelX = Math.max( Math.min( x, w-1), 0),
            pixelIndex = ( pixelX + pixelY * w ) * 4,
            red = imgData[ pixelIndex + 0 ],
            green = imgData[ pixelIndex + 1 ],
            blue = imgData[ pixelIndex + 2 ],
            pixelAlpha = alpha * (imgData[ pixelIndex + 3 ] / 255);

        ctx.fillStyle = 'rgba(' + red +','+ green +','+ blue +','+ pixelAlpha + ')';

        switch ( opts.shape ) {
          case 'circle' :
            ctx.beginPath();
              ctx.arc ( x, y, halfSize, 0, PI2, true );
              ctx.fill();
            ctx.closePath();
            break;
          case 'diamond' :
            ctx.save();
              ctx.translate( x, y );
              ctx.rotate( PI1_4 );
              ctx.fillRect( -halfDiamondSize, -halfDiamondSize, diamondSize, diamondSize );
            ctx.restore();
            break;
          default :  
            // square
            ctx.fillRect( x - halfSize, y - halfSize, size, size );
        } // switch
      } // col
    } // row
  } // options

};


/*!
// Infinite Scroll jQuery plugin
// copyright Paul Irish, licensed GPL & MIT
// version 1.5.101207

// home and docs: http://www.infinite-scroll.com
*/
(function($){$.fn.infinitescroll=function(options,callback){function debug(){if(opts.debug){window.console&&console.log.call(console,arguments)}}function areSelectorsValid(opts){for(var key in opts){if(key.indexOf&&key.indexOf("Selector")>-1&&$(opts[key]).length===0){debug("Your "+key+" found no elements.");return false}return true}}function determinePath(path){if(path.match(/^(.*?)\b2\b(.*?$)/)){path=path.match(/^(.*?)\b2\b(.*?$)/).slice(1)}else{if(path.match(/^(.*?)2(.*?$)/)){if(path.match(/^(.*?page=)2(\/.*|$)/)){path=path.match(/^(.*?page=)2(\/.*|$)/).slice(1);return path}debug("Trying backup next selector parse technique. Treacherous waters here, matey.");path=path.match(/^(.*?)2(.*?$)/).slice(1)}else{if(path.match(/^(.*?page=)1(\/.*|$)/)){path=path.match(/^(.*?page=)1(\/.*|$)/).slice(1);return path}if($.isFunction(opts.pathParse)){return[path]}else{debug("Sorry, we couldn't parse your Next (Previous Posts) URL. Verify your the css selector points to the correct A tag. If you still get this error: yell, scream, and kindly ask for help at infinite-scroll.com.");props.isInvalidPage=true}}}return path}function filterNav(){opts.isFiltered=true;return $(window).trigger("error.infscr."+opts.infid,[302])}function isNearBottom(){var pixelsFromWindowBottomToBottom=0+$(document).height()-($(props.container).scrollTop()||$(props.container.ownerDocument.body).scrollTop())-$(window).height();debug("math:",pixelsFromWindowBottomToBottom,props.pixelsFromNavToBottom);return(pixelsFromWindowBottomToBottom-opts.bufferPx<props.pixelsFromNavToBottom)}function showDoneMsg(){props.loadingMsg.find("img").hide().parent().find("div").html(opts.donetext).animate({opacity:1},2000,function(){$(this).parent().fadeOut("normal")});opts.errorCallback()}function infscrSetup(){if(opts.isDuringAjax||opts.isInvalidPage||opts.isDone||opts.isFiltered||opts.isPaused){return}if(!isNearBottom(opts,props)){return}$(document).trigger("retrieve.infscr."+opts.infid)}function kickOffAjax(){opts.isDuringAjax=true;props.loadingMsg.appendTo(opts.loadMsgSelector).show(opts.loadingMsgRevealSpeed,function(){$(opts.navSelector).hide();opts.currPage++;debug("heading into ajax",path);box=$(opts.contentSelector).is("table")?$("<tbody/>"):$("<div/>");frag=document.createDocumentFragment();if($.isFunction(opts.pathParse)){desturl=opts.pathParse(path.join("2"),opts.currPage)}else{desturl=path.join(opts.currPage)}box.load(desturl+" "+opts.itemSelector,null,loadCallback)})}function loadCallback(){if(opts.isDone){showDoneMsg();return false}else{var children=box.children();if(children.length==0||children.hasClass("error404")){return $(window).trigger("error.infscr."+opts.infid,[404])}while(box[0].firstChild){frag.appendChild(box[0].firstChild)}$(opts.contentSelector)[0].appendChild(frag);props.loadingMsg.fadeOut("normal");if(opts.animate){var scrollTo=$(window).scrollTop()+$("#infscr-loading").height()+opts.extraScrollPx+"px";$("html,body").animate({scrollTop:scrollTo},800,function(){opts.isDuringAjax=false})}callback.call($(opts.contentSelector)[0],children.get());if(!opts.animate){opts.isDuringAjax=false}}}function initPause(pauseValue){if(pauseValue=="pause"){opts.isPaused=true}else{if(pauseValue=="resume"){opts.isPaused=false}else{opts.isPaused=!opts.isPaused}}debug("Paused: "+opts.isPaused);return false}function infscrError(xhr){if(!opts.isDone&&xhr==404){debug("Page not found. Self-destructing...");showDoneMsg();opts.isDone=true;opts.currPage=1;$(window).unbind("scroll.infscr."+opts.infid);$(document).unbind("retrieve.infscr."+opts.infid)}if(opts.isFiltered&&xhr==302){debug("Filtered. Going to next instance...");opts.isDone=true;opts.currPage=1;opts.isPaused=false;$(window).unbind("scroll.infscr."+opts.infid,infscrSetup).unbind("pause.infscr."+opts.infid).unbind("filter.infscr."+opts.infid).unbind("error.infscr."+opts.infid);$(document).unbind("retrieve.infscr."+opts.infid,kickOffAjax)}}$.browser.ie6=$.browser.msie&&$.browser.version<7;var opts=$.extend({},$.infinitescroll.defaults,options),props=$.infinitescroll,box,frag,desturl,thisPause,errorStatus;callback=callback||function(){};if(!areSelectorsValid(opts)){return false}props.container=document.documentElement;opts.contentSelector=opts.contentSelector||this;opts.loadMsgSelector=opts.loadMsgSelector||opts.contentSelector;var relurl=/(.*?\/\/).*?(\/.*)/,path=$(opts.nextSelector).attr("href");if(!path){debug("Navigation selector not found");return}path=determinePath(path);props.pixelsFromNavToBottom=$(document).height()+(props.container==document.documentElement?0:$(props.container).offset().top)-$(opts.navSelector).offset().top;props.loadingMsg=$('<div id="infscr-loading" style="text-align: center;"><img alt="Loading..." src="'+opts.loadingImg+'" /><div>'+opts.loadingText+"</div></div>");(new Image()).src=opts.loadingImg;$(window).bind("scroll.infscr."+opts.infid,infscrSetup).bind("filter.infscr."+opts.infid,filterNav).bind("error.infscr."+opts.infid,function(event,errorStatus){infscrError(errorStatus)}).bind("pause.infscr."+opts.infid,function(event,thisPause){initPause(thisPause)}).trigger("scroll.infscr."+opts.infid);$(document).bind("retrieve.infscr."+opts.infid,kickOffAjax);return this};$.infinitescroll={defaults:{debug:false,preload:false,nextSelector:"div.navigation a:first",loadingImg:"http://www.infinite-scroll.com/loading.gif",loadingText:"<em>Loading the next set of posts...</em>",donetext:"<em>Congratulations, you've reached the end of the internet.</em>",navSelector:"div.navigation",contentSelector:null,loadMsgSelector:null,loadingMsgRevealSpeed:"fast",extraScrollPx:150,itemSelector:"div.post",animate:false,pathParse:undefined,bufferPx:40,errorCallback:function(){},infid:1,currPage:1,isDuringAjax:false,isInvalidPage:false,isFiltered:false,isDone:false,isPaused:false},loadingImg:undefined,loadingMsg:undefined,container:undefined,currDOMChunk:null}})(jQuery);