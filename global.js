var debug='';

// https://stackoverflow.com/a/16187766
function cmpVersions (a, b) {
    var i, diff;
    var regExStrip0 = /(\.0+)+$/;
    var segmentsA = a.replace(regExStrip0, '').split('.');
    var segmentsB = b.replace(regExStrip0, '').split('.');
    var l = Math.min(segmentsA.length, segmentsB.length);

    for (i = 0; i < l; i++) {
        diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10);
        if (diff) {
            return diff;
        }
    }
    return segmentsA.length - segmentsB.length;
}

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


// try to send a queued tip
// todo: fast local lock in case 2 sends at exact same time, i.e. queue + tx page
function sendQueued(obj,callback){
	var o=obj[0],item=obj[1],evp=obj[2]; // todo: improve // evp=is run from event page
	// update last attempt time
	if(!o.tx_attempts) o.tx_attempts={};
	o.tx_attempts[item[0]]=Date.now();
	for(let i=0;i<chrome.extension.getViews().length;i++) if(chrome.extension.getViews()[i].location.pathname.indexOf('/tx.html')!==-1 && chrome.extension.getViews()[i].document.hasFocus()) chrome.extension.getViews()[i].refreshAgo(item[0],o.tx_attempts[item[0]]);
	if(evp) chrome.storage.largeSync.set({tx_attempts:o.tx_attempts,txq_lastattempt:o.tx_attempts[item[0]]}); else chrome.storage.largeSync.set({tx_attempts:o.tx_attempts}); // dont block queue run from tx page
	if(debug){ var m=new SpeechSynthesisUtterance('trying to send to '+item[2]); speechSynthesis.speak(m); }

	// first, just get user address
	var x0=new XMLHttpRequest(); x0.timeout=15000; x0.open("GET","https://www.reddit.com/r/u_"+item[2]+"/about.json",true);
	var x1=new XMLHttpRequest(); x1.timeout=15000; x1.open("GET","https://cdn.bchftw.com/bchtips/reddit/"+item[2][0].toLowerCase()+".csv",true);
	var xs0=[x0,x1];
	onRequestsComplete(xs0, function(xr, xerr){
		//if(debug){ console.log('xs0='); console.log(xs0); }
		// check for error
		var ujserr='';
		try { var ujs=JSON.parse(x0.responseText); } catch(e){ ujserr=1; }
		if(debug){ console.log('x0.responseText length='+x0.responseText.length+' ujs='); console.log(ujs); }
		for(let i=0;i<xs0.length;i++){
			if(xs0[i].status!==200 || (i!==1 && xs0[i].responseText=='') || (i==0 && (!ujs.data || !'public_description' in ujs.data) && ujs.kind!='Listing') || (i==0 && ujserr)){
				if(i==0) var m='reddit profile'; else if(i==1) var m='user database';
				if(debug){ console.log('error checking '+m+'. aborting. xs0='); console.log(xs0); }
				if(evp){ clearInterval(evg.si); evg.si=''; }
				callback({error:1,m:m});
				return;
			}
		}
		// check if got an address
		var uaddr='';
		if(ujs.data.public_description && ujs.kind=='t5'){
			var tmp=ujs.data.public_description.replace('\\n','').split(' ');
			console.log('ujs.data.public_description='+tmp);
			for(i=tmp.length;i>=0;i--) try { if(bchaddr.isCashAddress(tmp[i])==true) uaddr=tmp[i].replace('bitcoincash:',''); } catch(e){}
			if(uaddr&&debug) console.log('got address from public description: '+uaddr);
		}
		// no addr from profile, check db response
		if(!uaddr){
			let ar=x1.responseText.split('\n').reduce(function(obj,str,index){
				let part=str.split(',');
				if(part[0] && part[1]) obj[part[0]]=part[1].trim();
				return obj;
			}, {});
			if(ar[item[2]]) uaddr=ar[item[2]];
		}
		if(!uaddr){ if(debug){ var m=new SpeechSynthesisUtterance('no address found'); speechSynthesis.speak(m); } if(debug) console.log('no user address, abort'); callback({neutral:1,m:'no user address',u:item[2]}); return; }

		// got an address, get utxos and fee estimate
		if(!o.fee || !o.fee.last || !o.fee.val || (Date.now()-o.fee.last>60000)) var dofee=1; else var dofee='';
		var x2=new XMLHttpRequest(); x2.timeout=15000; x2.open("GET","https://blockdozer.com/insight-api/addr/"+o.data.waddr+"/utxo",true);
		if(dofee){
			if(debug) console.log('updating fee');
			var x3=new XMLHttpRequest(); x3.timeout=15000; x3.open("GET","https://blockdozer.com/insight-api/utils/estimatefee/",true);
			var xs1=[x2,x3];
		} else var xs1=[x2];
		onRequestsComplete(xs1, function(xr, xerr){
			//if(debug){ console.log('xs1='); console.log(xs1); }
			if(x3) try { var fr=JSON.parse(x3.responseText)["2"]; } catch(e){}
			for(let i=0;i<xs1.length;i++){
				if(xs1[i].status!==200 || xs1[i].responseText=='' || (i==3 && fr==-1)){
					if(i==2) var m='utxos'; else if(i==3) var m='fee estimate';
					if(debug){ console.log('error checking '+m+'. aborting. xs1='); console.log(xs1); }
					if(evp){ clearInterval(evg.si); evg.si=''; }
					callback({error:1,m:m});
					return;
				}
			}
			if(dofee){
				fr=Math.ceil(fr*10000000)/100; // round up to nearest 10 sat/kb
				ferr=0;
				chrome.storage.largeSync.set({fee:{ last: Date.now(), val: fr }});
			} else fr=o.fee.val;
			if(fr<1){ if(debug) console.log('fee lower than 1. setting to 1.1'); fr=1.1; }
			//if(debug) console.log('fee estimate='+fr+' sat/B');
			//if(debug) console.log('got everything we need. time to send.');
			//if(debug) console.log('creating tx');
			var amt=parseFloat(BigNumber(item[1].split(' ')[0]).times(100000000).toFixed(0));
			//if(debug) console.log('amt='+amt);
			var tx=makeTx(x2.responseText,o.data.waddr,o.data.wkey,uaddr,amt,fr);
			//if(debug){ console.log('tx='); console.log(tx); }
			if(tx.status==1){
				//if(debug) console.log('sending tx');
				var x=new XMLHttpRequest();
				x.open("POST","https://blockdozer.com/insight-api/tx/send",true);
				x.setRequestHeader("Content-type","application/x-www-form-urlencoded");
				x.onreadystatechange=function(){
					if(x.readyState==4){
						if(x.status==200){
							if(debug) console.log('x.responseText='+x.responseText);
							if(x.responseText){
								try { var r=JSON.parse(x.responseText); } catch(e){}
								//if(debug){ console.log('r='); console.log(r); }
								// add to tx_sent
								if(r.txid){
									chrome.storage.largeSync.get(['tx_sent'],function(ox){
										if(!ox.tx_sent) ox.tx_sent=[];
										// check dupe
										for(var i=0;i<ox.tx_sent.length;i++){
											if(ox.tx_sent[i][4]==r.txid){
												if(debug) console.log('duplicate txid '+r.txid+' not really sent, skipping for now');
												dupetxid=1;
												callback({error:1,m:'duplicate txid'});
												return;
											}
										}
										// add to tx_sent
										ox.tx_sent.push([Date.now(),item[1],item[2],item[3],r.txid,'r']); // 0=time 1=amt 2=user 3=url 4=txid 5=site(r,t)
										if(ox.tx_sent.length>250){ while(1){ ox.tx_sent.shift(); if(ox.tx_sent.length<=250) break; } }
										chrome.storage.largeSync.set(ox);
										// remove from tx_queue
										chrome.storage.largeSync.get(['tx_queue','tx_attempts'],function(ox){
											if(!ox.tx_queue) ox.tx_queue=[]; if(!ox.tx_attempts) ox.tx_attempts=[];
											for(var i=0;i<ox.tx_queue.length;i++) if(ox.tx_queue[i][0]==item[0]){
												ox.tx_queue.splice(i,1);
												delete ox.tx_attempts[item[0]];
												break;
											}
											chrome.storage.largeSync.set(ox);
										});
										if(debug) console.log('sent '+item[1]+' to '+item[2]+ '. tx='+r.txid);
										if(debug){ var m=new SpeechSynthesisUtterance('Tip sent'); speechSynthesis.speak(m); }
										if(item[5]=='r') var st='Reddit';
										if(evp && o.options.bg_sent_notification){
											setTimeout(function(){
												chrome.notifications.create('',{'type':'basic','iconUrl':'img/icon.png','title':'Tip sent','message':'Pending tip of '+item[1]+' sent to '+item[2]+' on '+st+'.','requireInteraction':false,'buttons':[{'title':'View Post/Comment'},{'title':'View TX on Blockchain'}]},function(id){
														// add to listener object
														chrome.storage.local.get('notifs',function(on){
															if(!on || !on.notifs){ on={}; on.notifs={}; }
															on.notifs[id]=['https://www.reddit.com'+item[3],'https://blockdozer.com/insight/tx/'+r.txid];
															//if(debug){ console.log('created notif id='+id+' notifs='); console.log(on.notifs); }
															chrome.storage.local.set({notifs:on.notifs});
														});
												});
											},3000); // give it a few secs to add to block explorer
										}
										callback({success:1,m:'tip sent',u:item[2]});
										// hide queued item on tx pages immediately
										for(let i=0;i<chrome.extension.getViews().length;i++) if(chrome.extension.getViews()[i].location.pathname.indexOf('/tx.html')!==-1 && chrome.extension.getViews()[i].document.hasFocus()) chrome.extension.getViews()[i].hideQueued(item[0]);
										// refresh tx pages
										setTimeout(function(){
											for(let i=0;i<chrome.extension.getViews().length;i++) if(chrome.extension.getViews()[i].location.pathname.indexOf('/tx.html')!==-1 && chrome.extension.getViews()[i].document.hasFocus()) chrome.extension.getViews()[i].refreshData();
										},2500);
									});
								} else senderr=1;
							} else var senderr=1;
						} else var senderr=1;
					}
					if(senderr){
						if(x.responseText.indexOf('txn-mempool-conflict')!==-1){
							// retry
							if(debug) console.log('mempool conflict (waiting for new utxo), retrying');
							if(evp) evg.lastd=item[0]-1;
							callback({error:1,'m':'mempool conflict'});
							return;
						}
						if(debug){ console.log('send error. r='+x.responseText+' x='); console.log(x); }
					}
				}
				x.send('rawtx='+tx.tx);
			} else {
				// insufficient funds or other
				if(debug){ console.log('error'); console.log(tx); }
				if(tx.msg=='insufficient funds'||tx.msg=='no utxos'){
					chrome.notifications.getAll(function(n){
						if(!n.need_funds){
							if(debug){ var m=new SpeechSynthesisUtterance('insufficient funds'); speechSynthesis.speak(m); }
							chrome.notifications.create('need_funds',{'type':'basic','iconUrl':'img/icon.png','title':'Fund your wallet','message':'Pending tips can\'t be sent due to insufficient funds.','requireInteraction':true},function(){});
						}
					});
					if(evp){ clearInterval(evg.si); evg.si=''; }
					callback({error:1,m:'insufficient funds'});
					return;
				}
			}
		});
		x2.send(); if(dofee) x3.send();
	});
	x0.send(); x1.send();
}


