<!DOCTYPE html>
<html id="mainLayout" lang="en-US">
	<head>
		<title>Europe 30</title>
<meta charset="" />
<meta name="viewport" content="width=device-width"/>
<meta name="theme-color" content="#F4EFE4" />
<link rel="manifest" href="/manifest.webmanifest" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
<link href="https://cdn.legends.travian.com/gpack/367/css_ltr/imports_compressed.css" rel="stylesheet" type="text/css" />
<script type="application/javascript" src="https://cdn.legends.travian.com/gpack/367/js/jquery-3.5.1.min.js"></script>
<script type="application/javascript" src="https://cdn.legends.travian.com/gpack/367/js/jquery.md5.min.js"></script>
<script type="application/javascript" src="https://cdn.legends.travian.com/gpack/367/js/d3/d3.min.js"></script>
<script type="application/javascript" src="https://cdn.legends.travian.com/gpack/367/js/d3/d3pie.min.js"></script>
<script type="application/javascript" src="https://cdn.legends.travian.com/gpack/367/js/ChartJs/Chart.min.js"></script>
<script type="application/javascript" src="https://cdn.legends.travian.com/gpack/367/js/gsap/TweenMax.min.js"></script>
<script type="application/javascript" src="https://cdn.legends.travian.com/gpack/367/js/gsap/plugins/MorphSVGPlugin.min.js"></script>
<script type="application/javascript" src="https://cdn.legends.travian.com/gpack/367/js/simplebar.min.js"></script>
<script type="application/javascript" src="https://cdn.legends.travian.com/gpack/367/js/popper.min.js"></script>
<script type="application/javascript" src="https://cdn.legends.travian.com/gpack/367/js/tippy.min.js"></script>
<script type="application/javascript" src="https://cdn.legends.travian.com/gpack/367/js/PixiJS/pixi.min.js"></script>
<script type="application/javascript" src="https://cdn.legends.travian.com/gpack/367/js/deepmerge.js"></script>
<script type="application/javascript">window.Travian = {};</script>
<script type="application/javascript" src="/js/Constants.js"></script>
<script type="application/javascript" src="/js/Variables.js?367"></script>
<script type="application/javascript" src="/js/en-US/Strings.js?367"></script>
<script defer type='application/javascript' src='https://cdn.legends.travian.com/gpack/367/js/bundle/vendor.js'></script>
<script defer type='application/javascript' src='https://cdn.legends.travian.com/gpack/367/js/bundle/runtime.js'></script>
<script defer type='application/javascript' src='https://cdn.legends.travian.com/gpack/367/js/bundle/main.js'></script>
<script type="application/javascript" src="https://cdn.legends.travian.com/gpack/367/js/bundle/crypt.js"></script>
<script type="application/javascript">
    Travian.Game.language = "en-US";
    Travian.Game.timestamp = 1773401661;
    Travian.Game.timeZone = "Asia/Dubai";
    Travian.Game.timezoneOffsetToUTC = -14400;
    Travian.Game.timeFormat = 2;
</script>
<script type="application/javascript">
    Travian.Game.Preferences.initialize({"entriesPerPage":"10","flagAttributesBoxOpen":"1","hideContextualHelp":"","marketplaceOffersPerPage":"10","mobileUnitDisplay":"expanded","seasons":"1","snowAnimation":"{\"enabled\":false,\"maxFlakes\":1800,\"maxFlakeRadius\":10,\"screenWidth\":1692,\"screenHeight\":1400}","troopMovementsPerPage":"10","videoFeatureVideoInfoScreen":"{\"buildingUpgrade\":false,\"adventureDifficulty\":false,\"adventureDuration\":false}"});
    Travian.Game.PaymentWizardEventListener.defaultOptions = {"shopUIVersion":4,"cssClass":"paymentShopV4","data":{"activeTab":"buyGold"}};
</script>
	</head>
	<body class="village2 ltr mobileOptimized"
        data-browser="chrome" data-browser-engine="blink" data-theme="default" data-language="en-US" data-village-perspective="perspectiveBuildings"     >
        <script>window.cmp_minimaltracking=true;window.cmp_disable_spa=true;window.cmp_noscreen=true;</script><script>window.gdprAppliesGlobally=true;if(!("cmp_id" in window)||window.cmp_id<1){window.cmp_id=0}if(!("cmp_cdid" in window)){window.cmp_cdid="40dcf06677fd"}if(!("cmp_params" in window)){window.cmp_params=""}if(!("cmp_host" in window)){window.cmp_host="d.delivery.consentmanager.net"}if(!("cmp_cdn" in window)){window.cmp_cdn="cdn.consentmanager.net"}if(!("cmp_proto" in window)){window.cmp_proto="https:"}if(!("cmp_codesrc" in window)){window.cmp_codesrc="1"}window.cmp_getsupportedLangs=function(){var b=["DE","EN","FR","IT","NO","DA","FI","ES","PT","RO","BG","ET","EL","GA","HR","LV","LT","MT","NL","PL","SV","SK","SL","CS","HU","RU","SR","ZH","TR","UK","AR","BS"];if("cmp_customlanguages" in window){for(var a=0;a<window.cmp_customlanguages.length;a++){b.push(window.cmp_customlanguages[a].l.toUpperCase())}}return b};window.cmp_getRTLLangs=function(){var a=["AR"];if("cmp_customlanguages" in window){for(var b=0;b<window.cmp_customlanguages.length;b++){if("r" in window.cmp_customlanguages[b]&&window.cmp_customlanguages[b].r){a.push(window.cmp_customlanguages[b].l)}}}return a};window.cmp_getlang=function(j){if(typeof(j)!="boolean"){j=true}if(j&&typeof(cmp_getlang.usedlang)=="string"&&cmp_getlang.usedlang!==""){return cmp_getlang.usedlang}var g=window.cmp_getsupportedLangs();var c=[];var f=location.hash;var e=location.search;var a="languages" in navigator?navigator.languages:[];if(f.indexOf("cmplang=")!=-1){c.push(f.substr(f.indexOf("cmplang=")+8,2).toUpperCase())}else{if(e.indexOf("cmplang=")!=-1){c.push(e.substr(e.indexOf("cmplang=")+8,2).toUpperCase())}else{if("cmp_setlang" in window&&window.cmp_setlang!=""){c.push(window.cmp_setlang.toUpperCase())}else{if(a.length>0){for(var d=0;d<a.length;d++){c.push(a[d])}}}}}if("language" in navigator){c.push(navigator.language)}if("userLanguage" in navigator){c.push(navigator.userLanguage)}var h="";for(var d=0;d<c.length;d++){var b=c[d].toUpperCase();if(g.indexOf(b)!=-1){h=b;break}if(b.indexOf("-")!=-1){b=b.substr(0,2)}if(g.indexOf(b)!=-1){h=b;break}}if(h==""&&typeof(cmp_getlang.defaultlang)=="string"&&cmp_getlang.defaultlang!==""){return cmp_getlang.defaultlang}else{if(h==""){h="EN"}}h=h.toUpperCase();return h};(function(){var i=document;var b=window;var a="";var g="_en";if("cmp_getlang" in b){a=b.cmp_getlang().toLowerCase();g="_"+a}var f=("cmp_proto" in b)?b.cmp_proto:"https:";if(f!="http:"&&f!="https:"){f="https:"}var c=i.createElement("script");c.setAttribute("data-cmp-ab","1");c.src=f+"//"+b.cmp_cdn+"/delivery/autocdn/cmp-web."+("cmp_id" in b&&b.cmp_id>0?b.cmp_id:"")+("cmp_cdid" in b?"x"+b.cmp_cdid:"")+"."+a.replace("_","").toLowerCase()+".js";c.type="text/javascript";c.async=true;if(i.body){i.body.appendChild(c)}else{if(i.currentScript&&i.currentScript.parentElement){i.currentScript.parentElement.appendChild(c)}else{var h=i.getElementsByTagName("body");if(h.length==0){h=i.getElementsByTagName("div")}if(h.length==0){h=i.getElementsByTagName("span")}if(h.length==0){h=i.getElementsByTagName("ins")}if(h.length==0){h=i.getElementsByTagName("script")}if(h.length==0){h=i.getElementsByTagName("head")}if(h.length>0){h[0].appendChild(c)}}}var c=i.createElement("script");c.src=f+"//"+b.cmp_cdn+"/delivery/js/cmp"+g+".min.js";c.type="text/javascript";c.setAttribute("data-cmp-ab","1");c.async=true;if(i.body){i.body.appendChild(c)}else{if(i.currentScript&&i.currentScript.parentElement){i.currentScript.parentElement.appendChild(c)}else{var h=i.getElementsByTagName("body");if(h.length==0){h=i.getElementsByTagName("div")}if(h.length==0){h=i.getElementsByTagName("span")}if(h.length==0){h=i.getElementsByTagName("ins")}if(h.length==0){h=i.getElementsByTagName("script")}if(h.length==0){h=i.getElementsByTagName("head")}if(h.length>0){h[0].appendChild(c)}}}})();window.cmp_addFrame=function(b){if(!window.frames[b]){if(document.body){var a=document.createElement("iframe");a.style.cssText="display:none";if("cmp_cdn" in window&&"cmp_ultrablocking" in window&&window.cmp_ultrablocking>0){a.src="//"+window.cmp_cdn+"/delivery/empty.html"}a.name=b;document.body.appendChild(a)}else{window.setTimeout(window.cmp_addFrame,10,b)}}};window.cmp_rc=function(h){var b=document.cookie;var f="";var d=0;while(b!=""&&d<100){d++;while(b.substr(0,1)==" "){b=b.substr(1,b.length)}var g=b.substring(0,b.indexOf("="));if(b.indexOf(";")!=-1){var c=b.substring(b.indexOf("=")+1,b.indexOf(";"))}else{var c=b.substr(b.indexOf("=")+1,b.length)}if(h==g){f=c}var e=b.indexOf(";")+1;if(e==0){e=b.length}b=b.substring(e,b.length)}return(f)};window.cmp_stub=function(){var a=arguments;__cmp.a=__cmp.a||[];if(!a.length){return __cmp.a}else{if(a[0]==="ping"){if(a[1]===2){a[2]({gdprApplies:gdprAppliesGlobally,cmpLoaded:false,cmpStatus:"stub",displayStatus:"hidden",apiVersion:"2.0",cmpId:31},true)}else{a[2](false,true)}}else{if(a[0]==="getUSPData"){a[2]({version:1,uspString:window.cmp_rc("")},true)}else{if(a[0]==="getTCData"){__cmp.a.push([].slice.apply(a))}else{if(a[0]==="addEventListener"||a[0]==="removeEventListener"){__cmp.a.push([].slice.apply(a))}else{if(a.length==4&&a[3]===false){a[2]({},false)}else{__cmp.a.push([].slice.apply(a))}}}}}}};window.cmp_gpp_ping=function(){return{gppVersion:"1.0",cmpStatus:"stub",cmpDisplayStatus:"hidden",supportedAPIs:["tcfca","usnat","usca","usva","usco","usut","usct"],cmpId:31}};window.cmp_gppstub=function(){var a=arguments;__gpp.q=__gpp.q||[];if(!a.length){return __gpp.q}var g=a[0];var f=a.length>1?a[1]:null;var e=a.length>2?a[2]:null;if(g==="ping"){return window.cmp_gpp_ping()}else{if(g==="addEventListener"){__gpp.e=__gpp.e||[];if(!("lastId" in __gpp)){__gpp.lastId=0}__gpp.lastId++;var c=__gpp.lastId;__gpp.e.push({id:c,callback:f});return{eventName:"listenerRegistered",listenerId:c,data:true,pingData:window.cmp_gpp_ping()}}else{if(g==="removeEventListener"){var h=false;__gpp.e=__gpp.e||[];for(var d=0;d<__gpp.e.length;d++){if(__gpp.e[d].id==e){__gpp.e[d].splice(d,1);h=true;break}}return{eventName:"listenerRemoved",listenerId:e,data:h,pingData:window.cmp_gpp_ping()}}else{if(g==="getGPPData"){return{sectionId:3,gppVersion:1,sectionList:[],applicableSections:[0],gppString:"",pingData:window.cmp_gpp_ping()}}else{if(g==="hasSection"||g==="getSection"||g==="getField"){return null}else{__gpp.q.push([].slice.apply(a))}}}}}};window.cmp_msghandler=function(d){var a=typeof d.data==="string";try{var c=a?JSON.parse(d.data):d.data}catch(f){var c=null}if(typeof(c)==="object"&&c!==null&&"__cmpCall" in c){var b=c.__cmpCall;window.__cmp(b.command,b.parameter,function(h,g){var e={__cmpReturn:{returnValue:h,success:g,callId:b.callId}};d.source.postMessage(a?JSON.stringify(e):e,"*")})}if(typeof(c)==="object"&&c!==null&&"__uspapiCall" in c){var b=c.__uspapiCall;window.__uspapi(b.command,b.version,function(h,g){var e={__uspapiReturn:{returnValue:h,success:g,callId:b.callId}};d.source.postMessage(a?JSON.stringify(e):e,"*")})}if(typeof(c)==="object"&&c!==null&&"__tcfapiCall" in c){var b=c.__tcfapiCall;window.__tcfapi(b.command,b.version,function(h,g){var e={__tcfapiReturn:{returnValue:h,success:g,callId:b.callId}};d.source.postMessage(a?JSON.stringify(e):e,"*")},b.parameter)}if(typeof(c)==="object"&&c!==null&&"__gppCall" in c){var b=c.__gppCall;window.__gpp(b.command,function(h,g){var e={__gppReturn:{returnValue:h,success:g,callId:b.callId}};d.source.postMessage(a?JSON.stringify(e):e,"*")},"parameter" in b?b.parameter:null,"version" in b?b.version:1)}};window.cmp_setStub=function(a){if(!(a in window)||(typeof(window[a])!=="function"&&typeof(window[a])!=="object"&&(typeof(window[a])==="undefined"||window[a]!==null))){window[a]=window.cmp_stub;window[a].msgHandler=window.cmp_msghandler;window.addEventListener("message",window.cmp_msghandler,false)}};window.cmp_setGppStub=function(a){if(!(a in window)||(typeof(window[a])!=="function"&&typeof(window[a])!=="object"&&(typeof(window[a])==="undefined"||window[a]!==null))){window[a]=window.cmp_gppstub;window[a].msgHandler=window.cmp_msghandler;window.addEventListener("message",window.cmp_msghandler,false)}};window.cmp_addFrame("__cmpLocator");if(!("cmp_disableusp" in window)||!window.cmp_disableusp){window.cmp_addFrame("__uspapiLocator")}if(!("cmp_disabletcf" in window)||!window.cmp_disabletcf){window.cmp_addFrame("__tcfapiLocator")}if(!("cmp_disablegpp" in window)||!window.cmp_disablegpp){window.cmp_addFrame("__gppLocator")}window.cmp_setStub("__cmp");if(!("cmp_disabletcf" in window)||!window.cmp_disabletcf){window.cmp_setStub("__tcfapi")}if(!("cmp_disableusp" in window)||!window.cmp_disableusp){window.cmp_setStub("__uspapi")}if(!("cmp_disablegpp" in window)||!window.cmp_disablegpp){window.cmp_setGppStub("__gpp")};</script>        <div id="reactPortalRoot"></div>
        <div id="reactDialogWrapper"></div>

		<div id="background" class=" ">
			<div id="topBar">
    <a id="logo" href="https://www.travian.com/international" target="_blank" title="Travian">
		<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 172.7 60">
  <path d="M52.9 34.4c-.2-.3-.3-.7-.3-1.3 0-.8-.1-1.2-.1-1.3l-.1-3.9.1-6.6c0-1.1.1-2.2.1-3.3.1-1.5.2-2.4.3-2.8.1 0 .3 0 .6-.1h.4c2.6 0 4.1.3 4.4.8.1.1.1.4.3.8.1.4.2.5.2.5s.1 0 .2-.1V17c0-.4.1-.9.2-1.4.2-.5.3-1 .5-1.6l-.4-.1c-.9.2-1.9.4-3.1.4h-5l-6.5-.3c-.3 0-.5.4-.8 1.2-.1.5-.3 1-.4 1.4-.2.5-.3.8-.3.8v.2h.2c.1-.4.3-.7.6-1 .3-.3.6-.5.9-.6.3-.1.9-.2 2.1-.4 1.3-.2 2.1-.3 2.5-.3.3 0 .4 1.5.4 4.5l-.1 8.6c-.1 2.2-.3 3.7-.3 4.6-.1.9-.2 1.5-.4 1.8-.1.1-.2.2-.4.2-.2.1-.3.2-.3.3l.5.1c.2-.1.4-.1.5-.1 1.1-.1 1.8-.2 1.9-.2l2.8.2c.2 0 .3-.1.4-.2 0 0-.3-.1-.8-.2-.4-.2-.7-.3-.8-.5zm19.7-.1c.6.7 1.4 1 2.3 1h.9c1.2-.1 1.8-.2 1.9-.3-.1 0-.4-.1-.8-.3-.2-.1-.5-.2-.6-.4-.5-.4-1.1-1.2-1.7-2.2-.5-.9-1-1.8-1.4-2.7-.3-.5-.7-1.3-1.4-2.4-.4-.8-.7-1.2-.7-1.2 0-.1.4-.5 1-1.1.7-.7 1.3-1.4 1.6-2.1.6-1 .9-2.2.9-3.4 0-1.8-.7-3.1-2.1-3.9-1-.6-2.3-1-3.7-1l-2.8.1c-.9 0-1.6.1-2.1.1l-1.5.1c-.1 0-.3.1-.6.2l.3.1c.2.1.2.1.3.2.4 1 .6 2 .6 3l.1 3.9v2s0 .3-.1.8c0 .5-.1.7-.1.8v2l-.2 4.2c0 1.9-.1 3-.2 3.3-.3.4-.5.6-.6.7 1.2-.2 2-.3 2.3-.3h2.2s.3-.1.9-.2c-.1-.1-.2-.1-.4-.1-.9 0-1.4-1-1.4-3v-5.4c0-.2.1-.4.3-.4 1.2 0 2 .2 2.4.6.5.5 1 1.3 1.5 2.1.4.7.8 1.5 1.2 2.2.8 1.7 1.4 2.7 1.7 3zm-5.2-8.2h-1.8l.1-11.3h.9c1.4 0 2.6.8 3.6 2.5.9 1.5 1.4 2.9 1.4 4.3 0 1.9-.3 3.1-.9 3.6-.4.7-1.5.9-3.3.9zm33.6 8.6c-.4-.2-.7-.5-.9-.9-1.2-2-2.5-4.9-3.8-8.6-.9-2.6-1.7-5.1-2.6-7.7-.2-.7-.5-1.3-.7-2-.4-1-.9-1.5-1.3-1.5h-3.2c-.2 0-.4.1-.6.1-.2 0-.3.1-.3.2.1.1.2.1.2.1h.5c.3 0 .5.1.8.3.2.2.3.5.3.8 0 .5-.9 3-2.6 7.5-1.6 4.1-2.7 6.9-3.4 8.5-.7 1.6-1.5 2.8-2.5 3.6.3 0 .8 0 1.4.1.7.1 1.1.1 1.4.1l3.6-.5c-.7-.2-1.4-.5-2.1-.8-.6-.3-.9-.8-.9-1.7 0-.8.4-2.2 1.1-4.1l.6-1.8c.4-1 .8-1.6 1-1.6h5.4c.8 1.8 1.4 3.2 1.8 4.2.4 1.1.9 2.3 1.3 3.5.8 1.7 1.7 2.6 2.7 2.6l3-.2c.3.1.1 0-.2-.2zm-8.5-10.3h-5.4l2.8-7.4c.4.7.6 1.3.8 1.7l1.8 5.4v.3zm20.7-10.2c.3-.1.6.2.8.7.2.4.2.8.2 1.3 0 1.3-.8 4.2-2.3 8.5-1 2.8-1.8 4.9-2.5 6.4-1.6-3.7-2.8-6.9-3.8-9.4-.8-2.3-1.5-4-1.8-5.1-.5-1.4-.8-2.1-.8-2.1-.3-.1-.8-.2-1.6-.2h-2.6c-.3 0-.5.1-.6.3.2.1.4.1.6.2.2.1.3.2.5.3 1.1 1.5 2.3 3.7 3.5 6.7.7 1.5 1.6 3.9 2.8 7.1 1.1 3 1.7 4.6 1.8 4.9.6 1.2.9 1.8 1 1.9 2.8-7.3 5.8-14.6 9-21.8h-4.2v.3zm7.8 3.6c0 .3.1.6.1.8v6.8l-.1 4.9-.5 5.1h4.2c.1-.1.1-.2.1-.2-.5-.2-.7-.3-.7-.3-.2-.2-.3-.5-.3-.9 0-.3-.1-.6-.1-1l.1-9.6c.1-3.6.2-6.7.5-9.4h-.3c.1 0-.1 0-.6.1s-1 .1-1.7.1h-1.5c.5.5.7 1.1.8 1.8-.1.5-.1 1.2 0 1.8zm27 16.9c-.4-.2-.7-.5-.9-.9-1.2-2-2.5-4.9-3.8-8.6-.9-2.6-1.7-5.1-2.6-7.7-.2-.7-.5-1.3-.7-2-.4-1-.9-1.5-1.3-1.5l-3.1.1c-.2 0-.4.1-.6.1-.2 0-.3.1-.3.2.1.1.2.1.2.1h.5c.3 0 .5.1.8.3.2.2.3.5.3.8 0 .5-.9 3-2.6 7.5-1.6 4.1-2.7 6.9-3.4 8.5-.7 1.6-1.5 2.8-2.5 3.6.3 0 .8 0 1.4.1.7.1 1.1.1 1.4.1l3.6-.5c-.7-.2-1.4-.5-2.1-.8-.6-.3-.9-.8-.9-1.7 0-.8.4-2.2 1.1-4.1l.6-1.8c.4-1 .8-1.6 1-1.6h5.4c.8 1.8 1.4 3.2 1.8 4.2.4 1.1.9 2.3 1.3 3.5.8 1.7 1.7 2.6 2.7 2.6l3-.2c.2 0 .1-.1-.3-.3zm-8.4-10.3h-5.4L137 17c.4.7.6 1.3.8 1.7l1.8 5.4v.3zm29.7-10.2c-.4 0-1 .2-2 .5-.8.3-1.3.5-1.4.6.2 0 .8 0 1.7-.1.2 0 .3.1.3.2.1 1.4.2 2.5.2 3.2.1 2.1.2 4.4.3 6.6l.1 4.6c0 .2 0 .3-.1.4-3.4-3.8-5.7-6.3-6.8-7.6-2.8-3.3-4.8-6.1-6.2-8.6-2.1.2-3.8.3-4.9.5 1.3.6 2.1 1.4 2.5 2.4.3.6.4 1.6.4 3l-.2 3.7v1.7c0 3.8-.2 6.4-.6 7.9-.1.4-.3.7-.7 1-.5.4-.8.7-.9.7.5.1 1.1.2 2 .2.7 0 1.5-.1 2.5-.3 1.3-.3 2-.5 2-.5-.6-.1-1.1-.2-1.4-.2-.5 0-.9-.1-1.4-.4-.1-.1-.2-.3-.3-.5 0-.1-.1-.3-.1-.7-.2-1.9-.3-3.2-.3-4-.1-3.9-.1-7.1 0-9.7 1.1 1.3 3.1 3.5 5.8 6.7 1.8 2.1 4.3 4.9 7.5 8.4.9.9 1.3 1.4 1.4 1.4.1 0 .1 0 .2-.1.1-1.8.2-3.7.3-5.5.2-3.6.3-5.6.3-6.1v-1.4c0-.3.2-2.6.6-6.9.2-.1.7-.3 1.3-.5.6-.2.9-.3 1.1-.5l-3.2-.1zm-112 27.6H56v9.5h6v-1.2h-4.7m14.5-3.2h5.3v-1.1h-5.3v-2.9h5.7v-1.1h-7v9.5h7.2v-1.2h-5.9m19.1-2.6h2.8v1.8c-.3.2-.7.5-1.2.7s-1.1.3-1.6.3c-.6 0-1.2-.1-1.8-.4-.6-.3-1-.7-1.3-1.3-.3-.6-.4-1.3-.4-2.1 0-.7.1-1.3.4-1.9.1-.3.3-.7.6-.9.3-.3.6-.5 1-.7.4-.2.9-.3 1.5-.3.5 0 .9.1 1.3.2s.7.4.9.7c.2.3.4.7.5 1.1l1.2-.3c-.2-.6-.4-1.2-.7-1.6s-.8-.7-1.3-.9c-.6-.2-1.2-.3-1.9-.3-1 0-1.8.2-2.5.6s-1.3 1-1.7 1.8c-.4.8-.6 1.7-.6 2.6 0 .9.2 1.8.6 2.5s1 1.3 1.8 1.7 1.6.6 2.6.6c.7 0 1.4-.1 2.1-.4.7-.2 1.3-.6 1.9-1.1v-3.5H91v1.1zm14.2-.6h5.4v-1.1h-5.4v-2.9h5.7v-1.1h-7v9.5h7.3v-1.2h-6m21-.9l-5.1-7.4h-1.3v9.5h1.3v-7.5l5 7.5h1.3v-9.5h-1.2m16.8.8c-.4-.3-.9-.6-1.4-.7-.4-.1-1-.1-1.7-.1h-3.3v9.5h3.5c.6 0 1.1-.1 1.6-.2s.8-.3 1.2-.5c.3-.2.6-.5.9-.9.3-.4.5-.8.7-1.4.2-.6.3-1.2.3-1.9 0-.8-.1-1.6-.4-2.3-.5-.5-.9-1.1-1.4-1.5zm-.1 5.7c-.2.5-.4.9-.7 1.2-.2.2-.5.4-.9.5s-.9.2-1.5.2h-2.1V43h2c.8 0 1.3.1 1.7.2.5.2.9.5 1.2 1.1.3.5.5 1.3.5 2.3.1.6 0 1.2-.2 1.7zm15.9-2c-.4-.2-1.1-.4-2.1-.6-1-.2-1.7-.5-1.9-.7-.2-.2-.4-.5-.4-.8 0-.4.2-.7.5-1 .4-.3.9-.4 1.7-.4.7 0 1.3.2 1.7.5.4.3.6.8.7 1.4l1.2-.1c0-.6-.2-1.1-.5-1.5-.3-.4-.7-.8-1.3-1-.5-.2-1.2-.3-1.9-.3-.6 0-1.2.1-1.8.3-.5.2-.9.5-1.2.9-.3.4-.4.9-.4 1.3s.1.8.3 1.2c.2.4.6.6 1 .9.4.2 1 .4 1.9.6.9.2 1.5.4 1.7.5.4.2.7.3.9.6.2.2.3.5.3.8 0 .3-.1.6-.3.8-.2.2-.5.4-.8.6-.4.1-.8.2-1.3.2s-1-.1-1.5-.3-.8-.4-1-.7c-.2-.3-.3-.7-.4-1.2l-1.2.1c0 .6.2 1.2.5 1.7s.8.9 1.4 1.1 1.3.4 2.2.4c.7 0 1.3-.1 1.9-.4.6-.2 1-.6 1.3-1 .3-.4.4-.9.4-1.4 0-.5-.1-1-.4-1.3-.2-.7-.6-1-1.2-1.2z"></path>
  <image width="156" height="250" transform="matrix(.24 0 0 .24 .22 .14)" xlink:href="https://cdn.legends.travian.com/gpack/367/logo.png"></image>
