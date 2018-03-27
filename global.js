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
