/* BCH Tips tx.js */
function cancelQueued(d,u){
	if(!confirm('Are you sure you want to cancel this tip to '+u+'?')) return;
	waitUntilClear('cancelQueued',function(){
		setItemProcessing(1,function(){
			chrome.storage.largeSync.get(['tx_queue'],function(o){
				for(var j=0;j<o.tx_queue.length;j++) if(o.tx_queue[j][0]==d){ o.tx_queue.splice(j,1); break; }
				chrome.storage.largeSync.set(o,function(){ setItemProcessing('',function(){}); });
				refreshData();
			});
		});
	});
}
/*function removeTx(d){
	if(!confirm('Are you sure you want to remove this transaction from history?')) return;
	chrome.storage.largeSync.get(['tx_sent'],function(o){
		for(var j=0;j<o.tx_sent.length;j++) if(o.tx_sent[j][0]==d){ o.tx_sent.splice(j,1); break; }
		chrome.storage.largeSync.set(o);
		refreshData();
	});
}*/

function refreshData(){
	if(debug) console.log('refreshData()');
	// queued tx
	chrome.storage.largeSync.get(['tx_queue','tx_sent','tx_attempts','options'/*,'txq_lastrun'*/],function(o){
		if(debug){ console.log('o='); console.log(o); }
		var html='';
		if(o && o.tx_queue && o.tx_queue.length>0){
			if(!o.tx_attempts) o.tx_attempts={};
			/*if(!o.txq_lastrun) o.txq_lastrun=Date.now()-3600000;
			console.log('lastrun='+o.txq_lastrun+' now='+Date.now()+' togo='+(Date.now()+(Date.now()-o.txq_lastrun)));
			var nextrun=timeago().format(Date.now()+(3600000-(Date.now()-o.txq_lastrun)));*/
			//html+='<div id="nextrun_wrap">Next run <span id="nextrun" datetime="'+nextrun+'">'+nextrun+'</span></div>';
			if(o.options.show_timing_note){ html+='<div id="checknote">Full queue checked every '+o.options.queue_run_freq+' mins'; if(o.options.user_update_enabled) html+=', user-signaled updates every '+o.options.user_update_freq+' mins'; html+='. See <a id="options" href="#">options</a>.</div>'; }
			html+='<table border="0" cellspacing="0" cellpadding="0"><thead><tr><!--<th>Site</th>--><th>Date</th><th>Amount</th><th>User</th><th>Last Tried</th><th colspan="3"></th></tr></thead><tbody>';
			for(var i=o.tx_queue.length-1;i>=0;i--){
				if(o.tx_attempts[o.tx_queue[i][0]]) var la=timeago().format(o.tx_attempts[o.tx_queue[i][0]]); else var la='-';
				// 0=time 1=amt 2=user 3=url 4=null 5=site(r,t)
				var d=new Date(o.tx_queue[i][0]);
				d=d.getFullYear() +
					'-' + ('0' + (d.getMonth()+1)).slice(-2) +
					'-' + ('0' + d.getDate()).slice(-2) +
					' ' + ('0' + d.getHours()).slice(-2) +
					':' + ('0' + d.getMinutes()).slice(-2);
				if(o.tx_queue[i][5]=='r') var s='Reddit';
				var row='<tr class="txqrc" id="txqr'+o.tx_queue[i][0]+'"><!--<td>'+s+'</td>-->'
				+'<td>'+d+'</td>'
				+'<td>'+o.tx_queue[i][1]+'</td>'
				+'<td><a target="_blank" href="https://www.reddit.com/user/'+o.tx_queue[i][2]+'">'+o.tx_queue[i][2]+'</a></td>'
				+'<td class="last"><div id="ago'+o.tx_queue[i][0]+'"'; if(o.tx_attempts[o.tx_queue[i][0]]) row+=' class="tago" datetime="'+o.tx_attempts[o.tx_queue[i][0]]+'"'; row+='>'+la+'</div></td>'
				+'<td><a target="_blank" href="https://www.reddit.com'+o.tx_queue[i][3]+'">View Post</a></td>'
				+'<td class="try"><a class="trynow" id="t'+o.tx_queue[i][0]+'" data-item="'+encodeURIComponent(JSON.stringify(o.tx_queue[i]))+'" href="#">Try Now</a></td>'
				+'<td><a id="c'+i+'" data-d="'+o.tx_queue[i][0]+'" data-u="'+o.tx_queue[i][2]+'" href="#">Cancel</a></td>'
				+'</tr>';
				html+=row;
			}
			html+='</tbody></table>';
			document.getElementById('txq').innerHTML=html;
			timeago().render(document.getElementsByClassName('tago'));
			//timeago().render(document.getElementById('nextrun'));
			if(document.getElementById('options')) document.getElementById('options').addEventListener('click', function(){ window.open(chrome.extension.getURL("options.html")); });
			for(var i=o.tx_queue.length-1;i>=0;i--){
				document.getElementById('t'+o.tx_queue[i][0]).addEventListener('click', function(){ tryQueued(JSON.parse(decodeURIComponent(this.getAttribute('data-item')))); });
				document.getElementById('c'+i).addEventListener('click', function(){ cancelQueued(this.getAttribute('data-d'),this.getAttribute('data-u')); });
			}
		} else {
			document.getElementById('txq').innerHTML='No queued transactions';
		}
		
		// sent tx
		//if(debug){ console.log('o.tx_sent='); console.log(o.tx_sent); }
		html='';
		if(o && o.tx_sent && o.tx_sent.length>0){
			html+='<table border="0" cellspacing="0" cellpadding="0"><thead><tr><!--<th>Site</th>--><th>Date</th><th>Amount</th><th>User</th><th colspan="2"></th></tr></thead><tbody>';
			for(var i=o.tx_sent.length-1;i>=0;i--){
				// 0=time 1=amt 2=user 3=url 4=txid 5=site(r,t)
				var d=new Date(o.tx_sent[i][0]);
				d=d.getFullYear() +
					'-' + ('0' + (d.getMonth()+1)).slice(-2) +
					'-' + ('0' + d.getDate()).slice(-2) +
					' ' + ('0' + d.getHours()).slice(-2) +
					':' + ('0' + d.getMinutes()).slice(-2);
				if(o.tx_sent[i][5]=='r') var s='Reddit';
				var row='<tr id="txhr'+i+'"><!--<td>'+s+'</td>-->'
				+'<td>'+d+'</td>'
				+'<td>'+o.tx_sent[i][1]+'</td>'
				+'<td><a target="_blank" href="https://www.reddit.com/user/'+o.tx_sent[i][2]+'">'+o.tx_sent[i][2]+'</a></td>'
				+'<td><a target="_blank" href="https://www.reddit.com'+o.tx_sent[i][3]+'">View Post</a></td>'
				+'<td><a target="_blank" href="https://blockdozer.com/tx/'+o.tx_sent[i][4]+'">View Tx</a></td>'
				//+'<td><a id="c'+i+'" data-i='+i+' data-d="'+o.tx_sent[i][0]+'" href="#">Remove</a></td>'
				+'</tr>';
				html+=row;
			}
			html+='</tbody></table>';
			//for(var i=o.tx_sent.length-1;i>=0;i--) document.getElementById('c'+i).addEventListener('click', function(){ removeTx(this.getAttribute('data-d')); });
			document.getElementById('txh').innerHTML=html;
		} else {
			document.getElementById('txh').innerHTML='No sent transactions';
		}
	});
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',afterDOMLoaded); else afterDOMLoaded();
function afterDOMLoaded(){
	window.addEventListener('focus',function(){
		refreshData();
	});
	refreshData();
}

// try to send queued item manually
var txg={lock:''};
function tryQueued(item){
	if(debug){ console.log('tryQueued item='); console.log(item); }
	document.getElementById('t'+item[0]).innerHTML='Wait..';
	if(txg.lock) return;
	txg.lock=1;
	waitUntilClear('tx.js',function(){
		setItemProcessing(1,function(){
			chrome.storage.largeSync.get(['data','fee','tx_queue','tx_attempts'],function(o){
				if(!o.data || !o.data.waddr || !o.data.wkey){
					if(debug) console.log('no wallet addr/key set. aborting'); // todo: notify
					setItemProcessing('',function(){});
					return;
				}
				//if(o.tx_queue.indexOf(item)==-1){ if(debug){ console.log('item not found in tx_queue, abort'); return; } } // http://tinyurl.com/y9pmn3v6
				var found=''; for(var i=0;i<o.tx_queue.length;i++){ if(o.tx_queue[i][0]==item[0]){ found=1; break; } }
				if(!found){ if(debug) console.log('item not found in tx_queue, abort'); setItemProcessing('',function(){}); return; }
				//if(debug){ console.log('ls o='); console.log(o); }
				if(o && o.tx_queue && o.tx_queue.length>0){
					if(debug){ console.log('finalitem='); console.log(item); }
					sendQueued([o,item],function(cb){
						setItemProcessing('',function(){});
						if(debug){ console.log('got callback cb='); console.log(cb); }
						txg.lock='';
						var tns=document.getElementsByClassName('trynow');
						for(var i=0;i<tns.length;i++) tns[i].innerHTML='Try Now';
						if(cb.error){
							if(cb.m=='reddit profile') var toast='Error checking reddit profile. This should be temporary.';
							else if(cb.m=='user database') var toast='Error checking BCH Tips user database. This should be temporary.';
							else if(cb.m=='utxos') var toast='Error getting UTXOs. This should be temporary.';
							else if(cb.m=='fee estimate') var toast='Error getting fee estimate. This should be temporary.';
							else if(cb.m=='mempool conflict') var toast='Mempool conflict. Try again in a few seconds.';
							else if(cb.m=='insufficient funds') var toast='Insufficient funds. Fund your wallet.';
							else if(cb.m=='duplicate txid') var toast='Duplicate txid received. Try again in a few minutes.';
							iqwerty.toast.Toast(toast,{style:{main:{'font-size':'16px',background:'rgba(170, 0, 0, .85)'}},settings:{duration:10000}})
						} else if(cb.neutral){
							if(cb.m=='no user address') var toast=cb.u+' hasn\'t added an address yet. Try again later.';
							iqwerty.toast.Toast(toast,{style:{main:{'font-size':'16px',background:'rgba(0, 0, 0, .85)'}},settings:{duration:7000}})
						} else if(cb.success){
							if(cb.m=='tip sent') var toast='Tip sent to '+cb.u+'!';
							iqwerty.toast.Toast(toast,{style:{main:{'font-size':'16px',background:'rgba(0, 85, 0, .85)'}},settings:{duration:7000}})
						}
					});
				} else setItemProcessing('',function(){});
			});
		});
	});
}

function refreshAgo(k,v){
	if(debug) console.log('refreshAgo('+k+','+v+')');
	var x=document.getElementById('ago'+k);
	if(x){
		x.setAttribute('class','tago');
		x.setAttribute('datetime',v);
		timeago.cancel(x);
		timeago().render(x);
	}
}

function hideQueued(id){
	if(document.getElementById('txqr'+id)) document.getElementById('txqr'+id).remove();
	if(document.getElementsByClassName('txqrc').length==0) document.getElementById('txq').innerHTML='No queued transactions';
}