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
					// todo: if want skipped 'send tip' and reset links to work have to remove and replace everything - too little benefit for all that
					{ code: "var save=[],sent=0;var bchs=document.getElementsByClassName('bchtip_div');for(i=bchs.length-1;i>=0;i--){var id=bchs[i].getAttribute('data-id');if(document.getElementById('bchtip_div'+id)&&document.getElementById('bchtip_div'+id).getAttribute('data-sent'))continue;save.push({'data':document.getElementById('bchtip'+id).getAttribute('data-tip'),'amt':document.getElementById('bchtip_amt'+id).value,'unit':document.getElementById('bchtip_unit'+id).value});removeElem(bchs[i])}var bchs=document.getElementsByClassName('bchtip_link');for(i=bchs.length-1;i>=0;i--){var id=bchs[i].getAttribute('data-id');if(document.getElementById('bchtip_div'+id)&&document.getElementById('bchtip_div'+id).getAttribute('data-sent')){document.getElementById('bchtip'+id).innerHTML='tip locked due to update, refresh page to reset';sent++;continue}var p=bchs[i].parentNode;removeElem(bchs[i]);removeElem(p)}function removeElem(e){return e.parentNode.removeChild(e)}" },
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

// tries to send up to ~250 queued tips every 60m
// 14s between requests to profile page and bchtips database
var si='',serr=0,nl={},lastd=0,start=Date.now(),locktime=3570000,afreqm=10,pertryms=14000,senttxids={};
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',afterDOMLoaded); else afterDOMLoaded();
function afterDOMLoaded(){

	// set alarm
	//chrome.alarms.clear('txq'); // test
	chrome.alarms.get('txq',function(a){
		if(a){ if(debug){ console.log('alarm is set. a='); console.log(a); } return; }
		if(debug) console.log('creating alarm for every '+afreqm+' minutes');
		chrome.alarms.create('txq',{periodInMinutes:afreqm});
		if(debug) setTimeout(function(){ chrome.alarms.getAll(function(a){ console.log('all alarms='); console.log(a); }); },1000);
	});
	
	// init, check lock
	function txqInit(){
		if(debug) console.log('txqInit() '+Date.now());
		serr=0,lastd=0,start=Date.now(),senttxids={};
		chrome.storage.sync.get(['txq_lock'],function(o){
			if(o.txq_lock){
				var la=Date.now()-o.txq_lock;
				if(la>locktime) var le=1; else var le=''; // ~1hr
			} else var le='';
			if(!o || !o.txq_lock || le){
				if(debug) if(le) console.log('lock expired (set '+la+' ago), setting and sending'); else console.log('no lock, setting and sending');
				chrome.storage.sync.set({'txq_lock':Date.now()});
				send();
			} else {
				if(debug) console.log('lock found ('+la+'/'+locktime+'), not sending');
				// if crash or reinstall lock will be set until expiry - cant detect particular browser
			}
		});
	}
	txqInit();
	chrome.alarms.onAlarm.addListener(function(a){ txqInit(); });
	
	// send current item
	function send(){
		if(!si) si=setInterval(function(){ send(); },pertryms);
		if(Date.now()-start>locktime){
			if(debug) console.log('script running longer than max lock time, aborting');
			clearInterval(si);
			return;
		}
		// get wallet & fee
		chrome.storage.sync.get(['data','fee'],function(df){
			//if(debug){ console.log('df='); console.log(df); }
			if(!df.data || !df.data.waddr || !df.data.wkey){
				if(debug) console.log('no wallet addr/key set. aborting');
				clearInterval(si);
				//chrome.storage.sync.set({'txq_lock':''});
				return;
			}
			// check if items in queue
			chrome.storage.largeSync.get(['tx_queue'],function(o){
				//if(debug){ console.log('ls o='); console.log(o); }
				if(o && o.tx_queue && o.tx_queue.length>0){
					//if(debug){ console.log('all items='); console.log(o.tx_queue);
					// get next newest item
					var found='';
					for(var i=0;i<o.tx_queue.length;i++) if(o.tx_queue[i][0]>lastd){ found=1; var item=o.tx_queue[i]; lastd=item[0]; break; }
					if(!found){
						if(debug) console.log('no item found newer than '+lastd+'. all done');
						clearInterval(si);
						//chrome.storage.sync.set({'txq_lock':''});
						return;
					} else if(debug) console.log('item='+item.join(' '));

					// first, just get user address
					var x0=new XMLHttpRequest(); x0.open("GET","https://www.reddit.com/user/"+item[2],true);
					var x1=new XMLHttpRequest(); x1.open("GET","https://cdn.bchftw.com/bchtips/reddit/"+item[2][0].toLowerCase()+".csv",true);
					var xs0=[x0,x1];
					onRequestsComplete(xs0, function(xr, xerr){
						//if(debug){ console.log('xs0='); console.log(xs0); }
						// check for error
						for(let i=0;i<xs0.length;i++){
							if((xs0[i].status!==200 || (i!==1 && xs0[i].responseText=='') || (i==0 && xs0[i].responseText.indexOf('user/'+item[2])===-1)) && !(i==0 && xs0[i].responseText.indexOf('u/'+item[2]+': page not found')>-1)){
								if(i==0) var m='checking reddit profile'; else if(i==1) var m='checking user database';
								if(debug){ console.log('error '+m+'. xs0='); console.log(xs0); }
								serr++;
								if(serr>2){
									if(debug) console.log('too many errors. abort (0)');
									clearInterval(si);
									//chrome.storage.sync.set({'txq_lock':''});
									return;
								}
								return;
							}
						}
						// check if got an address
						var uaddr='';
						var e=document.createElement('html');
						e.innerHTML=x0.responseText;
						var d=e.getElementsByClassName("ProfileSidebar__description");
						if(d.length>0){ // legacy profiles have no description
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
							if(ar[item[2]]) uaddr=ar[item[2]];
						}
						if(!uaddr){ if(debug) console.log('no user address, abort'); return; }
				
						// got an address, get utxos and fee estimate
						if(!df.fee || !df.fee.last || !df.fee.val || (Date.now()-df.fee.last>60000)) var dofee=1; else var dofee='';
						var x2=new XMLHttpRequest(); x2.open("GET","https://blockdozer.com/insight-api/addr/"+df.data.waddr+"/utxo",true);
						if(dofee){
							if(debug) console.log('updating fee');
							var x3=new XMLHttpRequest(); x3.open("GET","https://blockdozer.com/insight-api/utils/estimatefee/",true);
							var xs1=[x2,x3];
						} else var xs1=[x2];
						onRequestsComplete(xs1, function(xr, xerr){
							if(debug){ console.log('xs1='); console.log(xs1); }
							for(let i=0;i<xs1.length;i++){
								if(xs1[i].status!==200 || xs1[i].responseText==''){
									if(i==2) var m='checking utxos'; else if(i==3) var m='updating fee estimate';
									if(debug){ console.log('error '+m+' xs1='); console.log(xs1); }
									serr++;
									if(serr>2){
										if(debug) console.log('too many errors. abort (1)');
										clearInterval(si);
										//chrome.storage.sync.set({'txq_lock':''});
										return;
									}
									return;
								}
							}
							serr=0;
							if(dofee){
								try { var f=JSON.parse(x3.responseText)["2"]; } catch(e){}
								f=Math.ceil(f*10000000)/100; // round up to nearest 10 sat/kb
								fr=f;
								ferr=0;
								chrome.storage.sync.set({'fee':{ last: Date.now(), val: fr }});
							} else fr=df.fee.val;
							//if(debug) console.log('fee estimate='+fr+' sat/B');
							//if(debug) console.log('got everything we need. time to send.');
							//if(debug) console.log('creating tx');
							var amt=parseFloat(BigNumber(item[1].split(' ')[0]).times(100000000).toFixed(0));
							//if(debug) console.log('amt='+amt);
							var tx=makeTx(x2.responseText,df.data.waddr,df.data.wkey,uaddr,amt,fr);
							//if(debug){ console.log('tx='); console.log(tx); }
							if(tx.status==1){
								//if(debug) console.log('sending tx');
								var x=new XMLHttpRequest();
								x.open("POST","https://blockdozer.com/insight-api/tx/send",true);
								x.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
								x.onreadystatechange=function(){
									if(x.readyState==4){
										if(x.status==200){
											if(debug) console.log('x.responseText='+x.responseText);
											if(x.responseText){
												try { var r=JSON.parse(x.responseText); } catch(e){}
												//if(debug){ console.log('r='); console.log(r); }
												// add to tx_sent
												if(r.txid){
													if(senttxids[r.txid]){
														// wasn't really accepted - can happen if two tips for same amount to same user before confirmation
														if(debug) console.log('duplicate txid received ('+r.txid+') - wasn\'t really sent, skipping for now');
														return;
													}
													if(debug) console.log('sent '+item[1]+' to '+item[2]+ '. tx='+r.txid);
													var m=new SpeechSynthesisUtterance('Tip sent');
													speechSynthesis.speak(m);
													if(item[5]=='r') var st='Reddit';
													chrome.notifications.create('',{'type':'basic','iconUrl':'img/icon.png','title':'Tip sent','message':'Pending tip of '+item[1]+' sent to '+item[2]+' on '+st+'.','requireInteraction':false,'buttons':[{'title':'View Post/Comment'},{'title':'View TX on Blockchain'}]},function(id){
															// add to listener object
															//if(debug){ console.log('created notif id='); console.log(id); }
															nl[id]=['https://www.reddit.com'+item[3],'https://blockdozer.com/insight/tx/'+r.txid];
															removeOldListeners();
													});
													chrome.notifications.onButtonClicked.addListener(function(ni,bi){
															var url=nl[ni][bi];
															//if(debug) console.log('ni='+ni+' bi='+bi+' url='+url);
															window.open(url,'_blank');
													});
													// remove from tx_queue
													chrome.storage.largeSync.get(['tx_queue'],function(oq){
														for(var i=0;i<oq.tx_queue.length;i++) if(oq.tx_queue[i][0]==item[0]){
															oq.tx_queue.splice(i,1);
															chrome.storage.largeSync.set(oq);
															break;
														}
													});
													// add to tx_sent
													chrome.storage.largeSync.get(['tx_sent'],function(os){
														//if(debug){ console.log('ls os='); console.log(os); }
														if(!os || !os.tx_sent){ os={}; os.tx_sent=[]; }
														os.tx_sent.push([Date.now(),item[1],item[2],item[3],r.txid,'r']); // 0=time 1=amt 2=user 3=url 4=txid 5=site(r,t)
														if(os.tx_sent.length>250){ while(1){ os.tx_sent.shift(); if(os.tx_sent.length<=250) break; } }
														chrome.storage.largeSync.set(os);
													});
													// refresh tx pages
													setTimeout(function(){
														for(let i=0;i<chrome.extension.getViews().length;i++) if(chrome.extension.getViews()[i].location.pathname.indexOf('/tx.html')!==-1) chrome.extension.getViews()[i].refreshData();
													},5000);
													senttxids[r.txid]=1;
												} else senderr=1;
											} else var senderr=1;
										} else var senderr=1;
									}
									if(senderr){
										if(x.responseText.indexOf('txn-mempool-conflict')!==-1){
											// retry
											if(debug) console.log('mempool conflict (waiting for new utxo), retrying');
											lastd=item[0]-1;
											return;
										}
										if(debug){ console.log('send error. r='+x.responseText+' x='); console.log(x); }
									}
								}
								x.send('rawtx='+tx.tx);
							} else {
								// insufficient funds or other
								if(debug){ console.log('error'); console.log(tx); }
								if(tx.msg=='insufficient funds'){
									chrome.notifications.getAll(function(n){
										if(!n.need_funds){
											var m=new SpeechSynthesisUtterance('insufficient funds');
											speechSynthesis.speak(m);
											chrome.notifications.create('need_funds',{'type':'basic','iconUrl':'img/icon.png','title':'Fund your wallet','message':'Pending tips can\'t be sent due to insufficient funds.','requireInteraction':true},function(){});
										}
									});
									clearInterval(si);
									//chrome.storage.sync.set({'txq_lock':''});
									return;
								}
							}
						});
						x2.send(); if(dofee) x3.send();
					});
					x0.send(); x1.send();
				} else {
					if(debug) console.log('no items to send');
					clearInterval(si);
					//chrome.storage.sync.set({'txq_lock':''});
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

// remove old listeners https://stackoverflow.com/a/33135296
function removeOldListenersCB(cb){
	chrome.notifications.getAll(function(n){ cb(n); });
}
function removeOldListeners(){
	if(!nl) return;
	removeOldListenersCB(function(n){
		for(var p in nl) if(nl.hasOwnProperty(p)) if(!n[p]) delete nl[p];
	});
}