/* BCH Tips tx.js */
function cancelQueued(d,u){
	if(!confirm('Are you sure you want to cancel this tip to '+u+'?')) return;
	chrome.storage.largeSync.get(['tx_queue'],function(o){
		for(var j=0;j<o.tx_queue.length;j++) if(o.tx_queue[j][0]==d){ o.tx_queue.splice(j,1); break; }
		chrome.storage.largeSync.set(o);
		refreshData();
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
	chrome.storage.largeSync.get(['tx_queue','tx_sent'],function(o){
		if(debug){ console.log('o.tx_queue='); console.log(o.tx_queue); }
		chrome.storage.local.get('tx_attempts',function(at){
			if(!at || !at.tx_attempts){ at={}; at.tx_attempts={}; }
			if(debug){ console.log('at.tx_attempts='); console.log(at.tx_attempts); }
			var html='';
			if(o && o.tx_queue && o.tx_queue.length>0){
				html+='<div id="nextrun">Next run: <span id="nextrun_time">Running now</span></div><table border="0" cellspacing="0" cellpadding="0"><thead><tr><!--<th>Site</th>--><th>Date</th><th>Amount</th><th>User</th><th>Last Tried</th><th colspan="2"></th></tr></thead><tbody>';
				for(var i=o.tx_queue.length-1;i>=0;i--){
					if(at.tx_attempts[o.tx_queue[i][0]]) var la=timeago().format(at.tx_attempts[o.tx_queue[i][0]]); else var la='-';
					// 0=time 1=amt 2=user 3=url 4=null 5=site(r,t)
					var d=new Date(o.tx_queue[i][0]);
					d=d.getFullYear() +
						'-' + ('0' + (d.getMonth()+1)).slice(-2) +
						'-' + ('0' + d.getDate()).slice(-2) +
						' ' + ('0' + d.getHours()).slice(-2) +
						':' + ('0' + d.getMinutes()).slice(-2);
					if(o.tx_queue[i][5]=='r') var s='Reddit';
					var row='<tr id="txqr'+i+'"><!--<td>'+s+'</td>-->'
					+'<td>'+d+'</td>'
					+'<td>'+o.tx_queue[i][1]+'</td>'
					+'<td><a target="_blank" href="https://www.reddit.com/user/'+o.tx_queue[i][2]+'">'+o.tx_queue[i][2]+'</a></td>'
					+'<td class="last"><div id="ago'+o.tx_queue[i][0]+'"'; if(at.tx_attempts[o.tx_queue[i][0]]) row+=' class="tago" datetime="'+at.tx_attempts[o.tx_queue[i][0]]+'"'; row+='>'+la+'</div></td>'
					+'<td><a target="_blank" href="https://www.reddit.com'+o.tx_queue[i][3]+'">View Post</a></td>'
					+'<td><a id="c'+i+'" data-d="'+o.tx_queue[i][0]+'" data-u="'+o.tx_queue[i][2]+'" href="#">Cancel</a></td>'
					+'</tr>'; // todo: cancel
					html+=row;
				}
				html+='</tbody></table>';
				document.getElementById('txq').innerHTML=html;
				timeago().render(document.getElementsByClassName('tago'));
				for(var i=o.tx_queue.length-1;i>=0;i--) document.getElementById('c'+i).addEventListener('click', function(){ cancelQueued(this.getAttribute('data-d'),this.getAttribute('data-u')); });
			} else {
				document.getElementById('txq').innerHTML='No queued transactions';
			}
			
			// sent tx
			if(debug){ console.log('o.tx_sent='); console.log(o.tx_sent); }
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
					+'<td><a target="_blank" href="https://blockdozer.com/insight/tx/'+o.tx_sent[i][4]+'">View Tx</a></td>'
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
	});
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',afterDOMLoaded); else afterDOMLoaded();
function afterDOMLoaded(){
	window.addEventListener('focus',function(){
		refreshData();
	});
	refreshData();
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