</svg>
	</a>
			<div id="header" class="referAFriend">
            <input type="checkbox" id="mobileMenuState" />
    
			<div id="navigation">
			<a class="village resourceView " href="/dorf1.php" accesskey="1" title="Resources||"></a>
			<a class="village buildingView " href="/dorf2.php" accesskey="2" title="Buildings||"></a>

			<a class="map" href="/karte.php" accesskey="3" title="Map||"></a>
			<a class="statistics" href="/statistics" accesskey="4" title="Statistics||"></a>
			<a class="reports" href="/report" accesskey="5" title="Reports||New reports: 8503">
									<div class="indicator">99+</div>
							</a>
			<a class="messages" href="/messages" accesskey="6" title="Messages||New messages: 24">
									<div class="indicator">24</div>
							</a>

			<a class="dailyQuests" href="#" accesskey="7" title="Daily quests||Collect daily rewards" onclick="Travian.React.openDailyQuestsDialog(); return false;">
							</a>

								<label class="mobileMenuButton" for="mobileMenuState">
											</label>
					<a class="mobileShopButton" href="#" accesskey="8" title="" onclick="jQuery(window).trigger('startPaymentWizard', {}); this.blur(); return false;"></a>
					</div>

		<div class="currency">
            <svg viewBox="0 0 50 50" class="goldCoin" onClick="jQuery(window).trigger('startPaymentWizard', {data:{activeTab: Travian.Constants.SHOP_TABS.advantages}}); return false;">
    <defs>
        <linearGradient id="gold-coin-linear-gradient" x1="25" x2="25" y1="2" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#ffdc79"></stop>
            <stop offset=".47" stop-color="#fcbf60"></stop>
            <stop offset=".8" stop-color="#af7029"></stop>
            <stop offset="1" stop-color="#c09957"></stop>
        </linearGradient>
        <linearGradient id="gold-coin-linear-gradient-2" x1="25" x2="25" y1="7.9" y2="42.19" gradientUnits="userSpaceOnUse">
            <stop offset=".06" stop-color="#81481b"></stop>
            <stop offset="1" stop-color="#fef6a9"></stop>
        </linearGradient>
    </defs>
    <circle cx="25" cy="25" r="25" fill="#522d1c"><title>Gold</title></circle>
    <circle cx="25" cy="25" r="23" fill="url(#gold-coin-linear-gradient)"><title>Gold</title></circle>
    <circle cx="25" cy="25" r="17" fill="url(#gold-coin-linear-gradient-2)"><title>Gold</title></circle>
    <path fill="#b4772a" d="M41 25C40.62 3.67 9.38 3.67 9 25c.38 21.33 31.62 21.33 32 0Z"><title>Gold</title></path>
    <path fill="#a06327" d="M14.84 12.41c.63-.49 1.29-.94 1.99-1.32l6.58 7.14v2.01l-8.57-7.83Zm20.9 10.4c.22-.05.91-.05.91-.05s2.01-1.26 3.66-2.53c-.11-.38-.22-.76-.35-1.12-.03-.06-.06-.13-.09-.2-1.69 1.71-3.63 3.58-4.12 3.89Zm-24.72-5.9c2.85 2.36 8.53 5.55 13.36 5.45-.49.1 1.95.1 1.36 0 4.87 0 10.42-3.05 13.24-5.42-.39-.69-.88-1.38-1.36-2.07-12.05 9.83-13.24 9.75-25.24-.03-.5.64-.96 1.32-1.37 2.07Zm14.14-1.24-3.38-6.36c-.42.08-.84.17-1.25.28 1.18 1.77 4.07 5.33 4.63 6.08Zm-1.25-6.62 1.25 1.6 1.24-1.59c-.83-.07-1.66-.06-2.49-.01Zm1.34 6.62s.69-1.18 1.96-2.66c.71-.81 1.75-2.27 2.51-3.35-.37-.11-.75-.19-1.13-.27l-3.35 6.28ZM9.07 23.94c-.02.35-.06.69-.07 1.06.01.67.05 1.31.12 1.94l2.5-3H9.06Zm17.75-3.84 8.47-7.59c-.62-.5-1.28-.95-1.96-1.35l-6.51 7.06v1.87Zm-12.37 2.66c-.38-.19-2.46-2.2-4.29-3.95-.16.42-.31.85-.43 1.29 2.51 1.71 3.48 2.85 4.72 2.66Zm24.21 10.89c-5.93-6.46-11.45-8.13-11.45-8.13 4.43 3.21 8.18 7.47 10.15 9.95.47-.56.91-1.16 1.31-1.82Zm-3.76-9.81h-4.48v.1c3.94 1.36 7.68 4.15 9.84 6.02.11-.38.23-.77.31-1.17-2.24-2.25-5.67-4.95-5.67-4.95Zm-8.37 6.8-.19 1.58c2.17 1.34 4.6 4.69 6.17 7.05.96-.47 1.86-1.05 2.71-1.71-4.64-4.57-8.68-6.91-8.68-6.91Zm-6.82-6.8h-4.38v.1s-3.51 2.78-5.85 5.03c.09.37.19.74.29 1.09 2.16-1.87 5.9-4.77 9.94-6.22Zm21.22.1H38.5l2.38 2.8c.06-.56.1-1.14.11-1.74 0-.36-.04-.71-.07-1.06Zm-17.91 1.58c-.68-.1-5.16 1.38-11.59 8.27.4.65.84 1.25 1.32 1.81 1.96-2.38 5.73-6.76 10.27-10.08Zm-5.33 13.84c1.57-2.44 3.97-5.74 6.21-7.15l-.19-1.48s-4.01 2.32-8.73 6.96c.85.65 1.76 1.21 2.71 1.67Zm12.93-.15-4.09-4.33H24l-4.09 4.33c1.56.59 2.92-1.97 5.36-3.64 2.34 1.67 3.7 4.24 5.36 3.64Z"><title>Gold</title></path>
    <path fill="#703e19" d="M34.65 15.43h-1.8l-.4.6h-14.9l-.4-.6h-1.8l-1 5.8.9 1 2.1-3.1h4.8v14.6c0 1.7-2.6 2.1-2.6 2.1v2.3h11v-2.3s-2.6-.4-2.6-2.1v-14.6h4.8l2.1 3.1.7-1.1-.9-5.7Z"><title>Gold</title></path>
    <path fill="#f7ce7c" d="m34.95 21.25.7-1.1-1-5.8h-1.8l-.4.6h-14.9l-.4-.6h-1.8l-1 5.8.9 1.1 2.1-3.1h5.3v14.6c0 1.7-3.1 2.1-3.1 2.1v1.4l.8.8h9.5l.7-.8v-1.5s-3.1-.4-3.1-2.1v-14.6h5.4l2.1 3.2Z"><title>Gold</title></path>
    <path fill="#faf28a" d="m14.45 20.25-.1-.1 1-5.8h1.8l.4.6h14.9l.4-.6h1.8l1 5.8-.1.1-.9-5.3h-1.8l-.4.6h-14.9l-.4-.6h-1.8l-.9 5.3Zm5.1 15.17c.2.1 3.7-.8 3.1-2.7 0 1.7-3.1 2.1-3.1 2.1v.6Zm7.9-2.76c-.6 2 2.8 2.8 3.1 2.7v-.6s-3.1-.5-3.1-2.1Z"><title>Gold</title></path>
    <path fill="#a87134" d="M25.05 4c1.48 0 1.48 2.26 0 2.26S23.57 4 25.05 4ZM21.7 6.56c1.48-.2 1.08-2.46-.39-2.16-1.38.2-.98 2.46.39 2.16Zm-3.14.78c1.38-.49.59-2.66-.79-2.07-1.28.49-.49 2.66.79 2.07Zm-2.95 1.38c1.28-.69.1-2.66-1.08-1.97-1.28.79-.1 2.75 1.08 1.97Zm-2.66 1.87c1.08-.89-.3-2.66-1.48-1.67-1.08.89.39 2.66 1.48 1.67Zm-2.26 2.36c.98-1.08-.79-2.56-1.67-1.48-.98 1.08.69 2.56 1.67 1.48Zm-1.97 2.66c.79-1.28-1.18-2.36-1.97-1.08-.69 1.18 1.28 2.36 1.97 1.08Zm-1.38 2.95c.59-1.38-1.57-2.07-2.07-.79-.49 1.38 1.67 2.16 2.07.79Zm-.78 3.14c.3-1.38-1.97-1.77-2.16-.39-.3 1.48 1.87 1.87 2.16.39Zm-.3 3.25c0-1.48-2.26-1.48-2.26 0s2.26 1.48 2.26 0Zm.3 3.35c-.2-1.48-2.46-1.08-2.16.39.2 1.38 2.36.98 2.16-.39Zm.78 3.14c-.49-1.38-2.66-.59-2.07.79.49 1.28 2.66.49 2.07-.79Zm1.38 2.95c-.69-1.28-2.66-.1-1.97 1.08.79 1.28 2.75.1 1.97-1.08Zm1.87 2.66c-.89-1.08-2.66.39-1.67 1.48.89 1.08 2.66-.39 1.67-1.48Zm2.36 2.36c-1.08-.98-2.56.79-1.48 1.67 1.08.98 2.56-.79 1.48-1.67Zm2.66 1.87c-1.28-.79-2.36 1.18-1.08 1.97 1.18.69 2.36-1.28 1.08-1.97Zm2.95 1.38c-1.38-.49-2.16 1.67-.79 2.07 1.38.49 2.16-1.57.79-2.07Zm3.14.78c-1.38-.3-1.77 1.97-.39 2.16 1.48.39 1.87-1.87.39-2.16Zm3.25.3c-1.48 0-1.48 2.26 0 2.26s1.48-2.26 0-2.26Zm3.25-.3c-1.48.2-1.08 2.46.39 2.16 1.48-.2 1.08-2.36-.39-2.16Zm3.14-.78c-1.38.49-.59 2.66.79 2.07 1.38-.49.59-2.56-.79-2.07Zm3.05-1.38c-1.28.69-.1 2.66 1.08 1.97 1.28-.79.1-2.75-1.08-1.97Zm2.66-1.87c-1.08.89.3 2.66 1.48 1.67 1.08-.89-.39-2.66-1.48-1.67Zm2.26-2.36c-.98 1.08.79 2.56 1.67 1.48.98-1.08-.69-2.56-1.67-1.48Zm1.87-2.66c-.79 1.28 1.18 2.36 1.97 1.08.79-1.18-1.18-2.36-1.97-1.08Zm1.38-2.95c-.49 1.38 1.57 2.16 2.07.79.59-1.38-1.57-2.16-2.07-.79Zm.88-3.14c-.3 1.38 1.97 1.77 2.16.39.3-1.48-1.97-1.87-2.16-.39Zm.3-3.25c0 1.48 2.26 1.48 2.26 0s-2.26-1.48-2.26 0Zm-.3-3.25c.2 1.48 2.46 1.08 2.16-.39-.2-1.48-2.46-1.08-2.16.39Zm-.78-3.14c.49 1.38 2.66.59 2.07-.79-.49-1.38-2.66-.59-2.07.79Zm-1.38-3.05c.69 1.28 2.66.1 1.97-1.08-.79-1.28-2.75-.1-1.97 1.08Zm-1.97-2.66c.89 1.08 2.66-.3 1.67-1.48-.79-1.08-2.56.39-1.67 1.48Zm-2.26-2.26c1.08.98 2.56-.79 1.48-1.67-1.18-.98-2.56.69-1.48 1.67Zm-2.66-1.87c1.28.79 2.36-1.18 1.08-1.97-1.18-.79-2.36 1.18-1.08 1.97Zm-2.95-1.38c1.38.49 2.16-1.67.79-2.07-1.38-.59-2.16 1.57-.79 2.07Zm-3.14-.88c1.38.3 1.77-1.97.39-2.16-1.48-.3-1.87 1.97-.39 2.16Z"><title>Gold</title></path>
</svg>
            <div class="value ajaxReplaceableGoldAmount">
                &#x202d;130&#x202c;            </div>
            <svg viewBox="0 0 50 50" class="silverCoin" onClick="jQuery(window).trigger('startPaymentWizard', {data:{activeTab: Travian.Constants.SHOP_TABS.advantages}}); return false;">
    <defs>
        <linearGradient id="linear-gradient" x1="25" x2="25" y1="2" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#c4e0f5"></stop>
            <stop offset=".48" stop-color="#b7ceeb"></stop>
            <stop offset=".77" stop-color="#6383a8"></stop>
            <stop offset="1" stop-color="#98b7db"></stop>
        </linearGradient>
        <linearGradient id="linear-gradient-2" x1="25" x2="25" y1="7.9" y2="42.19" gradientUnits="userSpaceOnUse">
            <stop offset=".06" stop-color="#4b6f7d"></stop>
            <stop offset="1" stop-color="#fafbfb"></stop>
        </linearGradient>
    </defs>
    <circle cx="25" cy="25" r="25" fill="#303a4c"><title>Silver</title></circle>
    <circle cx="25" cy="25" r="23" fill="url(#linear-gradient)"><title>Silver</title></circle>
    <circle cx="25" cy="25" r="17" fill="url(#linear-gradient-2)"><title>Silver</title></circle>
    <path fill="#7991bc" d="M41 25C40.62 3.67 9.38 3.67 9 25c.38 21.33 31.62 21.33 32 0Z"><title>Silver</title></path>
    <path fill="#5a7493" d="M14.84 12.41c.63-.49 1.29-.94 1.99-1.32l6.58 7.14v2.01l-8.57-7.83Zm20.9 10.4c.22-.05.91-.05.91-.05s2.01-1.26 3.66-2.53c-.11-.38-.22-.76-.35-1.12-.03-.06-.06-.13-.09-.2-1.69 1.71-3.63 3.58-4.12 3.89Zm-24.72-5.9c2.85 2.36 8.53 5.55 13.36 5.45-.49.1 1.95.1 1.36 0 4.87 0 10.42-3.05 13.24-5.42-.39-.69-.88-1.38-1.36-2.07-12.05 9.83-13.24 9.75-25.24-.03-.5.64-.96 1.32-1.37 2.07Zm14.14-1.24-3.38-6.36c-.42.08-.84.17-1.25.28 1.18 1.77 4.07 5.33 4.63 6.08Zm-1.25-6.62 1.25 1.6 1.24-1.59c-.83-.07-1.66-.06-2.49-.01Zm1.34 6.62s.69-1.18 1.96-2.66c.71-.81 1.75-2.27 2.51-3.35-.37-.11-.75-.19-1.13-.27l-3.35 6.28ZM9.07 23.94c-.02.35-.06.69-.07 1.06.01.67.05 1.31.12 1.94l2.5-3H9.06Zm17.75-3.84 8.47-7.59c-.62-.5-1.28-.95-1.96-1.35l-6.51 7.06v1.87Zm-12.37 2.66c-.38-.19-2.46-2.2-4.29-3.95-.16.42-.31.85-.43 1.29 2.51 1.71 3.48 2.85 4.72 2.66Zm24.21 10.89c-5.93-6.46-11.45-8.13-11.45-8.13 4.43 3.21 8.18 7.47 10.15 9.95.47-.56.91-1.16 1.31-1.82Zm-3.76-9.81h-4.48v.1c3.94 1.36 7.68 4.15 9.84 6.02.11-.38.23-.77.31-1.17-2.24-2.25-5.67-4.95-5.67-4.95Zm-8.37 6.8-.19 1.58c2.17 1.34 4.6 4.69 6.17 7.05.96-.47 1.86-1.05 2.71-1.71-4.64-4.57-8.68-6.91-8.68-6.91Zm-6.82-6.8h-4.38v.1s-3.51 2.78-5.85 5.03c.09.37.19.74.29 1.09 2.16-1.87 5.9-4.77 9.94-6.22Zm21.22.1H38.5l2.38 2.8c.06-.56.1-1.14.11-1.74 0-.36-.04-.71-.07-1.06Zm-17.91 1.58c-.68-.1-5.16 1.38-11.59 8.27.4.65.84 1.25 1.32 1.81 1.96-2.38 5.73-6.76 10.27-10.08Zm-5.33 13.84c1.57-2.44 3.97-5.74 6.21-7.15l-.19-1.48s-4.01 2.32-8.73 6.96c.85.65 1.76 1.21 2.71 1.67Zm12.93-.15-4.09-4.33H24l-4.09 4.33c1.56.59 2.92-1.97 5.36-3.64 2.34 1.67 3.7 4.24 5.36 3.64Z"><title>Silver</title></path>
    <path fill="#445c6b" d="M34.65 15.43h-1.8l-.4.6h-14.9l-.4-.6h-1.8l-1 5.8.9 1 2.1-3.1h4.8v14.6c0 1.7-2.6 2.1-2.6 2.1v2.3h11v-2.3s-2.6-.4-2.6-2.1v-14.6h4.8l2.1 3.1.7-1.1-.9-5.7Z"><title>Silver</title></path>
    <path fill="#c4e0f5" d="m34.95 21.25.7-1.1-1-5.8h-1.8l-.4.6h-14.9l-.4-.6h-1.8l-1 5.8.9 1.1 2.1-3.1h5.3v14.6c0 1.7-3.1 2.1-3.1 2.1v1.4l.8.8h9.5l.7-.8v-1.5s-3.1-.4-3.1-2.1v-14.6h5.4l2.1 3.2Z"><title>Silver</title></path>
    <path fill="#eff7fd" d="m14.45 20.25-.1-.1 1-5.8h1.8l.4.6h14.9l.4-.6h1.8l1 5.8-.1.1-.9-5.3h-1.8l-.4.6h-14.9l-.4-.6h-1.8l-.9 5.3Zm5.1 15.17c.2.1 3.7-.8 3.1-2.7 0 1.7-3.1 2.1-3.1 2.1v.6Zm7.9-2.76c-.6 2 2.8 2.8 3.1 2.7v-.6s-3.1-.5-3.1-2.1Z"><title>Silver</title></path>
    <path fill="#6f89a4" d="M25.05 4c1.48 0 1.48 2.26 0 2.26S23.57 4 25.05 4ZM21.7 6.56c1.48-.2 1.08-2.46-.39-2.16-1.38.2-.98 2.46.39 2.16Zm-3.14.78c1.38-.49.59-2.66-.79-2.07-1.28.49-.49 2.66.79 2.07Zm-2.95 1.38c1.28-.69.1-2.66-1.08-1.97-1.28.79-.1 2.75 1.08 1.97Zm-2.66 1.87c1.08-.89-.3-2.66-1.48-1.67-1.08.89.39 2.66 1.48 1.67Zm-2.26 2.36c.98-1.08-.79-2.56-1.67-1.48-.98 1.08.69 2.56 1.67 1.48Zm-1.97 2.66c.79-1.28-1.18-2.36-1.97-1.08-.69 1.18 1.28 2.36 1.97 1.08Zm-1.38 2.95c.59-1.38-1.57-2.07-2.07-.79-.49 1.38 1.67 2.16 2.07.79Zm-.78 3.14c.3-1.38-1.97-1.77-2.16-.39-.3 1.48 1.87 1.87 2.16.39Zm-.3 3.25c0-1.48-2.26-1.48-2.26 0s2.26 1.48 2.26 0Zm.3 3.35c-.2-1.48-2.46-1.08-2.16.39.2 1.38 2.36.98 2.16-.39Zm.78 3.14c-.49-1.38-2.66-.59-2.07.79.49 1.28 2.66.49 2.07-.79Zm1.38 2.95c-.69-1.28-2.66-.1-1.97 1.08.79 1.28 2.75.1 1.97-1.08Zm1.87 2.66c-.89-1.08-2.66.39-1.67 1.48.89 1.08 2.66-.39 1.67-1.48Zm2.36 2.36c-1.08-.98-2.56.79-1.48 1.67 1.08.98 2.56-.79 1.48-1.67Zm2.66 1.87c-1.28-.79-2.36 1.18-1.08 1.97 1.18.69 2.36-1.28 1.08-1.97Zm2.95 1.38c-1.38-.49-2.16 1.67-.79 2.07 1.38.49 2.16-1.57.79-2.07Zm3.14.78c-1.38-.3-1.77 1.97-.39 2.16 1.48.39 1.87-1.87.39-2.16Zm3.25.3c-1.48 0-1.48 2.26 0 2.26s1.48-2.26 0-2.26Zm3.25-.3c-1.48.2-1.08 2.46.39 2.16 1.48-.2 1.08-2.36-.39-2.16Zm3.14-.78c-1.38.49-.59 2.66.79 2.07 1.38-.49.59-2.56-.79-2.07Zm3.05-1.38c-1.28.69-.1 2.66 1.08 1.97 1.28-.79.1-2.75-1.08-1.97Zm2.66-1.87c-1.08.89.3 2.66 1.48 1.67 1.08-.89-.39-2.66-1.48-1.67Zm2.26-2.36c-.98 1.08.79 2.56 1.67 1.48.98-1.08-.69-2.56-1.67-1.48Zm1.87-2.66c-.79 1.28 1.18 2.36 1.97 1.08.79-1.18-1.18-2.36-1.97-1.08Zm1.38-2.95c-.49 1.38 1.57 2.16 2.07.79.59-1.38-1.57-2.16-2.07-.79Zm.88-3.14c-.3 1.38 1.97 1.77 2.16.39.3-1.48-1.97-1.87-2.16-.39Zm.3-3.25c0 1.48 2.26 1.48 2.26 0s-2.26-1.48-2.26 0Zm-.3-3.25c.2 1.48 2.46 1.08 2.16-.39-.2-1.48-2.46-1.08-2.16.39Zm-.78-3.14c.49 1.38 2.66.59 2.07-.79-.49-1.38-2.66-.59-2.07.79Zm-1.38-3.05c.69 1.28 2.66.1 1.97-1.08-.79-1.28-2.75-.1-1.97 1.08Zm-1.97-2.66c.89 1.08 2.66-.3 1.67-1.48-.79-1.08-2.56.39-1.67 1.48Zm-2.26-2.26c1.08.98 2.56-.79 1.48-1.67-1.18-.98-2.56.69-1.48 1.67Zm-2.66-1.87c1.28.79 2.36-1.18 1.08-1.97-1.18-.79-2.36 1.18-1.08 1.97Zm-2.95-1.38c1.38.49 2.16-1.67.79-2.07-1.38-.59-2.16 1.57-.79 2.07Zm-3.14-.88c1.38.3 1.77-1.97.39-2.16-1.48-.3-1.87 1.97-.39 2.16Z"><title>Silver</title></path>
</svg>
            <div class="value ajaxReplaceableSilverAmount" title="Silver" data-load-tooltip="free-silver">
                &#x202d;9,252&#x202c;            </div>
		</div>

		<a class="shop" href="#" accesskey="8" title="Buy Gold" onclick="jQuery(window).trigger('startPaymentWizard', {}); this.blur(); return false;"></a>

		
		
					<a id="button69b3f63de88bc"
   	class="layoutButton buttonFramed withIcon round referAFriend green    "
	title="Refer a friend"
        			href="/referAFriend"
	        	>
					<svg viewBox="0 0 18.08 20" class="referAFriend"><g class="outline">
  <path class="human" d="M5.86 9a1.26 1.26 0 01-1.14-1.31V6.36a.72.72 0 01.55-.75.67.67 0 000-.42 4.87 4.87 0 01.2-2.51 1.63 1.63 0 01.28-.52c.29-.38.63-.73.94-1.09A3.84 3.84 0 0111.4.58a4.16 4.16 0 011.86 4.2 5.2 5.2 0 000 1c.63.3.41.88.39 1.38 0 .2-.05.41 0 .63a1.76 1.76 0 01-.09.75c-.15.43-.17.45-.59.6a3.31 3.31 0 01-.71 1.6c-.24.28-.16.65-.24 1s-.13.61-.21.91a1.56 1.56 0 00.83 2 6.14 6.14 0 011.63 1.14 4.54 4.54 0 01.91 1.38c.19.42.06.61-.4.61H.5c-.46 0-.51 0-.5-.52a4.13 4.13 0 012-3.48A6.1 6.1 0 013.57 13a4.77 4.77 0 002.07-1.21 1.2 1.2 0 00.36-1c-.06-.56-.1-1.16-.14-1.79z"></path>
  <path class="plus" d="M8.38 16.43v-2.56a.71.71 0 01.77-.57h2.27v-2.32c0-.53.17-.68.69-.68h2.09c.7 0 .88.15.89.9v2.1h2.17c.62 0 .81.19.82.81v2c0 .71-.17.88-.87.88h-2.12v2.21c0 .72-.19.8-.81.81h-2c-.69 0-.85-.17-.85-.85v-2.17H9.25c-.42.01-.75-.1-.87-.56z"></path>
</g><g class="icon">
  <path class="human" d="M5.86 9a1.26 1.26 0 01-1.14-1.31V6.36a.72.72 0 01.55-.75.67.67 0 000-.42 4.87 4.87 0 01.2-2.51 1.63 1.63 0 01.28-.52c.29-.38.63-.73.94-1.09A3.84 3.84 0 0111.4.58a4.16 4.16 0 011.86 4.2 5.2 5.2 0 000 1c.63.3.41.88.39 1.38 0 .2-.05.41 0 .63a1.76 1.76 0 01-.09.75c-.15.43-.17.45-.59.6a3.31 3.31 0 01-.71 1.6c-.24.28-.16.65-.24 1s-.13.61-.21.91a1.56 1.56 0 00.83 2 6.14 6.14 0 011.63 1.14 4.54 4.54 0 01.91 1.38c.19.42.06.61-.4.61H.5c-.46 0-.51 0-.5-.52a4.13 4.13 0 012-3.48A6.1 6.1 0 013.57 13a4.77 4.77 0 002.07-1.21 1.2 1.2 0 00.36-1c-.06-.56-.1-1.16-.14-1.79z"></path>
  <path class="plus" d="M8.38 16.43v-2.56a.71.71 0 01.77-.57h2.27v-2.32c0-.53.17-.68.69-.68h2.09c.7 0 .88.15.89.9v2.1h2.17c.62 0 .81.19.82.81v2c0 .71-.17.88-.87.88h-2.12v2.21c0 .72-.19.8-.81.81h-2c-.69 0-.85-.17-.85-.85v-2.17H9.25c-.42.01-.75-.1-.87-.56z"></path>
</g></svg>
		</a>

<script type="text/javascript">
	jQuery('#button69b3f63de88bc').click(function (event) {
		jQuery(window).trigger('buttonClicked', [event.delegateTarget, {"type":"green","loadTooltip":null,"boxId":"","disabled":false,"attention":false,"colorBlind":false,"class":"","id":"button69b3f63de88bc","redirectUrl":"\/referAFriend","redirectUrlExternal":"","svg":"topBar\/referAFriend.svg","content":""}]);
	});
</script>
		
					<div id="stockBar">

    <div class="warehouse">

        <div class="capacity" title="Warehouse">
            <i class="warehouse_medium"></i>
            <div class="value">&#x202d;11,800&#x202c;</div>
        </div>
		                    <a class="stockBarButton resource1" href="/production.php?t=lumber" title="Lumber||Production: 732&lt;br /&gt;Full in: 15:39:16&lt;br /&gt;Click for more information">
                <i class="lumber_small"></i>
                <svg viewBox="0 0 160 180" class=" advantageBonusArrow productionBoost">
    <path class="border" d="M158.78 106.45 85.17 2.72C84.06 1.01 82.14 0 80.03 0S76 1.01 74.79 2.72L1.17 106.45c-1.41 1.91-1.51 4.53-.5 6.64 1.11 2.11 3.23 3.42 5.65 3.42h31.76v57.15c0 3.52 2.82 6.34 6.35 6.34h70.89c3.53 0 6.35-2.82 6.35-6.34v-57.15h31.97c2.42 0 4.54-1.31 5.65-3.42 1.11-2.11.91-4.63-.5-6.64Z"></path>
    <path class="sideShadow" d="m20.6 103.48-14.07 6.78c.17.3.48.51.87.51h35.86c.55 0 1 .45 1 1v61.81c0 .55.45 1 1 1h69.48c.55 0 1-.45 1-1V111.8c0-.55.45-1 1-1l35.34.29c.41 0 .74-.23.9-.55l-14.1-7-118.28-.06Z"></path>
    <path class="bottomShadow" d="m51.45 167.41-6.88 6.88c.18.18.42.28.69.28h69.48c.26 0 .49-.11.67-.27l-6.96-6.9H51.44Z"></path>
    <path class="topShadow" d="m6.54 110.26 13.98-6.74 59.44-85.03 59.02 85.1 14.01 6.95c.15-.3.15-.68-.07-1.01L80.83 5.35c-.39-.57-1.24-.57-1.64 0L6.59 109.21c-.35.5-.16 1.14.3 1.42-.15-.09-.26-.22-.35-.37Z"></path>
    <path class="inner" d="M108.45 167.41h-57v-63.89H20.52l59.44-85.03 59.02 85.1-30.53-.05v63.87z"></path>
</svg>

                <div id="l1" class="value">&#x202d;341&#x202c;</div>
				<div class="barBox">
					<div id="lbar1"
						 class="bar"
						 style="width:3%;"></div>
				</div>
            </a>
                    <a class="stockBarButton resource2" href="/production.php?t=clay" title="Clay||Production: 582&lt;br /&gt;Full in: 19:41:20&lt;br /&gt;Click for more information">
                <i class="clay_small"></i>
                <svg viewBox="0 0 160 180" class=" advantageBonusArrow productionBoost">
    <path class="border" d="M158.78 106.45 85.17 2.72C84.06 1.01 82.14 0 80.03 0S76 1.01 74.79 2.72L1.17 106.45c-1.41 1.91-1.51 4.53-.5 6.64 1.11 2.11 3.23 3.42 5.65 3.42h31.76v57.15c0 3.52 2.82 6.34 6.35 6.34h70.89c3.53 0 6.35-2.82 6.35-6.34v-57.15h31.97c2.42 0 4.54-1.31 5.65-3.42 1.11-2.11.91-4.63-.5-6.64Z"></path>
    <path class="sideShadow" d="m20.6 103.48-14.07 6.78c.17.3.48.51.87.51h35.86c.55 0 1 .45 1 1v61.81c0 .55.45 1 1 1h69.48c.55 0 1-.45 1-1V111.8c0-.55.45-1 1-1l35.34.29c.41 0 .74-.23.9-.55l-14.1-7-118.28-.06Z"></path>
    <path class="bottomShadow" d="m51.45 167.41-6.88 6.88c.18.18.42.28.69.28h69.48c.26 0 .49-.11.67-.27l-6.96-6.9H51.44Z"></path>
    <path class="topShadow" d="m6.54 110.26 13.98-6.74 59.44-85.03 59.02 85.1 14.01 6.95c.15-.3.15-.68-.07-1.01L80.83 5.35c-.39-.57-1.24-.57-1.64 0L6.59 109.21c-.35.5-.16 1.14.3 1.42-.15-.09-.26-.22-.35-.37Z"></path>
    <path class="inner" d="M108.45 167.41h-57v-63.89H20.52l59.44-85.03 59.02 85.1-30.53-.05v63.87z"></path>
</svg>

                <div id="l2" class="value">&#x202d;341&#x202c;</div>
				<div class="barBox">
					<div id="lbar2"
						 class="bar"
						 style="width:3%;"></div>
				</div>
            </a>
                    <a class="stockBarButton resource3" href="/production.php?t=iron" title="Iron||Production: 426&lt;br /&gt;Full in: 26:53:57&lt;br /&gt;Click for more information">
                <i class="iron_small"></i>
                <svg viewBox="0 0 160 180" class=" advantageBonusArrow productionBoost">
    <path class="border" d="M158.78 106.45 85.17 2.72C84.06 1.01 82.14 0 80.03 0S76 1.01 74.79 2.72L1.17 106.45c-1.41 1.91-1.51 4.53-.5 6.64 1.11 2.11 3.23 3.42 5.65 3.42h31.76v57.15c0 3.52 2.82 6.34 6.35 6.34h70.89c3.53 0 6.35-2.82 6.35-6.34v-57.15h31.97c2.42 0 4.54-1.31 5.65-3.42 1.11-2.11.91-4.63-.5-6.64Z"></path>
    <path class="sideShadow" d="m20.6 103.48-14.07 6.78c.17.3.48.51.87.51h35.86c.55 0 1 .45 1 1v61.81c0 .55.45 1 1 1h69.48c.55 0 1-.45 1-1V111.8c0-.55.45-1 1-1l35.34.29c.41 0 .74-.23.9-.55l-14.1-7-118.28-.06Z"></path>
    <path class="bottomShadow" d="m51.45 167.41-6.88 6.88c.18.18.42.28.69.28h69.48c.26 0 .49-.11.67-.27l-6.96-6.9H51.44Z"></path>
    <path class="topShadow" d="m6.54 110.26 13.98-6.74 59.44-85.03 59.02 85.1 14.01 6.95c.15-.3.15-.68-.07-1.01L80.83 5.35c-.39-.57-1.24-.57-1.64 0L6.59 109.21c-.35.5-.16 1.14.3 1.42-.15-.09-.26-.22-.35-.37Z"></path>
    <path class="inner" d="M108.45 167.41h-57v-63.89H20.52l59.44-85.03 59.02 85.1-30.53-.05v63.87z"></path>
</svg>

                <div id="l3" class="value">&#x202d;341&#x202c;</div>
				<div class="barBox">
					<div id="lbar3"
						 class="bar"
						 style="width:3%;"></div>
				</div>
            </a>
        
    </div>

    <div class="granary">
        <div class="capacity" title="Granary">
            <i class="granary_medium"></i>
            <div class="value">&#x202d;2,300&#x202c;</div>
        </div>

        <a class="stockBarButton resource4" href="/production.php?t=crop" title="Crop||Production less building upkeep: 636&lt;br /&gt;Full in: 3:06:34&lt;br /&gt;Click for more information">
            <i class="crop_small"></i>
            <svg viewBox="0 0 160 180" class=" advantageBonusArrow productionBoost">
    <path class="border" d="M158.78 106.45 85.17 2.72C84.06 1.01 82.14 0 80.03 0S76 1.01 74.79 2.72L1.17 106.45c-1.41 1.91-1.51 4.53-.5 6.64 1.11 2.11 3.23 3.42 5.65 3.42h31.76v57.15c0 3.52 2.82 6.34 6.35 6.34h70.89c3.53 0 6.35-2.82 6.35-6.34v-57.15h31.97c2.42 0 4.54-1.31 5.65-3.42 1.11-2.11.91-4.63-.5-6.64Z"></path>
    <path class="sideShadow" d="m20.6 103.48-14.07 6.78c.17.3.48.51.87.51h35.86c.55 0 1 .45 1 1v61.81c0 .55.45 1 1 1h69.48c.55 0 1-.45 1-1V111.8c0-.55.45-1 1-1l35.34.29c.41 0 .74-.23.9-.55l-14.1-7-118.28-.06Z"></path>
    <path class="bottomShadow" d="m51.45 167.41-6.88 6.88c.18.18.42.28.69.28h69.48c.26 0 .49-.11.67-.27l-6.96-6.9H51.44Z"></path>
    <path class="topShadow" d="m6.54 110.26 13.98-6.74 59.44-85.03 59.02 85.1 14.01 6.95c.15-.3.15-.68-.07-1.01L80.83 5.35c-.39-.57-1.24-.57-1.64 0L6.59 109.21c-.35.5-.16 1.14.3 1.42-.15-.09-.26-.22-.35-.37Z"></path>
    <path class="inner" d="M108.45 167.41h-57v-63.89H20.52l59.44-85.03 59.02 85.1-30.53-.05v63.87z"></path>
</svg>

            <div id="l4" class="value">&#x202d;341&#x202c;</div>
			<div class="barBox">
				<div id="lbar4"
					 class="bar"
					 style="width:15%;"></div>
			</div>
        </a>

        <a class="stockBarButton" href="/production.php?t=balance" title="Free crop for further buildings||Crop balance: &amp;#x202d;630&amp;#x202c;&lt;br /&gt;Click for more information">
            <i class="freeCrop_small"></i>
			<div id="stockBarFreeCrop" class="value">&#x202d;360&#x202c;</div>
        </a>

    </div>

</div>

<script type="text/javascript">
    var resources = {
        production: {"l1": 732,"l2": 582,"l3": 426,"l4": 630,"l5": 360},
        storage: {"l1": 341,"l2": 341,"l3": 341,"l4": 341},
        maxStorage: {"l1": 11800,"l2": 11800,"l3": 11800,"l4": 2300}
    };
</script>
		            <nav id="mobileMenu">
        <ul>
                            <li>
                    <a class="dailyQuests" href="#" accesskey="7" title="Daily quests||Collect daily rewards" onclick="Travian.React.openDailyQuestsDialog(); return false;">
                        <div class="inlineIcon " title=""><svg viewBox="0 0 40 130.22" class="dailyQuests ">
    <rect width="40" height="89.11" rx="10.33"></rect>
    <ellipse cx="19.67" cy="115.67" rx="17.22" ry="14.56"></ellipse>
</svg>
<span class="value ">Daily quests</span></div>                    </a>
                </li>
                <li>
                    <a class="statistics" href="/statistics" title="Statistics||">
                        <div class="inlineIcon " title=""><svg viewBox="0 0 120.56 137.33" class="statistics">
    <path d="M1.67 70.67h32.67V130H1.67zM43.56 35.56h32.67V130H43.56zM86.46 0h32.67v130H86.46zM0 133.56h120.56v3.78H0z"></path>
</svg>
<span class="value ">Statistics</span></div>                    </a>
                </li>
									<li>
						<a class="referAFriend" href="/referAFriend" title="Refer a friend">
							<div class="inlineIcon " title=""><svg viewBox="0 0 18.08 20" class="referAFriend">
  <path class="human" d="M5.86 9a1.26 1.26 0 01-1.14-1.31V6.36a.72.72 0 01.55-.75.67.67 0 000-.42 4.87 4.87 0 01.2-2.51 1.63 1.63 0 01.28-.52c.29-.38.63-.73.94-1.09A3.84 3.84 0 0111.4.58a4.16 4.16 0 011.86 4.2 5.2 5.2 0 000 1c.63.3.41.88.39 1.38 0 .2-.05.41 0 .63a1.76 1.76 0 01-.09.75c-.15.43-.17.45-.59.6a3.31 3.31 0 01-.71 1.6c-.24.28-.16.65-.24 1s-.13.61-.21.91a1.56 1.56 0 00.83 2 6.14 6.14 0 011.63 1.14 4.54 4.54 0 01.91 1.38c.19.42.06.61-.4.61H.5c-.46 0-.51 0-.5-.52a4.13 4.13 0 012-3.48A6.1 6.1 0 013.57 13a4.77 4.77 0 002.07-1.21 1.2 1.2 0 00.36-1c-.06-.56-.1-1.16-.14-1.79z"></path>
  <path class="plus" d="M8.38 16.43v-2.56a.71.71 0 01.77-.57h2.27v-2.32c0-.53.17-.68.69-.68h2.09c.7 0 .88.15.89.9v2.1h2.17c.62 0 .81.19.82.81v2c0 .71-.17.88-.87.88h-2.12v2.21c0 .72-.19.8-.81.81h-2c-.69 0-.85-.17-.85-.85v-2.17H9.25c-.42.01-.75-.1-.87-.56z"></path>