// simple toast https://github.com/mlcheng/js-toast/blob/master/toast.min.js
"use strict";var iqwerty=iqwerty||{};iqwerty.toast=function(){function t(o,r,i){if(null!==e())t.prototype.toastQueue.push({text:o,options:r,transitions:i});else{t.prototype.Transitions=i||n;var a=r||{};a=t.prototype.mergeOptions(t.prototype.DEFAULT_SETTINGS,a),t.prototype.show(o,a),a=null}}function e(){return i}function o(t){i=t}var r=400,n={SHOW:{"-webkit-transition":"opacity "+r+"ms, -webkit-transform "+r+"ms",transition:"opacity "+r+"ms, transform "+r+"ms",opacity:"1","-webkit-transform":"translateY(-100%) translateZ(0)",transform:"translateY(-100%) translateZ(0)"},HIDE:{opacity:"0","-webkit-transform":"translateY(150%) translateZ(0)",transform:"translateY(150%) translateZ(0)"}},i=null;return t.prototype.DEFAULT_SETTINGS={style:{main:{background:"rgba(0, 0, 0, .85)","box-shadow":"0 0 10px rgba(0, 0, 0, .8)","border-radius":"3px","z-index":"99999",color:"rgba(255, 255, 255, .9)",padding:"10px 15px","max-width":"60%",width:"100%","word-break":"keep-all",margin:"0 auto","text-align":"center",position:"fixed",left:"0",right:"0",bottom:"0","-webkit-transform":"translateY(150%) translateZ(0)",transform:"translateY(150%) translateZ(0)","-webkit-filter":"blur(0)",opacity:"0"}},settings:{duration:4e3}},t.prototype.Transitions={},t.prototype.toastQueue=[],t.prototype.timeout=null,t.prototype.mergeOptions=function(e,o){var r=o;for(var n in e)r.hasOwnProperty(n)?null!==e[n]&&e[n].constructor===Object&&(r[n]=t.prototype.mergeOptions(e[n],r[n])):r[n]=e[n];return r},t.prototype.generate=function(r,n){var i=document.createElement("div");"string"==typeof r&&(r=document.createTextNode(r)),i.appendChild(r),o(i),i=null,t.prototype.stylize(e(),n)},t.prototype.stylize=function(t,e){Object.keys(e).forEach(function(o){t.style[o]=e[o]})},t.prototype.show=function(o,r){this.generate(o,r.style.main);var n=e();document.body.insertBefore(n,document.body.firstChild),n.offsetHeight,t.prototype.stylize(n,t.prototype.Transitions.SHOW),n=null,clearTimeout(t.prototype.timeout),t.prototype.timeout=setTimeout(t.prototype.hide,r.settings.duration)},t.prototype.hide=function(){var o=e();t.prototype.stylize(o,t.prototype.Transitions.HIDE),clearTimeout(t.prototype.timeout),o.addEventListener("transitionend",t.prototype.animationListener),o=null},t.prototype.animationListener=function(){e().removeEventListener("transitionend",t.prototype.animationListener),t.prototype.destroy.call(this)},t.prototype.destroy=function(){var r=e();if(document.body.removeChild(r),r=null,o(null),t.prototype.toastQueue.length>0){var n=t.prototype.toastQueue.shift();t(n.text,n.options,n.transitions),n=null}},{Toast:t}}(),"undefined"!=typeof module&&(module.exports=iqwerty.toast);

