/* BCH Tips event.js */

// https://stackoverflow.com/a/21535234
function executeScripts(tabId,injectDetailsArray){
	function createCallback(tabId,injectDetails,innerCallback){
		return function(){ chrome.tabs.executeScript(tabId,injectDetails,innerCallback); };
	}
	var callback = null;
	for(var i=injectDetailsArray.length-1;i>=0;--i) callback=createCallback(tabId,injectDetailsArray[i],callback);
	if (callback !== null) callback(); // execute outermost function
}

// Defer update until clear
chrome.runtime.onUpdateAvailable.addListener(function(details){
	waitUntilClear('update',function(){
		setItemProcessing(1,function(){
			chrome.runtime.reload();
		});
	});
});

// refresh pages on install or upgrade
chrome.runtime.onInstalled.addListener(function(details){
	if(debug) console.log(details);
	chrome.tabs.query({}, function(tabs){
		if(details.reason=='install') var t='installed';
		else if(details.reason=='update') var t='updated';
		for(var i=0;i<tabs.length;i++){
			if(!tabs[i].url) continue;
			if(tabs[i].url.indexOf('.reddit.com/')!==-1){
				var p1=/^https:\/\/(.*)\.reddit\.com\/r\/[^\/]*\/$/; // index pages
				var p2=/^https:\/\/(.*)\.reddit\.com\/r\/(.*)\/comments\/(.*)/; // comment pages
				if(!p1.test(tabs[i].url.split("?")[0])&&!p2.test(tabs[i].url)) continue;
				executeScripts(tabs[i].id, [
					// remove divs, skip sent; remove send tip links, skip sent; save/restore open tip amounts & units
					{ code: "var save=[],sent=0;var bchs=document.getElementsByClassName('bchtip_div');for(i=bchs.length-1;i>=0;i--){var id=bchs[i].getAttribute('data-id');if(document.getElementById('bchtip_div'+id)&&document.getElementById('bchtip_div'+id).getAttribute('data-sent'))continue;save.push({'data':document.getElementById('bchtip'+id).getAttribute('data-tip'),'amt':document.getElementById('bchtip_amt'+id).value,'unit':document.getElementById('bchtip_unit'+id).value});removeElem(bchs[i])}var bchs=document.getElementsByClassName('bchtip_link');for(i=bchs.length-1;i>=0;i--){var id=bchs[i].getAttribute('data-id');if(document.getElementById('bchtip_div'+id)&&document.getElementById('bchtip_div'+id).getAttribute('data-sent')){document.getElementById('bchtip'+id).innerHTML='sent tip locked due to update, refresh page';sent++;continue}var p=bchs[i].parentNode;removeElem(bchs[i]);removeElem(p)}function removeElem(e){return e.parentNode.removeChild(e)}" },
					{ file: "lib/bignumber.min.js" },
					{ file: "lib/bchaddrjs-0.2.0.min.js" },
					{ file: "lib/bitcoincash-0.1.10.min.js" },
					{ file: "lib/chrome-Storage-largeSync.min.js" },
					{ file: "lib/lz-string.min.js" },
					{ file: "global.js" },
					{ file: "reddit.js" },
					{ code: "if(save.length>0||sent>0){var saves=[],ids=[];setTimeout(function(){var x=document.getElementsByClassName('flat-list buttons');for(i=0;i<x.length;i++){var y=x[i].getElementsByTagName('li');y=y[y.length-1];if(!y) continue;var a=x[i].parentNode.parentNode.getElementsByClassName('author');a=a[0].innerHTML;if(a=='[deleted]')continue;else if(a=='AutoModerator')continue;if(y.getElementsByTagName('a')[0]&&y.getElementsByTagName('a')[0].getAttribute('data-tip')){var id=y.getElementsByTagName('a')[0].getAttribute('data-tip').split(';')[0];var u=y.getElementsByTagName('a')[0].getAttribute('data-tip').split(';')[2];for(j=0;j<save.length;j++){if(save[j].data.split(';')[2]==u){ids.push(id);saves.push(save[j]);break}}}}if(ids.length>0){if(!document.getElementById('bchtip_div'+ids[0]))document.getElementById('bchtip'+ids[0]).click();setTimeout(function(){document.getElementById('bchtip_amt'+ids[0]).value=saves[0].amt;document.getElementById('bchtip_unit'+ids[0]).value=saves[0].unit},3000)}if(ids.length>1)setTimeout(function(){for(var i=1;i<ids.length;i++){if(!document.getElementById('bchtip_div'+ids[i]))document.getElementById('bchtip'+ids[i]).click();setTimeout(function(){for(var i=1;i<ids.length;i++){document.getElementById('bchtip_amt'+ids[i]).value=saves[i].amt;document.getElementById('bchtip_unit'+ids[i]).value=saves[i].unit}},3000)}},4000);if(sent>0)updateUtxos()},4000)}iqwerty.toast.Toast('BCH Tips has "+t+". :)',{style:{main:{'font-size':'16px'}},settings:{duration:12000}})" }
				]);
   			}
		}
	});
	setItemProcessing('',function(){
		waitUntilClear('install/update',function(){
			setItemProcessing(1,function(){
				// add default options if dont exist
				chrome.storage.largeSync.get(['options'],function(o){
					if(!o.options){
						if(debug) console.log('no options found, setting to default');
						var o={queue_run_freq:5,queue_item_delay:3,show_timing_note:1,bg_sent_notification:1,tip_sent_msg:'I sent you a tip of {amount}{foryourpost} with {bchtips}!',tip_queued_msg:'I tipped you {amount}{foryourpost}! {howto}'};
						chrome.storage.largeSync.set({options:o},function(){
							setItemProcessing('',function(){});
						});
					} else {
						if(cmpVersions(details.previousVersion,'1.0.15')<0){
							if(debug) console.log('raising queue_item_delay and setting default dynamic msgs');
							chrome.storage.largeSync.get(['options'],function(o){
								var p=o;
								if(o.options.queue_item_delay<3) p.options.queue_item_delay=3;
								p.options.tip_sent_msg='I sent you a tip of {amount}{foryourpost} with {bchtips}!';
								p.options.tip_queued_msg='I tipped you {amount}{foryourpost}! {howto}';
								chrome.storage.largeSync.set(p,function(){
									setItemProcessing('',function(){});
								});
							});
						} else {
							setItemProcessing('',function(){});
						}
					}
				});
			});
		});
	});
	// clean up notifs
	chrome.storage.local.remove('notifs');
	//setItemProcessing('',function(){});
});