</svg>
<span class="value ">Refer a friend</span></div>						</a>
					</li>
				                <li>
                    <a class="profile" href="/profile" title="Profile||Edit profile description.">
                        <div class="inlineIcon " title=""><svg viewBox="0 0 15.76 21" class="profile">
  <path d="M7.88 1.77c2.1 0 3.8 2.09 3.8 4.65s-1.7 4.65-3.8 4.65S4.08 9 4.08 6.42s1.71-4.65 3.8-4.65m0-1.77c-3 0-5.49 2.88-5.49 6.42s2.46 6.42 5.49 6.42 5.49-2.84 5.49-6.42S10.92 0 7.88 0zm7.88 21a11.81 11.81 0 0 0-2.51-7 7.17 7.17 0 0 1-5.37 2.46A7.17 7.17 0 0 1 2.52 14 11.82 11.82 0 0 0 0 21z"></path>
</svg>
<span class="value ">Profile</span></div>                    </a>
                </li>
                <li>
                                            <a class="options" href="/options" title="Options||Edit avatar settings.">
                            <div class="inlineIcon " title=""><svg viewBox="0 0 20 20" class="settings">
  <path d="M9 20l-.24-3.26-.57-.16A7.21 7.21 0 0 1 6.66 16l-.52-.29-2.47 2.1-1.48-1.48 2.14-2.47-.33-.52a7.21 7.21 0 0 1-.62-1.49l-.16-.57L0 11V9l3.26-.24.16-.57A7.21 7.21 0 0 1 4 6.66l.29-.52-2.1-2.47 1.48-1.48 2.47 2.14.52-.33a7.21 7.21 0 0 1 1.49-.62l.57-.16L9 0h2l.24 3.26.57.16a7.21 7.21 0 0 1 1.53.58l.52.29 2.47-2.14 1.48 1.48-2.14 2.51.29.52a7.21 7.21 0 0 1 .62 1.49l.16.57L20 9v2l-3.26.24-.16.57a7.21 7.21 0 0 1-.58 1.53l-.29.52 2.14 2.47-1.48 1.48-2.47-2.14-.52.29a7.21 7.21 0 0 1-1.49.62l-.57.16L11 20zm1-15a5 5 0 1 0 5 5 5 5 0 0 0-5-5z"></path>
</svg>
<span class="value ">Options</span></div>                        </a>
                                    </li>
                <li>
                    <a class="help" onclick="Travian.React.openHelpDialog()" title="Help||Manuals, Answers and Support">
                        <div class="inlineIcon " title=""><svg viewBox="0 0 12.24 20" class="answers">
  <path d="M3.73 13.1v-.52c0-2.8 1.47-3.8 2.89-4.76 1-.72 2.14-1.46 2.14-2.9s-1.13-2.55-3-2.55A5.39 5.39 0 0 0 2 4.12L0 2.61A8.15 8.15 0 0 1 6.24 0c3 0 6 1.4 6 4.52 0 2.42-1.4 3.38-2.88 4.4-1.33.91-2.7 1.85-2.7 3.82v.36zm3.61 4.8a2.09 2.09 0 0 0-2.1-2.07 2.09 2.09 0 0 0 0 4.17 2.1 2.1 0 0 0 2.1-2.1z"></path>
</svg>
<span class="value ">Help</span></div>                    </a>
                </li>
                <li>
                    <a class="discord" target="_blank" href="https://discord.gg/travianlegends" title="Discord||Meet other players on our official Discord server">
                        <div class="inlineIcon " title=""><svg viewBox="0 0 20 18.71" class="discord">
  <path d="M0 2.91v10.18A2.92 2.92 0 002.91 16h12.71a.93.93 0 01.65.27l2.17 2.17a.91.91 0 001.56-.65V2.91A2.92 2.92 0 0017.09 0H2.91A2.92 2.92 0 000 2.91zm15.72 9.59H4.28a.78.78 0 01-.78-.78V4.28a.78.78 0 01.78-.78h11.44a.78.78 0 01.78.78v7.44a.78.78 0 01-.78.78z"></path>
</svg>
<span class="value ">Discord</span></div>                    </a>
                </li>
                                <li>
                                        <a class="logout" href="/logout" onclick="Travian.api('auth/logout'); return false;" title="Logout||Back to the lobby">
                        <div class="inlineIcon " title=""><svg viewBox="0 0 20 20" class="logout">
  <path d="M0 17.01L7.01 10 .14 3.13 3.13.14 10 7.01 17.01 0 20 2.99 12.99 10l6.87 6.87-2.99 2.99L10 12.99 2.99 20 0 17.01z"></path>
</svg>
<span class="value ">Logout</span></div>                    </a>
                </li>
                                                </ul>

        
        <svg viewBox="0 0 200 10" class="divider">
    <path d="m200 5-78.7-2.5c.2.75.54 1.57.67 2.35h-2.49c-.08-1.31-1.16-2.35-2.48-2.35s-2.41 1.04-2.48 2.35h-9.67L100 0l-4.85 4.85h-9.67C85.4 3.54 84.32 2.5 83 2.5s-2.41 1.04-2.48 2.35h-2.49c.13-.78.47-1.6.67-2.35L0 5l78.7 2.5c-.22-.74-.55-1.58-.67-2.35h2.49C80.6 6.46 81.68 7.5 83 7.5s2.41-1.04 2.48-2.35h9.67L100 10l4.85-4.85h9.67c.08 1.31 1.16 2.35 2.48 2.35s2.41-1.04 2.48-2.35h2.49c-.12.77-.46 1.61-.67 2.35L200 5Z"></path>
</svg>

        <ul>
            <li>
                <a class="mainpage" href="https://www.travian.com/international" target="_blank" title="">Homepage</a>
            </li>
            <li>
                <a class="terms" href="https://agb.traviangames.com/terms-en.pdf" target="_blank" title="">Terms</a>
            </li>
            <li>
                <a class="imprint" href="https://www.travian.com/international/imprint" target="_blank" title="">Imprint</a>
            </li>
                            <li>
                    <a class="imprint" href="#" onclick="__cmapi('showScreenAdvanced',null,null); return false" target="_blank" title="">Privacy settings</a>
                </li>
                    </ul>

        <p class="copyright">© 2004 - 2026 Travian Games GmbH</p>
    </nav>
    
    
    </div>
	            <nav id="outOfGame">
            
        <a id="button69b3f63de9152"
   	class="layoutButton buttonFramed withIcon round profile grey    "
	title="Profile||Edit profile description."
        			href="/profile"
	        	>
					<svg viewBox="0 0 15.76 21" class="profile"><g class="outline">
  <path d="M7.88 1.77c2.1 0 3.8 2.09 3.8 4.65s-1.7 4.65-3.8 4.65S4.08 9 4.08 6.42s1.71-4.65 3.8-4.65m0-1.77c-3 0-5.49 2.88-5.49 6.42s2.46 6.42 5.49 6.42 5.49-2.84 5.49-6.42S10.92 0 7.88 0zm7.88 21a11.81 11.81 0 0 0-2.51-7 7.17 7.17 0 0 1-5.37 2.46A7.17 7.17 0 0 1 2.52 14 11.82 11.82 0 0 0 0 21z"></path>
</g><g class="icon">
  <path d="M7.88 1.77c2.1 0 3.8 2.09 3.8 4.65s-1.7 4.65-3.8 4.65S4.08 9 4.08 6.42s1.71-4.65 3.8-4.65m0-1.77c-3 0-5.49 2.88-5.49 6.42s2.46 6.42 5.49 6.42 5.49-2.84 5.49-6.42S10.92 0 7.88 0zm7.88 21a11.81 11.81 0 0 0-2.51-7 7.17 7.17 0 0 1-5.37 2.46A7.17 7.17 0 0 1 2.52 14 11.82 11.82 0 0 0 0 21z"></path>
</g></svg>
		</a>

<script type="text/javascript">
	jQuery('#button69b3f63de9152').click(function (event) {
		jQuery(window).trigger('buttonClicked', [event.delegateTarget, {"type":"grey","loadTooltip":null,"boxId":"","disabled":false,"attention":false,"colorBlind":false,"class":"","id":"button69b3f63de9152","redirectUrl":"\/profile","redirectUrlExternal":"","svg":"outOfGame\/profile.svg","content":""}]);
	});
</script>

        <a id="button69b3f63de91b6"
   	class="layoutButton buttonFramed withIcon round options grey    "
	title="Options||Edit avatar settings."
        			href="/options"
	        	>
					<svg viewBox="0 0 20 20" class="options"><g class="outline">
  <path d="M9 20l-.24-3.26-.57-.16A7.21 7.21 0 0 1 6.66 16l-.52-.29-2.47 2.1-1.48-1.48 2.14-2.47-.33-.52a7.21 7.21 0 0 1-.62-1.49l-.16-.57L0 11V9l3.26-.24.16-.57A7.21 7.21 0 0 1 4 6.66l.29-.52-2.1-2.47 1.48-1.48 2.47 2.14.52-.33a7.21 7.21 0 0 1 1.49-.62l.57-.16L9 0h2l.24 3.26.57.16a7.21 7.21 0 0 1 1.53.58l.52.29 2.47-2.14 1.48 1.48-2.14 2.51.29.52a7.21 7.21 0 0 1 .62 1.49l.16.57L20 9v2l-3.26.24-.16.57a7.21 7.21 0 0 1-.58 1.53l-.29.52 2.14 2.47-1.48 1.48-2.47-2.14-.52.29a7.21 7.21 0 0 1-1.49.62l-.57.16L11 20zm1-15a5 5 0 1 0 5 5 5 5 0 0 0-5-5z"></path>
</g><g class="icon">
  <path d="M9 20l-.24-3.26-.57-.16A7.21 7.21 0 0 1 6.66 16l-.52-.29-2.47 2.1-1.48-1.48 2.14-2.47-.33-.52a7.21 7.21 0 0 1-.62-1.49l-.16-.57L0 11V9l3.26-.24.16-.57A7.21 7.21 0 0 1 4 6.66l.29-.52-2.1-2.47 1.48-1.48 2.47 2.14.52-.33a7.21 7.21 0 0 1 1.49-.62l.57-.16L9 0h2l.24 3.26.57.16a7.21 7.21 0 0 1 1.53.58l.52.29 2.47-2.14 1.48 1.48-2.14 2.51.29.52a7.21 7.21 0 0 1 .62 1.49l.16.57L20 9v2l-3.26.24-.16.57a7.21 7.21 0 0 1-.58 1.53l-.29.52 2.14 2.47-1.48 1.48-2.47-2.14-.52.29a7.21 7.21 0 0 1-1.49.62l-.57.16L11 20zm1-15a5 5 0 1 0 5 5 5 5 0 0 0-5-5z"></path>
</g></svg>
		</a>

<script type="text/javascript">
	jQuery('#button69b3f63de91b6').click(function (event) {
		jQuery(window).trigger('buttonClicked', [event.delegateTarget, {"type":"grey","loadTooltip":null,"boxId":"","disabled":false,"attention":false,"colorBlind":false,"class":"","id":"button69b3f63de91b6","redirectUrl":"\/options","redirectUrlExternal":"","svg":"outOfGame\/settings.svg","content":""}]);
	});
</script>

        <a id="button69b3f63de9200"
   	class="layoutButton buttonFramed withIcon round help grey    "
	title="Help||Manuals, Answers and Support"
        	            onclick="Travian.React.openHelpDialog()"
        	>
					<svg viewBox="0 0 12.24 20" class="help"><g class="outline">
  <path d="M3.73 13.1v-.52c0-2.8 1.47-3.8 2.89-4.76 1-.72 2.14-1.46 2.14-2.9s-1.13-2.55-3-2.55A5.39 5.39 0 0 0 2 4.12L0 2.61A8.15 8.15 0 0 1 6.24 0c3 0 6 1.4 6 4.52 0 2.42-1.4 3.38-2.88 4.4-1.33.91-2.7 1.85-2.7 3.82v.36zm3.61 4.8a2.09 2.09 0 0 0-2.1-2.07 2.09 2.09 0 0 0 0 4.17 2.1 2.1 0 0 0 2.1-2.1z"></path>
</g><g class="icon">
  <path d="M3.73 13.1v-.52c0-2.8 1.47-3.8 2.89-4.76 1-.72 2.14-1.46 2.14-2.9s-1.13-2.55-3-2.55A5.39 5.39 0 0 0 2 4.12L0 2.61A8.15 8.15 0 0 1 6.24 0c3 0 6 1.4 6 4.52 0 2.42-1.4 3.38-2.88 4.4-1.33.91-2.7 1.85-2.7 3.82v.36zm3.61 4.8a2.09 2.09 0 0 0-2.1-2.07 2.09 2.09 0 0 0 0 4.17 2.1 2.1 0 0 0 2.1-2.1z"></path>
</g></svg>
		</a>

<script type="text/javascript">
	jQuery('#button69b3f63de9200').click(function (event) {
		jQuery(window).trigger('buttonClicked', [event.delegateTarget, {"type":"grey","loadTooltip":null,"boxId":"","disabled":false,"attention":false,"colorBlind":false,"class":"","id":"button69b3f63de9200","redirectUrl":"","redirectUrlExternal":"","svg":"outOfGame\/answers.svg","content":"","onclick":"Travian.React.openHelpDialog()"}]);
	});
</script>
            <a id="button69b3f63de924a"
   	class="layoutButton buttonFramed withIcon round logout grey    "
	title="Logout||Back to the lobby"
        	            onclick="Travian.api('auth/logout'); return false;"
        	>
					<svg viewBox="0 0 20 20" class="logout"><g class="outline">
  <path d="M0 17.01L7.01 10 .14 3.13 3.13.14 10 7.01 17.01 0 20 2.99 12.99 10l6.87 6.87-2.99 2.99L10 12.99 2.99 20 0 17.01z"></path>
</g><g class="icon">
  <path d="M0 17.01L7.01 10 .14 3.13 3.13.14 10 7.01 17.01 0 20 2.99 12.99 10l6.87 6.87-2.99 2.99L10 12.99 2.99 20 0 17.01z"></path>
</g></svg>
		</a>

<script type="text/javascript">
	jQuery('#button69b3f63de924a').click(function (event) {
		jQuery(window).trigger('buttonClicked', [event.delegateTarget, {"type":"grey","loadTooltip":null,"boxId":"","disabled":false,"attention":false,"colorBlind":false,"class":"","id":"button69b3f63de924a","redirectUrl":"","redirectUrlExternal":"","svg":"misc\/cross.svg","content":"","onclick":"Travian.api('auth\/logout'); return false;"}]);
	});
</script>
</nav>
<script type="text/javascript">
    jQuery('#outOfGame li.logout a').click(function() {
        var windows = Travian.WindowManager.getWindows();
        for (var i = 0; i < windows.length; i++) {
            Travian.WindowManager.unregister(windows[i]);
        }
    });
</script>
    </div>
    <div id="topBarHeroWrapper">
        <div id="topBarHero" class="heroV2">
			<svg class="health" viewBox="0 0 110 110">
			<defs>
				<clipPath id="healthMask" maskContentUnits="objectBoundingBox">
					<path d="M55 55L47.35 109.46A 55 55 0 0 0 109.87 51.16" fill="white" />
				</clipPath>
			</defs>

			<image xlink:href="https://cdn.legends.travian.com/gpack/367/img_ltr/hud/topBar/hero/frame/health.png" x="0" y="0" width="110" height="110" style="clip-path: url(#healthMask);" />

			<path class="title" d="M55 55L47.35 109.46A 55 55 0 0 0 109.87 51.16" fill="transparent">
				<title>Health: &#x202d;&#x202d;100&#x202c;&#37;&#x202c;</title>
			</path>
		</svg>
			<svg class="experience" viewBox="0 0 110 110">
			<defs>
				<clipPath id="experienceMask" maskContentUnits="objectBoundingBox">
					<path d="M55 55L32.63 105.25A 55 55 0 0 1 3.57 74.48" fill="white" />
				</clipPath>
			</defs>

			<image xlink:href="https://cdn.legends.travian.com/gpack/367/img_ltr/hud/topBar/hero/frame/experience.png" x="0" y="0" width="110" height="110" style="clip-path: url(#experienceMask);" />

			<path class="title" d="M55 55L32.63 105.25A 55 55 0 0 1 4 34.4" fill="transparent">
				<title>Experience &amp;#x202d;&amp;#x202d;51&amp;#x202c;&amp;#37;&amp;#x202c;||Your hero needs 170 experience to achieve level 7.</title>
			</path>
		</svg>
	
	<a id="heroImageButton" href="/hero" class="heroImageButton" type="button" title="Hero overview||Hero is currently in village &lt;a href=&quot;/karte.php?d=80335&quot;&gt;1&lt;/a&gt;.">
        <div class="heroImageHover">
            <img class="heroImage heroImageMale" src="/heroV2/head/b256face05df7f70fa84f7271700fb39ea107423.1773.1.png"  title="Hero" alt="Hero" />
        </div>
	</a>

	<div class="heroStatus" title="Hero overview||Hero is currently in village &lt;a href=&quot;/karte.php?d=80335&quot;&gt;1&lt;/a&gt;.">
        <a href="/build.php?newdid=24832&id=39&&tt=2" title="" class=""><i class="heroHome" ></i></a>
        <span class="hide"><i class="heroHome" ></i></span>
	</div>

    <i class="levelUp " title="Available attribute points.|| Click on your hero and distribute the attribute points."></i>

	<a id="button69b3f63de9ac0"
   	class="layoutButton buttonFramed withIcon round auction green    "
	title="Auctions||Tooltip loading..."
    data-load-tooltip="hero"    data-load-tooltip-data="{&quot;boxId&quot;:&quot;hero&quot;,&quot;buttonId&quot;:&quot;auction&quot;}"			href="/auctions"
	        	>
					<svg viewBox="0 0 20.18 19.44" class="auction"><g class="outline">
  <path d="M20 9.44l-6.14 6.16a.54.54 0 0 1-.78 0L11 13.5a.56.56 0 0 1 0-.78l1.64-1.64-.64-.64h-1.24l-7.38 8.7L0 15.76l8.67-7.41V7.13l-.57-.57-.74.75a.49.49 0 0 1-.69 0L4.19 4.83a.49.49 0 0 1 0-.69l4-4a.49.49 0 0 1 .69 0l2.45 2.45a.52.52 0 0 1 0 .74l-.45.46.65.65h3.14v3.14l.73.73 1.75-1.75a.54.54 0 0 1 .78 0L20 8.66a.54.54 0 0 1 0 .78zm-9.35 7v3h9v-3z"></path>
</g><g class="icon">
  <path d="M20 9.44l-6.14 6.16a.54.54 0 0 1-.78 0L11 13.5a.56.56 0 0 1 0-.78l1.64-1.64-.64-.64h-1.24l-7.38 8.7L0 15.76l8.67-7.41V7.13l-.57-.57-.74.75a.49.49 0 0 1-.69 0L4.19 4.83a.49.49 0 0 1 0-.69l4-4a.49.49 0 0 1 .69 0l2.45 2.45a.52.52 0 0 1 0 .74l-.45.46.65.65h3.14v3.14l.73.73 1.75-1.75a.54.54 0 0 1 .78 0L20 8.66a.54.54 0 0 1 0 .78zm-9.35 7v3h9v-3z"></path>
</g></svg>
		</a>

<script type="text/javascript">
	jQuery('#button69b3f63de9ac0').click(function (event) {
		jQuery(window).trigger('buttonClicked', [event.delegateTarget, {"type":"green","loadTooltip":"hero","boxId":"hero","disabled":false,"attention":false,"colorBlind":false,"class":"","id":"button69b3f63de9ac0","redirectUrl":"\/auctions","redirectUrlExternal":"","svg":"topBar\/auction.svg","content":"","title":"Auctions||Tooltip loading..."}]);
	});
</script>
<a id="button69b3f63de9b33"
   	class="layoutButton buttonFramed withIcon round adventure green    attention"
	title="Adventure||Tooltip loading..."
    data-load-tooltip="hero"    data-load-tooltip-data="{&quot;boxId&quot;:&quot;hero&quot;,&quot;buttonId&quot;:&quot;adventure&quot;}"			href="/hero/adventures"
	        	>
					<div class="content">&nbsp;99+</div>
		</a>

<script type="text/javascript">
	jQuery('#button69b3f63de9b33').click(function (event) {
		jQuery(window).trigger('buttonClicked', [event.delegateTarget, {"type":"green","loadTooltip":"hero","boxId":"hero","disabled":false,"attention":true,"colorBlind":false,"class":"","id":"button69b3f63de9b33","redirectUrl":"\/hero\/adventures","redirectUrlExternal":"","svg":false,"content":"&nbsp;99+","title":"Adventure||Tooltip loading..."}]);
	});
</script>
</div>
    </div>

			<div id="center">
                
                <div id="sidebarBeforeContent" class="sidebar beforeContent">
                    <div class="sidebarBoxWrapper">
                    <div id="servertime" class="stime">
	Server time:&nbsp;
	<span  format="12h" class="timer" counting="up" value="1773387261">11:34:21</span><span class="enTimeAppendix">&nbsp;am</span></div>
                    <div id="sidebarBoxAlliance" class="sidebarBox  expanded">
	<div class="header">
		<div class="buttonsWrapper">
        <a id="button69b3f63dea021"
   	class="layoutButton buttonFramed withIcon round alliance green disabled   "
	title="Alliance Page||No alliance"
        	            onclick="event.preventDefault();"
        	>
					<svg viewBox="0 0 20 14.2" class="alliance"><g class="outline">
  <path d="M4.42 1.17L2 6.62a.51.51 0 0 1-.66.26L.3 6.41a.51.51 0 0 1-.3-.66L2.43.3a.51.51 0 0 1 .66-.3l1.08.51a.49.49 0 0 1 .25.66zM20 5.61L17.68.53A.51.51 0 0 0 17 .28l-.82.37a.5.5 0 0 0-.25.66l2.28 5.08a.49.49 0 0 0 .66.25l.82-.37a.5.5 0 0 0 .31-.66zM4.85 1.11L4.49 2l3.09.22 1.06-.9zM2.69 5.86l-.46.87 1.11 1.61.52-.82zm2.16 1.66a.84.84 0 0 0-1.1.48l-.63 1.39a.84.84 0 1 0 1.53.67l.63-1.43a.84.84 0 0 0-.43-1.11zm1.44 1.35a.84.84 0 0 0-1.1.43l-.63 1.44a.84.84 0 0 0 .44 1.1.85.85 0 0 0 1.11-.43L6.72 10a.84.84 0 0 0-.43-1.13zM17 10.29a1.18 1.18 0 0 1-.76.48 1.14 1.14 0 0 1-.2.87 1.19 1.19 0 0 1-1 .51H15a1.18 1.18 0 0 1-1.2 1.14 1.12 1.12 0 0 1-.67-.22L13 13a1.21 1.21 0 0 1-.22.7 1.19 1.19 0 0 1-1 .51 1.12 1.12 0 0 1-.67-.22l-1.93-1.34a.81.81 0 0 1-.77 0 .84.84 0 0 1-.49-.93l-.16.37a.84.84 0 1 1-1.53-.67L6.85 10A.86.86 0 0 1 8 9.6a.85.85 0 0 1 .48.94l.16-.37a.84.84 0 0 1 1.11-.43.81.81 0 0 1 .45.49l3.24 2.24a.5.5 0 0 0 .69-.13.49.49 0 0 0 0-.58l-3.25-2.24a6.61 6.61 0 0 0 .39-.52l3.17 2.19a.77.77 0 0 1 .19.17l.1.06a.51.51 0 0 0 .7-.12.49.49 0 0 0 .09-.28.47.47 0 0 0-.12-.32l-.09-.06-3.64-2.58V8a4 4 0 0 0 .15-.7l3.91 2.7a.48.48 0 0 0 .55-.19.47.47 0 0 0 .09-.28.49.49 0 0 0-.21-.41l-4.34-3a3.82 3.82 0 0 0-.15-.67l-.62-.38a2.88 2.88 0 0 1-.83-.76s-.94.58-1.1.65a3.08 3.08 0 0 1-1.55.43 1.69 1.69 0 0 1-1.68-1.18A1.32 1.32 0 0 1 7 2.67a5.82 5.82 0 0 0 1.17-.17A7.59 7.59 0 0 0 10.08 1a1.1 1.1 0 0 1 .69-.37c1 0 1.46 1.21 2.74 1.21a4.32 4.32 0 0 0 1.93-.44l2.23 4.86a4.54 4.54 0 0 1-.62 1.19c-.25.23-.66.18-1 .18a3 3 0 0 1-1.29-.3l1.93 1.33a1.19 1.19 0 0 1 .31 1.63zm-4.88 2.6a.49.49 0 0 0-.22-.41L10 11.17l-.4.93 1.72 1.19a.51.51 0 0 0 .7-.12.51.51 0 0 0 .08-.28z"></path>
</g><g class="icon">
  <path d="M4.42 1.17L2 6.62a.51.51 0 0 1-.66.26L.3 6.41a.51.51 0 0 1-.3-.66L2.43.3a.51.51 0 0 1 .66-.3l1.08.51a.49.49 0 0 1 .25.66zM20 5.61L17.68.53A.51.51 0 0 0 17 .28l-.82.37a.5.5 0 0 0-.25.66l2.28 5.08a.49.49 0 0 0 .66.25l.82-.37a.5.5 0 0 0 .31-.66zM4.85 1.11L4.49 2l3.09.22 1.06-.9zM2.69 5.86l-.46.87 1.11 1.61.52-.82zm2.16 1.66a.84.84 0 0 0-1.1.48l-.63 1.39a.84.84 0 1 0 1.53.67l.63-1.43a.84.84 0 0 0-.43-1.11zm1.44 1.35a.84.84 0 0 0-1.1.43l-.63 1.44a.84.84 0 0 0 .44 1.1.85.85 0 0 0 1.11-.43L6.72 10a.84.84 0 0 0-.43-1.13zM17 10.29a1.18 1.18 0 0 1-.76.48 1.14 1.14 0 0 1-.2.87 1.19 1.19 0 0 1-1 .51H15a1.18 1.18 0 0 1-1.2 1.14 1.12 1.12 0 0 1-.67-.22L13 13a1.21 1.21 0 0 1-.22.7 1.19 1.19 0 0 1-1 .51 1.12 1.12 0 0 1-.67-.22l-1.93-1.34a.81.81 0 0 1-.77 0 .84.84 0 0 1-.49-.93l-.16.37a.84.84 0 1 1-1.53-.67L6.85 10A.86.86 0 0 1 8 9.6a.85.85 0 0 1 .48.94l.16-.37a.84.84 0 0 1 1.11-.43.81.81 0 0 1 .45.49l3.24 2.24a.5.5 0 0 0 .69-.13.49.49 0 0 0 0-.58l-3.25-2.24a6.61 6.61 0 0 0 .39-.52l3.17 2.19a.77.77 0 0 1 .19.17l.1.06a.51.51 0 0 0 .7-.12.49.49 0 0 0 .09-.28.47.47 0 0 0-.12-.32l-.09-.06-3.64-2.58V8a4 4 0 0 0 .15-.7l3.91 2.7a.48.48 0 0 0 .55-.19.47.47 0 0 0 .09-.28.49.49 0 0 0-.21-.41l-4.34-3a3.82 3.82 0 0 0-.15-.67l-.62-.38a2.88 2.88 0 0 1-.83-.76s-.94.58-1.1.65a3.08 3.08 0 0 1-1.55.43 1.69 1.69 0 0 1-1.68-1.18A1.32 1.32 0 0 1 7 2.67a5.82 5.82 0 0 0 1.17-.17A7.59 7.59 0 0 0 10.08 1a1.1 1.1 0 0 1 .69-.37c1 0 1.46 1.21 2.74 1.21a4.32 4.32 0 0 0 1.93-.44l2.23 4.86a4.54 4.54 0 0 1-.62 1.19c-.25.23-.66.18-1 .18a3 3 0 0 1-1.29-.3l1.93 1.33a1.19 1.19 0 0 1 .31 1.63zm-4.88 2.6a.49.49 0 0 0-.22-.41L10 11.17l-.4.93 1.72 1.19a.51.51 0 0 0 .7-.12.51.51 0 0 0 .08-.28z"></path>
</g></svg>
		</a>

<script type="text/javascript">
	jQuery('#button69b3f63dea021').click(function (event) {
		jQuery(window).trigger('buttonClicked', [event.delegateTarget, {"type":"green","loadTooltip":null,"boxId":"","disabled":true,"attention":false,"colorBlind":false,"class":"","id":"button69b3f63dea021","redirectUrl":"","redirectUrlExternal":"","svg":"sideBar\/alliance.svg","content":"","onclick":"event.preventDefault();"}]);
	});
</script>
    <a id="button69b3f63dea0bb"
   	class="layoutButton buttonFramed withIcon round forum green disabled   "
	title="Alliance forum||No alliance"
        	            onclick="event.preventDefault();"
        	>
					<svg viewBox="0 0 20 18.54" class="forum"><g class="outline">
  <path d="M3.31 4.7h8.5l-1.3 1.37h-7.2zm0 4.85h3.91l1.3-1.37H3.31zm0 3.47h3.45l.06-1.37H3.31zM17.16 1.29l-.94 1-1.43 1.5L13 5.66l-.49.51-2 2.11-1.26 1.37-.81.86-.06 1.24-.07 1.37v.51l3-.44 3.25-3.43.16-.17L20 4zm-.59 12l-.19-3.44L15 11.26a.61.61 0 0 0-.16.45l.07 1a.57.57 0 0 1-.15.43l-3.26 3.58a.57.57 0 0 1-.43.19H2.54a.58.58 0 0 1-.54-.58V2.53a.58.58 0 0 1 .58-.59h11a.59.59 0 0 0 .42-.17L15.7 0H.58A.58.58 0 0 0 0 .58V18a.58.58 0 0 0 .58.58H11.8a.57.57 0 0 0 .43-.19l4.19-4.66a.53.53 0 0 0 .15-.46z"></path>
</g><g class="icon">
  <path d="M3.31 4.7h8.5l-1.3 1.37h-7.2zm0 4.85h3.91l1.3-1.37H3.31zm0 3.47h3.45l.06-1.37H3.31zM17.16 1.29l-.94 1-1.43 1.5L13 5.66l-.49.51-2 2.11-1.26 1.37-.81.86-.06 1.24-.07 1.37v.51l3-.44 3.25-3.43.16-.17L20 4zm-.59 12l-.19-3.44L15 11.26a.61.61 0 0 0-.16.45l.07 1a.57.57 0 0 1-.15.43l-3.26 3.58a.57.57 0 0 1-.43.19H2.54a.58.58 0 0 1-.54-.58V2.53a.58.58 0 0 1 .58-.59h11a.59.59 0 0 0 .42-.17L15.7 0H.58A.58.58 0 0 0 0 .58V18a.58.58 0 0 0 .58.58H11.8a.57.57 0 0 0 .43-.19l4.19-4.66a.53.53 0 0 0 .15-.46z"></path>
</g></svg>
		</a>

<script type="text/javascript">
	jQuery('#button69b3f63dea0bb').click(function (event) {
		jQuery(window).trigger('buttonClicked', [event.delegateTarget, {"type":"green","loadTooltip":null,"boxId":"","disabled":true,"attention":false,"colorBlind":false,"class":"","id":"button69b3f63dea0bb","redirectUrl":"","redirectUrlExternal":"","svg":"general\/forum.svg","content":"","onclick":"event.preventDefault();"}]);
	});
</script>
    <a id="button69b3f63dea10c"
   	class="layoutButton buttonFramed withIcon round embassy green    "
	title="Embassy||Tooltip loading...&lt;br /&gt;Current invitations: 0&lt;br /&gt;Highest embassy level: 1"
    data-load-tooltip="layoutButton"    data-load-tooltip-data="{&quot;boxId&quot;:&quot;alliance&quot;,&quot;buttonId&quot;:&quot;embassy&quot;}"			href="/build.php?gid=18&newdid=24832"
	        	>
					<svg viewBox="0 0 17.63 20" class="embassy"><g class="outline">
  <path d="M16.15 2.21l-.23 1.66h-1.45v-.4A2.28 2.28 0 0 0 11 2.15l-.34.28h-.05a2.77 2.77 0 0 1-1.82.45 2.78 2.78 0 0 1-2.06-1.22c-.06-.13-.12-.25-.19-.37V1.2A2.68 2.68 0 0 0 3 .31c-.48.25-1.86 1.11-1.86 1.11.53-.31 3.46-.2 3.63 1.33C1 .92 0 4.37 0 4.37s2.42-1.48 4.19 1.48A3 3 0 0 0 .88 8c.55-.34 1.79-.07 2.48 0a3 3 0 0 1 2.39 1.62A2.5 2.5 0 0 0 9.63 11a1.67 1.67 0 0 1 .23-.23 1.56 1.56 0 0 1 .2-.16 2.46 2.46 0 0 1 1.65-.43c.32 0 .39.29.41.55a.89.89 0 0 0 1.59.55v-.31H15l-1.27 8.83 1.48.2 2.42-17.58zM13.6 10a17.28 17.28 0 0 1-.06-2.72 10.63 10.63 0 0 1 .54-1.81h1.62L15.08 10z"></path>
