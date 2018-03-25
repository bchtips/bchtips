/* BCH Tips event.js */
// tries to send up to 250 queued tips every 60m
// 14s between requests to profile page and bchtips database
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',afterDOMLoaded); else afterDOMLoaded();
function afterDOMLoaded(){
	chrome.alarms.clear('txq'); // test
	chrome.alarms.get('txq',function(a){
		if(a) return;
		console.log('creating alarm');
		chrome.alarms.create('txq',{periodInMinutes:1});
	});
	// check if running elsewhere
	function txqInit(){
		console.log('txqInit() '+Date.now());
		chrome.storage.sync.get(['txq_lock'],function(o){
			if(o.txq_lock){
				var la=Date.now()-o.txq_lock;
				if(la>3580000) var le=1; else var le=''; // ~1hr
			} else var le='';
			if(!o || !o.txq_lock || le){
				if(le) console.log('lock expired (set '+la+' ago), setting and sending'); else console.log('no lock, setting and sending');
				chrome.storage.sync.set({'txq_lock':Date.now()});
				send();
			} else {
				console.log('lock found (set '+la+' ago), we\'re running');
				// if crash or reinstall lock will be set until expiry - cant detect particular browser
			}

		});
	}
	txqInit();
	chrome.alarms.onAlarm.addListener(function(a){ txqInit(); });
	
	// send all queued items
	si='',serr=0,nl={};
	function send(){
		//console.log('send()');
		if(!si) si=setInterval(function(){ send(); },14000);
		// get wallet & fee
		chrome.storage.sync.get(['data','fee'],function(df){
			//console.log('df='); console.log(df);
			if(!df.data || !df.data.waddr || !df.data.wkey){
				//console.log('no wallet addr/key set. aborting');
				clearInterval(si);
				chrome.storage.sync.set({'txq_lock':''});
				return;
			}
			// check if items in queue
			chrome.storage.largeSync.get(['tx_queue'],function(o){
				//console.log('ls o='); console.log(o);
				if(o && o.tx_queue && o.tx_queue.length>0){
					//console.log(o.tx_queue.length+' queued items to send. current='); console.log(o.tx_queue[0]);
					// first, just get user address
					var x0=new XMLHttpRequest(); x0.open("GET","https://www.reddit.com/user/"+o.tx_queue[0][2],true);
					var x1=new XMLHttpRequest(); x1.open("GET","https://bchftw.com/bchuser?s=r&u="+o.tx_queue[0][2],true);
					var xs0=[x0,x1];
					onRequestsComplete(xs0, function(xr, xerr){
						//console.log('xs0='); console.log(xs0);
						// check for error
						for(let i=0;i<xs0.length;i++){
							if((xs0[i].status!==200 || xs0[i].responseText=='' || (i==0 && xs0[i].responseText.indexOf('user/'+o.tx_queue[0][2])===-1)) && !(i==0 && xs0[i].responseText.indexOf('u/'+o.tx_queue[0][2]+': page not found')>-1)){
								if(i==0) var m='checking reddit profile'; else if(i==1) var m='checking user database';
								console.log('error '+m+'. xs0='); console.log(xs0);
								serr++;
								if(serr>2){
									console.log('too many errors. abort (0)');
									clearInterval(si);
									chrome.storage.sync.set({'txq_lock':''});
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
						if(d.length>0){ // legacy profiles have no description or may be maintenance page
							var d=e.getElementsByClassName("ProfileSidebar__description")[0].innerHTML;
							d=d.replace('\\n','').split(' ');
							for(i=d.length;i>=0;i--) try { if(bchaddr.isCashAddress(d[i])==true) uaddr=d[i].replace('bitcoincash:',''); } catch(e){}
						}
						// no addr from profile, check db response
						if(!uaddr) if(x1.responseText.trim()!=='nf') uaddr=x1.responseText.trim();
						if(!uaddr){ console.log('no user address, abort'); return; }
				
						// got an address, get utxos and fee estimate
						if(!df.fee || !df.fee.last || !df.fee.val || (Date.now()-df.fee.last>60000)) var dofee=1; else var dofee='';
						var x2=new XMLHttpRequest(); x2.open("GET","https://blockdozer.com/insight-api/addr/"+df.data.waddr+"/utxo",true);
						if(dofee){
							console.log('updating fee');
							var x3=new XMLHttpRequest(); x3.open("GET","https://blockdozer.com/insight-api/utils/estimatefee/",true);
							var xs1=[x2,x3];
						} else var xs1=[x2];
						onRequestsComplete(xs1, function(xr, xerr){
							console.log('xs1='); console.log(xs1);
							for(let i=0;i<xs1.length;i++){
								if(xs1[i].status!==200 || xs1[i].responseText==''){
									if(i==2) var m='checking utxos'; else if(i==3) var m='updating fee estimate';
									console.log('error '+m+' xs1='); console.log(xs1);
									serr++;
									if(serr>2){
										console.log('too many errors. abort (1)');
										clearInterval(si);
										chrome.storage.sync.set({'txq_lock':''});
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
							//console.log('fee estimate='+fr+' sat/B');
							//console.log('got everything we need. time to send.');
							//console.log('creating tx');
							var amt=Math.floor(parseFloat(o.tx_queue[0][1].split(' ')[0]*100000000));
							//console.log('amt='+amt);
							var tx=makeTx(x2.responseText,df.data.waddr,df.data.wkey,uaddr,amt,fr);
							//console.log('tx='); console.log(tx);
							if(tx.status==1){
								//console.log('sending tx');
								var x=new XMLHttpRequest();
								x.open("POST","https://blockdozer.com/insight-api/tx/send",true);
								x.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
								x.onreadystatechange=function(){
									if(x.readyState==4){
										if(x.status==200){
											console.log('x.responseText='+x.responseText);
											if(x.responseText){
												try { var r=JSON.parse(x.responseText); } catch(e){}
												//console.log('r='); console.log(r);
												// add to tx_sent
												if(r.txid){
													console.log('sent '+o.tx_queue[0][1]+' to '+o.tx_queue[0][2]+ '. tx='+r.txid);
													var m=new SpeechSynthesisUtterance('Tip sent');
													speechSynthesis.speak(m);
													if(o.tx_queue[0][5]=='r') var st='Reddit';
													chrome.notifications.create('',{'type':'basic','iconUrl':'img/icon.png','title':'Tip sent','message':'Pending tip of '+o.tx_queue[0][1]+' sent to '+o.tx_queue[0][2]+' on '+st+'.','requireInteraction':false,'buttons':[{'title':'View Post/Comment'},{'title':'View TX on Blockchain'}]},function(id){
															// add to listener object
															//console.log('created notif id='); console.log(id);
															nl[id]=['https://www.reddit.com'+o.tx_queue[0][3],'https://blockdozer.com/insight/tx/'+r.txid];
															removeOldListeners();
													});
													// todo: buttons
													chrome.notifications.onButtonClicked.addListener(function(ni,bi){
															var url=nl[ni][bi];
															//console.log('ni='+ni+' bi='+bi+' url='+url);
															window.open(url,'_blank');
													});
													// remove from tx_queue
													chrome.storage.largeSync.get(['tx_queue'],function(oq){
														oq.tx_queue.splice(0,1);
														chrome.storage.largeSync.set(oq);
														if(oq.tx_queue.length==0){
															//console.log('all done. clearing send interval and lock');
															clearInterval(si);
															chrome.storage.sync.set({'txq_lock':''});
															return;
														}
													});
													// add to tx_sent
													chrome.storage.largeSync.get(['tx_sent'],function(os){
														//console.log('ls os='); console.log(os);
														if(!os || !os.tx_sent){ os={}; os.tx_sent=[]; }
														os.tx_sent.push([Date.now(),o.tx_queue[0][1],o.tx_queue[0][2],o.tx_queue[0][3],r.txid,'r']); // 0=time 1=amt 2=user 3=url 4=txid 5=site(r,t)
														if(os.tx_sent.length>250){ while(1){ os.tx_sent.shift(); if(os.tx_sent.length<=250) break; } }
														chrome.storage.largeSync.set(os);
													});
													console.log(chrome.extension.getViews());
													// refresh tx pages
													setTimeout(function(){
														for(let i=0;i<chrome.extension.getViews().length;i++) if(chrome.extension.getViews()[i].location.pathname.indexOf('/tx.html')!==-1) chrome.extension.getViews()[i].refreshData();
													},5000);
												} else senderr=1;
											} else var senderr=1;
										} else var senderr=1;
									}
									if(senderr){
										console.log("send error x="); console.log(x);
									}
								}
								x.send('rawtx='+tx.tx);
							} else {
								// insufficient funds or other
								console.log('error'); console.log(tx);
								if(tx.msg=='insufficient funds'){
									chrome.notifications.getAll(function(n){
										if(!n.need_funds){
											var m=new SpeechSynthesisUtterance('insufficient funds');
											speechSynthesis.speak(m);
											chrome.notifications.create('need_funds',{'type':'basic','iconUrl':'img/icon.png','title':'Fund your wallet','message':'Pending tips can\'t be sent due to insufficient funds.','requireInteraction':true},function(){});
										}
									});
									clearInterval(si);
									chrome.storage.sync.set({'txq_lock':''});
									return;
								}
							}
						});
						x2.send(); if(dofee) x3.send();
					});
					x0.send(); x1.send();
				} else {
					console.log('no items to send');
					clearInterval(si);
					chrome.storage.sync.set({'txq_lock':''});
					return;
				}
			});
		});
	
	}

}

// remove old listeners https://stackoverflow.com/a/33135296
function removeOldListenersCB(cb){
	console.log('removeOldListeners()');
	chrome.notifications.getAll(function(n){ cb(n); });
}
function removeOldListeners(){
	removeOldListenersCB(function(n){
		for(var p in nl) if(nl.hasOwnProperty(p)) if(!n[p]){ console.log('deleting expired listener: '+p); delete nl[p]; }
	});
}