chrome.contextMenus.removeAll();
chrome.contextMenus.create({
      title: "Transactions",
      contexts: ["browser_action"],
      onclick: function() {
        window.open(chrome.extension.getURL("tx.html"));
      }
});
  
chrome.notifications.onButtonClicked.addListener(function(ni,bi){
		chrome.storage.local.get('notifs',function(o){
			//if(debug){ console.log('notifClicked ni='+ni+' bi='+bi+' notifs='); console.log(o.notifs); }
			var url=o.notifs[ni][bi];
			window.open(url,'_blank');
		});
});

chrome.notifications.onClosed.addListener(function(id,bu){
	chrome.storage.local.get('notifs',function(o){
		//if(debug){ console.log('notification closed, id='+id+' byuser='+bu); }
		delete o.notifs[id];
		//if(debug){ console.log('new notifs='); console.log(o.notifs); }
		chrome.storage.local.set({notifs:o.notifs});
	});
});


if(debug){
	var m=new SpeechSynthesisUtterance('event page loaded');
	speechSynthesis.speak(m);
	chrome.runtime.onSuspend.addListener(function(a){
		var m=new SpeechSynthesisUtterance('suspending event page');
		speechSynthesis.speak(m);
	});
	chrome.runtime.onSuspendCanceled.addListener(function(a){
		var m=new SpeechSynthesisUtterance('suspend canceled');
		speechSynthesis.speak(m);
	});
}