</g><g class="icon">
  <path d="M16.15 2.21l-.23 1.66h-1.45v-.4A2.28 2.28 0 0 0 11 2.15l-.34.28h-.05a2.77 2.77 0 0 1-1.82.45 2.78 2.78 0 0 1-2.06-1.22c-.06-.13-.12-.25-.19-.37V1.2A2.68 2.68 0 0 0 3 .31c-.48.25-1.86 1.11-1.86 1.11.53-.31 3.46-.2 3.63 1.33C1 .92 0 4.37 0 4.37s2.42-1.48 4.19 1.48A3 3 0 0 0 .88 8c.55-.34 1.79-.07 2.48 0a3 3 0 0 1 2.39 1.62A2.5 2.5 0 0 0 9.63 11a1.67 1.67 0 0 1 .23-.23 1.56 1.56 0 0 1 .2-.16 2.46 2.46 0 0 1 1.65-.43c.32 0 .39.29.41.55a.89.89 0 0 0 1.59.55v-.31H15l-1.27 8.83 1.48.2 2.42-17.58zM13.6 10a17.28 17.28 0 0 1-.06-2.72 10.63 10.63 0 0 1 .54-1.81h1.62L15.08 10z"></path>
</g></svg>
		</a>

<script type="text/javascript">
	jQuery('#button69b3f63dea10c').click(function (event) {
		jQuery(window).trigger('buttonClicked', [event.delegateTarget, {"type":"green","loadTooltip":"layoutButton","boxId":"alliance","disabled":false,"attention":false,"colorBlind":false,"class":"","id":"button69b3f63dea10c","redirectUrl":"\/build.php?gid=18&newdid=24832","redirectUrlExternal":"","svg":"sideBar\/embassy.svg","content":""}]);
	});
</script>
</div>
	</div>
	<div class="content">
		<div class="boxTitle ">
    	<div class="name">No alliance</div>
</div>

	</div>
	</div>
<div id="sidebarBoxInfobox" class="sidebarBox toggleable expanded">
	<div class="header">
			</div>
	<div class="content">
		<div class="boxTitle">Info box</div>

<div class="inlineIcon messageShortInfo" title="Total messages: 1&lt;br /&gt;New messages: 1"><svg viewBox="0 0 20 14.28" class="messageNew">
  <path d="M.72.93A1.69 1.69 0 0 1 .33.21L.54 0h19a1.56 1.56 0 0 1 .16.2 1.73 1.73 0 0 1-.39.73l-7.2 7.78a2.79 2.79 0 0 1-4.18 0zm13.59 7.89l3.55 2.5-4.92-1.06a4.31 4.31 0 0 1-5.84 0l-4.89 1.06 3.53-2.49L0 2.62v10.06a1.54 1.54 0 0 0 1.47 1.6h17.06a1.54 1.54 0 0 0 1.47-1.6v-10z"></path>
</svg>
<span class="value ">&#x202d;&#x202d;1&#x202c;&times;&#x202c;</span></div>
<ul>
        <li id=infoID_356118 class="infoType_21 firstElement active unreaded">
            <a class ="infoboxDeleteButton" href="#" data-id="356118">
<img src="/img/x.gif" class="del" alt="del">
</a>
⚔️ <span style="font-weight:bold;">CW – The Fall of Rome x2</span> ⚔️<br />
<br />
Time to sharpen your swords, gather the team and get ready for the next fight!<br />
<br />
Your new friends and foes are waiting for you on the next ➡️ <span style="font-weight:bold;"><span style="text-decoration:underline;"><a href="https://games.traviangames.com/128771234591777/1?server=9d1eb800-1e02-11f1-6417-000000000000#loginLobby" target="_blank">CW – The Fall of Rome x2</a></span></span> game world!        </li>
        </ul>


<script type="text/javascript">
	jQuery(function() {
		Travian.Game.Layout.setupInfoboxItemsDeletionWithMessage('Delete this message permanently?', 'Confirm');
	});
</script>

	</div>
				<div class="toggle">
		<button type="button" class="toggleBox" onclick="" title="Collapse box | Mark all messages as read">
			<svg class="toggleArrow" viewBox="0 0 18 11">
				<filter id="insetShadow">
					<feFlood flood-color="#a2e25e"/>
					<feComposite in2="SourceAlpha" operator="out"/>
					<feGaussianBlur stdDeviation="2" result="blur"/>
					<feComposite operator="atop" in2="SourceGraphic"/>
				</filter>
				<path class="caret" d="M1 10H17L9 1z" />
				<path class="glow" d="M1 10H17L9 1z" />
			</svg>
		</button>
	</div>

	<script type="text/javascript">
		jQuery(function() {
			Travian.Translation.add({
				'infobox_collapsed': 'Expand box',
				'infobox_expanded': 'Collapse box | Mark all messages as read'
			});

			var box = jQuery('#sidebarBoxInfobox');
			box.find('button.toggleBox').click(function(e) {
				Travian.Game.Layout.toggleBox(box, 'travian_toggle', 'infobox');
			});
		});
	</script>
	</div>
<div id="sidebarBoxLinklist" class="sidebarBox  expanded">
	<div class="header">
		<div class="buttonsWrapper">
    <a id="button69b3f63dea803"
   	class="layoutButton buttonFramed withIcon round edit gold    "
	title="Link list || Travian Plus allows you to make a link list."
        			href="#"
	            onclick="event.preventDefault();"
        	>
					<svg viewBox="0 0 15.59 20" class="edit"><g class="outline">
  <path d="M15.59 18.55V20H0v-1.45zM11.52 0L1.05 13.47.92 17.4l3.65-1.21L15 2.73zm.25 7L8.16 4.33 9 3.2l3.6 2.62z"></path>
</g><g class="icon">
  <path d="M15.59 18.55V20H0v-1.45zM11.52 0L1.05 13.47.92 17.4l3.65-1.21L15 2.73zm.25 7L8.16 4.33 9 3.2l3.6 2.62z"></path>
</g></svg>
		</a>

<script type="text/javascript">
	jQuery('#button69b3f63dea803').click(function (event) {
		jQuery(window).trigger('buttonClicked', [event.delegateTarget, {"type":"gold","loadTooltip":null,"boxId":"","disabled":false,"attention":false,"colorBlind":false,"class":"","id":"button69b3f63dea803","redirectUrl":"#","redirectUrlExternal":"","svg":"sideBar\/editUnderlined.svg","content":"","plusDialog":{"featureKey":"linkList","infoIcon":"https:\/\/support.travian.com\/support\/solutions\/articles\/7000060367-travian-plus-membership","cssClass":"premiumFeaturePackage premiumFeaturePlus paymentShopV4","premiumFeatureDialogVersion":2,"version":2,"paymentShopVersion":4},"title":"Link list || Travian Plus allows you to make a link list.","onclick":"event.preventDefault();"}]);
	});
</script>
</div>
	</div>
	<div class="content">
		<div class="boxTitle">Link list</div>

	<div class="linklistNotice">Travian Plus allows you to make a link list.</div>
	</div>
	</div>
                    </div>
				</div>

				<div id="contentOuterContainer" class="">
                                            <div class="village2">
        <div id="villageContent" class="">
        <div class="buildingSlot a19 g23 aid19 teuton" data-aid="19" data-gid="23" data-building-id="302979" data-name="Cranny"><a href="/build.php?id=19&gid=23" class="level colorLayer good aid19 teuton" title="Cranny &lt;span class=&quot;level&quot;&gt;Level 3&lt;/span&gt;||Cost for upgrading building to level 4:&lt;br /&gt;&lt;div class=&quot;inlineIconList resourceWrapper&quot;&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r1Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;85&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r2Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;105&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r3Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;65&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r4Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;20&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class=&quot;inlineIconList resourceWrapper&quot;&gt;&lt;div class=&quot;inlineIcon duration&quot; title=&quot;&quot;&gt;&lt;i class=&quot;clock_medium&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;0:07:20&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;" data-level="3"><div class="labelLayer">3</div></a><img src="/img/x.gif" class="building g23 teuton" alt="" /><svg width="120" height="120" viewBox="0 0 120 120" class="buildingShape g23">
  <g class="hoverShape">
    <path d="M42.75 60c15.31-2.35 28.15-7.84 36.45-19.1 9.52 10.65 14.52 22.67 14.54 36.22l-8.47 18.09-3.27 7.33a29.35 29.35 0 00-14.17 9.28L47 110.68c-9.42-2.14-17.73-5.76-23.78-12.38L24 82.83l4.24-12.55z" onclick="window.location.href='/build.php?id=19&amp;gid=23'"><title>Cranny &lt;span class="level"&gt;Level 3&lt;/span&gt;||Cost for upgrading building to level 4:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;85&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;105&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;65&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;20&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;0:07:20&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
  </g>
  <g class="highlightShape">
    <path d="M80.1 40.6c-.5-.3-1.1.8-1.5 2.4-.3 1.8-1.2 3-2.1 3s-1.5.4-1.5.8a4.38 4.38 0 001.2 2c1 1 1 1.5-.1 2.1a2.24 2.24 0 00-.9 2.2 2.32 2.32 0 01-1.1 2.5c-1.3 1-1.3 1.4-.2 2.8S75 60 73.2 60c-1.3 0-2.8-1.2-3.9-3-.9-1.7-2-3-2.4-3s-.5 1.5-.4 3.2a7.82 7.82 0 01-.7 4.5 4.24 4.24 0 00-.5 3.4c.3 1.2 0 2.2-.9 2.6a2.55 2.55 0 00-1.4 2.4 3.26 3.26 0 01-1.7 2.7 1.91 1.91 0 00-.8 2.8c.4 1.1.9 2.4 1.1 3.1.1.9-1.4 1.2-4.9 1-2.9-.1-5.5-.7-5.9-1.2a7.39 7.39 0 01-.8-3.4c0-1.4-1.4-5.3-3.1-8.8s-3.5-6.3-4.1-6.1-4 2.6-7.8 5.3c-5.3 3.9-6.9 5.6-7 7.5a13.61 13.61 0 01-2.1 5.9 9.53 9.53 0 00-1.5 7 35.59 35.59 0 01.6 5.7c0 1.3 1.4 3.3 3.4 4.8 1.8 1.4 3.6 2.2 4 1.9s.6-.2.6.4-.7 1.3-1.5 1.7-1.5.9-1.5 1.4 1.5 1.5 3.3 2.2a22.27 22.27 0 015.4 3.3c1.6 1.4 3.5 1.9 7 1.8 2.6 0 6.3-.2 8.1-.4s5.6-.5 8.5-.6 4.4-.5 3.4-.8c-1.8-.5-1.8-.5 0-1.9a11.88 11.88 0 015.7-1.4c3.2 0 3.7-.3 3.1-1.7a30.72 30.72 0 01-1.2-5c-.5-2.8-.2-3.4 2.3-4.4a44.89 44.89 0 005.4-2.6 26.17 26.17 0 014.3-2c1.7-.5 1.7-.6 0-1.9-1.5-1.1-1.5-1.3-.3-1.4.8 0 2.7-1.1 4.2-2.3a10.19 10.19 0 003.3-4.9 4.33 4.33 0 00-1.4-4.7c-1.2-1.2-2.1-2.5-2.1-3s1-1.6 2.3-2.4l2.2-1.6h-2.7c-1.6-.1-2.8-.5-2.8-1a2.14 2.14 0 011-1.6 1.88 1.88 0 001-1.5c0-.5-.9-1.2-2-1.5-1.6-.5-1.8-1-1-2.5a8.35 8.35 0 001-2.3c0-.3-.8-.4-1.7-.3-1.3.1-1.8-.6-1.8-2.4a12.62 12.62 0 00-1.7-5.3 10 10 0 01-1.8-4.6 3.23 3.23 0 00-.9-2.5z" onclick="window.location.href='/build.php?id=19&amp;gid=23'"><title>Cranny &lt;span class="level"&gt;Level 3&lt;/span&gt;||Cost for upgrading building to level 4:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;85&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;105&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;65&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;20&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;0:07:20&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
    <path d="M82 94.2c-1.4 0-1.9.2-1.2.5a5.28 5.28 0 002.5 0c.6-.3.1-.5-1.3-.5zM24.5 97c-.2 0-.7.4-1 1s.1 1 1 1 1.3-.5 1-1-.8-1-1-1zM77.4 102.1c-1.1 0-1.4.3-.6.6a2 2 0 001.9-.1c.4-.3-.2-.6-1.3-.5zM65.5 109a2.33 2.33 0 00-2 1c-.4.6.5 1 2 1s2.4-.4 2-1a2.33 2.33 0 00-2-1z" onclick="window.location.href='/build.php?id=19&amp;gid=23'"><title>Cranny &lt;span class="level"&gt;Level 3&lt;/span&gt;||Cost for upgrading building to level 4:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;85&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;105&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;65&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;20&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;0:07:20&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
  </g>
</svg>
</div><div class="buildingSlot a20 g10 aid20 teuton" data-aid="20" data-gid="10" data-building-id="302980" data-name="Warehouse"><a href="/build.php?id=20&gid=10" class="level colorLayer notNow aid20 teuton" title="Warehouse &lt;span class=&quot;level&quot;&gt;Level 10&lt;/span&gt;||Cost for upgrading building to level 11:&lt;br /&gt;&lt;div class=&quot;inlineIconList resourceWrapper&quot;&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r1Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;1535&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r2Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;1890&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r3Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;1065&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r4Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;470&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class=&quot;inlineIconList resourceWrapper&quot;&gt;&lt;div class=&quot;inlineIcon duration&quot; title=&quot;&quot;&gt;&lt;i class=&quot;clock_medium&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;1:13:00&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;" data-level="10"><div class="labelLayer">10</div></a><img src="/img/x.gif" class="building g10 teuton" alt="" /><svg width="120" height="120" viewBox="0 0 120 120" class="buildingShape g10">
  <g class="hoverShape">
    <path d="M18.77 51.59a4.36 4.36 0 00-.57 1.91c-.1 1.4.3 2.5.8 2.5s1 7.1 1 18.8v18.7l9.3 4.7a93.79 93.79 0 008.81 3.8c8.23 3.27 11.08 11.26 23.46 8.73.23-.05 18.13-10.38 19.83-9.68 2.4.9 6.6.3 6.6-.9.1-.3.3-5.4.6-11.2l.6-10.7S82 69.14 84 57.5c1.8-1.1 1-2.2-3.7-4.9-5.1-2.8-7.2-4.1-11.3-6.7-2.44-1.58-4.72-2.49-6-2.26-12.49 2.36-24.83-1.79-25.43-1.59-2.39.78-18.49 9.13-18.8 9.54z" onclick="window.location.href='/build.php?id=20&amp;gid=10'"><title>Warehouse &lt;span class="level"&gt;Level 10&lt;/span&gt;||Cost for upgrading building to level 11:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;1535&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;1890&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;1065&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;470&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;1:13:00&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
  </g>
  <g class="highlightShape">
    <path d="M38.4 42c-.8 0-1.4.4-1.4 1s-.7.7-1.5.4-1.5-.1-1.5.5-.7 1.1-1.5 1.1-1.5.4-1.5 1-.7.7-1.5.4-1.5-.1-1.5.5-.7 1.1-1.5 1.1-1.5.5-1.5 1a1 1 0 01-1.2.9 13.44 13.44 0 00-3.5.6 2.92 2.92 0 00-2.3 3.1c0 1.3.5 2.4 1 2.4s1 6.9 1 18.8v18.9l9.3 4.5c8.1 4.1 9.7 4.6 14 4.1 3.9-.5 4.7-.3 4.7 1.1 0 .9.5 1.6 1 1.6s1-.7 1-1.5.9-1.5 2.5-1.5a3.49 3.49 0 003.2-1.6 2.64 2.64 0 00-.8-2.8 27.58 27.58 0 01-3.5-4.1c-1.1-1.7-1.9-3.6-1.7-4.3a2.17 2.17 0 011.5-1.2c.6 0 .8.3.5.6s.9 1.5 2.9 2.6 3.9 1.6 4.4 1.3 1 0 1 .7 1.1 2.3 2.3 3.5c2 1.8 2.9 2 6.2 1.3 2.1-.5 4.1-1.4 4.5-2s1.8-.8 3.3-.5a3.63 3.63 0 012.9 2.8c.2 1.8 1 2.2 4.3 2.2h4l.1-4.8a15.68 15.68 0 01.7-5.4c.4-.3.7-3 .7-5.8 0-3.8-.5-5.6-1.8-6.8a5.83 5.83 0 00-3-1.7c-.8 0-1.2-2.8-1.2-8.9 0-7 .3-9 1.5-9.5.8-.3 1.5-.9 1.5-1.4s-3.9-3-8.7-5.7A76.18 76.18 0 0168 45a8.08 8.08 0 00-3.2-1.4c-1.7-.4-2.8-.2-2.8.4s-.7 1-1.5 1-1.5.4-1.5 1-.7.7-1.5.4-1.5-.1-1.5.5a1.27 1.27 0 01-1.4 1.1 2 2 0 00-1.8 1.1c-.2.7-1.9.2-4.3-1.2-2.2-1.3-5.1-3.1-6.4-4.1a8.71 8.71 0 00-3.7-1.8z" onclick="window.location.href='/build.php?id=20&amp;gid=10'"><title>Warehouse &lt;span class="level"&gt;Level 10&lt;/span&gt;||Cost for upgrading building to level 11:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;1535&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;1890&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;1065&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;470&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;1:13:00&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
    <path d="M57.4 95.1c-1.1 0-1.4.3-.6.6a2 2 0 001.9-.1c.4-.3-.2-.6-1.3-.5zM57.9 103c-.5 0-1.7 1-2.9 2.2a7.34 7.34 0 00-2 3.4 1.93 1.93 0 001.3 1.6 14.28 14.28 0 004.2.4c2-.1 3.1-.7 3.3-1.9a5.17 5.17 0 00-1.4-3.8 6.38 6.38 0 00-2.5-1.9z" onclick="window.location.href='/build.php?id=20&amp;gid=10'"><title>Warehouse &lt;span class="level"&gt;Level 10&lt;/span&gt;||Cost for upgrading building to level 11:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;1535&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;1890&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;1065&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;470&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;1:13:00&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
  </g>
</svg>
</div><div class="buildingSlot a21 g11 aid21 teuton" data-aid="21" data-gid="11" data-building-id="302981" data-name="Granary"><a href="/build.php?id=21&gid=11" class="level colorLayer good aid21 teuton" title="Granary &lt;span class=&quot;level&quot;&gt;Level 3&lt;/span&gt;||Cost for upgrading building to level 4:&lt;br /&gt;&lt;div class=&quot;inlineIconList resourceWrapper&quot;&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r1Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;170&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r2Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;210&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r3Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;145&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r4Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;40&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class=&quot;inlineIconList resourceWrapper&quot;&gt;&lt;div class=&quot;inlineIcon duration&quot; title=&quot;&quot;&gt;&lt;i class=&quot;clock_medium&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;0:17:00&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;" data-level="3"><div class="labelLayer">3</div></a><img src="/img/x.gif" class="building g11 teuton" alt="" /><svg width="120" height="120" viewBox="0 0 120 120" class="buildingShape g11">
  <g class="hoverShape">
    <path d="M49.8 34c-9.91 4.2-17.86 10.08-23.66 17.82l1.72 51.07A60.59 60.59 0 0059 115.1a131 131 0 0029.21-19.79 76.16 76.16 0 00-.08-15C78.64 72.77 69.9 64.4 65.65 51.09 64.14 46.12 58.09 40.27 49.8 34z" onclick="window.location.href='/build.php?id=21&amp;gid=11'"><title>Granary &lt;span class="level"&gt;Level 3&lt;/span&gt;||Cost for upgrading building to level 4:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;170&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;210&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;145&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;40&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;0:17:00&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
  </g>
  <g class="highlightShape">
    <path d="M49.8 34a9.56 9.56 0 00-3.3 1.2 10.2 10.2 0 01-3.4 1.4 9.52 9.52 0 00-3.3 2.4 13.67 13.67 0 01-4.8 3.1c-1.5.6-4.2 3-6 5.5-2.4 3.3-2.9 4.8-2.1 5.8.7.8 1.2 10.1 1.3 25.5l.3 24.3 5 2a31.07 31.07 0 016.5 3.3c.9.8 3.5 1.7 5.8 2.1s4.5 1 4.8 1.5 2.3 1.3 4.5 1.9c3 .8 4.4.8 5.5-.1a4.25 4.25 0 001.4-3 3.84 3.84 0 00-1.7-2.8c-1.5-.8-1.5-1.3 1-5 2-3 3.1-3.9 4.4-3.4a32.13 32.13 0 014.1 2.1c1.9 1.2 3 1.3 6.2.3 2.2-.6 4-1.6 4-2.1s1.7-1.8 3.8-2.8l3.7-1.7V89a31.1 31.1 0 01.7-7.6c.4-.6-.1-1.7-1.1-2.6s-3.9-1.7-6.5-2c-3.4-.4-5.7-.1-7.8 1.1s-2.8 2.2-2.5 3.8c.2 1.3-.1 2.3-.7 2.3a8.25 8.25 0 01-3.4-1.6C64.1 81 64 80.2 64 67.6c0-8.5.4-13.6 1.1-14.3.9-.9.5-2-1.6-4.5a39.63 39.63 0 00-7.1-6.1c-2.4-1.5-4.5-3.2-4.5-3.7s-.3-1.5-.4-2l-.4-2c-.1-.5-.7-1-1.3-1z" onclick="window.location.href='/build.php?id=21&amp;gid=11'"><title>Granary &lt;span class="level"&gt;Level 3&lt;/span&gt;||Cost for upgrading building to level 4:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;170&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;210&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;145&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;40&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;0:17:00&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
  </g>
</svg>
</div><div class="buildingSlot a22 g0 aid22 teuton" data-aid="22" data-gid="0" data-building-id="302982" data-name=""><a href="/build.php?id=22" class="emptyBuildingSlot"></a><img src="/img/x.gif" class="building iso teuton" alt="" /><svg width="120" height="120" viewBox="0 0 120 120" class="buildingShape iso">
	<path d="M49.4 70.4c-7.8 1.8-13.5 4.7-16.8 8.6-3.5 4.3-4.1 7.2-2.1 11.3 3.3 7.1 13.9 11.7 28.5 12.4 19.8 1.1 35-6.5 35-17.5 0-4.9-5.8-10.2-14.2-13.1-8.1-2.8-22-3.6-30.4-1.7z" onclick="window.location.href='/build.php?id=22'"><title>Building site</title></path>
</svg>
</div><div class="buildingSlot a23 g17 aid23 teuton" data-aid="23" data-gid="17" data-building-id="302983" data-name="Marketplace"><a href="/build.php?id=23&gid=17" class="level colorLayer good aid23 teuton" title="Marketplace &lt;span class=&quot;level&quot;&gt;Level 1&lt;/span&gt;||Cost for upgrading building to level 2:&lt;br /&gt;&lt;div class=&quot;inlineIconList resourceWrapper&quot;&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r1Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;100&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r2Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;90&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r3Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;155&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r4Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;90&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class=&quot;inlineIconList resourceWrapper&quot;&gt;&lt;div class=&quot;inlineIcon duration&quot; title=&quot;&quot;&gt;&lt;i class=&quot;clock_medium&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;0:11:30&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;" data-level="1"><div class="labelLayer">1</div></a><img src="/img/x.gif" class="building g17 teuton" alt="" /><svg width="120" height="120" viewBox="0 0 120 120" class="buildingShape g17">
  <g class="hoverShape">
    <path d="M20.9 53.6l-3 3.27s-5 10.23-5.64 10.43S8 84.7 8 86.3c0 1.84.28 3 1 3.75 1 .88 10.4 5.85 10.4 6.85 0 3.6 9.87 12.06 10.16 12.15s15.35 7.06 17.27 7.06 26.57 1.09 26.57 1.09 13.3-1.2 16.2-2.6a8.07 8.07 0 002.57-1.6c.64-.72 4.9-9.85 5.2-10.24.44-.57 6.23-10 6.43-11.43s1.5-2.6 3.7-3.4c4.3-1.6 6.3-5.6 4.4-9-1.5-2.9-3.4-4.9-4.7-4.9-.5 0-1.7-.9-2.8-2.1S96.47 62.39 89.07 59L75.9 52.6c-4.48-1.6-18.59-2.72-23.05-7.68.49 1.84-31.49 10.51-31.95 8.68z" onclick="window.location.href='/build.php?id=23&amp;gid=17'"><title>Marketplace &lt;span class="level"&gt;Level 1&lt;/span&gt;||Cost for upgrading building to level 2:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;100&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;90&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;155&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;90&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;0:11:30&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
  </g>
  <g class="highlightShape">
    <path d="M52 45c-1.1 0-2 .4-2 1s-1.1 1.2-2.5 1.6-2.2 1-1.9 1.5-.2.6-1 .3-1.6-.1-1.6.6-.7 1-1.5.6-1.5-.1-1.5.4-.7.6-1.7.3c-1.1-.5-1.4-.3-.8.6s.2 1.1-1.4.6c-1.1-.3-2.1-.2-2.1.3s-2 2.3-4.6 4.1c-4 3-4.3 3.4-2.8 4.5.9.7 1.4 1.8 1 2.4a2.54 2.54 0 01-2 1.2c-.7 0-1.9-2.4-2.6-5.5s-1.7-5.8-2.1-6.1-1.1.6-1.4 1.8a13.43 13.43 0 01-2.5 4.3 11.87 11.87 0 00-2.5 4.7c-.4 1.6-1.1 2.8-1.5 2.8s-.9.8-.9 1.7-.1 4.6-.1 8c.1 4.9-.3 6.3-1.4 6.3a3.19 3.19 0 00-2.4 1.6 6.26 6.26 0 00-.4 3.9c.2 1.3 1.2 2.6 2.1 2.7a14.58 14.58 0 004.9-.3c1.7-.4 3.5-.3 3.8.2s0 .8-.7.7a1.38 1.38 0 00-1.6.9c-.3.8.5 1 2.4.7 2.2-.4 2.6-.3 1.6.7a5.09 5.09 0 00-1.3 3.1 3.76 3.76 0 002.1 2.8 14.79 14.79 0 005.7 1.1 34.7 34.7 0 007.2-1 24 24 0 014.7-1.1c.6 0 1 .8.9 1.7s-2.1 2.3-5.1 3.3c-2.7.9-5.1 2.2-5.3 2.8s.6 1.2 2 1.2a31.86 31.86 0 006.1-1.4c3.2-1.2 3.6-1.2 2.6 0-.7.8-1 1.6-.8 1.8a25.55 25.55 0 003.5 1.9c1.9 1 3.1 2.3 3 3.4-.1 1.5.5 1.7 3.4 1.5a11.59 11.59 0 004-.9c.3-.2-.4-1.1-1.5-1.9-1.7-1.3-1.8-1.6-.5-2.4a7.08 7.08 0 013.1-1 4.57 4.57 0 002.9-1.5c1.2-1.4 1.5-1.4 3.1.1 1 .9 1.7 2.1 1.6 2.7s1.2 1.4 2.9 1.8a12.53 12.53 0 014.9 2.9 6.63 6.63 0 004.2 2c1.2 0 2.3-.3 2.3-.8s1.1-1.2 2.4-1.8c1.8-.8 2.8-.8 4.2.3a8.28 8.28 0 004.1 1.3 8.31 8.31 0 004.3-1.7 6.16 6.16 0 002-4c0-1.2-.4-2.5-1-2.8a2.87 2.87 0 01-1-2.2 1 1 0 011.4-1c.7.3 2.2-.1 3.3-.8 1.4-1 1.9-2.2 1.5-4.4s0-3.1 1-3.1c.8 0 2.5-1.1 3.8-2.5s2.1-2.8 1.7-3.1 1.2-1.6 3.5-2.8 4.4-3.1 4.8-4.2.2-3.3-.5-5.1-3.5-4.5-6.7-6.5c-2.9-2-6.8-4.4-8.5-5.4-2.1-1.1-3.3-2.6-3.3-3.9 0-1.6-2-3-8.6-6.3L75.9 52l-5.8 3c-5.4 2.9-5.7 3.3-5.3 6.3.3 2.5.1 2.9-.7 1.7a7.32 7.32 0 01-1.1-3.7 3.9 3.9 0 00-1.1-2.9c-.6-.3-2.6-3-4.5-6-2.3-3.5-4.1-5.4-5.4-5.4zm11.5 21a5.1 5.1 0 011.5 3.4c0 1.8-.2 1.7-1.5-.8a20.79 20.79 0 01-1.5-3.3c0-.3.7 0 1.5.7zm.1 14c.2 0 .4.7.4 1.5a1.56 1.56 0 01-1.6 1.5c-1.4 0-1.4-.3-.4-1.5a6 6 0 011.6-1.5zM57 85a4.13 4.13 0 011.8 1.2 3.74 3.74 0 011.2 2.2c0 .5-.9.1-2-.9-1.9-1.8-2-1.7-2 .7s-.6 2.6-7 3.8c-3.9.7-7.3 1-7.7.7s.5-.7 1.8-.7a22.69 22.69 0 006.6-1.9c3-1.4 4.3-1.6 4.7-.8.2.7.5.3.5-.9a5.07 5.07 0 01.8-2.7A1.89 1.89 0 0157 85zm11.9 1.4a2 2 0 011.8 1.2c.2.7-1 1.7-2.8 2.3a25.66 25.66 0 01-4 1.1c-.5 0-.9-.9-.9-1.9a2.47 2.47 0 012.3-2.4 16.29 16.29 0 013.6-.3zM54.3 97.9c.6.6 2.9 1.1 5.2 1.1 3.3.1 3.7.2 2.2 1.1a4.46 4.46 0 01-3.3.5 4.47 4.47 0 00-3.2.3c-1.4.7-1.7.4-1.9-1.6-.1-1.8.2-2.2 1-1.4z" onclick="window.location.href='/build.php?id=23&amp;gid=17'"><title>Marketplace &lt;span class="level"&gt;Level 1&lt;/span&gt;||Cost for upgrading building to level 2:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;100&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;90&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;155&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;90&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;0:11:30&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
  </g>
</svg>
</div><div class="buildingSlot a24 g0 aid24 teuton" data-aid="24" data-gid="0" data-building-id="302984" data-name=""><a href="/build.php?id=24" class="emptyBuildingSlot"></a><img src="/img/x.gif" class="building iso teuton" alt="" /><svg width="120" height="120" viewBox="0 0 120 120" class="buildingShape iso">
	<path d="M49.4 70.4c-7.8 1.8-13.5 4.7-16.8 8.6-3.5 4.3-4.1 7.2-2.1 11.3 3.3 7.1 13.9 11.7 28.5 12.4 19.8 1.1 35-6.5 35-17.5 0-4.9-5.8-10.2-14.2-13.1-8.1-2.8-22-3.6-30.4-1.7z" onclick="window.location.href='/build.php?id=24'"><title>Building site</title></path>
