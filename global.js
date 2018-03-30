var debug='';
// multi sync ajax https://stackoverflow.com/a/34570288
function requestsAreComplete(requests) {
    return requests.every(function (request) {
        return request.readyState == 4;
    });
}

function unsuccessfulRequests(requests) {
    var unsuccessful = requests.filter(function (request) {
         return request.status != 200;
    });
    return unsuccessful.length ? unsuccessful : null;
}

function onRequestsComplete(requests, callback) {
    function sharedCallback() {
        if (requestsAreComplete(requests)) {
            callback(requests, unsuccessfulRequests(requests));
        }
    }
    requests.forEach(function (request) {
        request.onreadystatechange = sharedCallback;
    });
}

function makeTx(utxos,waddr,wkey,toaddr,a,fr){
		if(debug) console.log('makeTx()');
		//console.log('utxos='); console.log(utxos);
		//console.log('waddr='+waddr+' wkey='+wkey+' toaddr='+toaddr+' a='+a+' fr='+fr);
		utxos=JSON.parse(utxos);
		if(!utxos||utxos.length==0) return {status:0,msg:'no utxos'};
		var fee=0, su=[], si=0;
		while(1){
			if(!su[si]) su[si]={
		        'txId':utxos[si].txid,
		        'outputIndex':utxos[si].vout,
		        'address':bchaddr.toLegacyAddress(utxos[si].address),
		        'script':utxos[si].scriptPubKey,
		        'satoshis':utxos[si].satoshis
			}
			var st=0;
			for(var k in su) st+=su[k].satoshis;
			var t=a+fee;
			if(t<=st){
				var tx=new bch.Transaction().fee(fee).from(su);
				tx.to(bchaddr.toLegacyAddress(toaddr),a);
				tx.change(bchaddr.toLegacyAddress(waddr)).sign(wkey);
				var fn=Math.ceil(tx.toString().length/2*fr); // fee needed
				if(fn>fee){ fee=fn; continue; }
				var us=[];
				for(i=0;i<=si;i++) us.push(utxos[i].txid);
				//console.log('to send: '+a+' + '+fee+' fee = '+t+'. within source utxo: '+st+'. good to send. tx='); console.log(tx);
				return {status:1,tx:tx.toString()};
			} else {
				if(tx && tx.outputs && tx.outputs.length>1 && !utxos[si+1]){ // use change as fee
					fee=tx.outputs[tx.outputs.length-1].satoshis;
					continue;
				}
				// add another utxo
				si++;
				if(!utxos[si]) return {status:0,msg:'insufficient funds'};
				continue;
			}
			break;
		}
}

// simple toast https://github.com/mlcheng/js-toast/blob/master/toast.min.js
"use strict";var iqwerty=iqwerty||{};iqwerty.toast=function(){function t(o,r,i){if(null!==e())t.prototype.toastQueue.push({text:o,options:r,transitions:i});else{t.prototype.Transitions=i||n;var a=r||{};a=t.prototype.mergeOptions(t.prototype.DEFAULT_SETTINGS,a),t.prototype.show(o,a),a=null}}function e(){return i}function o(t){i=t}var r=400,n={SHOW:{"-webkit-transition":"opacity "+r+"ms, -webkit-transform "+r+"ms",transition:"opacity "+r+"ms, transform "+r+"ms",opacity:"1","-webkit-transform":"translateY(-100%) translateZ(0)",transform:"translateY(-100%) translateZ(0)"},HIDE:{opacity:"0","-webkit-transform":"translateY(150%) translateZ(0)",transform:"translateY(150%) translateZ(0)"}},i=null;return t.prototype.DEFAULT_SETTINGS={style:{main:{background:"rgba(0, 0, 0, .85)","box-shadow":"0 0 10px rgba(0, 0, 0, .8)","border-radius":"3px","z-index":"99999",color:"rgba(255, 255, 255, .9)",padding:"10px 15px","max-width":"60%",width:"100%","word-break":"keep-all",margin:"0 auto","text-align":"center",position:"fixed",left:"0",right:"0",bottom:"0","-webkit-transform":"translateY(150%) translateZ(0)",transform:"translateY(150%) translateZ(0)","-webkit-filter":"blur(0)",opacity:"0"}},settings:{duration:4e3}},t.prototype.Transitions={},t.prototype.toastQueue=[],t.prototype.timeout=null,t.prototype.mergeOptions=function(e,o){var r=o;for(var n in e)r.hasOwnProperty(n)?null!==e[n]&&e[n].constructor===Object&&(r[n]=t.prototype.mergeOptions(e[n],r[n])):r[n]=e[n];return r},t.prototype.generate=function(r,n){var i=document.createElement("div");"string"==typeof r&&(r=document.createTextNode(r)),i.appendChild(r),o(i),i=null,t.prototype.stylize(e(),n)},t.prototype.stylize=function(t,e){Object.keys(e).forEach(function(o){t.style[o]=e[o]})},t.prototype.show=function(o,r){this.generate(o,r.style.main);var n=e();document.body.insertBefore(n,document.body.firstChild),n.offsetHeight,t.prototype.stylize(n,t.prototype.Transitions.SHOW),n=null,clearTimeout(t.prototype.timeout),t.prototype.timeout=setTimeout(t.prototype.hide,r.settings.duration)},t.prototype.hide=function(){var o=e();t.prototype.stylize(o,t.prototype.Transitions.HIDE),clearTimeout(t.prototype.timeout),o.addEventListener("transitionend",t.prototype.animationListener),o=null},t.prototype.animationListener=function(){e().removeEventListener("transitionend",t.prototype.animationListener),t.prototype.destroy.call(this)},t.prototype.destroy=function(){var r=e();if(document.body.removeChild(r),r=null,o(null),t.prototype.toastQueue.length>0){var n=t.prototype.toastQueue.shift();t(n.text,n.options,n.transitions),n=null}},{Toast:t}}(),"undefined"!=typeof module&&(module.exports=iqwerty.toast);