var evg={si:'',serr:0,nl:{},item:'',lastd:0,start:Date.now(),itemdelay:0};

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',afterDOMLoaded); else afterDOMLoaded();
function afterDOMLoaded(){
	// set tx queue alarm
	chrome.alarms.clear('txq');
	chrome.alarms.get('txq',function(a){
		if(debug){ console.log('alarm txq a='); console.log(a); }
		if(!a || (a && a.periodInMinutes!=1)){
			if(debug) console.log('alarm not set or period != 1, setting');
			chrome.alarms.clear('txq');
			chrome.alarms.create('txq',{periodInMinutes:1});
			if(debug) setTimeout(function(){ chrome.alarms.getAll(function(a){ console.log('alarms='); console.log(a); }); },1000);
		}
	});

	chrome.alarms.onAlarm.addListener(function(a){
		if(debug) console.log('alarm '+a.name+' fired.');
		if(a.name=='txq'||a.name=='txq_test') txqInit();
	});
	
	// init
	function txqInit(){
		if(debug) console.log('txqInit() '+Date.now());
		var now=Date.now();
		chrome.storage.largeSync.get(['options','txq_lastrun','txq_lastattempt'],function(o){ // todo: only read as needed
			evg.itemdelay=o.options.queue_item_delay;
			if(debug) console.log('initial itemdelay seconds='+evg.itemdelay);
			if(!o.txq_lastattempt) o.txq_lastattempt=0;
			if(now-o.txq_lastattempt<((o.options.queue_item_delay*1000)+25000)){ // queue_item_delay+ to allow for sync delay and 15s ajax timeout
				if(debug) console.log('last attempt '+(now-o.txq_lastattempt)+' < '+((o.options.queue_item_delay*1000)+30000)+' ago, skipping queue run');
				return;
			}
			var locktime=(parseInt(o.options.queue_run_freq)*1000*60)-10000;
			var dorun='';
			if(!o.txq_lastrun) o.txq_lastrun=Date.now()-locktime;
			var lr=Date.now()-o.txq_lastrun;
			if(lr>=locktime) dorun=1;
			if(dorun){
				if(debug) console.log('txq last run '+lr+'/'+locktime+' ago. running now');
				chrome.storage.largeSync.set({txq_lastrun:now});
				evg.item='',evg.lastd=0,evg.start=now; // reset
				send(1);
			} else {
				if(debug) console.log('txq last run '+lr+'/'+locktime+' ago. not time to run');
			}
		});
	}
	setTimeout(function(){ waitUntilClear('init',function(){ txqInit(); }); },1000);
	
	// send current item
	function send(first){
		if(debug){ console.log('send() evg='); console.log(evg); }
		if(first) var waituntil=Date.now(); else waituntil=Date.now()+parseInt(evg.itemdelay)*1000;
		if(debug) console.log('waituntil='+waituntil);
		waitUntil(waituntil,'send()',function(){
			waitUntilClear('send()',function(){
				setItemProcessing(1,function(){
					chrome.storage.largeSync.get(['options','data','fee','tx_queue','tx_attempts'],function(o){
						if(!o.data || !o.data.waddr || !o.data.wkey){
							if(debug) console.log('no wallet addr/key set. aborting'); // todo: notify
							setItemProcessing('',function(){});
							return;
						}
						//if(debug){ console.log('ls o='); console.log(o); }
						if(o && o.tx_queue && o.tx_queue.length>0){
							if(debug && evg.lastd==0){ console.log('queue items='); console.log(o.tx_queue); }
							// get next newest item
							var found='';
							for(var i=0;i<o.tx_queue.length;i++) if(o.tx_queue[i][0]>evg.lastd){ found=1; evg.item=o.tx_queue[i]; evg.lastd=evg.item[0]; break; }
							if(!found){
								if(debug) console.log('no item found newer than '+evg.lastd+'. all done');
								if(debug){ var m=new SpeechSynthesisUtterance('all done'); speechSynthesis.speak(m); }
								setItemProcessing('',function(){});
								return;
							} else if(debug) console.log('item='+evg.item.join(' '));
							
							var r=sendQueued([o,evg.item,1],function(cb){
								setItemProcessing('',function(){});
								if(debug){ console.log('cb='); console.log(cb); }
								if(cb.error && cb.m=='duplicate txid'){
									if(debug) console.log('got duplicate txid, ignoring for now');
									send();
									return;
								} if(cb.error && cb.m=='mempool conflict'){
									if(debug) console.log('got mempool conflict, retrying');
									evg.lastd=evg.lastd-1;
									send();
									return;
								} else if(cb.error){
									if(debug) console.log('got fatal error, aborting queue run');
									return;
								}
								send();
							});
						} else {
							if(debug) console.log('no items to send');
							setItemProcessing('',function(){});
							return;
						}
					});
				});
			});
		});
	}
}