</svg>
</div><div class="buildingSlot a25 g18 aid25 teuton" data-aid="25" data-gid="18" data-building-id="302985" data-name="Embassy"><a href="/build.php?id=25&gid=18" class="level colorLayer good aid25 teuton" title="Embassy &lt;span class=&quot;level&quot;&gt;Level 1&lt;/span&gt;||Cost for upgrading building to level 2:&lt;br /&gt;&lt;div class=&quot;inlineIconList resourceWrapper&quot;&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r1Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;230&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r2Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;165&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r3Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;190&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r4Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;100&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class=&quot;inlineIconList resourceWrapper&quot;&gt;&lt;div class=&quot;inlineIcon duration&quot; title=&quot;&quot;&gt;&lt;i class=&quot;clock_medium&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;0:12:30&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;" data-level="1"><div class="labelLayer">1</div></a><img src="/img/x.gif" class="building g18 teuton" alt="" /><svg width="120" height="120" viewBox="0 0 120 120" class="buildingShape g18">
  <g class="hoverShape">
    <path d="M103.76 44.06c-6-.57-6.44-6.44-17.43-7.42v-.15.2l-5.66 7.6S37.7 50 37.1 50s-3.3 2.15-3.46 2.4S23.6 66.75 23.12 67a2.45 2.45 0 00-1 1.78c-.3 1.2-2.1 3.1-4 4.3l-3.3 2 .5 8.7c.5 8 .3 9.2-1.9 12.7a24.4 24.4 0 00-2.4 4.8c0 .4 3.9 2.6 8.6 4.7l8.5 4s9.2-1 24.9 3c.58.15 9.4 5.2 10 5.5 1.38.12.68 0 2.48 0 5.13-7.66 8.67-10.16 19.79-15.72a68.4 68.4 0 0113.93-.73c-.33-4.56-.09-2.85-.25-11.41.94-11.42 4.83-30.64 5.13-39.74a18 18 0 00-.08-2.7 9.11 9.11 0 00-.26-4.12z" onclick="window.location.href='/build.php?id=25&amp;gid=18'"><title>Embassy &lt;span class="level"&gt;Level 1&lt;/span&gt;||Cost for upgrading building to level 2:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;230&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;165&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;190&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;100&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;0:12:30&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
  </g>
  <g class="highlightShape">
    <path d="M87 37.5a1 1 0 00-1.4.7 20 20 0 00-.8 3.3 2.9 2.9 0 01-2.7 2.3c-1.8.3-2.2.8-1.7 2.5a29.55 29.55 0 01.6 5.8 9.75 9.75 0 002 5.9c1.7 2 2 3.7 2 11.9 0 9-.1 9.4-1.7 7.8a5.93 5.93 0 01-1.8-3.5c0-1-.9-1.8-2.2-2s-2.3-1-2.3-1.8.5-1.4 1-1.4a1 1 0 001-1c0-.6-1.6-1.8-3.6-2.8l-3.6-1.7.4-6.7c.3-3.9.1-6.8-.4-6.8s-4.2.5-8.1 1.1a42.36 42.36 0 00-12.6 4 35 35 0 01-6.4 2.9 11.37 11.37 0 01-3.8-2.1c-1.6-1.1-2.9-2.9-2.9-4s-.4-1.9-1-1.9a1.1 1.1 0 00-1 1.1c0 .6-.7.8-1.6.5-1.1-.4-1.4-.1-1.2 1.2a16 16 0 01-1.1 5.2 42.1 42.1 0 01-3.4 6.3c-1 1.5-2.3 2.5-2.8 2.1a4.84 4.84 0 00-2.9.1 3 3 0 00-2 2.5c0 1-1.3 2.7-3 3.7l-3 1.7v10c0 7-.4 10.4-1.4 11.5a12.54 12.54 0 00-2 3.8c-.6 2 .2 2.7 7.5 6.3l8.2 4.2 5.1-2.8c3.2-1.8 6.3-2.7 8.4-2.6a18.35 18.35 0 016.7 2.5c1.9 1.2 3.6 3 3.9 3.9s1 1.8 1.6 1.8 1-.7.6-1.5-.2-1.5.2-1.5a8.74 8.74 0 013 1.6c1.3.9 2.9 1.3 3.7 1 1.1-.4 1.5.2 1.5 2.4 0 1.6.4 3.2 1 3.5s1-1.2 1-4c0-3.3.5-4.7 1.6-5.2a2.18 2.18 0 012.5.8c.7 1.1.9 1.1.9-.3 0-1.1 1.9-2.7 5-4.3 2.8-1.4 5-2.1 5-1.5a1 1 0 00.9 1c.5 0 1.1-.9 1.4-2a2.53 2.53 0 012.1-2c1 0 1.6-.9 1.6-2.6 0-1.4.4-2.3 1-1.9s1-4.8 1-14.7c0-13.4.3-15.9 2-19.3 1.1-2.2 2-3.2 2-2.3a2.94 2.94 0 001.4 2.5 9.89 9.89 0 012.5 3c.7 1.4 1.1 8.2 1.1 18.7 0 9.9.4 16.7 1 17.1s1-5.2 1-16c0-13.5.3-16.9 1.5-18.1a6.41 6.41 0 001.5-3.8 5.19 5.19 0 01.9-3.1c.5-.6 1-4.4 1.1-8.5s.2-7.8.1-8.3-1.1.3-2.3 1.5l-2.3 2.3-.3-2.8c-.2-1.5-.8-2.7-1.3-2.7s-.9 1.3-.9 2.9-.5 3.3-1.1 3.6a1.52 1.52 0 01-1.5.3 22.38 22.38 0 01-.5-5.6c-.1-2.9-.5-5.2-.9-5.2s-1 .7-1.4 1.5-1 1.5-1.6 1.5-1-.6-1-1.4a2.82 2.82 0 00-1-2.1zm2 5.5c.6 0 1 .2 1 .4s-.4.8-1 1.1-1 .1-1-.4a1.1 1.1 0 011-1.1zm10 6c.6 0 1 .2 1 .4s-.4.8-1 1.1-1 .1-1-.4a1.1 1.1 0 011-1.1z" onclick="window.location.href='/build.php?id=25&amp;gid=18'"><title>Embassy &lt;span class="level"&gt;Level 1&lt;/span&gt;||Cost for upgrading building to level 2:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;230&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;165&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;190&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;100&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;0:12:30&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
  </g>
</svg>
</div><div class="buildingSlot a26 g15 aid26 teuton" data-aid="26" data-gid="15" data-building-id="302986" data-name="Main Building"><a href="/build.php?id=26&gid=15" class="level colorLayer good aid26 teuton" title="Main Building &lt;span class=&quot;level&quot;&gt;Level 5&lt;/span&gt;||Cost for upgrading building to level 6:&lt;br /&gt;&lt;div class=&quot;inlineIconList resourceWrapper&quot;&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r1Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;240&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r2Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;135&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r3Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;205&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r4Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;70&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class=&quot;inlineIconList resourceWrapper&quot;&gt;&lt;div class=&quot;inlineIcon duration&quot; title=&quot;&quot;&gt;&lt;i class=&quot;clock_medium&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;0:30:00&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;" data-level="5"><div class="labelLayer">5</div></a><img src="/img/x.gif" class="building g15 teuton" alt="" /><svg width="120" height="120" viewBox="0 0 120 120" class="buildingShape g15">
  <g class="hoverShape">
    <path d="M31.7 24.8c-.8.9-4.35 5.35-5.35 5.25-1.73 1.73-8 10.85-10.85 16.45C6.7 63.9.67 65.06.38 65.16S2.4 83.1 2.7 86.6l.6 6.5 9.4 4.8 9.5 4.9s7-4.42 40.76 7.45c9.77-1 18.44 3.75 21 3.75 1.71 0 2.14-.2 2.65-.76 6.06-6.74 17.13-4.35 16.35-11.54-.73-6.66-4.46-28.08-4.26-28.25.42-.31-6.3-7.45-6.3-7.45S81.2 54.7 81.09 49.16C64.15 43.3 51.3 35.1 49.5 30.6c-1.3-3.2-1.9-3.6-5.1-3.6a19.09 19.09 0 01-7.3-2c-3.6-1.8-4-1.8-5.4-.2z" onclick="window.location.href='/build.php?id=26&amp;gid=15'"><title>Main Building &lt;span class="level"&gt;Level 5&lt;/span&gt;||Cost for upgrading building to level 6:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;240&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;135&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;205&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;70&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;0:30:00&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
  </g>
  <g class="highlightShape">
    <path d="M32.8 23c-.5 0-1.6 1.6-2.5 3.5-1 2.1-2.3 3.4-3.2 3.3-1.1-.2-1.9 1-2.5 4s-1.4 4.1-2.4 3.7-2.2.4-3.1 1.7A34.41 34.41 0 0016 45c-.8 2-3.5 7.1-5.9 11.3C6.2 63 5.3 64 2.8 64c-1.5 0-2.8.5-2.8 1s.9 1.4 2.1 1.8c1.9.7 1.9.9.5 2.1A4.41 4.41 0 001 71.5a1.74 1.74 0 001.2 1.7c.9.3 1 1.6.1 5.4-.7 2.9-.8 5-.2 5.2s.9 2.5.9 5v4.7l10 5c6.8 3.4 10.3 4.6 10.8 3.9a19.54 19.54 0 014.9-3.3 23.92 23.92 0 015.5-2.1c.7 0 7.7 3.2 15.6 7 12.5 6.2 14.5 6.9 15.7 5.6a11 11 0 013.6-2.1q2.1-.75 5.1 1.5c1.6 1.2 3.6 1.9 4.5 1.6s1.7.1 2 1.3a4 4 0 002 2.5 3.33 3.33 0 002.9-.4c.8-.7 1.1-2.4.7-4.6-.6-3.4-.4-3.5 4.4-5.6l5-2.1.7-7.4c.3-4.1.3-7.9 0-8.4a.55.55 0 01.5-.9 1.27 1.27 0 001.1-1.4 4.42 4.42 0 00-1.5-2.6 4.57 4.57 0 01-1.5-3 4.74 4.74 0 012.3-3.3l2.2-1.6H97a5.4 5.4 0 00-3.8 1.1c-1 1-1.7.8-3.3-.8-1.1-1.2-1.7-2.7-1.4-3.6a6.49 6.49 0 012.8-2.6c2.1-1 2-1.1-.9-1.1a7.69 7.69 0 00-5.2 2c-1.3 1.1-3 1.9-4 1.7s-1.8-1.4-2-3.2c-.2-1.6.2-3.2.9-3.7.9-.5.5-1.5-1.4-3.8-1.6-2-2.4-3.8-2-4.9a9 9 0 012.7-3.4l2.1-1.8h-2.3a10.87 10.87 0 00-5.3 2.1c-2 1.4-3.6 1.8-5.1 1.4-1.3-.4-6.2-2.8-11-5.3-8.8-4.5-8.8-4.6-8.8-8.4 0-2.4.4-3.7 1-3.3s1 .1 1-.6a18.21 18.21 0 00-1.2-4.6C48.7 27.4 48.2 27 45 27a20 20 0 01-7.5-2 25.71 25.71 0 00-4.7-2zM100.1 94a3.35 3.35 0 00-2 1.4c-.7.8-1.1 3-.9 4.8.2 2.8.7 3.4 3.1 3.6 1.7.2 2.7-.1 2.7-1a29.76 29.76 0 00-1.1-5.1c-.5-2-1.4-3.7-1.8-3.7z" onclick="window.location.href='/build.php?id=26&amp;gid=15'"><title>Main Building &lt;span class="level"&gt;Level 5&lt;/span&gt;||Cost for upgrading building to level 6:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;240&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;135&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;205&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;70&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;0:30:00&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
  </g>
</svg>
</div><div class="buildingSlot a27 g0 aid27 teuton" data-aid="27" data-gid="0" data-building-id="302987" data-name=""><a href="/build.php?id=27" class="emptyBuildingSlot"></a><img src="/img/x.gif" class="building iso teuton" alt="" /><svg width="120" height="120" viewBox="0 0 120 120" class="buildingShape iso">
	<path d="M49.4 70.4c-7.8 1.8-13.5 4.7-16.8 8.6-3.5 4.3-4.1 7.2-2.1 11.3 3.3 7.1 13.9 11.7 28.5 12.4 19.8 1.1 35-6.5 35-17.5 0-4.9-5.8-10.2-14.2-13.1-8.1-2.8-22-3.6-30.4-1.7z" onclick="window.location.href='/build.php?id=27'"><title>Building site</title></path>
</svg>
</div><div class="buildingSlot a28 g0 aid28 teuton" data-aid="28" data-gid="0" data-building-id="302988" data-name=""><a href="/build.php?id=28" class="emptyBuildingSlot"></a><img src="/img/x.gif" class="building iso teuton" alt="" /><svg width="120" height="120" viewBox="0 0 120 120" class="buildingShape iso">
	<path d="M49.4 70.4c-7.8 1.8-13.5 4.7-16.8 8.6-3.5 4.3-4.1 7.2-2.1 11.3 3.3 7.1 13.9 11.7 28.5 12.4 19.8 1.1 35-6.5 35-17.5 0-4.9-5.8-10.2-14.2-13.1-8.1-2.8-22-3.6-30.4-1.7z" onclick="window.location.href='/build.php?id=28'"><title>Building site</title></path>
</svg>
</div><div class="buildingSlot a29 g0 aid29 teuton" data-aid="29" data-gid="0" data-building-id="302989" data-name=""><a href="/build.php?id=29" class="emptyBuildingSlot"></a><img src="/img/x.gif" class="building iso teuton" alt="" /><svg width="120" height="120" viewBox="0 0 120 120" class="buildingShape iso">
	<path d="M49.4 70.4c-7.8 1.8-13.5 4.7-16.8 8.6-3.5 4.3-4.1 7.2-2.1 11.3 3.3 7.1 13.9 11.7 28.5 12.4 19.8 1.1 35-6.5 35-17.5 0-4.9-5.8-10.2-14.2-13.1-8.1-2.8-22-3.6-30.4-1.7z" onclick="window.location.href='/build.php?id=29'"><title>Building site</title></path>
</svg>
</div><div class="buildingSlot a30 g22 aid30 teuton" data-aid="30" data-gid="22" data-building-id="302990" data-name="Academy"><a href="/build.php?id=30&gid=22" class="level colorLayer good aid30 teuton" title="Academy &lt;span class=&quot;level&quot;&gt;Level 1&lt;/span&gt;||Cost for upgrading building to level 2:&lt;br /&gt;&lt;div class=&quot;inlineIconList resourceWrapper&quot;&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r1Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;280&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r2Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;205&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r3Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;115&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r4Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;50&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class=&quot;inlineIconList resourceWrapper&quot;&gt;&lt;div class=&quot;inlineIcon duration&quot; title=&quot;&quot;&gt;&lt;i class=&quot;clock_medium&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;0:12:30&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;" data-level="1"><div class="labelLayer">1</div></a><img src="/img/x.gif" class="building g22 teuton" alt="" /><svg width="120" height="120" viewBox="0 0 120 120" class="buildingShape g22">
  <g class="hoverShape">
    <path d="M47 45.3c-4.9 1.1-5.8 1.8-9.7 6.7-2.3 3-6.1 9.5-8.4 10.5-4.3 2-14.4 14.8-14.4 14.8l.2 9.5.1 9.6 10.6 5.3c8.5 4.3 10 10.67 13.2 13.2 2 1.6 4.1 2.1 8.6 2.1 4.16 0 7.16-.61 8.86-1.75s10.64-3.15 14.24-4.35c2.2-.7 4.4-2.1 5.1-3.2 1.4-2.4 7.8-5.7 11.1-5.7 4 0 10.5-3.7 10.5-6 0-1-.39-6.8-.09-13.4l.17-7.5-4.28-3.5c-1.5-1-2.8-2.3-2.8-3s-2-2.2-4.5-3.4c-3.8-1.8-4.5-2.6-4.5-5s-.7-3.2-4.2-4.8a59.61 59.61 0 01-9.2-5.3c-4.3-2.9-12.5-6.3-14.5-6-.3 0-3.1.6-6.1 1.2z" onclick="window.location.href='/build.php?id=30&amp;gid=22'"><title>Academy &lt;span class="level"&gt;Level 1&lt;/span&gt;||Cost for upgrading building to level 2:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;280&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;205&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;115&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;50&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;0:12:30&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
  </g>
  <g class="highlightShape">
    <path d="M55.8 44.6a35.46 35.46 0 00-8.6.4 21.28 21.28 0 00-6.3 2.4c-1.2.8-3.8 4.2-5.9 7.7-2.5 4-5.2 6.9-7.7 8.3-3.2 1.8-3.9 2.8-4.1 5.7-.3 3.2-.9 3.9-4.8 5.9l-4.5 2.3.3 9.6.3 9.6 10 5.2c7.8 4.1 10.7 5.1 13 4.7l3-.6-2.2 1.7a5.59 5.59 0 00-2.3 3.9 4.89 4.89 0 001.4 3.5 16.71 16.71 0 004.8 2.2 23.51 23.51 0 008.1.3c2.6-.3 5.5-1.3 6.3-2.2a4.6 4.6 0 001-4.4L57 108l4.8 2.3c2.6 1.3 5.7 2.1 7 1.9s2.2-.7 2.2-1.2.9-1.2 2-1.5a2.65 2.65 0 002-2.1c0-.7 2.2-2.5 4.9-3.9s5.6-2.2 6.4-1.9 3.3-.4 5.5-1.5l4-2-.5-9.9c-.4-6.9-.2-10.1.6-10.6a3 3 0 001.1-2.2c0-.8-1.6-2.4-3.5-3.5S90 69.2 90 68.4s-2-2.4-4.5-3.6C81.8 63 81 62.1 81 60s-.8-3.1-4.2-4.6a33 33 0 01-6.8-4 55.57 55.57 0 00-6.2-4.1 24.41 24.41 0 00-8-2.7zM90 79c.6 0 1 2.7 1 6s-.4 6-1 6-1-2.7-1-6 .4-6 1-6zm-69.6 4a3 3 0 012.2 1.1 1.71 1.71 0 01-.7 2 5.62 5.62 0 01-2.1.9c-.5 0-.8-.9-.8-2s.6-2 1.4-2zm29.1 21a6.21 6.21 0 012.5 1c.8.5 1.1 1 .5 1a6.8 6.8 0 01-2.5-1c-.8-.5-1-1-.5-1z" onclick="window.location.href='/build.php?id=30&amp;gid=22'"><title>Academy &lt;span class="level"&gt;Level 1&lt;/span&gt;||Cost for upgrading building to level 2:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;280&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;205&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;115&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;50&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;0:12:30&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
  </g>
</svg>
</div><div class="buildingSlot a31 g0 aid31 teuton" data-aid="31" data-gid="0" data-building-id="302991" data-name=""><a href="/build.php?id=31" class="emptyBuildingSlot"></a><img src="/img/x.gif" class="building iso teuton" alt="" /><svg width="120" height="120" viewBox="0 0 120 120" class="buildingShape iso">
	<path d="M49.4 70.4c-7.8 1.8-13.5 4.7-16.8 8.6-3.5 4.3-4.1 7.2-2.1 11.3 3.3 7.1 13.9 11.7 28.5 12.4 19.8 1.1 35-6.5 35-17.5 0-4.9-5.8-10.2-14.2-13.1-8.1-2.8-22-3.6-30.4-1.7z" onclick="window.location.href='/build.php?id=31'"><title>Building site</title></path>
</svg>
</div><div class="buildingSlot a32 g19 aid32 teuton" data-aid="32" data-gid="19" data-building-id="302992" data-name="Barracks"><a href="/build.php?id=32&gid=19" class="level colorLayer notNow aid32 teuton" title="Barracks &lt;span class=&quot;level&quot;&gt;Level 6&lt;/span&gt;||Cost for upgrading building to level 7:&lt;br /&gt;&lt;div class=&quot;inlineIconList resourceWrapper&quot;&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r1Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;925&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r2Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;615&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r3Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;1145&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r4Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;530&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class=&quot;inlineIconList resourceWrapper&quot;&gt;&lt;div class=&quot;inlineIcon duration&quot; title=&quot;&quot;&gt;&lt;i class=&quot;clock_medium&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;0:36:20&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;" data-level="6"><div class="labelLayer">6</div></a><img src="/img/x.gif" class="building g19 teuton" alt="" /><svg width="120" height="120" viewBox="0 0 120 120" class="buildingShape g19">
  <g class="hoverShape">
    <path d="M35.39 53.28c-3.72.23-9 14.86-22.26 16.06C12.88 69.36 6 96.4 6.2 96.5s8.2 4.4 17.9 9.4c16.7 8.6 17.7 9 20.7 7.9a9.92 9.92 0 015.2-.4l2-2.2c1.2-1.2 2.5-2.2 3-2.2s6.3-2.9 7.3-4.5C71.91 94.61 91.24 94 91.24 94s12.45-10 12.61-10.26c.27-.39-1.85-9.45-1.85-10.25 0-1.6-5.55-11-7.5-21.68-2.61.49-4.09-1.26-4.5-.82-3.9 4.16-25.88 2.51-37.22-1.88a27.08 27.08 0 01-17.39 4.17z" onclick="window.location.href='/build.php?id=32&amp;gid=19'"><title>Barracks &lt;span class="level"&gt;Level 6&lt;/span&gt;||Cost for upgrading building to level 7:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;925&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;615&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;1145&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;530&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;0:36:20&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
  </g>
  <g class="highlightShape">
    <path d="M52.9 49c-.5 0-.9.2-.9.5a17.49 17.49 0 001.1 2.8c.8 1.7.8 3.5-.1 6.5-.6 2.3-1.5 4.2-2.1 4.2s-.7-.5-.4-1-.5-1-1.9-1c-1.7 0-2.6-.6-2.6-1.5s-.6-1.5-1.2-1.4a12.18 12.18 0 01-2.7 0c-.8-.1-1.1-.7-.7-1.7.5-1.3.2-1.5-1.4-1.1a3.39 3.39 0 01-3.6-1.6c-1.6-2.1-1.6-2.1-1 1.2.4 2.3-.3 6.1-2.4 12.5-2.7 8.3-3.3 9.1-5.6 9.3-1.8.1-2.8-.5-3.1-1.6-.3-1.3-1.2-1.7-3-1.3-2.2.4-2.5.2-2-1.2s.2-1.6-1.2-1.4a4.87 4.87 0 01-3.5-1.1c-.9-.8-1.9-1.1-2.2-.8s-.1 1.5.5 2.6c.9 1.6.8 3.7-.4 8.8a53.73 53.73 0 01-4.1 11.2c-1.3 2.4-2.1 4.8-1.7 5.2s8.5 4.6 18 9.3 17.6 8.6 18.1 8.6 1.2-.7 1.6-1.5a1.85 1.85 0 011.7-1.3c.7.2 1.6-1.2 1.9-3s1-3.6 1.4-3.9.6 1.1.6 3.3c.1 3.5.2 3.7 1.4 2.2a4 4 0 012.5-1.8c.6 0 1.1-1.1 1.1-2.5s.6-2.5 1.4-2.5a2.52 2.52 0 012.1 1 2.82 2.82 0 002.1 1 1.45 1.45 0 001.4-1.5c0-.8.3-1.5.8-1.5s.7-2.4.6-5.3a93.28 93.28 0 01.3-9.4c.4-3.6.7-4 1.9-2.8.8.7 1.4 3.2 1.4 5.4s.5 4.1 1 4.1 1-1.6 1-3.5.4-3.5.9-3.5a9.87 9.87 0 002.5-.6c1.2-.4 1.5-.2 1 .9-.3 1 .6 2.1 2.8 3.2 1.9 1.1 5.7 1.9 9.1 1.9l5.7.1.2-6c.1-4.2.3-4.9.5-2.3s.9 3.8 1.9 3.8 1.4-1.3 1.4-4.6c0-3.8.3-4.5 1.6-4a15.63 15.63 0 002 .6c.2 0 .4.9.4 1.9a3.5 3.5 0 001 2.6c.6.3 1-.1 1-1 0-1.1.5-1.5 1.5-1.1.8.3 1.5.2 1.5-.2a16.77 16.77 0 00-2.1-4.1c-1.9-3.2-1.9-3.4-.2-4.6 1.2-.9 1.5-1.7.8-2.4a14.56 14.56 0 00-4.5-1.8l-3.5-.9.4-9.4c.3-9 .3-9.3-1.5-7.6s-1.8 1.7-2.8-.5l-.9-2.4-.5 2.5a8 8 0 01-1.4 3.7 1.78 1.78 0 01-2 .7c-.6-.4-.9 1.5-.6 5 .2 4.4 0 5.5-1 5.1a7.14 7.14 0 00-1.8-.5c-.2 0 0-.8.3-1.7.5-1.2.2-1.5-1-1a5.83 5.83 0 01-3.2.1 2.54 2.54 0 01-1.5-1.9c0-.9-.8-1.1-2.2-.7-1.7.4-2 .2-1.5-1.3s.3-1.6-1.8-1.1c-1.8.5-2.5.2-2.5-.9 0-.9-.9-1.5-2.5-1.5-1.4 0-2.5-.6-2.5-1.3s-1-1.3-2.2-1.3c-1.4.1-2.3-.5-2.3-1.4s-.8-1.4-2.2-1.2a3 3 0 01-2.8-.8 2.14 2.14 0 00-1.6-1zm5.8 34c.2 0 .3 1.8.3 4 0 3.8-.1 3.9-2.4 2.8l-2.5-1.1 2.2-2.8a12.66 12.66 0 012.4-2.9z" onclick="window.location.href='/build.php?id=32&amp;gid=19'"><title>Barracks &lt;span class="level"&gt;Level 6&lt;/span&gt;||Cost for upgrading building to level 7:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;925&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;615&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;1145&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;530&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;0:36:20&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
  </g>
</svg>
</div><div class="buildingSlot a33 g0 aid33 teuton" data-aid="33" data-gid="0" data-building-id="302993" data-name=""><a href="/build.php?id=33" class="emptyBuildingSlot"></a><img src="/img/x.gif" class="building iso teuton" alt="" /><svg width="120" height="120" viewBox="0 0 120 120" class="buildingShape iso">
	<path d="M49.4 70.4c-7.8 1.8-13.5 4.7-16.8 8.6-3.5 4.3-4.1 7.2-2.1 11.3 3.3 7.1 13.9 11.7 28.5 12.4 19.8 1.1 35-6.5 35-17.5 0-4.9-5.8-10.2-14.2-13.1-8.1-2.8-22-3.6-30.4-1.7z" onclick="window.location.href='/build.php?id=33'"><title>Building site</title></path>
</svg>
</div><div class="buildingSlot a34 g0 aid34 teuton" data-aid="34" data-gid="0" data-building-id="302994" data-name=""><a href="/build.php?id=34" class="emptyBuildingSlot"></a><img src="/img/x.gif" class="building iso teuton" alt="" /><svg width="120" height="120" viewBox="0 0 120 120" class="buildingShape iso">
	<path d="M49.4 70.4c-7.8 1.8-13.5 4.7-16.8 8.6-3.5 4.3-4.1 7.2-2.1 11.3 3.3 7.1 13.9 11.7 28.5 12.4 19.8 1.1 35-6.5 35-17.5 0-4.9-5.8-10.2-14.2-13.1-8.1-2.8-22-3.6-30.4-1.7z" onclick="window.location.href='/build.php?id=34'"><title>Building site</title></path>
</svg>
</div><div class="buildingSlot a35 g0 aid35 teuton" data-aid="35" data-gid="0" data-building-id="302995" data-name=""><a href="/build.php?id=35" class="emptyBuildingSlot"></a><img src="/img/x.gif" class="building iso teuton" alt="" /><svg width="120" height="120" viewBox="0 0 120 120" class="buildingShape iso">
	<path d="M49.4 70.4c-7.8 1.8-13.5 4.7-16.8 8.6-3.5 4.3-4.1 7.2-2.1 11.3 3.3 7.1 13.9 11.7 28.5 12.4 19.8 1.1 35-6.5 35-17.5 0-4.9-5.8-10.2-14.2-13.1-8.1-2.8-22-3.6-30.4-1.7z" onclick="window.location.href='/build.php?id=35'"><title>Building site</title></path>
</svg>
</div><div class="buildingSlot a36 g0 aid36 teuton" data-aid="36" data-gid="0" data-building-id="302996" data-name=""><a href="/build.php?id=36" class="emptyBuildingSlot"></a><img src="/img/x.gif" class="building iso teuton" alt="" /><svg width="120" height="120" viewBox="0 0 120 120" class="buildingShape iso">
	<path d="M49.4 70.4c-7.8 1.8-13.5 4.7-16.8 8.6-3.5 4.3-4.1 7.2-2.1 11.3 3.3 7.1 13.9 11.7 28.5 12.4 19.8 1.1 35-6.5 35-17.5 0-4.9-5.8-10.2-14.2-13.1-8.1-2.8-22-3.6-30.4-1.7z" onclick="window.location.href='/build.php?id=36'"><title>Building site</title></path>
</svg>
</div><div class="buildingSlot a37 g34 aid37 teuton" data-aid="37" data-gid="34" data-building-id="302997" data-name="Stonemason&#39;s Lodge"><a href="/build.php?id=37&gid=34" class="level colorLayer good aid37 teuton" title="Stonemason&amp;#39;s Lodge &lt;span class=&quot;level&quot;&gt;Level 1&lt;/span&gt;||Cost for upgrading building to level 2:&lt;br /&gt;&lt;div class=&quot;inlineIconList resourceWrapper&quot;&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r1Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;200&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r2Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;165&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r3Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;160&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r4Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;90&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class=&quot;inlineIconList resourceWrapper&quot;&gt;&lt;div class=&quot;inlineIcon duration&quot; title=&quot;&quot;&gt;&lt;i class=&quot;clock_medium&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;0:15:10&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;" data-level="1"><div class="labelLayer">1</div></a><img src="/img/x.gif" class="building g34 teuton" alt="" /><svg width="120" height="120" viewBox="0 0 120 120" class="buildingShape g34">
  <g class="hoverShape">
    <path d="M47.42 30.81l-4.34 1.08C39 48.6 34.59 64.61 25.16 70.77c0 0-7.48 4.76-8.25 10.1-.73 5 .62 11.75.21 11.73l7.5 5.86 11.29 4.35c11.37-.83 21.31.67 28.56 6.51L74.9 107c1.5 0 27.4-11.66 29-12.27s-4.61-20.29-6.3-20.63c-10.8-6-17.4-15.06-18.89-27.91-13.32-3.38-24.81-7.89-31.29-15.38z" onclick="window.location.href='/build.php?id=37&amp;gid=34'"><title>Stonemason&amp;#39;s Lodge &lt;span class="level"&gt;Level 1&lt;/span&gt;||Cost for upgrading building to level 2:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;200&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;165&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;160&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;90&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;0:15:10&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
  </g>
  <g class="highlightShape">
    <path d="M47.6 31c-.4 0-.9.7-1.2 1.5-.5 1.2-1 1.3-2 .4-.8-.6-1.4-.7-1.4-.2a3.67 3.67 0 001.1 2c.8.8.7 1.7-.4 3.4a56.63 56.63 0 00-3.7 9.4c-1.6 4.8-1.9 7-1.1 7.3.6.2 1.1 2.4 1.1 4.8 0 4-.3 4.7-3.5 6.5-1.9 1.2-3.5 2.5-3.5 3s-1.5.9-3.4.9a10.89 10.89 0 00-6 2.1c-1.4 1.1-2.6 2.5-2.6 3.1a6.07 6.07 0 01-1.6 2.9c-1 1.1-1.8 4.2-2 8.3-.4 6.2-.3 6.5 2.7 9a15.77 15.77 0 004.2 2.7A24.75 24.75 0 0028 98a11.44 11.44 0 004.7-1.6 8.58 8.58 0 013.7-1.4c.7 0 1.7-1.1 2-2.4a9.38 9.38 0 000-4.1c-.6-1.6-.5-1.6 2.3-.2 2.5 1.4 3 2.2 3.1 5.8a32.22 32.22 0 00.4 4.5c.2.1 2.2.5 4.5.9 3.5.5 4.5.3 6.3-1.5 2-2 2.2-2 5-.3 2.7 1.5 3 2.3 3 6.6 0 4.1.3 4.8 1.8 4.5 1.2-.3 1.6-1.2 1.4-3.3l-.3-3 2.1 2.3a7.14 7.14 0 004.4 2.2 7 7 0 004.2-2.1c1-1.2 5.2-3.7 9.1-5.5 6.1-2.8 7.7-3.2 9.6-2.3s3.1.7 5.7-.6 3.1-2.1 2.6-3.8a19.68 19.68 0 01-.6-3.5 1.48 1.48 0 00-1.6-1.2c-1.2 0-1.4-.7-.9-2.9.3-1.6.2-3.2-.3-3.5s-1.3-2.2-1.6-4.1-1.1-3.3-1.5-3.1-4.9-1.4-10-3.9L78 66.1v-5c0-2.9.5-5.1 1.2-5.3s.6-1.4-.7-3.5c-1.6-2.8-1.7-3.4-.4-4.9s1.2-1.6-.9-1c-1.2.4-2.2.3-2.2-.1s-4-2.2-9-3.8-9-3.2-9-3.7-.8-.8-1.9-.8a4.8 4.8 0 01-3.1-1.5 4.57 4.57 0 00-3-1.5c-1.3 0-1.7-.6-1.3-2 .3-1.1.2-2-.1-2z" onclick="window.location.href='/build.php?id=37&amp;gid=34'"><title>Stonemason&amp;#39;s Lodge &lt;span class="level"&gt;Level 1&lt;/span&gt;||Cost for upgrading building to level 2:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;200&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;165&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;160&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;90&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;0:15:10&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
    <path d="M37.1 98.6c-.6-.4-1.1-.2-1.1.4s-.4.9-.9.5a1.39 1.39 0 00-1.7.6 1.71 1.71 0 00.7 2 5.92 5.92 0 002.2.9c.5 0 .5-.5.1-1.1a1.49 1.49 0 01.6-1.9c.9-.5.9-.9.1-1.4z" onclick="window.location.href='/build.php?id=37&amp;gid=34'"><title>Stonemason&amp;#39;s Lodge &lt;span class="level"&gt;Level 1&lt;/span&gt;||Cost for upgrading building to level 2:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;200&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;165&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;160&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;90&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;0:15:10&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
  </g>
</svg>
</div><div class="buildingSlot a38 g0 aid38 teuton" data-aid="38" data-gid="0" data-building-id="302998" data-name=""><a href="/build.php?id=38" class="emptyBuildingSlot"></a><img src="/img/x.gif" class="building iso teuton" alt="" /><svg width="120" height="120" viewBox="0 0 120 120" class="buildingShape iso">
	<path d="M49.4 70.4c-7.8 1.8-13.5 4.7-16.8 8.6-3.5 4.3-4.1 7.2-2.1 11.3 3.3 7.1 13.9 11.7 28.5 12.4 19.8 1.1 35-6.5 35-17.5 0-4.9-5.8-10.2-14.2-13.1-8.1-2.8-22-3.6-30.4-1.7z" onclick="window.location.href='/build.php?id=38'"><title>Building site</title></path>