// time ago https://github.com/hustcc/timeago.js/blob/master/dist/timeago.min.js
!function(t,e){"object"==typeof module&&module.exports?(module.exports=e(),module.exports.default=module.exports):t.timeago=e()}("undefined"!=typeof window?window:this,function(){function t(t){return t instanceof Date?t:isNaN(t)?/^\d+$/.test(t)?new Date(e(t)):(t=(t||"").trim().replace(/\.\d+/,"").replace(/-/,"/").replace(/-/,"/").replace(/(\d)T(\d)/,"$1 $2").replace(/Z/," UTC").replace(/([\+\-]\d\d)\:?(\d\d)/," $1$2"),new Date(t)):new Date(e(t))}function e(t){return parseInt(t)}function n(t,n,r){n=l[n]?n:l[r]?r:"en";for(var o=0,i=t<0?1:0,a=t=Math.abs(t);t>=p[o]&&o<h;o++)t/=p[o];return t=e(t),o*=2,t>(0===o?9:1)&&(o+=1),l[n](t,o,a)[i].replace("%s",t)}function r(e,n){return((n=n?t(n):new Date)-t(e))/1e3}function o(t){for(var e=1,n=0,r=Math.abs(t);t>=p[n]&&n<h;n++)t/=p[n],e*=p[n];return r%=e,r=r?e-r:e,Math.ceil(r)}function i(t){return a(t,"data-timeago")||a(t,"datetime")}function a(t,e){return t.getAttribute?t.getAttribute(e):t.attr?t.attr(e):void 0}function u(t,e){return t.setAttribute?t.setAttribute(m,e):t.attr?t.attr(m,e):void 0}function c(t,e){this.nowDate=t,this.defaultLocale=e||"en"}function d(t,e){return new c(t,e)}var f="second_minute_hour_day_week_month_year".split("_"),s="秒_分钟_小时_天_周_月_年".split("_"),l={en:function(t,e){if(0===e)return["just now","right now"];var n=f[parseInt(e/2)];return t>1&&(n+="s"),[t+" "+n+" ago","in "+t+" "+n]},zh_CN:function(t,e){if(0===e)return["刚刚","片刻后"];var n=s[parseInt(e/2)];return[t+n+"前",t+n+"后"]}},p=[60,60,24,7,365/7/12,12],h=6,m="data-tid",w={};return c.prototype.doRender=function(t,e,i){var a,c=r(e,this.nowDate),d=this;t.innerHTML=n(c,i,this.defaultLocale),w[a=setTimeout(function(){d.doRender(t,e,i),delete w[a]},Math.min(1e3*o(c),2147483647))]=0,u(t,a)},c.prototype.format=function(t,e){return n(r(t,this.nowDate),e,this.defaultLocale)},c.prototype.render=function(t,e){void 0===t.length&&(t=[t]);for(var n=0,r=t.length;n<r;n++)this.doRender(t[n],i(t[n]),e)},c.prototype.setLocale=function(t){this.defaultLocale=t},d.register=function(t,e){l[t]=e},d.cancel=function(t){var e;if(t)(e=a(t,m))&&(clearTimeout(e),delete w[e]);else{for(e in w)clearTimeout(e);w={}}},d});