// time ago https://github.com/hustcc/timeago.js/blob/master/dist/timeago.min.js
!function(t,e){"object"==typeof module&&module.exports?(module.exports=e(),module.exports.default=module.exports):t.timeago=e()}("undefined"!=typeof window?window:this,function(){function t(t){return t instanceof Date?t:isNaN(t)?/^\d+$/.test(t)?new Date(e(t)):(t=(t||"").trim().replace(/\.\d+/,"").replace(/-/,"/").replace(/-/,"/").replace(/(\d)T(\d)/,"$1 $2").replace(/Z/," UTC").replace(/([\+\-]\d\d)\:?(\d\d)/," $1$2"),new Date(t)):new Date(e(t))}function e(t){return parseInt(t)}function n(t,n,r){n=l[n]?n:l[r]?r:"en";for(var o=0,i=t<0?1:0,a=t=Math.abs(t);t>=p[o]&&o<h;o++)t/=p[o];return t=e(t),o*=2,t>(0===o?9:1)&&(o+=1),l[n](t,o,a)[i].replace("%s",t)}function r(e,n){return((n=n?t(n):new Date)-t(e))/1e3}function o(t){for(var e=1,n=0,r=Math.abs(t);t>=p[n]&&n<h;n++)t/=p[n],e*=p[n];return r%=e,r=r?e-r:e,Math.ceil(r)}function i(t){return a(t,"data-timeago")||a(t,"datetime")}function a(t,e){return t.getAttribute?t.getAttribute(e):t.attr?t.attr(e):void 0}function u(t,e){return t.setAttribute?t.setAttribute(m,e):t.attr?t.attr(m,e):void 0}function c(t,e){this.nowDate=t,this.defaultLocale=e||"en"}function d(t,e){return new c(t,e)}var f="second_minute_hour_day_week_month_year".split("_"),s="秒_分钟_小时_天_周_月_年".split("_"),l={en:function(t,e){if(0===e)return["Just now","Right now"];var n=f[parseInt(e/2)];return t>1&&(n+="s"),[t+" "+n+" ago","in "+t+" "+n]},zh_CN:function(t,e){if(0===e)return["刚刚","片刻后"];var n=s[parseInt(e/2)];return[t+n+"前",t+n+"后"]}},p=[60,60,24,7,365/7/12,12],h=6,m="data-tid",w={};return c.prototype.doRender=function(t,e,i){var a,c=r(e,this.nowDate),d=this;t.innerHTML=n(c,i,this.defaultLocale),w[a=setTimeout(function(){d.doRender(t,e,i),delete w[a]},Math.min(1e3*o(c),2147483647))]=0,u(t,a)},c.prototype.format=function(t,e){return n(r(t,this.nowDate),e,this.defaultLocale)},c.prototype.render=function(t,e){void 0===t.length&&(t=[t]);for(var n=0,r=t.length;n<r;n++)this.doRender(t[n],i(t[n]),e)},c.prototype.setLocale=function(t){this.defaultLocale=t},d.register=function(t,e){l[t]=e},d.cancel=function(t){var e;if(t)(e=a(t,m))&&(clearTimeout(e),delete w[e]);else{for(e in w)clearTimeout(e);w={}}},d});