</svg>
</div><div class="buildingSlot a39 g16 aid39 teuton" data-aid="39" data-gid="16" data-building-id="302999" data-name="Rally Point"><a href="/build.php?id=39&gid=16" class="level colorLayer good aid39 teuton" title="Rally Point &lt;span class=&quot;level&quot;&gt;Level 1&lt;/span&gt;||Cost for upgrading building to level 2:&lt;br /&gt;&lt;div class=&quot;inlineIconList resourceWrapper&quot;&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r1Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;140&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r2Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;205&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r3Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;115&lt;/span&gt;&lt;/div&gt;&lt;div class=&quot;inlineIcon resources&quot; title=&quot;&quot;&gt;&lt;i class=&quot;r4Big&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;90&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class=&quot;inlineIconList resourceWrapper&quot;&gt;&lt;div class=&quot;inlineIcon duration&quot; title=&quot;&quot;&gt;&lt;i class=&quot;clock_medium&quot;&gt;&lt;/i&gt;&lt;span class=&quot;value &quot;&gt;0:12:30&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;" data-level="1"><div class="labelLayer">1</div></a><img src="/img/x.gif" class="building g16 teuton" alt="" /><svg width="125" height="160" viewBox="0 0 125 160" class="buildingShape g16">
  <g class="hoverShape">
    <path d="M52 9.5L21.31 63.09c14.93 24 22.14 50.29 22.79 79.31 1.87 6.17 4.37 11.29 9.3 12.41l7.82 3.58c9.2.27 16.44-1.88 22.31-5.7 22-13.95 27.27-23.51 29.47-32.29-1.41-23.73-1.43-45.93.67-65.78C82.93 38.54 68.22 29.06 52 9.5z" onclick="window.location.href='/build.php?id=39&amp;gid=16'"><title>Rally Point &lt;span class="level"&gt;Level 1&lt;/span&gt;||Cost for upgrading building to level 2:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;140&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;205&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;115&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;90&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;0:12:30&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
  </g>
  <g class="highlightShape">
    <path d="M52 9.5c-.4-.3-1.1 1.1-1.4 3s-1.4 3.9-2.4 4.4-1.3 1.1-.8 1.1.1 1.1-.8 2.4-1.3 3.1-1 3.9a3.46 3.46 0 01-1.1 3.1 3.94 3.94 0 00-1.2 3.6c.4 1.6 0 2-1.9 2-1.3 0-2.4.6-2.4 1.3a4.06 4.06 0 001.1 2.4 1.87 1.87 0 01.4 2.2 1.28 1.28 0 01-1.7.5c-.7-.5-.9.2-.4 2s.3 2.5-.6 2.4-1.2.5-1.1 1.7a9.82 9.82 0 01-1.5 4.7c-1.5 2.5-1.5 2.9.1 4.6a22.58 22.58 0 005.2 3.8c1.9 1 3.5 2.2 3.5 2.6s-.7.8-1.6.8a14.65 14.65 0 01-4.7-1.4 32 32 0 00-7.4-1.9c-3.2-.4-4.3-.2-4.3.9 0 .7-1.1 1.6-2.3 2-1.9.4-2.3 1.1-1.9 3a7.12 7.12 0 002.8 4.1 8.23 8.23 0 005.9 1c2.1-.4 3.8-.1 4.2.6a7.53 7.53 0 01.8 3.7c0 2 .5 2.5 2.5 2.6a34.69 34.69 0 013.8.2c.6.1 1.2 1.1 1.2 2.1a3.23 3.23 0 00.9 2.5c.5.3 1.1-.1 1.4-.9s2.9-2.6 5.7-4 5-3.2 5-4-.2-1.5-.5-1.5a30.84 30.84 0 00-4.5 2 30.84 30.84 0 01-4.5 2c-.3 0-.5-.4-.5-.8s1.1-1.4 2.5-2c2.1-1 2.4-1.7 1.9-3.7-.3-1.4-.2-2.5.2-2.6s2.4-.2 4.2-.4l3.2-.3-.6 4.9c-.5 3.4-.3 4.9.5 4.9.6 0 1.1-1.9 1.1-4.7a26.94 26.94 0 011.2-8c.7-1.8 1.5-3.3 1.9-3.3a6.2 6.2 0 002.4-1.7 31.53 31.53 0 014.9-3.4c2-1.1 3-2.3 2.8-3.5a27.66 27.66 0 01-.3-4.2c.1-1.2-.4-2.2-1-2.2s-.9-.9-.5-2.3c.3-1.2-.2-4.8-1.1-7.9l-1.7-5.7-1.8 3.7c-.9 2-1.7 3.1-1.8 2.4a1.12 1.12 0 00-1-1.2c-.5 0-1 .7-1 1.5s-.5 1.5-1.1 1.5-.9-.7-.5-1.5 0-1.5-.9-1.5-1.5-.4-1.5-.9a1.6 1.6 0 011.1-1.3c.5-.2.7-1.1.4-2.1S58.3 27 57.6 27s-1.1-1.8-1-5-.4-5.1-1.2-5.4-1.5-1.8-1.9-3.5-1-3.3-1.5-3.6zm-4.2 58c.3.3 0 1.1-.7 1.8-1 .9-1.1.8-.5-.6.3-1 .9-1.5 1.2-1.2zm-6.2 1.2a2 2 0 011.4 1.7c0 .6-1.1 1.6-2.5 2.3-2.1.9-2.5.9-2.5-.6a4.64 4.64 0 011.1-2.8 2.62 2.62 0 012.5-.6zM107.8 52c-.4 0-.9 1-.9 2.2a21.3 21.3 0 000 3.6 13.2 13.2 0 01-.8 4.5c-.5 1.8-1.2 4.5-1.5 6-.6 2.5-.8 2.6-2.3 1.2a4.6 4.6 0 00-3.7-1.3c-1.7.2-2.2 1.1-2.4 4.8-.2 2.5-.7 4.9-1.3 5.5a4.36 4.36 0 00-.9 2.7c0 1-.2 1.8-.5 1.8s-3.4-1.5-7-3.2L80 76.6l-13.5 6.7C59.1 87 53 90.3 53 90.8s6.1 3.8 13.5 7.5 14.3 6.7 15.3 6.7a5.09 5.09 0 003.1-1.3c1-1 1.1-.7.6 1.5-.4 1.7-.3 2.8.3 2.8s1.2 1 1.5 2.2c.6 2.1.7 2.1 2.6.4a12 12 0 002.7-3.9 2.32 2.32 0 00-.7-2.8c-1.1-.7-.9-1.3.8-3.1 1.2-1.2 2.4-2 2.6-1.7s.7 2.7 1.1 5.6l.6 5.1-3.5 1.2a12.28 12.28 0 00-5.2 3.3c-1 1.2-6.9 4.7-13.1 7.7S64 127.9 64 128.5s5.2 3.6 11.5 6.8L87 141l11-5.5c8.1-4.1 10.8-5.9 10.4-7-.4-.8-.1-1.5.5-1.5a1.27 1.27 0 001.1-1.4 4.42 4.42 0 011.5-2.6 4.42 4.42 0 001.5-2.6c0-.8-1.8-3.1-3.9-5.2l-3.9-3.8v-8.6c-.1-6.3.3-9 1.4-9.9a3.78 3.78 0 001.4-2.5c0-.8-.9-1.4-2-1.4s-2-.6-2-1.3a36.74 36.74 0 011.6-6.2c.8-2.8 2-7.3 2.5-10a52.36 52.36 0 001.1-9c0-2.2.2-3 .5-1.8s.9 2.3 1.4 2.3 1.4-1.2 1.9-2.6a13.21 13.21 0 001-4.2c0-.9-1.2-2.3-2.7-3a20.33 20.33 0 00-3.5-1.2zm-7.1 55.7a5.28 5.28 0 010 2.5c-.3.7-.5.2-.5-1.2s.2-1.9.5-1.3zM72 55a1 1 0 00-1 1 1.08 1.08 0 001 1 1 1 0 001-1 .94.94 0 00-1-1z" onclick="window.location.href='/build.php?id=39&amp;gid=16'"><title>Rally Point &lt;span class="level"&gt;Level 1&lt;/span&gt;||Cost for upgrading building to level 2:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;140&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;205&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;115&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;90&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;0:12:30&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
    <path d="M68.8 57a6.16 6.16 0 00-2.7.9 1.71 1.71 0 00-.7 2 3.57 3.57 0 002.7 1.1 1.77 1.77 0 001.9-2c0-1.1-.6-2-1.2-2zM64.1 133c-3.6-1.8-6.2-2.6-6.6-2a2.33 2.33 0 000 2c.3.5 2.6 1.9 5.2 3a26.27 26.27 0 005.9 2c.8 0 1.4-.4 1.4-1s-2.7-2.3-5.9-4zM53.6 135a3 3 0 00-1.6 2.2c0 .4 2.5 1.9 5.6 3.3a39.08 39.08 0 006.5 2.5c.5 0 .9-.6.9-1.3s-2.5-2.5-5.5-4-5.7-2.7-5.9-2.7zM73.6 138a2.13 2.13 0 00-.9.7 2.1 2.1 0 00-.7 1.4c0 .5 2.2 2 5 3.4s5.6 2.5 6.5 2.5a1.44 1.44 0 001.5-1.3c0-.7-2.5-2.5-5.5-4s-5.7-2.7-5.9-2.7zM50.2 141.1c-4.6-1.8-5.3-1.9-5.9-.6-.3.9-.4 1.7-.2 1.9s2.8 1.2 5.8 2.4a44.16 44.16 0 006.2 2.2c.5 0 .9-.6.9-1.4a2.85 2.85 0 00-.8-2c-.4-.2-3.2-1.4-6-2.5zM95.5 140c-.8 0-1.5.4-1.5.9s-1.5 1.1-3.2 1.3c-2.2.2-3.4.9-3.6 2-.3 1.4.3 1.8 2.8 1.8 2.3 0 3.3-.5 3.7-2 .3-1.1 1.2-2 1.9-2s1.4-.5 1.4-1-.7-1-1.5-1zM71.9 145.1a1.41 1.41 0 00-1.2.6 2.1 2.1 0 00-.7 1.4c0 .4 2.5 1.9 5.6 3.3s6.3 2.6 7.1 2.6a1 1 0 001.1-1.3c-.2-.6-2.9-2.4-5.9-3.9a42.46 42.46 0 00-6-2.7zM52.2 148a2.13 2.13 0 00-1.5.7 3.61 3.61 0 00-.7 2.4 3.75 3.75 0 002.1 2.9 6.94 6.94 0 004.5.6c1.3-.4 2.4-1.1 2.4-1.7s.5-.7 1.1-.3 1 .2.8-.5-.8-1.2-1.2-1.2a10.11 10.11 0 01-3.7-1.4 15.47 15.47 0 00-3.8-1.5zM70.1 151c-4.8-2.4-6.1-2.7-7-1.6s-.8 1.6.2 2.4a32.35 32.35 0 006.1 3.1c2.6 1.2 5.2 1.9 5.7 1.5a1.84 1.84 0 00.9-1.4c0-.6-2.7-2.3-5.9-4zM60.6 155a2.93 2.93 0 00-2.1.9 1.22 1.22 0 00.5 1.6 2.33 2.33 0 002 0 1.9 1.9 0 001-1.6c0-.5-.6-.9-1.4-.9z" onclick="window.location.href='/build.php?id=39&amp;gid=16'"><title>Rally Point &lt;span class="level"&gt;Level 1&lt;/span&gt;||Cost for upgrading building to level 2:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;140&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;205&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;115&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;90&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;0:12:30&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
  </g>
</svg>
</div><div class="buildingSlot a40 g32 bottom teuton" data-aid="40" data-gid="32" data-building-id="" data-name="Earth Wall"><a href="" class="level colorLayer good aid40 teuton" title="" data-level="1"><div class="labelLayer">1</div></a><img src="/img/x.gif" class="g32Bottom teuton" alt="" /><svg width="794" height="540" viewBox="0 0 794 540" class="buildingShape g32Bottom">
  <g class="hoverShape">
    <path d="M704 288v3.5c0 2.4-.6 3.7-2 4.5-1.6.9-2 2.1-2.1 6.8a33.68 33.68 0 01-1.2 9.2 8.66 8.66 0 01-3.9 4.8c-2.5 1.2-2.8 1.9-2.8 6a33.25 33.25 0 01-1.5 9 35 35 0 01-4.5 8 18.53 18.53 0 00-1.49 2.2l-.25-.22-32.84 37.54.41.36c-.46.43-.91.87-1.33 1.32a61.05 61.05 0 01-8.5 7c-3 2.1-6.1 4.8-6.8 6.2a9.42 9.42 0 01-4.3 3.5c-2.3.9-2.9 1.7-2.9 4.2s-.6 3.4-4 5.1a29.3 29.3 0 00-5.7 3.9 10.21 10.21 0 01-3.8 2.3 3 3 0 00-2.3 2.3c-.2 1.4-2.9 3.3-8.6 6.3-4.5 2.3-9.1 4.2-10.1 4.2a6.37 6.37 0 00-3.5 1.5c-.9.9-4.1 2.1-6.9 2.9s-6.1 1.2-7.1.9-2.4.4-3.3 1.7-3.7 2.7-7.3 3.6a51.43 51.43 0 00-10.3 4.1c-3.6 2.1-4.8 2.4-6.3 1.4a8 8 0 00-3.3-1.1c-.9 0-2 1.1-2.5 2.4-.7 2-1.9 2.6-5.7 3.2-2.6.3-8.3 2-12.7 3.6-6.4 2.5-8.2 2.8-10.2 1.9s-2.8-.7-4.9 1.3-4 2.5-12.8 3.1c-5.6.4-12.7.9-15.7 1s-8.8.8-12.8 1.4-8.3 1.6-9.4 2.2c-1.3.7-4.6.9-8.8.5-5.1-.5-6.9-.4-7.2.6-.3.8-3.6 1.6-8.9 2.1-4.6.5-13.6 1-19.9 1.2s-16.4.5-22.5.8-15.8.9-21.7 1.3c-10.6.7-10.8.7-10.8-1.5 0-1.4-.6-2.1-2-2.1a4.21 4.21 0 00-3.1 2.1c-1 1.9-1.7 2.1-7.2 1.5-3.4-.3-9.8-.6-14.2-.8-5.1-.1-8.6-.7-9.7-1.6a2.87 2.87 0 00-3.5-.4c-1.1.6-6.8.6-14.7.1-10.1-.7-13.1-1.2-14-2.5s-1.9-1.4-3.7-.8a9.82 9.82 0 01-3.4.5c-.5-.2-6.6-.7-13.5-1l-12.5-.6-.3-3.3c-.3-2.6-.7-3.2-2.8-3.2-1.9 0-2.4.5-2.4 2.4 0 1.4-.4 2.8-1 3.1a3.94 3.94 0 01-3-.5 46 46 0 00-9.5-2.5 55.05 55.05 0 01-11.8-3.7c-2.3-1.2-5.4-2.1-6.9-1.9s-4.8-.9-7.5-2.2a94.44 94.44 0 00-10.2-4.2c-2.9-.9-6.2-2.6-7.3-3.7a4.56 4.56 0 00-4-1.5c-1.1.3-4.8-.7-8.2-2.2s-7.4-3.3-8.9-3.9l-.61-.26h-.11c-.18-.07-.37-.14-.57-.2a13.63 13.63 0 00-1.43-.37L118.4 401.4c-1.8-1.9-3.7-3.4-4.2-3.4s-3.6-2.8-7-6.3-7.3-7.4-8.7-8.8-2.5-3.6-2.5-4.8a3.25 3.25 0 00-2.4-3c-1.3-.5-3.6-2.5-5.2-4.4a53.63 53.63 0 00-6.1-5.7c-2.6-1.8-3.3-3.1-3.3-5.6a18.8 18.8 0 00-.6-4.8c-.4-.9-1.8-1.6-3.4-1.6-2.4 0-3.3-.9-6.1-5.8-2.6-4.4-3.4-7.3-3.9-13-.4-4.6-1.2-7.7-2-8.2s-1.7-.7-2.1-.4-1.6-1.1-2.7-2.8c-1.3-2-2.3-6.1-2.8-10.6-.6-6.4-.9-7.3-3-7.8-1.8-.5-2.5-1.6-3.3-5.7a35.93 35.93 0 01-.9-7.2 34.67 34.67 0 00-1-7c-.6-2.8-1.4-7.1-1.7-9.7s-.1-4.9.4-5.3 1.3-2.7 1.7-5.3a47.79 47.79 0 012-7.9 26.56 26.56 0 001.4-8.8 62.76 62.76 0 012.5-14.1c1.4-4.7 2.5-9.4 2.5-9.4H33s-1.5 4-2.5 7a93.32 93.32 0 01-4.6 11.1 60 60 0 00-4 12.4c-.8 4.6-.8 7-.1 7.7s.8 2.4.5 4.2a27.15 27.15 0 00.5 7.3c.8 3.6.6 4.7-1.4 8.3-1.9 3.3-2.3 5-1.8 8.3.4 2.3 1.1 4.8 1.7 5.4s.6 2.7.3 4.5a91.19 91.19 0 00-1 10.5c-.2 4-.3 7.3-.1 7.3s1.6-.5 3.1-1c2.1-.8 2.9-.8 3.6.2a10.75 10.75 0 01.8 4.2 9.48 9.48 0 01-2.2 5.4l-2.3 2.5 2.3-.6c1.6-.4 2.5.1 3.4 1.6.7 1.2 1.1 4.4 1 7s.2 4.5.8 4.2 1.4.4 2 1.5c.9 1.7.8 2.7-.4 4.5a9.55 9.55 0 00-1.6 3.4c0 .5.8.8 1.7.7 1.4-.1 1.9 1.1 2.6 6.1.7 5.2 1.2 6.2 3.1 6.7a6 6 0 013.4 3.1 14.76 14.76 0 011.2 5.6c0 2.2.4 2.9 1.6 2.7 1-.2 2.3 1 3.5 3.1a25.16 25.16 0 002.9 4.5 7.6 7.6 0 011 4.1 9.28 9.28 0 00.8 4 11 11 0 002.7 2.1 11.14 11.14 0 013.5 4.1 29.81 29.81 0 004.5 6.1 58.42 58.42 0 015.3 6c1.2 1.7 2.2 3.9 2.2 5.1a16.89 16.89 0 001.6 5.5c1.4 2.8 2.4 3.5 5.6 4 2.2.4 3.6 1.1 3.3 1.6s.2 1 1.3 1a5.67 5.67 0 013.5 1.8 7.36 7.36 0 011.7 4.5c0 1.5.5 2.7 1 2.7a11.58 11.58 0 013.9 2.1c.26.19.52.36.78.52l.14.09c.25.15.5.28.74.4l52.28 31.65v.08c.08.15.17.29.25.42l.09.15.2.31.09.13c.1.13.19.25.28.35a5.45 5.45 0 003.7 1.8 2.42 2.42 0 01.45 0 3.11 3.11 0 01.49.11l3.11 1.89c1 1.1 4.2 3.1 7.2 4.5s5.3 3 5.3 3.5 1.5 1 3.3 1a16.57 16.57 0 016.1 1.5 13.06 13.06 0 004.5 1.5 4.37 4.37 0 012.4.6c.4.4 3 .9 5.9 1.1a37.48 37.48 0 0111.5 3.5c4.2 2 7.1 2.9 8.9 2.5 1.5-.3 6.4.1 10.8.9s9.6 2.1 11.5 3c2.8 1.3 3.7 1.4 5.7.4 1.6-.9 2.7-1 3.6-.3a12.08 12.08 0 003.6 1.8c1.6.5 3.1 0 5.3-1.9 1.7-1.4 3.4-2.6 3.9-2.6s2.1 1.1 3.7 2.4c2.2 1.9 3.1 2.1 4.5 1.3s2.2-.7 4.1 1.1c1.3 1.2 3.1 2.2 4 2.2a2.58 2.58 0 012.3 1.5 3 3 0 002.5 1.5 7.72 7.72 0 003.8-1.2c1.5-.9 2.4-.6 5.3 1.5 1.9 1.5 3.9 2.7 4.5 2.7a6.31 6.31 0 002.8-2c1.3-1.5 3.1-2 6.5-2 2.5 0 5 .4 5.5.9s3.6 1.1 6.7 1.4c4.8.5 6.2.2 8.3-1.5 2.3-1.7 3-1.9 5.5-.8s3 1.9 3 4.4c0 1.7.4 2.6.8 2.1a45.51 45.51 0 013.9-3.9c2.7-2.4 3.5-2.7 4.8-1.6.8.7 1.5 2.8 1.5 5 0 2 .3 3.9.6 4.2s1.7 0 3.2-.8a12 12 0 014.5-1.4c.9 0 3.1-1.4 4.9-3s3.9-3 4.8-3a4.71 4.71 0 013.1 1.6 3.28 3.28 0 003.6.9 6.67 6.67 0 014.9 1.2c2.2 1.4 2.7 1.4 3.5.2a9.09 9.09 0 00.9-4 5.79 5.79 0 011.5-3.9c1.2-1 2-.9 4.2.6a20 20 0 003.3 1.9 5.9 5.9 0 011.9.9c.9.6 1.74 0 2.34-1.12.5-.9 2.26-2 3.86-2.88s3.7-1.3 4.5-1a5.87 5.87 0 013.26 3 18.1 18.1 0 01.91 7.89c-.2 2.7-.43 3.58.07 2.18s2.86-2.73 6.06-4.43c3.5-2 5.8-2.7 6.5-2.1s3.5 1.1 6.3 1.2c4.2.2 5.8-.2 8.5-2.3a16.71 16.71 0 015.4-3c1.4-.2 2.62-1.76 2.2 2.4.2 1.6.8 2.8 1.3 2.8a.9.9 0 00.9-.9c0-.5 1.3-1.2 2.9-1.6a14 14 0 005.6-3.2l2.07-2.46-3-2c-2.1-1.7-1.57-2.62-.77-3.52a4.39 4.39 0 013.31-1c1.8.2 3.16.7 3.16 2.6a4.86 4.86 0 001.62 3.59c1.2.9 5 1.31 15.17 1 11.2-.3 15.2-.7 17.9-2.1a26.38 26.38 0 018.7-2.2c3-.3 5.6-.8 5.9-1.3s1.8-.9 3.3-.9a25.38 25.38 0 006.2-1.1 19.11 19.11 0 005-2.6c1.4-1.1 2-1 4.2.7a10.56 10.56 0 005.5 2c2.3 0 3.8-1 6.6-4.3l3.5-4.2 3.3 1.8a19.85 19.85 0 007.8 1.8 53.07 53.07 0 005.8 0c.7-.1 2.6-1.5 4.2-3.3 2.6-2.9 3.2-3 5.5-2a13 13 0 004.9 1.2c1.3 0 2.6-.6 2.9-1.4s2.9-1.6 6.2-2.1q5.55-.6 7.5-2.7a4 4 0 014.5-1.4c2 .5 2.7.2 3.4-1.6.5-1.3 2.9-4 5.4-6s5.2-3.8 6.1-3.8a2.06 2.06 0 011.8 1c.2.6 1.2.3 2.3-.7a10.39 10.39 0 015-2.2 6.63 6.63 0 004.3-2.2c.7-1 1.8-1.9 2.3-1.9a13.79 13.79 0 003.9-2.1c2.3-1.8 3.7-2 7-1.5 4.1.6 4.2.6 3.6-1.8a8.93 8.93 0 010-4A2.65 2.65 0 01633 450a6.07 6.07 0 003.5-2 6 6 0 012.9-2c.6-.1 2.2-1.8 3.6-3.9s8.1-9.8 15-17c8.2-8.7 13.1-13.1 14.3-12.9 1 .2 2.2-.7 3-2.2a4.37 4.37 0 013.8-2.6 11.4 11.4 0 003.8-.8 1.38 1.38 0 00.26-.23l.06-.07a2.35 2.35 0 00.19-.25l.05-.07a3.56 3.56 0 00.37-.84L709.5 365a3.93 3.93 0 001-3.9c-.4-1.2-.2-2.1.4-2.1s1.1-2.1 1.1-4.9c0-3.1.5-5.3 1.5-6.1a18.49 18.49 0 003-4.3 16.6 16.6 0 001.5-6.2c0-1.7.4-3.5 1-4.1s.6-2.4 0-4.9a47.11 47.11 0 01-1-8.6c0-2.9.6-5.1 1.5-5.9a3.51 3.51 0 013.1-.6 4.21 4.21 0 012.1 2.7c.5 1.8.9 1.3 2.4-2.6a18.55 18.55 0 001.2-9.6c-.5-3.9-.3-4.9.9-4.9a5.34 5.34 0 003.1-1.8c1-1 1.7-3.5 1.7-5.5V288z" onclick="window.location.href='/build.php?id=40&amp;gid=32'"><title>Earth Wall &lt;span class="level"&gt;Level 1&lt;/span&gt;||Cost for upgrading building to level 2:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;155&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;255&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;0&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;100&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;0:12:30&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
  </g>
  <g class="highlightShape">
    <path d="M33 224s-1.5 4-2.5 7a93.32 93.32 0 01-4.6 11.1 60 60 0 00-4 12.4c-.8 4.6-.8 7-.1 7.7s.8 2.4.5 4.2a27.15 27.15 0 00.5 7.3c.8 3.6.6 4.7-1.4 8.3-1.9 3.3-2.3 5-1.8 8.3.4 2.3 1.1 4.8 1.7 5.4s.6 2.7.3 4.5a91.19 91.19 0 00-1 10.5c-.2 4-.3 7.3-.1 7.3s1.6-.5 3.1-1c2.1-.8 2.9-.8 3.6.2a10.75 10.75 0 01.8 4.2 9.48 9.48 0 01-2.2 5.4l-2.3 2.5 2.3-.6c1.6-.4 2.5.1 3.4 1.6.7 1.2 1.1 4.4 1 7s.2 4.5.8 4.2 1.4.4 2 1.5c.9 1.7.8 2.7-.4 4.5a9.55 9.55 0 00-1.6 3.4c0 .5.8.8 1.7.7 1.4-.1 1.9 1.1 2.6 6.1.7 5.2 1.2 6.2 3.1 6.7a6 6 0 013.4 3.1 14.76 14.76 0 011.2 5.6c0 2.2.4 2.9 1.6 2.7 1-.2 2.3 1 3.5 3.1a25.16 25.16 0 002.9 4.5 7.6 7.6 0 011 4.1 9.28 9.28 0 00.8 4 11 11 0 002.7 2.1 11.14 11.14 0 013.5 4.1 29.81 29.81 0 004.5 6.1 58.42 58.42 0 015.3 6c1.2 1.7 2.2 3.9 2.2 5.1a16.89 16.89 0 001.6 5.5c1.4 2.8 2.4 3.5 5.6 4 2.2.4 3.6 1.1 3.3 1.6s.2 1 1.3 1a5.67 5.67 0 013.5 1.8 7.36 7.36 0 011.7 4.5c0 1.5.5 2.7 1 2.7a11.58 11.58 0 013.9 2.1c1.6 1.2 3.4 1.8 4 1.5s1.4 0 1.7.8c.4 1.1 1.8 1.4 5 1.2 2.4-.1 4.6-.5 5-.9s2.1.5 3.9 1.8 3.7 2.5 4.3 2.5a1.13 1.13 0 001.2-1c0-.6 1.2-1 2.8-1s4.2-1.3 6.1-2.9c2.7-2.2 3.4-3.5 3.4-6.2 0-1.9-1.4-8.1-3-13.9a107 107 0 00-4.2-12.9 29.64 29.64 0 00-4.7-5.7c-1.8-1.9-3.7-3.4-4.2-3.4s-3.6-2.8-7-6.3-7.3-7.4-8.7-8.8-2.5-3.6-2.5-4.8a3.25 3.25 0 00-2.4-3c-1.3-.5-3.6-2.5-5.2-4.4a53.63 53.63 0 00-6.1-5.7c-2.6-1.8-3.3-3.1-3.3-5.6a18.8 18.8 0 00-.6-4.8c-.4-.9-1.8-1.6-3.4-1.6-2.4 0-3.3-.9-6.1-5.8-2.6-4.4-3.4-7.3-3.9-13-.4-4.6-1.2-7.7-2-8.2s-1.7-.7-2.1-.4-1.6-1.1-2.7-2.8c-1.3-2-2.3-6.1-2.8-10.6-.6-6.4-.9-7.3-3-7.8-1.8-.5-2.5-1.6-3.3-5.7a35.93 35.93 0 01-.9-7.2 34.67 34.67 0 00-1-7c-.6-2.8-1.4-7.1-1.7-9.7s-.1-4.9.4-5.3 1.3-2.7 1.7-5.3a47.79 47.79 0 012-7.9 26.56 26.56 0 001.4-8.8 62.76 62.76 0 012.5-14.1c1.4-4.7 2.5-9.4 2.5-9.4zM704 288v3.5c0 2.4-.6 3.7-2 4.5-1.6.9-2 2.1-2.1 6.8a33.68 33.68 0 01-1.2 9.2 8.66 8.66 0 01-3.9 4.8c-2.5 1.2-2.8 1.9-2.8 6a33.25 33.25 0 01-1.5 9 35 35 0 01-4.5 8c-2.2 2.8-3.2 5.4-3.9 10.7a84.86 84.86 0 00-1 9.5 39.67 39.67 0 01-.6 5.6c-.6 2.7-.3 3.4 2.6 5.5 2.4 1.7 4.7 2.3 8.5 2.4 4.4 0 5.7-.5 8.1-2.7a13.45 13.45 0 015.5-3.3 10.85 10.85 0 004.3-2.5 3.93 3.93 0 001-3.9c-.4-1.2-.2-2.1.4-2.1s1.1-2.1 1.1-4.9c0-3.1.5-5.3 1.5-6.1a18.49 18.49 0 003-4.3 16.6 16.6 0 001.5-6.2c0-1.7.4-3.5 1-4.1s.6-2.4 0-4.9a47.11 47.11 0 01-1-8.6c0-2.9.6-5.1 1.5-5.9a3.51 3.51 0 013.1-.6 4.21 4.21 0 012.1 2.7c.5 1.8.9 1.3 2.4-2.6a18.55 18.55 0 001.2-9.6c-.5-3.9-.3-4.9.9-4.9a5.34 5.34 0 003.1-1.8c1-1 1.7-3.5 1.7-5.5V288zM661.5 376.5c-2.2-.2-4.9-.1-6 .4a21.93 21.93 0 00-5 4.1 61.05 61.05 0 01-8.5 7c-3 2.1-6.1 4.8-6.8 6.2a9.42 9.42 0 01-4.3 3.5c-2.3.9-2.9 1.7-2.9 4.2s-.6 3.4-4 5.1a29.3 29.3 0 00-5.7 3.9 10.21 10.21 0 01-3.8 2.3 3 3 0 00-2.3 2.3c-.2 1.4-2.9 3.3-8.6 6.3-4.5 2.3-9.1 4.2-10.1 4.2a6.37 6.37 0 00-3.5 1.5c-.9.9-4.1 2.1-6.9 2.9s-6.1 1.2-7.1.9-2.4.4-3.3 1.7-3.7 2.7-7.3 3.6a51.43 51.43 0 00-10.3 4.1c-3.6 2.1-4.8 2.4-6.3 1.4a8 8 0 00-3.3-1.1c-.9 0-2 1.1-2.5 2.4-.7 2-1.9 2.6-5.7 3.2-2.6.3-8.3 2-12.7 3.6-6.4 2.5-8.2 2.8-10.2 1.9s-2.8-.7-4.9 1.3-4 2.5-12.8 3.1c-5.6.4-12.7.9-15.7 1s-8.8.8-12.8 1.4-8.3 1.6-9.4 2.2c-1.3.7-4.6.9-8.8.5-5.1-.5-6.9-.4-7.2.6-.3.8-3.6 1.6-8.9 2.1-4.6.5-13.6 1-19.9 1.2s-16.4.5-22.5.8-15.8.9-21.7 1.3c-10.6.7-10.8.7-10.8-1.5 0-1.4-.6-2.1-2-2.1a4.21 4.21 0 00-3.1 2.1c-1 1.9-1.7 2.1-7.2 1.5-3.4-.3-9.8-.6-14.2-.8-5.1-.1-8.6-.7-9.7-1.6a2.87 2.87 0 00-3.5-.4c-1.1.6-6.8.6-14.7.1-10.1-.7-13.1-1.2-14-2.5s-1.9-1.4-3.7-.8a9.82 9.82 0 01-3.4.5c-.5-.2-6.6-.7-13.5-1l-12.5-.6-.3-3.3c-.3-2.6-.7-3.2-2.8-3.2-1.9 0-2.4.5-2.4 2.4 0 1.4-.4 2.8-1 3.1a3.94 3.94 0 01-3-.5 46 46 0 00-9.5-2.5 55.05 55.05 0 01-11.8-3.7c-2.3-1.2-5.4-2.1-6.9-1.9s-4.8-.9-7.5-2.2a94.44 94.44 0 00-10.2-4.2c-2.9-.9-6.2-2.6-7.3-3.7a4.56 4.56 0 00-4-1.5c-1.1.3-4.8-.7-8.2-2.2s-7.4-3.3-8.9-3.9a15 15 0 00-5.4-1.2 16 16 0 00-6.3 2.1 14.75 14.75 0 00-5.8 6.5 24.9 24.9 0 00-2.2 5.8 38.67 38.67 0 01-2.6 7.2 65.11 65.11 0 01-4.5 8.6 6 6 0 00-1.3 5.5 13.5 13.5 0 002.2 4.5 5.45 5.45 0 003.7 1.8 6.4 6.4 0 014 2c1 1.1 4.2 3.1 7.2 4.5s5.3 3 5.3 3.5 1.5 1 3.3 1a16.57 16.57 0 016.1 1.5 13.06 13.06 0 004.5 1.5 4.37 4.37 0 012.4.6c.4.4 3 .9 5.9 1.1a37.48 37.48 0 0111.5 3.5c4.2 2 7.1 2.9 8.9 2.5 1.5-.3 6.4.1 10.8.9s9.6 2.1 11.5 3c2.8 1.3 3.7 1.4 5.7.4 1.6-.9 2.7-1 3.6-.3a12.08 12.08 0 003.6 1.8c1.6.5 3.1 0 5.3-1.9 1.7-1.4 3.4-2.6 3.9-2.6s2.1 1.1 3.7 2.4c2.2 1.9 3.1 2.1 4.5 1.3s2.2-.7 4.1 1.1c1.3 1.2 3.1 2.2 4 2.2a2.58 2.58 0 012.3 1.5 3 3 0 002.5 1.5 7.72 7.72 0 003.8-1.2c1.5-.9 2.4-.6 5.3 1.5 1.9 1.5 3.9 2.7 4.5 2.7a6.31 6.31 0 002.8-2c1.3-1.5 3.1-2 6.5-2 2.5 0 5 .4 5.5.9s3.6 1.1 6.7 1.4c4.8.5 6.2.2 8.3-1.5 2.3-1.7 3-1.9 5.5-.8s3 1.9 3 4.4c0 1.7.4 2.6.8 2.1a45.51 45.51 0 013.9-3.9c2.7-2.4 3.5-2.7 4.8-1.6.8.7 1.5 2.8 1.5 5 0 2 .3 3.9.6 4.2s1.7 0 3.2-.8a12 12 0 014.5-1.4c.9 0 3.1-1.4 4.9-3s3.9-3 4.8-3a4.71 4.71 0 013.1 1.6 3.28 3.28 0 003.6.9 6.67 6.67 0 014.9 1.2c2.2 1.4 2.7 1.4 3.5.2a9.09 9.09 0 00.9-4 5.79 5.79 0 011.5-3.9c1.2-1 2-.9 4.2.6a20 20 0 003.3 1.9 5.9 5.9 0 011.9.9c.9.6 1.74 0 2.34-1.12.5-.9 2.26-2 3.86-2.88s3.7-1.3 4.5-1a5.87 5.87 0 013.26 3 18.1 18.1 0 01.91 7.89c-.2 2.7-.43 3.58.07 2.18s2.86-2.73 6.06-4.43c3.5-2 5.8-2.7 6.5-2.1s3.5 1.1 6.3 1.2c4.2.2 5.8-.2 8.5-2.3a16.71 16.71 0 015.4-3c1.4-.2 2.62-1.76 2.2 2.4.2 1.6.8 2.8 1.3 2.8a.9.9 0 00.9-.9c0-.5 1.3-1.2 2.9-1.6a14 14 0 005.6-3.2l2.07-2.46-3-2c-2.1-1.7-1.57-2.62-.77-3.52a4.39 4.39 0 013.31-1c1.8.2 3.16.7 3.16 2.6a4.86 4.86 0 001.62 3.59c1.2.9 5 1.31 15.17 1 11.2-.3 15.2-.7 17.9-2.1a26.38 26.38 0 018.7-2.2c3-.3 5.6-.8 5.9-1.3s1.8-.9 3.3-.9a25.38 25.38 0 006.2-1.1 19.11 19.11 0 005-2.6c1.4-1.1 2-1 4.2.7a10.56 10.56 0 005.5 2c2.3 0 3.8-1 6.6-4.3l3.5-4.2 3.3 1.8a19.85 19.85 0 007.8 1.8 53.07 53.07 0 005.8 0c.7-.1 2.6-1.5 4.2-3.3 2.6-2.9 3.2-3 5.5-2a13 13 0 004.9 1.2c1.3 0 2.6-.6 2.9-1.4s2.9-1.6 6.2-2.1q5.55-.6 7.5-2.7a4 4 0 014.5-1.4c2 .5 2.7.2 3.4-1.6.5-1.3 2.9-4 5.4-6s5.2-3.8 6.1-3.8a2.06 2.06 0 011.8 1c.2.6 1.2.3 2.3-.7a10.39 10.39 0 015-2.2 6.63 6.63 0 004.3-2.2c.7-1 1.8-1.9 2.3-1.9a13.79 13.79 0 003.9-2.1c2.3-1.8 3.7-2 7-1.5 4.1.6 4.2.6 3.6-1.8a8.93 8.93 0 010-4A2.65 2.65 0 01633 450a6.07 6.07 0 003.5-2 6 6 0 012.9-2c.6-.1 2.2-1.8 3.6-3.9s8.1-9.8 15-17c8.2-8.7 13.1-13.1 14.3-12.9 1 .2 2.2-.7 3-2.2a4.37 4.37 0 013.8-2.6 11.4 11.4 0 003.8-.8 3.27 3.27 0 001.1-2.5c0-.9-1.3-3-2.9-4.5s-5-6.3-7.4-10.5-5.3-8.6-6.3-9.8a9.4 9.4 0 00-5.9-2.8z" onclick="window.location.href='/build.php?id=40&amp;gid=32'"><title>Earth Wall &lt;span class="level"&gt;Level 1&lt;/span&gt;||Cost for upgrading building to level 2:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;155&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;255&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;0&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;100&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;0:12:30&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
  </g>
