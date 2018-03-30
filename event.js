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

// refresh pages on install or upgrade
chrome.runtime.onInstalled.addListener(function(details){
	//if(debug) console.log(details);
	chrome.tabs.query({}, function(tabs){
		//if(debug) console.log(tabs);
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



// tries to send up to ~250 queued tips every 60m
// 14s between requests to profile page and bchtips database
var evg={si:'',serr:0,nl:{},item:'',lastd:0,start:Date.now(),locktime:3570000,afreqm:10,pertryms:14000,senttxids:{}};

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',afterDOMLoaded); else afterDOMLoaded();
function afterDOMLoaded(){

	// set alarm
	//chrome.alarms.clear('txq');
	chrome.alarms.get('txq',function(a){
		if(a){ if(debug){ console.log('alarm is set. a='); console.log(a); } return; }
		if(debug) console.log('creating alarm for every '+evg.afreqm+' minutes');
		chrome.alarms.create('txq',{periodInMinutes:evg.afreqm});
		if(debug) setTimeout(function(){ chrome.alarms.getAll(function(a){ console.log('alarms='); console.log(a); }); },1000);
	});
	
	// init, check lock
	function txqInit(){
		if(debug) console.log('txqInit() '+Date.now());
		chrome.storage.sync.get(['txq_lock'],function(o){
			if(o.txq_lock){
				var la=Date.now()-o.txq_lock;
				if(la>evg.locktime) var le=1; else var le=''; // ~1hr
			} else var le='';
			if(!o || !o.txq_lock || le){
				if(debug) if(le) console.log('lock expired (set '+la+' ago), setting and sending'); else console.log('no lock, setting and sending');
				chrome.storage.sync.set({'txq_lock':Date.now()});
				evg.serr=0,evg.item='',evg.lastd=0,evg.start=Date.now(),evg.senttxids={}; // reset when page isnt reloaded
				send();
			} else {
				if(debug) console.log('lock found ('+la+'/'+evg.locktime+'), not sending');
				// if crash or reinstall lock will be set until expiry - cant detect particular browser
			}
		});
	}
	txqInit();
	chrome.alarms.onAlarm.addListener(function(a){ txqInit(); });
	
	// send current item
	function send(){
		//chrome.runtime.getBackgroundPage(function(a){ });
		if(debug){ var m=new SpeechSynthesisUtterance('trying to send'); speechSynthesis.speak(m); }
		if(debug){ console.log('send() evg='); console.log(evg); }
		if(!evg.si) evg.si=setInterval(function(){ send(); },evg.pertryms);
		if(Date.now()-evg.start>evg.locktime){
			if(debug) console.log('script running longer than max lock time, aborting'); // todo: move lock up
			clearInterval(evg.si); evg.si='';
			return;
		}
		// get wallet & fee
		chrome.storage.sync.get(['data','fee'],function(df){
			//if(debug){ console.log('df='); console.log(df); }
			if(!df.data || !df.data.waddr || !df.data.wkey){
				if(debug) console.log('no wallet addr/key set. aborting'); // todo: notify
				clearInterval(evg.si); evg.si='';
				//chrome.storage.sync.set({'txq_lock':''});
				return;
			}
			// check if items in queue
			chrome.storage.largeSync.get(['tx_queue'],function(o){
				//if(debug){ console.log('ls o='); console.log(o); }
				if(o && o.tx_queue && o.tx_queue.length>0){
					if(debug && evg.lastd==0){ console.log('queue items='); console.log(o.tx_queue); }
					// get next newest item
					var found='';
					for(var i=0;i<o.tx_queue.length;i++) if(o.tx_queue[i][0]>evg.lastd){ found=1; evg.item=o.tx_queue[i]; evg.lastd=evg.item[0]; break; }
					if(!found){
						if(debug) console.log('no item found newer than '+evg.lastd+'. all done');
						if(debug){ var m=new SpeechSynthesisUtterance('all done'); speechSynthesis.speak(m); }
						clearInterval(evg.si); evg.si='';
						return;
					} else if(debug) console.log('item='+evg.item.join(' '));

					// first, just get user address
					var x0=new XMLHttpRequest(); x0.timeout=15000; x0.open("GET","https://www.reddit.com/user/"+evg.item[2],true);
					var x1=new XMLHttpRequest(); x1.timeout=15000; x1.open("GET","https://cdn.bchftw.com/bchtips/reddit/"+evg.item[2][0].toLowerCase()+".csv",true);
					var xs0=[x0,x1];
					onRequestsComplete(xs0, function(xr, xerr){
						//if(debug){ console.log('xs0='); console.log(xs0); }
						// check for error
						for(let i=0;i<xs0.length;i++){
							if((xs0[i].status!==200 || (i!==1 && xs0[i].responseText=='') || (i==0 && xs0[i].responseText.indexOf('user/'+evg.item[2])===-1)) && !(i==0 && xs0[i].responseText.indexOf('u/'+evg.item[2]+': page not found')>-1)){
								if(i==0) var m='checking reddit profile'; else if(i==1) var m='checking user database';
								if(debug){ console.log('error '+m+'. xs0='); console.log(xs0); }
								evg.serr++;
								if(evg.serr>2){
									if(debug) console.log('too many errors. abort (0)');
									clearInterval(evg.si); evg.si='';
									return;
								}
								return;
							}
						}
						// check if got an address
						var uaddr='';
						if(x0.responseText.indexOf('ProfileSidebar__description')!==-1){
							var e=document.createElement('html');
							e.innerHTML=x0.responseText;
							var d=e.getElementsByClassName("ProfileSidebar__description")[0].innerHTML;
							d=d.replace('\\n','').split(' ');
							for(i=d.length;i>=0;i--) try { if(bchaddr.isCashAddress(d[i])==true) uaddr=d[i].replace('bitcoincash:',''); } catch(e){}
						}
						// no addr from profile, check db response
						if(!uaddr){
							let ar=x1.responseText.split('\n').reduce(function(obj,str,index){
								let part=str.split(',');
								if(part[0] && part[1]) obj[part[0]]=part[1].trim();
								return obj;
							}, {});
							if(ar[evg.item[2]]) uaddr=ar[evg.item[2]];
						}
						if(!uaddr){ if(debug){ var m=new SpeechSynthesisUtterance('no address found'); speechSynthesis.speak(m); } if(debug) console.log('no user address, abort'); return; }
				
						// got an address, get utxos and fee estimate
						if(!df.fee || !df.fee.last || !df.fee.val || (Date.now()-df.fee.last>60000)) var dofee=1; else var dofee='';
						var x2=new XMLHttpRequest(); x2.timeout=15000; x2.open("GET","https://blockdozer.com/insight-api/addr/"+df.data.waddr+"/utxo",true);
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
									if(i==2) var m='checking utxos'; else if(i==3) var m='updating fee estimate';
									if(debug){ console.log('error '+m+' xs1='); console.log(xs1); }
									evg.serr++;
									if(evg.serr>2){
										if(debug) console.log('too many errors. abort (1)');
										clearInterval(evg.si); evg.si='';
										return;
									}
									return;
								}
							}
							evg.serr=0;
							if(dofee){
								fr=Math.ceil(fr*10000000)/100; // round up to nearest 10 sat/kb
								ferr=0;
								chrome.storage.sync.set({'fee':{ last: Date.now(), val: fr }});
							} else fr=df.fee.val;
							if(fr<1){ if(debug) console.log('fee lower than 1. setting to 1.1'); fr=1.1; }
							//if(debug) console.log('fee estimate='+fr+' sat/B');
							//if(debug) console.log('got everything we need. time to send.');
							//if(debug) console.log('creating tx');
							var amt=parseFloat(BigNumber(evg.item[1].split(' ')[0]).times(100000000).toFixed(0));
							//if(debug) console.log('amt='+amt);
							var tx=makeTx(x2.responseText,df.data.waddr,df.data.wkey,uaddr,amt,fr);
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
													if(evg.senttxids[r.txid]){
														// wasn't really accepted - can happen if two tips for same amount to same user before confirmation
														if(debug) console.log('duplicate txid received ('+r.txid+') - wasn\'t really sent, skipping for now');
														return;
													}
													if(debug) console.log('sent '+evg.item[1]+' to '+evg.item[2]+ '. tx='+r.txid);
													//var m=new SpeechSynthesisUtterance('Tip sent');
													//speechSynthesis.speak(m);
													if(evg.item[5]=='r') var st='Reddit';
													chrome.notifications.create('',{'type':'basic','iconUrl':'img/icon.png','title':'Tip sent','message':'Pending tip of '+evg.item[1]+' sent to '+evg.item[2]+' on '+st+'.','requireInteraction':false,'buttons':[{'title':'View Post/Comment'},{'title':'View TX on Blockchain'}]},function(id){
															// add to listener object
															chrome.storage.local.get('notifs',function(on){
																on.notifs[id]=['https://www.reddit.com'+evg.item[3],'https://blockdozer.com/insight/tx/'+r.txid];
																//if(debug){ console.log('created notif id='+id+' notifs='); console.log(on.notifs); }
																chrome.storage.local.set({notifs:on.notifs});
															});
													});
													// remove from tx_queue
													chrome.storage.largeSync.get(['tx_queue'],function(oq){
														for(var i=0;i<oq.tx_queue.length;i++) if(oq.tx_queue[i][0]==evg.item[0]){
															oq.tx_queue.splice(i,1);
															chrome.storage.largeSync.set(oq);
															break;
														}
													});
													// add to tx_sent
													chrome.storage.largeSync.get(['tx_sent'],function(os){
														//if(debug){ console.log('ls os='); console.log(os); }
														if(!os || !os.tx_sent){ os={}; os.tx_sent=[]; }
														os.tx_sent.push([Date.now(),evg.item[1],evg.item[2],evg.item[3],r.txid,'r']); // 0=time 1=amt 2=user 3=url 4=txid 5=site(r,t)
														if(os.tx_sent.length>250){ while(1){ os.tx_sent.shift(); if(os.tx_sent.length<=250) break; } }
														chrome.storage.largeSync.set(os);
													});
													// refresh tx pages
													setTimeout(function(){
														for(let i=0;i<chrome.extension.getViews().length;i++) if(chrome.extension.getViews()[i].location.pathname.indexOf('/tx.html')!==-1 && chrome.extension.getViews()[i].document.hasFocus()) chrome.extension.getViews()[i].refreshData();
													},2000);
													evg.senttxids[r.txid]=1;
												} else senderr=1;
											} else var senderr=1;
										} else var senderr=1;
									}
									if(senderr){
										if(x.responseText.indexOf('txn-mempool-conflict')!==-1){
											// retry
											if(debug) console.log('mempool conflict (waiting for new utxo), retrying');
											evg.lastd=evg.item[0]-1;
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
											//var m=new SpeechSynthesisUtterance('insufficient funds');
											//speechSynthesis.speak(m);
											chrome.notifications.create('need_funds',{'type':'basic','iconUrl':'img/icon.png','title':'Fund your wallet','message':'Pending tips can\'t be sent due to insufficient funds.','requireInteraction':true},function(){});
										}
									});
									clearInterval(evg.si); evg.si='';
									return;
								}
							}
						});
						x2.send(); if(dofee) x3.send();
					});
					x0.send(); x1.send();
				} else {
					if(debug) console.log('no items to send');
					clearInterval(evg.si); evg.si='';
					return;
				}
			});
		});
	
	}
	
	// finish up
	function alldone(){
		// remove items not in tx_queue from tx_tocancel
	}
}