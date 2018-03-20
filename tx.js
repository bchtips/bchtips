/* BCH Tips tx.js */
function cancelQueued(i,u){
	if(!confirm('Are you sure you want to cancel this tip to '+u+'?')) return;
	chrome.storage.largeSync.get(['tx_queue','tx_sent'],function(o){
		o.tx_queue.splice(i,1);
		chrome.storage.largeSync.set(o);
		document.getElementById('txqr'+i).style.display='none';
		if(o.tx_queue.length==0) document.getElementById('txq').innerHTML='No queued transactions';
	});
}
function removeTx(i,u){
	if(!confirm('Are you sure you want to remove this transaction from history?')) return;
	chrome.storage.largeSync.get(['tx_queue','tx_sent'],function(o){
		o.tx_sent.splice(i,1);
		chrome.storage.largeSync.set(o);
		document.getElementById('txhr'+i).style.display='none';
		if(o.tx_queue.length==0) document.getElementById('txh').innerHTML='No sent transactions';
	});
}

document.addEventListener('DOMContentLoaded', () => {
	// queued tx
	chrome.storage.largeSync.get(['tx_queue','tx_sent'],function(o){
		console.log('o.tx_queue='); console.log(o.tx_queue);
		document.getElementById('txq').innerHTML='';
		if(o && o.tx_queue && o.tx_queue.length>0){
			document.getElementById('txq').innerHTML+='<table border="0" cellspacing="0" cellpadding="0"><thead><tr><!--<th>Site</th>--><th>Date</th><th>Amount</th><th>User</th><th colspan="2"></th></tr></thead><tbody id="txq_tb"></tbody></table>';
			for(var i=o.tx_queue.length-1;i>=0;i--){
				// 0=time 1=amt 2=user 3=url 4=null 5=site(r,t)
				var d=new Date(parseInt(o.tx_queue[i][0]+'000'));
				d=d.getFullYear() +
					'-' + ('0' + d.getMonth()).slice(-2) +
					'-' + ('0' + d.getDate()).slice(-2) +
					' ' + ('0' + d.getHours()).slice(-2) +
					':' + ('0' + d.getMinutes()).slice(-2);
				if(o.tx_queue[i][5]=='r') var s='Reddit';
				var row='<tr id="txqr'+i+'"><!--<td>'+s+'</td>-->'
				+'<td>'+d+'</td>'
				+'<td>'+o.tx_queue[i][1]+'</td>'
				+'<td><a target="_blank" href="https://www.reddit.com/user/'+o.tx_queue[i][2]+'">'+o.tx_queue[i][2]+'</a></td>'
				+'<td><a target="_blank" href="https://www.reddit.com'+o.tx_queue[i][3]+'">View Post</a></td>'
				+'<td><a id="c'+i+'" data-id="'+i+'" data-user="'+o.tx_queue[i][2]+'" href="#">Cancel</a></td>'
				+'</tr>'; // todo: cancel
				document.getElementById('txq_tb').innerHTML+=row;
			}
			for(var i=o.tx_queue.length-1;i>=0;i--) document.getElementById('c'+i).addEventListener('click', function(){ cancelQueued(this.getAttribute('data-id'),this.getAttribute('data-user')); });
		} else {
			document.getElementById('txq').innerHTML='No queued transactions';
		}
		
		// sent tx
		console.log('o.tx_sent='); console.log(o.tx_sent);
		document.getElementById('txh').innerHTML='';
		if(o && o.tx_sent && o.tx_sent.length>0){
			document.getElementById('txh').innerHTML+='<table border="0" cellspacing="0" cellpadding="0"><thead><tr><!--<th>Site</th>--><th>Date</th><th>Amount</th><th>User</th><th colspan="2"></th></tr></thead><tbody id="txh_tb"></tbody></table>';
			for(var i=o.tx_sent.length-1;i>=0;i--){
				// 0=time 1=amt 2=user 3=url 4=txid 5=site(r,t)
				var d=new Date(parseInt(o.tx_sent[i][0]+'000'));
				d=d.getFullYear() +
					'-' + ('0' + d.getMonth()).slice(-2) +
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
				//+'<td><a id="c'+i+'" data-id="'+i+'" data-user="'+o.tx_sent[i][2]+'" href="#">Remove</a></td>'
				+'</tr>';
				document.getElementById('txh_tb').innerHTML+=row;
			}
			//for(var i=o.tx_sent.length-1;i>=0;i--) document.getElementById('c'+i).addEventListener('click', function(){ removeTx(this.getAttribute('data-id'),this.getAttribute('data-user')); });
		} else {
			document.getElementById('txh').innerHTML='No sent transactions';
		}
	});
});