</svg>
</div><div class="buildingSlot a40 g32 top teuton" data-aid="40" data-gid="32" data-building-id="303000" data-name="Earth Wall"><a href="" class="level colorLayer good aid40 teuton" title="" data-level="1"><div class="labelLayer">1</div></a><img src="/img/x.gif" class="g32Top teuton" alt="" /><svg width="794" height="540" viewBox="0 0 794 540" class="buildingShape g32Top">
  <g class="hoverShape">
    <path d="M733.7 282a43 43 0 00-1.8-5.5 18.59 18.59 0 01-1.3-4 14.3 14.3 0 00-2.3-4.8 7.75 7.75 0 01-1.9-4.2c-.2-1.8.2-2.5 1.4-2.5 1.4 0 1.7-.9 1.6-4.8a20.82 20.82 0 00-.7-6.2c-.3-.8-1.5-4.7-2.6-8.7a54 54 0 01-2.1-8.8c0-.9.5-1.3 1-1s1 0 1-.7-2.3-4.2-5-7.7-5-7.4-5-8.5a6.54 6.54 0 00-1.3-3.5 46.87 46.87 0 01-3.7-7.1 81.32 81.32 0 00-4.7-9c-1.3-1.9-2.3-4.2-2.3-5.1s-3.6-5.7-8.1-10.5-9.8-11.2-11.9-13.9a146.36 146.36 0 00-12.7-13c-4.8-4.4-12.8-11.2-17.7-15s-9.7-7.8-10.7-8.8a9.55 9.55 0 00-2.5-1.7c-.4 0-2.3-1.4-4.3-3s-4-3.4-4.6-3.8a8.42 8.42 0 00-2.5-1.3l-60.3-33.2a29.21 29.21 0 00-8.7-3.6c-3-.8-9.5-2.7-14.5-4.3s-11.2-3.9-14-5.2a69.07 69.07 0 00-13-4.1c-4.4-1-9-2.1-10.3-2.6a15 15 0 00-4.5-.9c-1.2 0-4.6-1-7.7-2.1s-7.3-3-9.6-4a20.27 20.27 0 00-7.3-1.9 22.83 22.83 0 01-8.1-2.5c-4.6-2.3-6-2.5-18.8-2.5-7.6 0-14.2-.4-14.8-.9a31 31 0 00-6.3-2.5 34 34 0 00-11.5-1.5c-4.5.2-7-.2-9.6-1.6-3.1-1.7-6.1-1.9-26-2.1-12.4-.1-23.2.1-24 .6s-9.4 1.1-19 1.5c-12.6.5-19.1 1.2-23 2.5a65.57 65.57 0 01-13 2.4 111.73 111.73 0 00-13.3 2.2 87.81 87.81 0 01-9.5 1.9c-2 .2-10.1 1.8-18 3.4s-17.6 3.9-21.7 5a53.78 53.78 0 01-10 2.1c-1.3 0-2.6.4-2.9.9s-2.7 1.4-5.3 2.1-7.7 2.4-11.3 3.8-9.2 3.3-12.5 4.4a55.1 55.1 0 00-10 4.6c-2.2 1.5-4.4 3.2-5 3.7a7.45 7.45 0 00-1.3 2.5c-.2.8-57.49 31.6-57.49 31.6-1.38.53-3 1.12-4.71 1.7a156.15 156.15 0 00-15.9 6.7c-4.6 2.3-10 5.6-11.9 7.3S88.1 140 85 143s-7.1 7.5-9.1 10a95.24 95.24 0 00-6.1 9 113.61 113.61 0 01-8.5 12c-3.2 4.1-8.3 11.5-11.4 16.5s-8.1 14-11.2 20.1A133.35 133.35 0 0033 224h23s5.1-5.6 7.2-8.1 3.8-5.1 3.8-5.6 1.6-2.3 3.5-4.2 3.5-4.2 3.5-5.3 2.4-4.4 5.3-7.2a38.78 38.78 0 016.9-5.9c.9-.3 2.6-2.6 3.7-5.1 1.3-3 3-5 4.8-5.8a24.55 24.55 0 005.6-3.7c1.5-1.3 2.7-3 2.7-3.6s1.5-2.5 3.3-4.2a19.2 19.2 0 015-3.6 2.75 2.75 0 001.7-2 4.67 4.67 0 011.8-2.9 17.72 17.72 0 015.7-2.8 25 25 0 005.5-2.4 32.3 32.3 0 016-3.3 41.25 41.25 0 018.1-2.8c2.1-.3 4.2-1.2 4.9-2a5.36 5.36 0 013.5-1.5 40.33 40.33 0 005.4-.6 7.61 7.61 0 004-2.31c10.78-5.5 35.64-18.62 36.9-19.19 1.7-.7 3.3-2.1 3.5-3.1a4.26 4.26 0 011.48-1.88l1.42-.82a13.06 13.06 0 004.2-3 7 7 0 015.1-2.1c2.3 0 3.4-.5 3.8-1.9.2-1 1.9-2.6 3.7-3.5a18.88 18.88 0 017.1-1.6c2.1 0 4.1-.5 4.5-1.1s2.1-.9 4.4-.5c2.8.4 4.1.2 5.1-1a3.65 3.65 0 013.1-1.1 7.54 7.54 0 004.6-.9 13.07 13.07 0 015.1-1.4 8 8 0 004.4-1.7c1.3-1.2 3.8-1.9 8-2a95.94 95.94 0 0010.5-.9c2.3-.3 4.5-1 4.8-1.5s2-.9 3.7-.9a14.62 14.62 0 005.9-1.4c1.8-1 5.3-1.3 10.7-1.2 4.5.2 8.4.6 8.8.9a2.74 2.74 0 001.9.7c.8 0 4.3-1.4 7.9-3 5.9-2.7 7.5-3 16.8-3 6.1 0 10.7.4 11.4 1.1s1.7.7 3.4-.2c1.5-.8 8.9-1.6 19.8-2 9.9-.4 18.2-.4 19.1.1a18.49 18.49 0 005.4 1.3 14.14 14.14 0 014 .8c.3.3 5.1.1 10.8-.3 6.4-.5 11.4-.4 13.2.2a19.55 19.55 0 005.7 1c1.6 0 3 .6 3 1.2a8.07 8.07 0 010 2.2c-.1.5 1 .5 2.6 0s9.5-.8 17.6-.9c11 0 15 .3 15.6 1.3.4.7 2.1 1.2 3.7 1.1s6.1.8 10 1.9a50 50 0 0010 2.2 18.8 18.8 0 016.9 2 21.87 21.87 0 009.2 2c2.8 0 5.4.4 5.7.9a9.09 9.09 0 004 1.4c1.8.3 7.1 2.4 11.7 4.7s11.4 5.8 15.1 7.8 7.7 4.5 9.1 5.5a6.08 6.08 0 002.32 1.12l58.16 28a1.36 1.36 0 001.22.58 4.57 4.57 0 013 1.5 4.31 4.31 0 002.4 1.5c.7 0 2.5 1.4 4.2 3.1a23.26 23.26 0 006.2 4.5 14.57 14.57 0 015.2 3.6 9.49 9.49 0 012 4.4c0 1.7.8 2.3 3.4 2.8a11.17 11.17 0 004.8.1 3.15 3.15 0 013 1.2 8.2 8.2 0 011.9 3.7c.3 1.4 1.8 2.3 5.3 3.2a19.3 19.3 0 018.2 4.5c1.9 1.8 3.4 3.9 3.4 4.7s1.7 3.2 3.8 5.2a64.44 64.44 0 017 8.8c1.7 2.9 3.2 6 3.2 7.1a4.8 4.8 0 001.5 3.1 5.1 5.1 0 011.5 3.4c0 1.2 1.4 3.5 3 5.1 2 1.9 3 3.9 3 5.8s1.2 4.5 3.5 7.3a34.28 34.28 0 014.5 6.9 22.23 22.23 0 011 6.1c0 2 1.2 6.5 2.6 10.1a40.22 40.22 0 012.9 10.7 29.47 29.47 0 001 5.9c.4 1 .4 4.5.1 7.8S704 288 704 288h30a22.94 22.94 0 00-.3-6z" onclick="window.location.href='/build.php?id=40&amp;gid=32'"><title>Earth Wall &lt;span class="level"&gt;Level 1&lt;/span&gt;||Cost for upgrading building to level 2:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;155&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;255&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;0&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;100&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;0:12:30&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
  </g>
  <g class="highlightShape">
    <path d="M384 43.4c-12.4-.1-23.2.1-24 .6s-9.4 1.1-19 1.5c-12.6.5-19.1 1.2-23 2.5a65.57 65.57 0 01-13 2.4 111.73 111.73 0 00-13.3 2.2 87.81 87.81 0 01-9.5 1.9c-2 .2-10.1 1.8-18 3.4s-17.6 3.9-21.7 5a53.78 53.78 0 01-10 2.1c-1.3 0-2.6.4-2.9.9s-2.7 1.4-5.3 2.1-7.7 2.4-11.3 3.8-9.2 3.3-12.5 4.4a55.1 55.1 0 00-10 4.6c-2.2 1.5-4.4 3.2-5 3.7a7.45 7.45 0 00-1.3 2.5 5.65 5.65 0 01-1.6 2.5 6.83 6.83 0 00-1.9 3.5c-.4 1.4-3 4.9-5.8 7.9-3.3 3.6-4.9 6.1-4.6 7.3.3 1 .1 2.1-.5 2.4s-1.4 0-1.9-.7-1-1.1-1.2-.9 0 2.1.7 4c.9 2.8 1.7 3.6 4.1 3.8a10.11 10.11 0 014.7 1.9c1.1 1 4.4 1.8 8.7 2.1q6.9.45 9.9-.9c1.7-.7 3.3-2.1 3.5-3.1a5.17 5.17 0 012.9-2.7 13.06 13.06 0 004.2-3 7 7 0 015.1-2.1c2.3 0 3.4-.5 3.8-1.9.2-1 1.9-2.6 3.7-3.5a18.88 18.88 0 017.1-1.6c2.1 0 4.1-.5 4.5-1.1s2.1-.9 4.4-.5c2.8.4 4.1.2 5.1-1a3.65 3.65 0 013.1-1.1 7.54 7.54 0 004.6-.9 13.07 13.07 0 015.1-1.4 8 8 0 004.4-1.7c1.3-1.2 3.8-1.9 8-2a95.94 95.94 0 0010.5-.9c2.3-.3 4.5-1 4.8-1.5s2-.9 3.7-.9a14.62 14.62 0 005.9-1.4c1.8-1 5.3-1.3 10.7-1.2 4.5.2 8.4.6 8.8.9a2.74 2.74 0 001.9.7c.8 0 4.3-1.4 7.9-3 5.9-2.7 7.5-3 16.8-3 6.1 0 10.7.4 11.4 1.1s1.7.7 3.4-.2c1.5-.8 8.9-1.6 19.8-2 9.9-.4 18.2-.4 19.1.1a18.49 18.49 0 005.4 1.3 14.14 14.14 0 014 .8c.3.3 5.1.1 10.8-.3 6.4-.5 11.4-.4 13.2.2a19.55 19.55 0 005.7 1c1.6 0 3 .6 3 1.2a8.07 8.07 0 010 2.2c-.1.5 1 .5 2.6 0s9.5-.8 17.6-.9c11 0 15 .3 15.6 1.3.4.7 2.1 1.2 3.7 1.1s6.1.8 10 1.9a50 50 0 0010 2.2 18.8 18.8 0 016.9 2 21.87 21.87 0 009.2 2c2.8 0 5.4.4 5.7.9a9.09 9.09 0 004 1.4c1.8.3 7.1 2.4 11.7 4.7s11.4 5.8 15.1 7.8 7.7 4.5 9.1 5.5c2.1 1.5 3.3 1.6 10 .7a36 36 0 0013.2-4.3c3.1-1.7 5.5-3.8 5.5-4.7s-1.7-4.5-3.9-8.1-4.2-7.9-4.6-9.7a10.07 10.07 0 00-3.8-5.5 29.21 29.21 0 00-8.7-3.6c-3-.8-9.5-2.7-14.5-4.3s-11.2-3.9-14-5.2a69.07 69.07 0 00-13-4.1c-4.4-1-9-2.1-10.3-2.6a15 15 0 00-4.5-.9c-1.2 0-4.6-1-7.7-2.1s-7.3-3-9.6-4a20.27 20.27 0 00-7.3-1.9 22.83 22.83 0 01-8.1-2.5c-4.6-2.3-6-2.5-18.8-2.5-7.6 0-14.2-.4-14.8-.9a31 31 0 00-6.3-2.5 34 34 0 00-11.5-1.5c-4.5.2-7-.2-9.6-1.6-3.1-1.7-6.1-1.9-26-2.1zM136.8 116c-3 0-5.8.4-6.3.9s-4.4 2-8.5 3.4a156.15 156.15 0 00-15.9 6.7c-4.6 2.3-10 5.6-11.9 7.3S88.1 140 85 143s-7.1 7.5-9.1 10a95.24 95.24 0 00-6.1 9 113.61 113.61 0 01-8.5 12c-3.2 4.1-8.3 11.5-11.4 16.5s-8.1 14-11.2 20.1A133.35 133.35 0 0033 224h23s5.1-5.6 7.2-8.1 3.8-5.1 3.8-5.6 1.6-2.3 3.5-4.2 3.5-4.2 3.5-5.3 2.4-4.4 5.3-7.2a38.78 38.78 0 016.9-5.9c.9-.3 2.6-2.6 3.7-5.1 1.3-3 3-5 4.8-5.8a24.55 24.55 0 005.6-3.7c1.5-1.3 2.7-3 2.7-3.6s1.5-2.5 3.3-4.2a19.2 19.2 0 015-3.6 2.75 2.75 0 001.7-2 4.67 4.67 0 011.8-2.9 17.72 17.72 0 015.7-2.8 25 25 0 005.5-2.4 32.3 32.3 0 016-3.3 41.25 41.25 0 018.1-2.8c2.1-.3 4.2-1.2 4.9-2a5.36 5.36 0 013.5-1.5 40.33 40.33 0 005.4-.6c1.7-.4 3.6-1.5 4.2-2.6.8-1.4.6-2.6-.8-4.8-1-1.5-3.5-5.3-5.6-8.4a42.15 42.15 0 00-6.7-7.6c-2-1.4-4.4-2-8.2-2zM629 118.9c-.8-.3-3.5-.2-5.9.3a14.24 14.24 0 00-7.2 3.4 59.85 59.85 0 00-6.4 8.5c-2.6 4.2-3.4 6.3-2.7 7.5a10.53 10.53 0 003.3 2.8 3.58 3.58 0 012.3 3.4c0 1.4.5 2.2 1.6 2.2a4.57 4.57 0 013 1.5 4.31 4.31 0 002.4 1.5c.7 0 2.5 1.4 4.2 3.1a23.26 23.26 0 006.2 4.5 14.57 14.57 0 015.2 3.6 9.49 9.49 0 012 4.4c0 1.7.8 2.3 3.4 2.8a11.17 11.17 0 004.8.1 3.15 3.15 0 013 1.2 8.2 8.2 0 011.9 3.7c.3 1.4 1.8 2.3 5.3 3.2a19.3 19.3 0 018.2 4.5c1.9 1.8 3.4 3.9 3.4 4.7s1.7 3.2 3.8 5.2a64.44 64.44 0 017 8.8c1.7 2.9 3.2 6 3.2 7.1a4.8 4.8 0 001.5 3.1 5.1 5.1 0 011.5 3.4c0 1.2 1.4 3.5 3 5.1 2 1.9 3 3.9 3 5.8s1.2 4.5 3.5 7.3a34.28 34.28 0 014.5 6.9 22.23 22.23 0 011 6.1c0 2 1.2 6.5 2.6 10.1a40.22 40.22 0 012.9 10.7 29.47 29.47 0 001 5.9c.4 1 .4 4.5.1 7.8S704 288 704 288h30a22.94 22.94 0 00-.3-6 43 43 0 00-1.8-5.5 18.59 18.59 0 01-1.3-4 14.3 14.3 0 00-2.3-4.8 7.75 7.75 0 01-1.9-4.2c-.2-1.8.2-2.5 1.4-2.5 1.4 0 1.7-.9 1.6-4.8a20.82 20.82 0 00-.7-6.2c-.3-.8-1.5-4.7-2.6-8.7a54 54 0 01-2.1-8.8c0-.9.5-1.3 1-1s1 0 1-.7-2.3-4.2-5-7.7-5-7.4-5-8.5a6.54 6.54 0 00-1.3-3.5 46.87 46.87 0 01-3.7-7.1 81.32 81.32 0 00-4.7-9c-1.3-1.9-2.3-4.2-2.3-5.1s-3.6-5.7-8.1-10.5-9.8-11.2-11.9-13.9a146.36 146.36 0 00-12.7-13c-4.8-4.4-12.8-11.2-17.7-15s-9.7-7.8-10.7-8.8a9.55 9.55 0 00-2.5-1.7c-.4 0-2.3-1.4-4.3-3s-4-3.4-4.6-3.8a8.42 8.42 0 00-2.5-1.3z" onclick="window.location.href='/build.php?id=40&amp;gid=32'"><title>Earth Wall &lt;span class="level"&gt;Level 1&lt;/span&gt;||Cost for upgrading building to level 2:&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r1Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;155&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r2Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;255&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r3Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;0&lt;/span&gt;&lt;/div&gt;&lt;div class="inlineIcon resources" title=""&gt;&lt;i class="r4Big"&gt;&lt;/i&gt;&lt;span class="value "&gt;100&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;&lt;br /&gt;&lt;div class="inlineIconList resourceWrapper"&gt;&lt;div class="inlineIcon duration" title=""&gt;&lt;i class="clock_medium"&gt;&lt;/i&gt;&lt;span class="value "&gt;0:12:30&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;</title></path>
  </g>
</svg>
</div>            </div>
    </div>
<script type="text/javascript">
    jQuery(function () {
        Travian.Game.Village.initializeWallStates();        Travian.Translation.add('gid15.rearrangeBuildings_step2','Now select the new position of the building: [NAME] (Level [LEVEL])');
        Travian.Translation.add('gid15.rearrangeBuildings_dragAndDrop','Now drag and drop the building [NAME] (level [LEVEL]) to its new position.');
        Travian.Translation.add('gid15.rearrangeToContinue','<span class=\"notice\">Rearrange a building to continue.<\/span>');
        Travian.Translation.add('gid15.rearrangeBuildings','Rearrange buildings');
        Travian.Translation.add('allgemein.onUnloadMessage', 'You have made changes. Do you really want to leave this page?')
    });
    rearrangeBuildingsSuccessHandler = function() {
        window.location.href = '/dorf2.php';
    };
</script>
                    				</div>

				<div id="sidebarAfterContent" class="sidebar afterContent">
                    <div class="sidebarBoxWrapper">
                        <div id="villageBoxes" class="contentV2">
    <div id="sidebarBoxActiveVillage" class="sidebarBox  expanded">
	<div class="header">
		<div class="buttonsWrapper quickLinks">
            <div class="quickLinkSlot">
                            <div class="slot"></div>
                    </div>
            <div class="quickLinkSlot">
                                            <a id="button69b3f63df17d6"
   	class="layoutButton buttonFramed withIcon round activeVillageMarketplaceSendResources gold  quickLink MarketplaceSendResources  "
	title=""
        	        	>
					<svg viewBox="0 0 250 213" class="activeVillageMarketplaceSendResources"><g class="outline">
    <path d="M23.5 108.2c-1.7.5-8.5-.3-5.1-7.2-1-3.6 1.2-6.6 4.3-6.1 1.4-6 1.1-10.5 11.5-9.1.8-2.2 8.9-4.3 13.9-.3h2.4c-.8-1-14.3-22.6-24.1-17-2.6 4.2-5.3.1-8.8-.4 0 0-1.1 10.7-7.7 5.2-9.2.9-14.2-4.4-5-10.7 0 0-2.8-7.9 6.7-5.6.5-12.1 4.5-17.9 16.8-11.8 7.4-13.8 46.5 28.9 49.9 31.2-3.4-5.4-18.4-30.6-27.4-34.1-3.9-1-17.4-4.1-10.6-10.7-1.4-1.7-1.4-3.1 1.1-2.6 2.5.4 5.1 3.1 5.1 3.1l13.3 8.3-9.7-12.9s-3.5-1.5-4.5-1.9c-1-.4-1.6-3.9 2.4-4.5 4-.6 10.8 2.2 10.8 2.2s-3.9-6.7-4.5-6.7-4.5-5.3 2-5.5c-.9-14.7 11.4 3 11.4 3.6 0 0-1.6-9.2.8-11.4C77.6-8.4 85 14.3 86 18.8c4.7 3 5.7 10.9 6.3 14.9l5.3 8.1-2.8-15.5c-8.4-14.6-6.4-36 12.1-15.1.3-6.3 6.6-4.4 8.6-1.2l2.8 8.9s1.8-8.5 4.3-9.8 4.9-.8 5.3 3.3c4.5-2 7.3-2.2 8.7 1.2 14.1 6.3.6 18.2-2.5 26.9-.8 1.8-3.3 12.4-3.3 12.4L146 35.7s-.8-6.3 7.5-5.3c3.1-5.3 8.1-13.8 15.3-7.9 6.5-3.3 12.8-5.3 14.8 1.4 7.1.4 12.2.2 12.4 10.4 7.1 8.3 6.1 16-3 11.2-3.1 2-5.3 1.8-6.7-.8-1.8 4.5-8.5 12.8-13.4 5.5-2 1.4-27.5 17.3-31.1 35.1 15.9-14.2 27.9-28.3 41.4-25.9 7.3-4.2 11.2-6.7 16.5-1.2 4.3-.2 5.9 4.1 5.7 5.9 5.9-1 10.4-1 10.8 4.1.8 8.6-1.3 17.2-7.7 9.8 0 0-7.9 4.5-9.2-2.8-4.7 3.1-11.4 6.3-14.6 1.6-2.6 1.8-8.1 6.1-11 12.6-26.8 7.5-105.6 30.9-105.6 30.9l-5.6-5s-4.2 8-9.9 0c-1.7 0-3.8 0-5.1 3.2-12.9.9.6-12.3 4.2-11 0 0-1.8-4.3 4.7-4.2-12-13.9-24.7-2.2-32.9 4.9Zm151.6 5.7c7.6-1.3 35.5 21.8 42 25.1l10.8-2.5c-14.6-7.6-24.2-35.1-17.3-49.7-13.9 3.6-97.8 25.5-98.4 25.7l39.8 11.4v13.8h6.1c-1.5-11.5 4.5-23.7 16.9-23.7ZM37.2 138.2l86.6 25.3c-.2-4.4-.1-21.4-.1-26.1h20.5v-8.2l-42.9-9.1s-63.1 18.1-64 18.1Zm-7.9 11v29.9c10.9 4 70.7 27.2 80.6 29.6l13.8-10.1v-28.9s-88.1-25.4-90.2-26.8l-4.2 6.4Zm194.4-66.9c-19.3 6.8-1.1 56.8 18.1 49.6 19.2-6.9 1-56.7-18.1-49.6Zm-1.1 81.8c-7.1-4.8-16.3-11.2-23.5-15.9-22.2-13.6-27.1-26.6-25.7 9.5h-28.6v32h28.6v18.8c0 3.6 3.4 5.8 6.1 4 12.7-8.6 38.4-26.1 51.2-34.7 6.7-5.6-4.4-10.9-8.2-13.6Z"></path>
</g><g class="icon">
    <path d="M23.5 108.2c-1.7.5-8.5-.3-5.1-7.2-1-3.6 1.2-6.6 4.3-6.1 1.4-6 1.1-10.5 11.5-9.1.8-2.2 8.9-4.3 13.9-.3h2.4c-.8-1-14.3-22.6-24.1-17-2.6 4.2-5.3.1-8.8-.4 0 0-1.1 10.7-7.7 5.2-9.2.9-14.2-4.4-5-10.7 0 0-2.8-7.9 6.7-5.6.5-12.1 4.5-17.9 16.8-11.8 7.4-13.8 46.5 28.9 49.9 31.2-3.4-5.4-18.4-30.6-27.4-34.1-3.9-1-17.4-4.1-10.6-10.7-1.4-1.7-1.4-3.1 1.1-2.6 2.5.4 5.1 3.1 5.1 3.1l13.3 8.3-9.7-12.9s-3.5-1.5-4.5-1.9c-1-.4-1.6-3.9 2.4-4.5 4-.6 10.8 2.2 10.8 2.2s-3.9-6.7-4.5-6.7-4.5-5.3 2-5.5c-.9-14.7 11.4 3 11.4 3.6 0 0-1.6-9.2.8-11.4C77.6-8.4 85 14.3 86 18.8c4.7 3 5.7 10.9 6.3 14.9l5.3 8.1-2.8-15.5c-8.4-14.6-6.4-36 12.1-15.1.3-6.3 6.6-4.4 8.6-1.2l2.8 8.9s1.8-8.5 4.3-9.8 4.9-.8 5.3 3.3c4.5-2 7.3-2.2 8.7 1.2 14.1 6.3.6 18.2-2.5 26.9-.8 1.8-3.3 12.4-3.3 12.4L146 35.7s-.8-6.3 7.5-5.3c3.1-5.3 8.1-13.8 15.3-7.9 6.5-3.3 12.8-5.3 14.8 1.4 7.1.4 12.2.2 12.4 10.4 7.1 8.3 6.1 16-3 11.2-3.1 2-5.3 1.8-6.7-.8-1.8 4.5-8.5 12.8-13.4 5.5-2 1.4-27.5 17.3-31.1 35.1 15.9-14.2 27.9-28.3 41.4-25.9 7.3-4.2 11.2-6.7 16.5-1.2 4.3-.2 5.9 4.1 5.7 5.9 5.9-1 10.4-1 10.8 4.1.8 8.6-1.3 17.2-7.7 9.8 0 0-7.9 4.5-9.2-2.8-4.7 3.1-11.4 6.3-14.6 1.6-2.6 1.8-8.1 6.1-11 12.6-26.8 7.5-105.6 30.9-105.6 30.9l-5.6-5s-4.2 8-9.9 0c-1.7 0-3.8 0-5.1 3.2-12.9.9.6-12.3 4.2-11 0 0-1.8-4.3 4.7-4.2-12-13.9-24.7-2.2-32.9 4.9Zm151.6 5.7c7.6-1.3 35.5 21.8 42 25.1l10.8-2.5c-14.6-7.6-24.2-35.1-17.3-49.7-13.9 3.6-97.8 25.5-98.4 25.7l39.8 11.4v13.8h6.1c-1.5-11.5 4.5-23.7 16.9-23.7ZM37.2 138.2l86.6 25.3c-.2-4.4-.1-21.4-.1-26.1h20.5v-8.2l-42.9-9.1s-63.1 18.1-64 18.1Zm-7.9 11v29.9c10.9 4 70.7 27.2 80.6 29.6l13.8-10.1v-28.9s-88.1-25.4-90.2-26.8l-4.2 6.4Zm194.4-66.9c-19.3 6.8-1.1 56.8 18.1 49.6 19.2-6.9 1-56.7-18.1-49.6Zm-1.1 81.8c-7.1-4.8-16.3-11.2-23.5-15.9-22.2-13.6-27.1-26.6-25.7 9.5h-28.6v32h28.6v18.8c0 3.6 3.4 5.8 6.1 4 12.7-8.6 38.4-26.1 51.2-34.7 6.7-5.6-4.4-10.9-8.2-13.6Z"></path>
</g></svg>
		</a>

<script type="text/javascript">
	jQuery('#button69b3f63df17d6').click(function (event) {
		jQuery(window).trigger('buttonClicked', [event.delegateTarget, {"type":"gold","loadTooltip":null,"boxId":"","disabled":false,"attention":false,"colorBlind":false,"class":"quickLink MarketplaceSendResources","id":"button69b3f63df17d6","redirectUrl":"","redirectUrlExternal":"","svg":"sideBar\/quickLinks\/quickLinkMarketplaceSendResources.svg","content":""}]);
	});
