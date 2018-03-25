/* BCH Tips tx.js */
function cancelQueued(d,i){
	chrome.storage.largeSync.get(['tx_queue'],function(o){
		for(var j=0;j<o.tx_queue.length;j++) if(o.tx_queue[j][0]==d){ if(!confirm('Are you sure you want to cancel this tip to '+o.tx_queue[j][2]+'?')) return; o.tx_queue.splice(j,1); break; }
		chrome.storage.largeSync.set(o);
		document.getElementById('txqr'+i).style.display='none';
		if(o.tx_queue.length==0) document.getElementById('txq').innerHTML='No queued transactions';
	});
}
function removeTx(d,i){
	chrome.storage.largeSync.get(['tx_sent'],function(o){
		for(var j=0;j<o.tx_sent.length;j++) if(o.tx_sent[j][0]==d){ if(!confirm('Are you sure you want to remove this transaction from history?')) return; o.tx_sent.splice(j,1); break; }
		chrome.storage.largeSync.set(o);
		document.getElementById('txhr'+i).style.display='none';
		if(o.tx_sent.length==0) document.getElementById('txh').innerHTML='No sent transactions';
	});
}

function refreshData(){
	console.log('refreshData()');
	lr=Date.now();
	// queued tx
	chrome.storage.largeSync.get(['tx_queue','tx_sent'],function(o){
		console.log('o.tx_queue='); console.log(o.tx_queue);
		var html='';
		if(o && o.tx_queue && o.tx_queue.length>0){
			html+='<table border="0" cellspacing="0" cellpadding="0"><thead><tr><!--<th>Site</th>--><th>Date</th><th>Amount</th><th>User</th><th colspan="2"></th></tr></thead><tbody>';
			for(var i=o.tx_queue.length-1;i>=0;i--){
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
				+'<td><a target="_blank" href="https://www.reddit.com'+o.tx_queue[i][3]+'">View Post</a></td>'
				+'<td><a id="c'+i+'" data-i='+i+' data-d="'+o.tx_queue[i][0]+'" href="#">Cancel</a></td>'
				+'</tr>'; // todo: cancel
				html+=row;
			}
			html+='</tbody></table>';
			document.getElementById('txq').innerHTML=html;
			for(var i=o.tx_queue.length-1;i>=0;i--) document.getElementById('c'+i).addEventListener('click', function(){ cancelQueued(this.getAttribute('data-d'),this.getAttribute('data-i')); });
		} else {
			document.getElementById('txq').innerHTML='No queued transactions';
		}
		
		// sent tx
		console.log('o.tx_sent='); console.log(o.tx_sent);
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
			//for(var i=o.tx_sent.length-1;i>=0;i--) document.getElementById('c'+i).addEventListener('click', function(){ removeTx(this.getAttribute('data-d'),this.getAttribute('data-i')); });
			document.getElementById('txh').innerHTML=html;
		} else {
			document.getElementById('txh').innerHTML='No sent transactions';
		}
	});
}

var lr=0;
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',afterDOMLoaded); else afterDOMLoaded();
function afterDOMLoaded(){
	window.addEventListener('focus',function(){
		if(Date.now()-lr>=5000) refreshData();
	});
	refreshData();
}