</script>
                    </div>
            <div class="quickLinkSlot">
                                            <a id="button69b3f63df189c"
   	class="layoutButton buttonFramed withIcon round activeVillageBarracksManagement gold  quickLink BarracksManagement  "
	title=""
        	        	>
					<svg viewBox="0 0 184.6 200" class="activeVillageBarracksManagement"><g class="outline">
    <path d="m138.6 172.6 3.8 3.2s-12.3 8.4-20.5 7c-8.1-1.5-16.2-23-16.2-23.3-.5-7.8-7-13.8-14.8-13.8s-14.8 6.6-14.8 14.8 1.1 6.5 3 9c2.6 3.5 6.7 5.7 11.3 5.9-34.5 25.8-75.6 24.7-75.6 24.7l28.4-65.6 8.8 5.2 30-25.1-18.8-13.9s-14.8 2.7-28.2 12.4c-2.1 4.8-9.6 27.4-9.6 27.4L12 146.9l11-40.6 1.6-5.9c7-20.9 26.7-36.1 50-36.1s52.7 23.6 52.7 52.7-.8 11.3-2.6 16.4c-1.6 11.4-1.5 29.8 13.9 39.2Zm18-63.1 27.3-3.4c-2-19.5-8.2-37.8-18-53.6l-36.8 14.9 28.3-27C146.1 26.5 131.8 15.3 115 8.3L94.5 42.5l8-38.6c-.6-.2-1.3-.4-1.9-.5C87.5 0 74.2-.8 61.4.8l4.2 30.8L51 2.5c-16.9-.4-33.3 4.2-51 9l39.3 45.1c10.4-1.4 35-10.3 45.6-7.6 46.3 12.1 64.7 54.6 54.1 105.1 13.7 11.7 0 0 31.2 31.5 8.8-26.3 4.8-11.8 10-31.5 2.8-11 4.3-22 4.4-32.8l-28-11.7Z"></path>
</g><g class="icon">
    <path d="m138.6 172.6 3.8 3.2s-12.3 8.4-20.5 7c-8.1-1.5-16.2-23-16.2-23.3-.5-7.8-7-13.8-14.8-13.8s-14.8 6.6-14.8 14.8 1.1 6.5 3 9c2.6 3.5 6.7 5.7 11.3 5.9-34.5 25.8-75.6 24.7-75.6 24.7l28.4-65.6 8.8 5.2 30-25.1-18.8-13.9s-14.8 2.7-28.2 12.4c-2.1 4.8-9.6 27.4-9.6 27.4L12 146.9l11-40.6 1.6-5.9c7-20.9 26.7-36.1 50-36.1s52.7 23.6 52.7 52.7-.8 11.3-2.6 16.4c-1.6 11.4-1.5 29.8 13.9 39.2Zm18-63.1 27.3-3.4c-2-19.5-8.2-37.8-18-53.6l-36.8 14.9 28.3-27C146.1 26.5 131.8 15.3 115 8.3L94.5 42.5l8-38.6c-.6-.2-1.3-.4-1.9-.5C87.5 0 74.2-.8 61.4.8l4.2 30.8L51 2.5c-16.9-.4-33.3 4.2-51 9l39.3 45.1c10.4-1.4 35-10.3 45.6-7.6 46.3 12.1 64.7 54.6 54.1 105.1 13.7 11.7 0 0 31.2 31.5 8.8-26.3 4.8-11.8 10-31.5 2.8-11 4.3-22 4.4-32.8l-28-11.7Z"></path>
</g></svg>
		</a>

<script type="text/javascript">
	jQuery('#button69b3f63df189c').click(function (event) {
		jQuery(window).trigger('buttonClicked', [event.delegateTarget, {"type":"gold","loadTooltip":null,"boxId":"","disabled":false,"attention":false,"colorBlind":false,"class":"quickLink BarracksManagement","id":"button69b3f63df189c","redirectUrl":"","redirectUrlExternal":"","svg":"sideBar\/quickLinks\/quickLinkBarracksManagement.svg","content":""}]);
	});
</script>
                    </div>
            <div class="quickLinkSlot">
                                            <a id="button69b3f63df1919"
   	class="layoutButton buttonFramed withIcon round activeVillageStableManagement gold disabled quickLink StableManagement  "
	title=""
        	            onclick="event.preventDefault();"
        	>
					<svg viewBox="0 0 237.1 250" class="activeVillageStableManagement"><g class="outline">
    <path d="M218.3 128.8c7.5 2.5 13.7 6.2 18.7 10-12.5-19.8-38.6-60.7-65-68.7 3.7 0 17.5-1.2 20 0-11.2-6.2-13.7-11.2-70-31.2q-8.7-2.5-18.7-6.2C102.2 28 86.5-2.1 69.7.1c1.6 5.7 3 37.8 3.7 41.2 0 0-1.2 0-2.5 1.2-4.6-.8-22.1-12.5-26.2-15 0 0 1.2 23.7 10 31.2-5 5-8.7 10-11.2 8.7-17.6 6.4-11.1 19.4-11.2 32.5-8.9 17.5-13.7 40.2-25 56.2-8.2 2.3-10 13.8-2.5 18.7 2.7 14.1 15 22.5 28.7 21.2 11.2-1.2 18.7-10 21.2-21.2 40.4-10.2 83.1-45.4 35-73.7 79.9 8.7-5 136.2-6.2 141.2 17.5 10 28.7 8.7 63.7 3.7 18.7-7.5 45-30 60-37.5 10.9-24.1 21.2-53.4 11.2-79.9Zm-158.6-30c-2.5 1.2-5 2.5-6.2 2.5-6.2 0-10 3.7-10-1.2s2.5-17.5 8.7-17.5c14.4-2.2 18.5 6.7 7.5 16.2Zm139.9 102.4c-6.2-94.9-81.2-138.7-86.2-141.2 6.2 1.2 103.7 28.7 86.2 141.2Z"></path>
</g><g class="icon">
    <path d="M218.3 128.8c7.5 2.5 13.7 6.2 18.7 10-12.5-19.8-38.6-60.7-65-68.7 3.7 0 17.5-1.2 20 0-11.2-6.2-13.7-11.2-70-31.2q-8.7-2.5-18.7-6.2C102.2 28 86.5-2.1 69.7.1c1.6 5.7 3 37.8 3.7 41.2 0 0-1.2 0-2.5 1.2-4.6-.8-22.1-12.5-26.2-15 0 0 1.2 23.7 10 31.2-5 5-8.7 10-11.2 8.7-17.6 6.4-11.1 19.4-11.2 32.5-8.9 17.5-13.7 40.2-25 56.2-8.2 2.3-10 13.8-2.5 18.7 2.7 14.1 15 22.5 28.7 21.2 11.2-1.2 18.7-10 21.2-21.2 40.4-10.2 83.1-45.4 35-73.7 79.9 8.7-5 136.2-6.2 141.2 17.5 10 28.7 8.7 63.7 3.7 18.7-7.5 45-30 60-37.5 10.9-24.1 21.2-53.4 11.2-79.9Zm-158.6-30c-2.5 1.2-5 2.5-6.2 2.5-6.2 0-10 3.7-10-1.2s2.5-17.5 8.7-17.5c14.4-2.2 18.5 6.7 7.5 16.2Zm139.9 102.4c-6.2-94.9-81.2-138.7-86.2-141.2 6.2 1.2 103.7 28.7 86.2 141.2Z"></path>
</g></svg>
		</a>

<script type="text/javascript">
	jQuery('#button69b3f63df1919').click(function (event) {
		jQuery(window).trigger('buttonClicked', [event.delegateTarget, {"type":"gold","loadTooltip":null,"boxId":"","disabled":true,"attention":false,"colorBlind":false,"class":"quickLink StableManagement","id":"button69b3f63df1919","redirectUrl":"","redirectUrlExternal":"","svg":"sideBar\/quickLinks\/quickLinkStableManagement.svg","content":"","onclick":"event.preventDefault();"}]);
	});
</script>
                    </div>
            <div class="quickLinkSlot">
                                            <a id="button69b3f63df198a"
   	class="layoutButton buttonFramed withIcon round activeVillageWorkshopManagement gold disabled quickLink WorkshopManagement  "
	title=""
        	            onclick="event.preventDefault();"
        	>
					<svg viewBox="0 0 250 227.9" class="activeVillageWorkshopManagement"><g class="outline">
    <path d="M110.6 205.5c11 14.3-14.8 31.9-23.6 16.2l-6.1-9.4 1.4-1.6 18.5-20.2 9.8 15Zm-61.7-55.4c4.3-4.7 23.7-26 27.6-30.2l.5-23.8 15.3 6.4 18.2-20-21.1-8.7C110.1 39.1 77.6-9 37.2 1.5l22.2 36.1L57 52.5l-9.9 6.2L32.2 55 9.8 18.8c-24.6 31.2.1 80.3 41.1 78.3l-2 52.9Zm115.9-28c-1 1.1-19.8 20.3-20 20.9l18.1 27.8c3.9 6.8 14.3 9 19.9 2.4 6.2-3.7 8.7-12.5 3.6-18.6l-21.6-32.5Zm70.1-58.9-38.3-.6 7.7-8.7c6.3-8.8 1.5-18.3-7.1-23.7-10.8-9-20.2 1.9-26.7 9.8 1.6-42.8 1.1-29.5-39.1-32.2-4.3-.1-7.5 3.1-7.6 7.3l-.4 32c-.1 4.3 3.1 7.5 7.3 7.6l26 .3L126 88.8c-22.8 25.4-50.1 55-73 80.4l-27.5 30.2c-7.7 9.1-.8 18.7 7.1 23.8 14.9 13.2 29-15.3 37.6-23.1l1.6-1.7L90.4 178c27.3-30.1 68.3-72.2 94.8-102.8l-.6 37.7c-.2 9.6 8.6 16.1 17.8 15 42.1 2.7 64.1-61.6 32.4-64.8Z"></path>
</g><g class="icon">
    <path d="M110.6 205.5c11 14.3-14.8 31.9-23.6 16.2l-6.1-9.4 1.4-1.6 18.5-20.2 9.8 15Zm-61.7-55.4c4.3-4.7 23.7-26 27.6-30.2l.5-23.8 15.3 6.4 18.2-20-21.1-8.7C110.1 39.1 77.6-9 37.2 1.5l22.2 36.1L57 52.5l-9.9 6.2L32.2 55 9.8 18.8c-24.6 31.2.1 80.3 41.1 78.3l-2 52.9Zm115.9-28c-1 1.1-19.8 20.3-20 20.9l18.1 27.8c3.9 6.8 14.3 9 19.9 2.4 6.2-3.7 8.7-12.5 3.6-18.6l-21.6-32.5Zm70.1-58.9-38.3-.6 7.7-8.7c6.3-8.8 1.5-18.3-7.1-23.7-10.8-9-20.2 1.9-26.7 9.8 1.6-42.8 1.1-29.5-39.1-32.2-4.3-.1-7.5 3.1-7.6 7.3l-.4 32c-.1 4.3 3.1 7.5 7.3 7.6l26 .3L126 88.8c-22.8 25.4-50.1 55-73 80.4l-27.5 30.2c-7.7 9.1-.8 18.7 7.1 23.8 14.9 13.2 29-15.3 37.6-23.1l1.6-1.7L90.4 178c27.3-30.1 68.3-72.2 94.8-102.8l-.6 37.7c-.2 9.6 8.6 16.1 17.8 15 42.1 2.7 64.1-61.6 32.4-64.8Z"></path>
</g></svg>
		</a>

<script type="text/javascript">
	jQuery('#button69b3f63df198a').click(function (event) {
		jQuery(window).trigger('buttonClicked', [event.delegateTarget, {"type":"gold","loadTooltip":null,"boxId":"","disabled":true,"attention":false,"colorBlind":false,"class":"quickLink WorkshopManagement","id":"button69b3f63df198a","redirectUrl":"","redirectUrlExternal":"","svg":"sideBar\/quickLinks\/quickLinkWorkshopManagement.svg","content":"","onclick":"event.preventDefault();"}]);
	});
</script>
                    </div>
    
    <a id="button69b3f63df1a03"
   	class="layoutButton buttonFramed withIcon round activeVillageQuickLinksSettings gold  settings  "
	title=""
        	        	>
					<svg viewBox="0 0 13 3" class="activeVillageQuickLinksSettings"><g class="outline">
    <path d="M3 1.5C3 2.33 2.33 3 1.5 3S0 2.33 0 1.5.67 0 1.5 0 3 .67 3 1.5ZM8 1.5C8 2.33 7.33 3 6.5 3S5 2.33 5 1.5 5.67 0 6.5 0 8 .67 8 1.5ZM13 1.5c0 .83-.67 1.5-1.5 1.5S10 2.33 10 1.5 10.67 0 11.5 0 13 .67 13 1.5Z"></path>
</g><g class="icon">
    <path d="M3 1.5C3 2.33 2.33 3 1.5 3S0 2.33 0 1.5.67 0 1.5 0 3 .67 3 1.5ZM8 1.5C8 2.33 7.33 3 6.5 3S5 2.33 5 1.5 5.67 0 6.5 0 8 .67 8 1.5ZM13 1.5c0 .83-.67 1.5-1.5 1.5S10 2.33 10 1.5 10.67 0 11.5 0 13 .67 13 1.5Z"></path>
</g></svg>
		</a>

<script type="text/javascript">
	jQuery('#button69b3f63df1a03').click(function (event) {
		jQuery(window).trigger('buttonClicked', [event.delegateTarget, {"type":"gold","loadTooltip":null,"boxId":"","disabled":false,"attention":false,"colorBlind":false,"class":"settings","id":"button69b3f63df1a03","redirectUrl":"","redirectUrlExternal":"","svg":"misc\/threeDots.svg","content":"","title":"Quick links||For this feature you need Travian Plus activated."}]);
	});
</script>
</div>
	</div>
	<div class="content">
		<div class="playerName">Ma7ame7o</div>
<div id="villageName"
	 class="boxTitle editable"
	 title="Click to change village name">

			<form>
			<input class="villageInput" type="text" maxlength="20" name="villageName" data-did=24832 value="1"/>
			<svg viewBox="0 0 12.8 18.8" class="rename">
    <path d="M5.5 16.6.8 18.8 0 13.6c0-.1.1-.1.1-.1l5.4 2.9c.1.1.1.2 0 .2zm6.7-14.4L8.4.1C7.9-.1 7.3 0 7 .5L1.2 11.2c-.3.5-.1 1.1.3 1.4h.1l3.9 2.1c.5.3 1.1.1 1.4-.4l5.8-10.7c.3-.4.1-1.1-.5-1.4.1 0 .1 0 0 0z"></path>
</svg>
		</form>
	</div>

<div class="population">
	Population: <span>&#x202d;108&#x202c;</span>
</div>

<div class="loyalty medium">
	Loyalty: <span>&#x202d;&#x202d;100&#x202c;&#37;&#x202c;</span>
</div>

<script type="text/javascript">
	function saveChanges(newVillageName) {
		Travian.api('village/change-names', {
			data: {
                data: [
                    {villageId: 24832, name: newVillageName}
                ]
			},
			success: function(data) {
                Travian.Game.VillageList.updateVillageNames();
            },
            error: function(body) {
                var errorDialog = new Travian.Dialog.Dialog({
                    buttonOk: true,
                    buttonCloseOnClickOk: true,
                    preventFormSubmit: true
                });
                errorDialog.setContent(body.message);
                errorDialog.show();
            }
		}, 'PUT');
	}

	jQuery(function() {
		var villageNameForm = jQuery('#villageName form');
		var villageNameInput = jQuery('#villageName input');

		villageNameInput.on('focusout', function () {
		    saveChanges(villageNameInput.val())
		});

		villageNameForm.on('submit', function (event) {
		    event.preventDefault();
            villageNameInput.blur();
		});
	})
</script>
	</div>
	</div>
    <div id="sidebarBoxVillageList" class="sidebarBox  expanded">
	<div class="header">
		<div class="buttonsWrapper quickLinks">
            <div class="quickLinkSlot">
                            <div class="slot"></div>
                    </div>
            <div class="quickLinkSlot">
                            <div class="slot"></div>
                    </div>
            <div class="quickLinkSlot">
                            <div class="slot"></div>
                    </div>
            <div class="quickLinkSlot">
                            <div class="slot"></div>
                    </div>
        <a id="button69b3f63df1cf8"
   	class="layoutButton buttonFramed withIcon round overview green  villageStatistics  "
	title="Village statistics"
        			href="/village/statistics"
	                accesskey="9"
    	>
					<svg viewBox="0 0 20 14.92" class="overview"><g class="outline">
  <path d="M10 1.41c4.61 0 8.34 6.05 8.34 6.05s-3.73 6.05-8.34 6.05-8.34-6-8.34-6 3.73-6 8.34-6M10 0C7.7 0 5.38 1.16 3.1 3.44A20.17 20.17 0 0 0 .46 6.72L0 7.46l.46.74a20.17 20.17 0 0 0 2.64 3.28c2.28 2.28 4.6 3.44 6.9 3.44s4.62-1.16 6.9-3.44a20.17 20.17 0 0 0 2.64-3.28l.46-.74-.46-.74a20.17 20.17 0 0 0-2.64-3.28C14.62 1.16 12.3 0 10 0zm.08 11.64a4.5 4.5 0 1 1 4.49-4.49 4.5 4.5 0 0 1-4.49 4.49zm0-7.88a3.39 3.39 0 1 0 3.38 3.39 3.39 3.39 0 0 0-3.38-3.39zm0 5.92a2.53 2.53 0 1 1 2.52-2.53 2.53 2.53 0 0 1-2.52 2.53z"></path>
</g><g class="icon">
  <path d="M10 1.41c4.61 0 8.34 6.05 8.34 6.05s-3.73 6.05-8.34 6.05-8.34-6-8.34-6 3.73-6 8.34-6M10 0C7.7 0 5.38 1.16 3.1 3.44A20.17 20.17 0 0 0 .46 6.72L0 7.46l.46.74a20.17 20.17 0 0 0 2.64 3.28c2.28 2.28 4.6 3.44 6.9 3.44s4.62-1.16 6.9-3.44a20.17 20.17 0 0 0 2.64-3.28l.46-.74-.46-.74a20.17 20.17 0 0 0-2.64-3.28C14.62 1.16 12.3 0 10 0zm.08 11.64a4.5 4.5 0 1 1 4.49-4.49 4.5 4.5 0 0 1-4.49 4.49zm0-7.88a3.39 3.39 0 1 0 3.38 3.39 3.39 3.39 0 0 0-3.38-3.39zm0 5.92a2.53 2.53 0 1 1 2.52-2.53 2.53 2.53 0 0 1-2.52 2.53z"></path>
</g></svg>
		</a>

<script type="text/javascript">
	jQuery('#button69b3f63df1cf8').click(function (event) {
		jQuery(window).trigger('buttonClicked', [event.delegateTarget, {"type":"green","loadTooltip":null,"boxId":"","disabled":false,"attention":false,"colorBlind":false,"class":"villageStatistics","id":"button69b3f63df1cf8","redirectUrl":"\/village\/statistics","redirectUrlExternal":"","svg":"sideBar\/overview.svg","content":"","accesskey":9}]);
	});
</script>
    <a id="button69b3f63df1d66"
   	class="layoutButton buttonFramed withIcon round villageListQuickLinksSettings grey  settings  "
	title=""
        	        	>
					<svg viewBox="0 0 13 3" class="villageListQuickLinksSettings"><g class="outline">
    <path d="M3 1.5C3 2.33 2.33 3 1.5 3S0 2.33 0 1.5.67 0 1.5 0 3 .67 3 1.5ZM8 1.5C8 2.33 7.33 3 6.5 3S5 2.33 5 1.5 5.67 0 6.5 0 8 .67 8 1.5ZM13 1.5c0 .83-.67 1.5-1.5 1.5S10 2.33 10 1.5 10.67 0 11.5 0 13 .67 13 1.5Z"></path>
</g><g class="icon">
    <path d="M3 1.5C3 2.33 2.33 3 1.5 3S0 2.33 0 1.5.67 0 1.5 0 3 .67 3 1.5ZM8 1.5C8 2.33 7.33 3 6.5 3S5 2.33 5 1.5 5.67 0 6.5 0 8 .67 8 1.5ZM13 1.5c0 .83-.67 1.5-1.5 1.5S10 2.33 10 1.5 10.67 0 11.5 0 13 .67 13 1.5Z"></path>
</g></svg>
		</a>

<script type="text/javascript">
	jQuery('#button69b3f63df1d66').click(function (event) {
		jQuery(window).trigger('buttonClicked', [event.delegateTarget, {"type":"grey","loadTooltip":null,"boxId":"","disabled":false,"attention":false,"colorBlind":false,"class":"settings","id":"button69b3f63df1d66","redirectUrl":"","redirectUrlExternal":"","svg":"misc\/threeDots.svg","content":"","title":"Quick links||For this feature you need Travian Plus activated."}]);
	});
</script>
</div>
	</div>
	<div class="content">
		
<div class="expansionSlotInfo">
	<div class="boxTitle">
		Villages		<span class="slots">&#x202d;&#x202d;1&#x202c;/&#x202d;2&#x202c;&#x202c;</span>
	</div>
	<div class="barWrapper">
		<div class="bar" style="width:99.761904761905%">&nbsp;</div>
	</div>
</div>

	<div class="villageList">
        <div class="groupsHeader">
            <span>Village groups</span>
            <span>(&#x202d;&#x202d;0&#x202c;/&#x202d;20&#x202c;&#x202c;)</span>
            <button type="button" class="secondaryIconButton"
                                        title="">
                <svg viewBox="0 0 20 16" class="addGroup">
    <path d="M12 12h2v-2h2V8h-2V6h-2v2h-2v2h2v2ZM2 16c-.55 0-1.02-.2-1.41-.59C.2 15.02 0 14.55 0 14V2C0 1.45.2.98.59.59.98.2 1.45 0 2 0h6l2 2h8c.55 0 1.02.2 1.41.59.39.39.59.86.59 1.41v10c0 .55-.2 1.02-.59 1.41-.39.39-.86.59-1.41.59H2Zm0-2h16V4H9.18l-2-2H2v12Z"></path>
</svg>
            </button>
        </div>
		            <div class="dropContainer">
    <div class="listEntry village active" data-did="24832">
                <a href="?newdid=24832&amp;"  class="active">
                    <span class="iconAndNameWrapper">
                <span class="incomingTroops" data-id="24832">
                    <svg viewBox="0 0 20 19.06" class="attack">
  <path d="M16.22 13.08l2.14-2.14-1.37-1.36-1.63 1.63-2.15-2.15 4.74-4.73L19.06 0l-4.32 1.11L10 5.85 5.26 1.11.94 0l1.11 4.33 4.74 4.73-2.15 2.15-1.63-1.63-1.37 1.36 2.14 2.14L0 16.86l2.21 2.2 3.78-3.77 2.13 2.13 1.37-1.37-1.63-1.63L10 12.28l2.14 2.14-1.63 1.63 1.37 1.37 2.14-2.13 3.77 3.77 2.21-2.2-3.78-3.78z"></path>
</svg>
                </span>
                <span class="name" data-did="24832">1</span>
            </span>
                </a>
        <span class="coordinatesGrid">
            &#x202d;<span class="coordinates coordinatesWrapper coordinatesAligned coordinatesltr"><span class="coordinateX">(&#x202d;&minus;&#x202d;66&#x202c;&#x202c;</span><span class="coordinatePipe">|</span><span class="coordinateY">&#x202d;0&#x202c;)</span></span>&#x202c;        </span>
            </div>
</div>
            			</div>
	</div>
	</div>
</div>

<script type='text/javascript'>
    jQuery(function() {
        window.Travian.React.VillageBoxes.render(
            {
                gqlQuery: "query{bootstrapData{buildings{type validTribes}serverSupportedFeatures{keepVidOnConquer}} ownPlayer{name tribeId isSitter goldFeatures{travianPlus{isActive}goldClub}village{id tribeId name sortIndex population loyalty quickLinks{all{type buildingIsAvailable availableBuildingId}villageListSet{type buildingIsAvailable availableBuildingId}villageSet{type buildingIsAvailable availableBuildingId}}}isSitter culturalPointsOverview{usedSlots maxControllableVillages cpProducedForNextSlot cpNeededForNextSlot}profileBan{isActive tooltip}villageList{... on VillageListGroup{id name color villages{id name distance incomingAttacksAmount incomingAttacksSymbols{gray green red yellow}x y}} ... on VillageListVillage{id name distance incomingAttacksAmount incomingAttacksSymbols{gray green red yellow}x y}}}}",
                viewData: {"bootstrapData":{"buildings":[{"type":1,"validTribes":[1,2,3]},{"type":2,"validTribes":[1,2,3]},{"type":3,"validTribes":[1,2,3]},{"type":4,"validTribes":[1,2,3]},{"type":5,"validTribes":[1,2,3]},{"type":6,"validTribes":[1,2,3]},{"type":7,"validTribes":[1,2,3]},{"type":8,"validTribes":[1,2,3]},{"type":9,"validTribes":[1,2,3]},{"type":10,"validTribes":[1,2,3]},{"type":11,"validTribes":[1,2,3]},{"type":13,"validTribes":[1,2,3]},{"type":14,"validTribes":[1,2,3]},{"type":15,"validTribes":[1,2,3]},{"type":16,"validTribes":[1,2,3]},{"type":17,"validTribes":[1,2,3]},{"type":18,"validTribes":[1,2,3]},{"type":19,"validTribes":[1,2,3]},{"type":20,"validTribes":[1,2,3]},{"type":21,"validTribes":[1,2,3]},{"type":22,"validTribes":[1,2,3]},{"type":23,"validTribes":[1,2,3]},{"type":24,"validTribes":[1,2,3]},{"type":25,"validTribes":[1,2,3]},{"type":26,"validTribes":[1,2,3]},{"type":27,"validTribes":[1,2,3]},{"type":28,"validTribes":[1,2,3]},{"type":29,"validTribes":[1,2,3]},{"type":30,"validTribes":[1,2,3]},{"type":31,"validTribes":[1]},{"type":32,"validTribes":[2]},{"type":33,"validTribes":[3]},{"type":34,"validTribes":[1,2,3]},{"type":35,"validTribes":[2]},{"type":36,"validTribes":[3]},{"type":37,"validTribes":[1,2,3]},{"type":38,"validTribes":[1,2,3]},{"type":39,"validTribes":[1,2,3]},{"type":40,"validTribes":[]},{"type":41,"validTribes":[1]},{"type":46,"validTribes":[1,2,3]}],"serverSupportedFeatures":{"keepVidOnConquer":false}},"ownPlayer":{"name":"Ma7ame7o","tribeId":2,"isSitter":false,"goldFeatures":{"travianPlus":{"isActive":false},"goldClub":false},"village":{"id":24832,"tribeId":2,"name":"1","sortIndex":1,"population":108,"loyalty":100,"quickLinks":{"all":[{"type":"BlacksmithManagement","buildingIsAvailable":false,"availableBuildingId":null},{"type":"RallyPointOverview","buildingIsAvailable":true,"availableBuildingId":16},{"type":"RallyPointSendTroops","buildingIsAvailable":true,"availableBuildingId":16},{"type":"RallyPointFarmList","buildingIsAvailable":true,"availableBuildingId":16},{"type":"MarketplaceSendResources","buildingIsAvailable":true,"availableBuildingId":17},{"type":"MarketplaceTradeRoutes","buildingIsAvailable":true,"availableBuildingId":17},{"type":"MarketplaceBuy","buildingIsAvailable":true,"availableBuildingId":17},{"type":"BarracksManagement","buildingIsAvailable":true,"availableBuildingId":19},{"type":"GreatBarracksManagement","buildingIsAvailable":false,"availableBuildingId":null},{"type":"StableManagement","buildingIsAvailable":false,"availableBuildingId":null},{"type":"GreatStableManagement","buildingIsAvailable":false,"availableBuildingId":null},{"type":"WorkshopManagement","buildingIsAvailable":false,"availableBuildingId":null},{"type":"TownHallCelebration","buildingIsAvailable":false,"availableBuildingId":null},{"type":"TrapperManagement","buildingIsAvailable":false,"availableBuildingId":null},{"type":"HerosMansionManagement","buildingIsAvailable":false,"availableBuildingId":null},{"type":"HospitalManagement","buildingIsAvailable":false,"availableBuildingId":null},{"type":"ExpansionTrain","buildingIsAvailable":false,"availableBuildingId":null}],"villageListSet":[null,null,null,null],"villageSet":[null,{"type":"MarketplaceSendResources","buildingIsAvailable":true,"availableBuildingId":17},{"type":"BarracksManagement","buildingIsAvailable":true,"availableBuildingId":19},{"type":"StableManagement","buildingIsAvailable":false,"availableBuildingId":null},{"type":"WorkshopManagement","buildingIsAvailable":false,"availableBuildingId":null}]}},"culturalPointsOverview":{"usedSlots":1,"maxControllableVillages":2,"cpProducedForNextSlot":2095,"cpNeededForNextSlot":2100},"profileBan":{"isActive":false,"tooltip":""},"villageList":[{"id":24832,"name":"1","distance":0,"incomingAttacksAmount":71,"incomingAttacksSymbols":{"gray":71,"green":0,"red":0,"yellow":0},"x":-66,"y":0}]}},
                knowledgeBaseLinkPlus: 'https://support.travian.com/support/solutions/articles/7000060367-travian-plus-membership'
            },
            ["layout","karte","allgemein","dorf1u2","spieler","api","quickLinks","gid16","gid17","gid24","gid25u26","plus"]        );
    });
</script>
<div id="sidebarBoxQuestmaster" class="sidebarBox  expanded">
	<div class="header">
		<button id="questmasterButton"
        title="Display task list"
        class="vid_2 claimable"
        type="button">

            <svg width="200" height="116" viewBox="0 0 200 116">
    <path fill="url(#mentor_gradient)" d="M0 116c4.5-8.69 14.23-11.45 21.22-17.39-.39-5.23 5.5-12.83 10.42-13.95 1.59-2.07 5.34-4.15 8.68-3.37 2.53-1.3 5.22-1.74 7.83-.81 8.34-3.86 15.38-9.24 23.06-14.22-2.5-4.46-3.22-10.45-2.6-15.34-3.54-4.6-.77-11.43.33-16.97-2.47-12.56 7.01-25.41 18.31-29.11 5.39-4.1 12.69-7.23 18.56-2.38 11.53 1.32 17.99 14.25 22.33 24.05 2.46-1.75 3.02-5.42 6.1-6.7 8.25-5.15 16.57-10.99 25.13-16.01 10.19 1.17 13.71 10.68 15.68 18.81l-.25.25c8.34 9.61 17.58.1 24.74-5.01 3.25 25.06-11.06 37.32-31 49.08.04.21.06.41.08.6 3.5 2.69 7.27 5.87 5.57 10.7.15 2.86 2.06 6.38 2.66 9.24 2.4 8.68 7.75 19.92 10.74 28.53H0Z"></path>
    <defs>
        <linearGradient id="mentor_gradient" gradientTransform="rotate(90)">
            <stop class="colorStop1" offset="0%"></stop>
            <stop class="colorStop2" offset="30%"></stop>
            <stop class="colorStop1" offset="60%"></stop>
            <stop class="colorStop3" offset="95%"></stop>
            <stop class="colorStop4" offset="100%"></stop>
        </linearGradient>
    </defs>
</svg>
    	<img class="mentor" alt="" src="/img/x.gif" />
    <div class="bigSpeechBubble newQuestSpeechBubble" title="">
	<img src="/img/x.gif" alt="" />
</div></button>

<script type="text/javascript">
    jQuery(function() {
        jQuery('button#questmasterButton').click(function() {
            window.location = '/tasks';
        });
            });
</script>
	</div>
	<div class="content">
		<a href="/tasks" title="Display task list" class="progressiveTasksTitle">
    <div class="boxTitle">Task overview</div>
</a>
	</div>
	</div>
                    </div>
                </div>
			</div>

			<div id="footer">
				<div id="pageLinks">
					<a href="https://www.travian.com/international" target="_blank">Homepage</a>
					<a href="https://discord.gg/travianlegends" target="_blank">Discord</a>
					<a href="https://www.travian.com/international/news" target="_blank">News</a>
					<a href="/help.php?page=support" onclick="return Travian.Game.Freshdesk.homePage()">Support</a>
					<a href="https://www.travian.com/international/gamerules" target="_blank">Game rules</a>
					<a href="https://agb.traviangames.com/terms-en.pdf" target="_blank">Terms</a>
					<a href="https://www.travian.com/international/imprint" target="_blank">Imprint</a>
					<div class="clear"></div>
				</div>
				<p class="copyright">© 2004 - 2026 Travian Games GmbH</p>
			</div>

			<div id="ce"></div>

            		</div>

        <div id="toastStack"></div>
        <script type='text/javascript'>
            jQuery(function() {
                window.Travian.React.ToastStack.render({}, []);
            });
        </script>

		<script type="application/javascript">
                            Travian.Game.contextHelpData = {"groupName":"","steps":[],"restartableGroup":null};
                Travian.Game.ContextualHelp.initialize();
            
            
            
                            Travian.Game.Layout.MobileOptimizations.init();
                Travian.Game.Layout.updateContentTitleClass();
            		</script>
        	</body>
</html>
