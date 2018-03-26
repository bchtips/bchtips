/* BCH Tips tx.js */
function findAncestor(el,cls){
    while((el=el.parentNode)&&!el.classList.contains(cls));
    return el;
}

function toFixed(n,f){
    var r=new RegExp('^-?\\d+(?:\.\\d{0,'+(f||-1)+'})?');
    return n.toString().match(r)[0];
}
function fixNum(x) {
  if (Math.abs(x) < 1.0) {
    var e = parseInt(x.toString().split('e-')[1]);
    if (e) {
        x *= Math.pow(10,e-1);
        x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
    }
  } else {
    var e = parseInt(x.toString().split('+')[1]);
    if (e > 20) {
        e -= 20;
        x /= Math.pow(10,e);
        x += (new Array(e+1)).join('0');
    }
  }
  return x;
}

function midScroll(el){
	const element = document.getElementById(el);
	const elementRect = element.getBoundingClientRect();
	const absoluteElementTop = elementRect.top + window.pageYOffset;
	const middle = absoluteElementTop - (window.innerHeight / 2);
	window.scrollTo(0, middle+200);
}

function bchtousd(bch,rate){
	if(!rate) rate=document.getElementById('bchtip_globals').getAttribute('data-rate');
	return (bch*rate).toFixed(2); // round
}

function usdtobch(usd,rate){
	if(!rate) rate=document.getElementById('bchtip_globals').getAttribute('data-rate');
	return toFixed(Math.floor((usd/rate)*100000000)/100000000,8);
}

function getSatAmt(id,u){ // u for calc with unitlast
	if(!document.getElementById('bchtip_loaded'+id)) return;
	var a=document.getElementById('bchtip_amt'+id).value;
	var rate=document.getElementById('bchtip_globals').getAttribute('data-rate');
	if(!u) var u=document.getElementById('bchtip_unit'+id).value;
	if(u=='bch' || u=='all') return unitToSat(a,'bch');
	else if(u=='bit') return unitToSat(a,'bit');
	else if(u=='sat') return unitToSat(a,'sat');
	else if(u=='usd') return unitToSat(a,'usd');
}

function unitToSat(a,u){
	if(u=='bch' || u=='all') return Math.floor(a*100000000);
	else if(u=='bit') return Math.floor(a*100);
	else if(u=='sat') return Math.floor(a);
	else if(u=='usd') return Math.floor((a/document.getElementById('bchtip_globals').getAttribute('data-rate'))*100000000);
}

function satToUnit(s,u){
	if(u=='bch') return toFixed(fixNum(parseFloat(s*0.00000001)),8);
	else if(u=='bit') return toFixed(parseFloat(s*0.01),0);
	else if(u=='sat') return toFixed(parseFloat(s),0);
	else if(u=='usd') return bchtousd(satToUnit(s,'bch'));
}

function setAmtEst(id){
	q=document.getElementById('bchtip_amt'+id).value;
	if(!q || q==0 || isNaN(q)) document.getElementById('bchtip_amtest'+id).innerHTML='';
	var u=document.getElementById('bchtip_unit'+id).value;
	if(u=='bch') var est='$'+bchtousd(q)+' USD';
	else if(u=='bit') var est='$'+bchtousd(satToUnit(unitToSat(q,'bit'),'bch'))+' USD';
	else if(u=='sat') var est='$'+bchtousd(satToUnit(q,'bch'))+' USD';
	else if(u=='usd') var est=usdtobch(q)+' BCH';
	if(u=='all') document.getElementById('bchtip_amtest'+id).style.display='none';
	else { document.getElementById('bchtip_amtest'+id).innerHTML=est; document.getElementById('bchtip_amtest'+id).style.display=''; }
}

function updateEstimate(id,bo){
	//console.log('updateEstimate('+id+')');
	if(!document.getElementById('bchtip_loaded'+id)) return;
	var q=document.getElementById('bchtip_globals').getAttribute('data-balance');
	document.getElementById('bchtip_balest'+id).innerHTML='$'+bchtousd(q)+' USD';
	if(bo) return;
	setAmtEst(id);
	// got everything, show it
	if(document.getElementById('bchtip_loading'+id).style.display==''){
		document.getElementById('bchtip_loading'+id).style.display='none';
		var func=function(ev){
			var id=ev.srcElement.getAttribute('data-id');
			// expand comment-reply box by clicking reply button if not top post
			if(!document.getElementById('bchtip_div'+id).getAttribute('data-noreply')){
				if(!document.getElementById('bchtip_div'+id).getAttribute('data-top')){
					if(!document.getElementById('bchtip_globals').getAttribute('data-archived')){
						var c='x=document.getElementById("bchtip'+id+'").parentNode.parentNode.getElementsByClassName("reply-button")[0].children[0].click();'; var s=document.createElement('script'); s.textContent=c; (document.head||document.documentElement).appendChild(s); s.remove();
						// wipe box if copied from top, otherwise dont (reply started earlier)
						var v=document.getElementsByClassName('usertext cloneable warn-on-unload')[0].text.value;
						var v2=findAncestor(document.getElementById('bchtip'+id),'entry').nextSibling.nextSibling.getElementsByTagName('form')[0].text.value;
						if(v==v2) findAncestor(document.getElementById('bchtip'+id),'entry').nextSibling.nextSibling.getElementsByTagName('form')[0].text.value='';
					}
				}
			}
			// focus on amount or unit
			if(document.getElementById('bchtip_unit'+id).value=='all') document.getElementById('bchtip_unit'+id).focus();
			else {
				document.getElementById('bchtip_amt'+id).focus();
				document.getElementById('bchtip_amt'+id).select();
			}
			document.getElementById('bchtip_inside'+id).removeEventListener('transitionend',func);
			console.log('done transition');
		}
		document.getElementById('bchtip_inside'+id).addEventListener('transitionend',func,false);
		document.getElementById('bchtip_inside'+id).classList.remove('bchtip_collapse');
	}
}

function showReplyText(b,id){
	if(document.getElementById('bchtip_div'+id).getAttribute('data-top')) var typ='post'; else var typ='comment';
	var fyp=' for [your '+typ+']('+document.getElementById('bchtip_div'+id).getAttribute('data-url')+')';
	if(document.getElementById('bchtip_div'+id).getAttribute('data-hasaddr')){
		var t1='I sent you a tip of '+b+' with [BCH Tips](/r/bchtips)!';
		var t2='I sent you a tip of '+b+fyp+' with [BCH Tips](/r/bchtips)!';
	} else {
		var t1='I tipped you '+b+' with [BCH Tips](/r/bchtips)! [How to collect](https://redd.it/7xwesx)';
		var t2='I tipped you '+b+fyp+' with [BCH Tips]! [How to collect](https://redd.it/7xwesx)';
	}
	if(document.getElementById('bchtip_globals').getAttribute('data-archived')||document.getElementById('bchtip_div'+id).getAttribute('data-noreply')){
		var rtext='Reply unavailable. ';
		var rlink='';
		t1=t2;
	} else {
		var rtext='';
		var rlink='(<a id="bchtip_areply'+id+'" class="bchtip" href="javascript:;" data-id="'+id+'">add to reply</a>) ';
	}
	if(document.getElementById('bchtip_globals').getAttribute('data-archived')) t1=t2;
	document.getElementById('bchtip_reply'+id).innerHTML=rtext+'Suggested message '+rlink+'(<a id="bchtip_sendpm'+id+'" class="bchtip" target="_blank" href="/message/compose/?to='+document.getElementById('bchtip_div'+id).getAttribute('data-author')+'&subject='+encodeURIComponent('I sent you a tip!')+'&message='+encodeURIComponent(t2)+'">send pm</a>):<br><textarea id="bchtip_replytxt'+id+'" class="bchtip_replytxt" disabled="disabled">'+t1+'</textarea><br>';
	document.getElementById('bchtip_replytxt'+id).style.height='1px';
	document.getElementById('bchtip_replytxt'+id).style.height=(document.getElementById('bchtip_replytxt'+id).scrollHeight+3)+'px'; // auto height
	// add to reply clicked
	if(document.getElementById('bchtip_areply'+id)) document.getElementById('bchtip_areply'+id).addEventListener('click', function(){
		var id=this.getAttribute('data-id');
		var t=document.getElementById('bchtip_replytxt'+id).value;
		console.log('t='+t);
		if(this.parentNode.parentNode.parentNode.previousSibling.classList.contains('entry')) var c=this.parentNode.parentNode.parentNode.previousSibling; // bottom, depends on traversing bchtip_div elements
		else var c=findAncestor(this,'entry'); // top
		if(document.getElementById('bchtip_div'+id).getAttribute('data-top')) var f=document.getElementsByClassName('usertext cloneable warn-on-unload')[0];
		else var f=c.nextSibling.nextSibling.getElementsByTagName('form')[0];
		f.text.value=f.text.value.trim();
		if(f.text.value) f.text.value+='\n\n';
		f.text.value+=t;
		f.text.scrollTop=f.text.scrollHeight;
	});
	var func=function(ev){ for(i=0;i<2;i++) document.getElementById('bchtip_reply'+ev.srcElement.getAttribute('data-id')).click(); }
	document.getElementById('bchtip_reply'+id).addEventListener('transitionend',func,false);
	document.getElementById('bchtip_reply'+id).classList.remove('bchtip_r_collapse');
}

// calculate fee and build tx
// simple utxo selection: iterate through and select utxos until we have enough for tip + fee at ~1 sat/B (signed tx string length/2)
// first in chain of updates, updateEstimate calls from here
function updateTip(id){
	if(document.getElementById('bchtip_div'+id).getAttribute('data-sent')==1){ console.log('tip sent, not running updateTip ('+id+')'); updateEstimate(id,1); return; }
	if(!document.getElementById('bchtip_loaded'+id)) return;
	if(!document.getElementById('bchtip_uaddr'+id).value) var noaddr=1; else var noaddr='';
	/*if(!document.getElementById('bchtip_amt'+id).value || isNaN(document.getElementById('bchtip_amt'+id).value)){
		document.getElementById('bchtip_fee'+id).innerHTML='';
		updateEstimate(id);
		return;
	}*/
	document.getElementById('bchtip_send'+id).disabled=true;
	document.getElementById('bchtip_tx'+id).value='';
	chrome.storage.sync.get(['data'],function(o){
		if(o.data && o.data.waddr && o.data.wkey){
			if(document.getElementById('bchtip_unit'+id).value=='all') var a=unitToSat(document.getElementById('bchtip_globals').getAttribute('data-balance'),'bch'); else var a=getSatAmt(id);
			if(!a || a==0 || isNaN(a)){
				//console.log('amount is 0. aborting');
				document.getElementById('bchtip_send'+id).style.display='none';
				if(document.getElementById('bchtip_unit'+id).value=='all') document.getElementById('bchtip_fee'+id).innerHTML='<span class="bchtip_error">Fund wallet to tip</span>';
				else document.getElementById('bchtip_fee'+id).innerHTML='<span class="bchtip_error">Enter amount to tip</span>';
				document.getElementById('bchtip_feewarn'+id).innerHTML='';
				updateEstimate(id);
				return;
			}
			var fee=0;
			var df=document.getElementById('bchtip_globals').getAttribute('data-fee');
			var su=[]; // target source utxos
			var si=0; // source index
			// check utxos
			while(1){
				if(!su[si]) su[si]={ // add utxo
			        'txId':utxos[si].txid,
			        'outputIndex':utxos[si].vout,
			        'address':bchaddr.toLegacyAddress(utxos[si].address),
			        'script':utxos[si].scriptPubKey,
			        'satoshis':utxos[si].satoshis
				}
				var st=0; // total source utxos
				for(var k in su) st+=su[k].satoshis;
				var t=a+fee;
				//console.log('a='+a+' fee='+fee+' t='+t+' st='+st+' su='); console.log(su);
				if(t<=st){
					//console.log('t<=st, crafting tx');
					var tx=new bch.Transaction().fee(fee).from(su);
					if(noaddr) tx.to(bchaddr.toLegacyAddress(o.data.waddr),a); else tx.to(bchaddr.toLegacyAddress(document.getElementById('bchtip_uaddr'+id).value),a);
					tx.change(bchaddr.toLegacyAddress(o.data.waddr)).sign(o.data.wkey);
					//console.log('signedtoStringlen='+tx.toString().length);
					//console.log('tx='); console.log(tx);
					var fn=Math.ceil(tx.toString().length/2*df); // fee needed
					if(fn>fee){
						//console.log('fee '+fee+' not big enough.. setting to '+tx.toString().length/2);
						fee=fn;
						continue;
					} else if(fn<fee-1){ // -1 avoids loop
						if(document.getElementById('bchtip_unit'+id).value=='all'){
							//console.log('fee '+fee+' too big, sending all, setting to '+tx.toString().length/2);
							fee=fn;
							a=st-fn;
							document.getElementById('bchtip_amt'+id).value=toFixed(parseFloat(a/100000000),8);
							continue;
						} // todo: avoid "slightly overpaying fee" by adjusting here without causing/using loop - not easy due to 2 outputs after stepping off send all, change as fee, etc.
					}
					document.getElementById('bchtip_send'+id).style.display='';
					document.getElementById('bchtip_send'+id).disabled=false;
					var us=[];
					for(i=0;i<=si;i++) us.push(utxos[i].txid);
					document.getElementById('bchtip_tx'+id).value=tx.toString();
					console.log('to send: '+a+' + '+fee+' fee = '+t+'. within source utxo: '+st+'. good to send. tx='); console.log(tx);
				} else {
					if(document.getElementById('bchtip_unit'+id).value=='all' && si==su.length-1 && fee>0){
						// reduce amount
						//console.log('amount too big, sending all, set to st - fee');
						a=st-fee;
						document.getElementById('bchtip_amt'+id).value=toFixed(parseFloat(a/100000000),8);
						continue;
					}
					// use change as fee
					if(tx && tx.outputs && tx.outputs.length>1 && !utxos[si+1]){
						//console.log('trying change as fee');
						fee=tx.outputs[tx.outputs.length-1].satoshis;
						continue;
					}
					// add another utxo
					//console.log('t '+t+' > st '+st+'. need more utxos');
					si++;
					if(!utxos[si]){
						//console.log('no more utxos available. aborting');
						document.getElementById('bchtip_send'+id).style.display='none';
						document.getElementById('bchtip_fee'+id).innerHTML='<span class="bchtip_error">Insufficient funds</span>';
						document.getElementById('bchtip_feewarn'+id).innerHTML='';
						updateEstimate(id);
						return;
					}
					continue;
				}
				break;
			}
			document.getElementById('bchtip_fee'+id).innerHTML='+ '+fee+' sat fee = '+satToUnit(fee+a,'bch')+' BCH';
			// check for small change amount
			if(tx && tx.outputs && tx.outputs.length>1 && tx.outputs[tx.outputs.length-1].satoshis<250){
				if(!utxos[si+1]) var oa=' or All'; else var oa='';
				document.getElementById('bchtip_feewarn'+id).innerHTML='<span class="bchtip_warn">Inefficient change ('+tx.outputs[tx.outputs.length-1].satoshis+' sat is <250). Consider sending more'+oa+'.</span><br>';
			} else if(tx && fee-2 > fn){
				document.getElementById('bchtip_feewarn'+id).innerHTML='<span class="bchtip_warn">Slightly overpaying fee.</span><br>';
			} else document.getElementById('bchtip_feewarn'+id).innerHTML='';
			if(noaddr) document.getElementById('bchtip_feewarn'+id).innerHTML+='This is just an estimate. Balance and fees at sending time will affect results.<br>';
		} else {
			alert('BCH Tips: You must set an address and key. Click the extension icon');
			return;
		}
		updateEstimate(id);
	});
}

function resetTipBox(id){
	console.log('resetTipBox('+id+')');
	var func=function(ev){ for(i=0;i<2;i++) document.getElementById('bchtip'+ev.srcElement.getAttribute('data-id')).click(); }
	document.getElementById('bchtip_inside'+id).addEventListener('transitionend',func,false);
	document.getElementById('bchtip_inside'+id).classList.add('bchtip_collapse');
}

// send tip clicked
function sendTipClicked(d){
	console.log('bchtips sendTipClicked()');
	d=d.split(';');
	id=d[0]; a=d[1]; u=d[2];
	console.log('id='+id+' a='+a+' u='+u);
	// load storage, then multi ajax
	chrome.storage.sync.get(['data','lastsend'],function(o){
		console.log('o='); console.log(o);
		if(document.getElementById('bchtip_div'+id)){ document.getElementById('bchtip_div'+id).outerHTML=''; document.getElementById('bchtip'+id).innerHTML='send tip'; return; }  // collapse if open
		if(o.data && o.data.waddr){
			if(document.getElementsByClassName('logout').length==0){ document.getElementById('bchtip'+id).innerHTML='login to tip'; document.getElementById('bchtip'+id).classList.remove('bchtips'); document.getElementById('bchtip'+id).classList.add('bchtip_err'); return; }
			if(document.getElementById('bchtip_globals').getAttribute('data-index') || (id==0 && document.getElementsByClassName('infobar')[1] && document.getElementsByClassName('infobar')[1].innerHTML.indexOf("you are viewing a single comment's thread.")!==-1 && document.getElementsByClassName('usertext cloneable warn-on-unload').length>0 && document.getElementsByClassName('usertext cloneable warn-on-unload')[0].style.display==='none')){ window.location=u+'#tip'; return; } // forward to post
			document.getElementById('bchtip'+id).innerHTML='cancel tip';
			var n=findAncestor(document.getElementById('bchtip'+id),'entry');
			if(findAncestor(document.getElementById('bchtip'+id),'entry').getElementsByClassName('top-matter').length==1){
				n.insertAdjacentHTML('beforeend','<div id="bchtip_div'+id+'" class="bchtip_div bchtip_div_top" data-id="'+id+'" data-author="'+a+'" data-url="'+u+'" data-top="1"></div>');
			} else n.insertAdjacentHTML('afterend','<div id="bchtip_div'+id+'" class="bchtip_div" data-id="'+id+'" data-author="'+a+'" data-url="'+u+'"></div>'); // todo: get margin-left of child and match it on .bchtip_div
			document.getElementById('bchtip_div'+id).innerHTML+='<img src="https://cdn.bchftw.com/bchtips/bchtips.png" class="bchtip_logo"><span id="bchtip_loading'+id+'"><img class="bchtip_load" src="https://cdn.bchftw.com/bchtips/bchload.gif" class="bchtip_load"></span><br>';
			var x0=new XMLHttpRequest(); x0.open("GET","https://www.reddit.com/user/"+a,true);
			var x1=new XMLHttpRequest(); x1.open("GET","https://cdn.bchftw.com/bchtips/reddit/"+a[0].toLowerCase()+".csv",true);
			if(document.getElementsByClassName('bchtip_div').length==1) var dorate=1; else dorate=false; // only load rate+utxos on first tip open, else intervals running
			if(dorate){ // also do utxos
				var x2=new XMLHttpRequest(); x2.open("GET","https://cdn.bchftw.com/bchtips/bchprice.csv",true);
				var x3=new XMLHttpRequest(); x3.open("GET","https://blockdozer.com/insight-api/addr/"+o.data.waddr+"/utxo",true);
				var x4=new XMLHttpRequest(); x4.open("GET","https://blockdozer.com/insight-api/utils/estimatefee/",true);
				var xs=[x0,x1,x2,x3,x4];
			} else var xs=[x0,x1];
			onRequestsComplete(xs, function(xr, xerr){
				console.log('xs='); console.log(xs);
				for(let i=0;i<xs.length;i++){
					if((xs[i].status!==200 || (i!==1 && xs[i].responseText=='') || (i==0 && xs[i].responseText.indexOf('user/'+a)===-1)) && !(i==0 && xs[i].responseText.indexOf('u/'+a+': page not found')>-1)){
						if(i==0) var m='checking reddit profile'; else if(i==1) var m='checking user database'; else if(i==2) var m='getting BCH price'; else if(i==3) var m='checking utxos';
						document.getElementById('bchtip_loading'+id).innerHTML='<span class="bchtip_error">Error '+m+'. <a class="bchtip_error" href="javascript:for(i=0;i<2;i++) document.getElementById(\'bchtip'+id+'\').click();">try again</a></span>';
						console.log('error '+m);
						return;
					}
				}
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
					if(ar[a]) uaddr=ar[a];
				}
				// user addr found
				if(uaddr) document.getElementById('bchtip_div'+id).setAttribute('data-hasaddr',1); // so showReplyText knows which string to use
				if(dorate){
					if(!x2.responseText || isNaN(x2.responseText)){
						document.getElementById('bchtip_div'+id).innerHTML+='<span class="bchtip_error"> Error getting exchange rate</span><br>';
						console.log('bchtips_rate_error x[2] response='); console.log(x2.responseText);
						return;
					}
					document.getElementById('bchtip_globals').setAttribute('data-rate',x2.responseText);
					if(!x3.responseText){
						document.getElementById('bchtip_div'+id).innerHTML+='<span class="bchtip_error"> Error getting utxos</span><br>';
						console.log('bchtips_rate_error x[3] response='); console.log(x3.responseText);
						return;
					}
					parseUtxos(x3.responseText,1); // also calcs balance, 1=dont update all open tips
					try { var f=JSON.parse(x4.responseText)["2"]; } catch(e){}
					if(!x4.responseText || isNaN(f)){
						document.getElementById('bchtip_div'+id).innerHTML+='<span class="bchtip_error"> Error getting fee estimate</span><br>';
						console.log('bchtips_estimate_error x[4] response='); console.log(x4.responseText);
						return;
					}
					var f=Math.ceil(f*10000000)/100; // round up to nearest 10 sat/kb
					console.log('fee estimate='+f+' sat/B');
					document.getElementById('bchtip_globals').setAttribute('data-fee',f);
				}
				if(document.getElementsByClassName('usertext cloneable warn-on-unload').length==0) document.getElementById('bchtip_div'+id).setAttribute('data-noreply',1); // reply not avail
				var bal=document.getElementById('bchtip_globals').getAttribute('data-balance');
				// output
				console.log('uaddr='+uaddr+' balance='+bal+'rate='+document.getElementById('bchtip_globals').getAttribute('data-rate'));
				if(a[a.length-1]=='s') var ss="'"; else var ss="'s";
				if(uaddr){
					var line1=a+ss+' address: '+uaddr;
					var btntxt='Send';
					//var noall='';
				} else {
					if(document.getElementById('bchtip_globals').getAttribute('data-archived')||document.getElementById('bchtip_div'+id).getAttribute('data-noreply')) var t='message'; else var t='reply';
					var line1=a+' doesn\'t have a known address. Your tip will be sent automatically when they add one.';
					var btntxt='Queue';
					//var noall=1;
				}
				var html='<div id="bchtip_inside'+id+'" class="bchtip_inside bchtip_expand bchtip_collapse" data-id="'+id+'"><div class="bchtip_line1">'+line1+'</div>Balance: <span id="bchtip_bal'+id+'" class="bchtip_bal">'+bal+'</span> BCH (<span id="bchtip_balest'+id+'"></span>)<br><div id="bchtip_inwrap'+id+'">Tip: <input id="bchtip_amt'+id+'" class="bchtip_amt" type="number" step="any" min="0" size="10" data-id="'+id+'"> <select id="bchtip_unit'+id+'" data-id="'+id+'"><option value="bch">BCH<option value="bit">Bits<option value="sat">Satoshi<option value="usd">USD'; /*if(!noall)*/ html+='<option value="all">All'; html+='</select><input type="hidden" id="bchtip_unitlast'+id+'" value=""> <span id="bchtip_amtest'+id+'"></span> <span id="bchtip_fee'+id+'"></span> <button id="bchtip_send'+id+'" class="bchtip_send" data-id="'+id+'" disabled="disabled">'+btntxt+'</button><br><span id="bchtip_feewarn'+id+'"></span></div><div id="bchtip_inwrap2_'+id+'"></div><div id="bchtip_reply'+id+'" class="bchtip_r_expand bchtip_r_collapse" data-id="'+id+'"></div><input type="hidden" id="bchtip_uaddr'+id+'" value="'+uaddr+'"><input id="bchtip_tx'+id+'" type="hidden" value=""><input id="bchtip_loaded'+id+'" type="hidden" value="1"></div></div>'; // todo:change hiddens to one element and use set/getattribute
				document.getElementById('bchtip_div'+id).innerHTML+=html;
				if(!o.lastsend || !o.lastsend.amt){ if(!o.lastsend) o.lastsend={}; o.lastsend.amt=0; }
				if(!o.lastsend || !o.lastsend.unit) o.lastsend.unit='bch';
				//if(o.lastsend.unit=='all' && noall) o.lastsend.unit='bch';
				document.getElementById('bchtip_unit'+id).value=o.lastsend.unit;
				document.getElementById('bchtip_unitlast'+id).value=o.lastsend.unit;
				if(document.getElementById('bchtip_unit'+id).value=='all'){
					document.getElementById('bchtip_amt'+id).style.display='none';
				}
				var stepUSD='0.05'; // todo: put in options
				if(document.getElementById('bchtip_unit'+id).value=='bch') document.getElementById('bchtip_amt'+id).step=usdtobch(stepUSD);
				else if(document.getElementById('bchtip_unit'+id).value=='bit') document.getElementById('bchtip_amt'+id).step=satToUnit(unitToSat(stepUSD,'usd'),'bit');
				else if(document.getElementById('bchtip_unit'+id).value=='sat') document.getElementById('bchtip_amt'+id).step=unitToSat(stepUSD,'usd')
				else if(document.getElementById('bchtip_unit'+id).value=='usd') document.getElementById('bchtip_amt'+id).step=stepUSD;
				if(document.getElementById('bchtip_unit'+id).value=='all') o.lastsend.amt=bal;
				document.getElementById('bchtip_amt'+id).value=o.lastsend.amt;
				document.getElementById('bchtip_amt'+id).addEventListener('focus', function(){ this.select(); });
				document.getElementById('bchtip_unit'+id).addEventListener('change', function(){
					if(this.value=='all'){
						document.getElementById('bchtip_amt'+this.getAttribute('data-id')).style.display='none';
						document.getElementById('bchtip_amt'+this.getAttribute('data-id')).value=document.getElementById('bchtip_globals').getAttribute('data-balance');
						document.getElementById('bchtip_amt'+this.getAttribute('data-id')).disabled=true;
					} else {
						document.getElementById('bchtip_amtest'+this.getAttribute('data-id')).style.display='';
						document.getElementById('bchtip_amt'+this.getAttribute('data-id')).disabled=false;
						document.getElementById('bchtip_amt'+this.getAttribute('data-id')).value=satToUnit(getSatAmt(this.getAttribute('data-id'),document.getElementById('bchtip_unitlast'+this.getAttribute('data-id')).value),this.value);
						document.getElementById('bchtip_amt'+this.getAttribute('data-id')).style.display='';
						document.getElementById('bchtip_amt'+this.getAttribute('data-id')).select();
					}
					setAmtEst(this.getAttribute('data-id'));
					document.getElementById('bchtip_unitlast'+this.getAttribute('data-id')).value=this.value;
					var stepUSD='0.05';
					if(this.value=='bch') document.getElementById('bchtip_amt'+this.getAttribute('data-id')).step=usdtobch(stepUSD);
					else if(this.value=='bit') document.getElementById('bchtip_amt'+this.getAttribute('data-id')).step=satToUnit(unitToSat(stepUSD,'usd'),'bit');
					else if(this.value=='sat') document.getElementById('bchtip_amt'+this.getAttribute('data-id')).step=unitToSat(stepUSD,'usd')
					else if(this.value=='usd') document.getElementById('bchtip_amt'+this.getAttribute('data-id')).step=stepUSD;
					updateTip(this.getAttribute('data-id'));
				});
				document.getElementById('bchtip_amt'+id).setAttribute('data-last',document.getElementById('bchtip_amt'+id).value); // for detecting spinner clicks
				document.getElementById('bchtip_amt'+id).addEventListener('keyup', function(){
					this.setAttribute('data-last',this.value);
					updateTip(this.getAttribute('data-id'));
				});
				document.getElementById('bchtip_amt'+id).addEventListener('click', function(){
					if((this.value>this.getAttribute('data-last') || this.value<this.getAttribute('data-last')) && this.value>0){
						if(document.getElementById('bchtip_unit'+this.getAttribute('data-id')).value=='bch') this.value=parseFloat(this.value).toFixed(8);
						else if(document.getElementById('bchtip_unit'+this.getAttribute('data-id')).value=='bit') this.value=parseFloat(this.value).toFixed(0);
						else if(document.getElementById('bchtip_unit'+this.getAttribute('data-id')).value=='sat') this.value=parseFloat(this.value).toFixed(0);
						else if(document.getElementById('bchtip_unit'+this.getAttribute('data-id')).value=='usd') this.value=parseFloat(this.value).toFixed(2);
					}
					updateTip(this.getAttribute('data-id'));
				});
				document.getElementById('bchtip_send'+id).addEventListener('click', function(){
					var id=this.getAttribute('data-id');
					var a=getSatAmt(id);
					var b=satToUnit(a,'bch');
					var b1=b+' BCH ($'+bchtousd(b)+' USD)';
					var b2=fixNum(parseFloat(b).toFixed(8))+' BCH ($'+bchtousd(b)+' USD)';
					document.getElementById('bchtip_inwrap'+id).style.display='none';
					var d=document.getElementById('bchtip'+id).getAttribute('data-tip');
					d=d.split(';');
					if(document.getElementById('bchtip_div'+id).getAttribute('data-hasaddr')) document.getElementById('bchtip_inwrap2_'+id).innerHTML='Sent '+b1+' to '+d[1]+'! '; else document.getElementById('bchtip_inwrap2_'+id).innerHTML='Queued '+b1+' to '+d[1]+'! ';
					document.getElementById('bchtip_inwrap2_'+id).style.display='';
					document.getElementById('bchtip_div'+id).setAttribute('data-sent',1);
					// set and expand suggested msg
					showReplyText(b1,id);
					// send
					chrome.storage.sync.set({'lastsend':{'amt':document.getElementById('bchtip_amt'+id).value,'unit':document.getElementById('bchtip_unit'+id).value}});
					if(document.getElementById('bchtip_div'+id).getAttribute('data-hasaddr')){
						var tx=document.getElementById('bchtip_tx'+id).value; // todo: store rate with tx to prevent bchtousd (above) race
						console.log('sending tx='+tx);
						// refresh utxos? they're 21s fresh anyway..
						var x=new XMLHttpRequest();
						x.open("POST","https://blockdozer.com/insight-api/tx/send",true);
						x.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
						x.onreadystatechange=function(){
							if(x.readyState==4){
								if(x.status==200){
									console.log('x.responseText='+x.responseText);
									if(x.responseText){
										try { var r=JSON.parse(x.responseText); } catch(e) { document.getElementById('bchtip_inwrap2_'+id).innerHTML+='<span class="bchtip_error">Error parsing response: '+x.responseText+'</span> '; console.log('error parsing response: '+x.responseText); }
										console.log('r='); console.log(r);
										setTimeout(function(){ updateUtxos(); },10000);
										if(r.txid) document.getElementById('bchtip_inwrap2_'+id).innerHTML+='(<a class="bchtip" target="_blank" href="https://blockdozer.com/insight/tx/'+r.txid+'">view tx</a>) ';
										document.getElementById('bchtip_inwrap2_'+id).innerHTML+='(<a id="bchtip_reset'+id+'" class="bchtip" href="javascript:;" data-id="'+id+'">reset tip box</a>)<br>';
										document.getElementById('bchtip_reset'+id).addEventListener('click',function(){ resetTipBox(this.getAttribute('data-id')); });
										// add to tx_sent
										if(r.txid){
											chrome.storage.largeSync.get(['tx_sent'],function(o){
												console.log('ls o='); console.log(o);
												if(!o || !o.tx_sent){ o={}; o.tx_sent=[]; }
												o.tx_sent.push([Date.now(),b2,d[1],d[2],r.txid,'r']); // 0=time 1=amt 2=user 3=url 4=txid 5=site(r,t)
												if(o.tx_sent.length>250){ while(1){ o.tx_sent.shift(); if(o.tx_sent.length<=250) break; } }
												chrome.storage.largeSync.set(o);
											});
										}
									} else var senderr=1;
								} else var senderr=1;
							}
							if(senderr){
								document.getElementById('bchtip_inwrap2_'+id).innerHTML+='<span class="bchtip_error">Error '+x.response+'</span> ';
								document.getElementById('bchtip_inwrap2_'+id).innerHTML+='(<a id="bchtip_reset'+id+'" class="bchtip" href="javascript:;" data-id="'+id+'">reset tip box</a>)<br>';
								document.getElementById('bchtip_reset'+id).addEventListener('click',function(){ resetTipBox(this.getAttribute('data-id')); });
								console.log("transmit error x="); console.log(x);
							}
						}
						x.send('rawtx='+tx);
					} else { // queue
						console.log('queuing..');
						chrome.storage.largeSync.get(['tx_queue'],function(o){
							console.log('ls o='); console.log(o);
							if(!o || !o.tx_queue){ o={}; o.tx_queue=[]; }
							o.tx_queue.push([Date.now(),b2,d[1],d[2],null,'r']); // 0=time 1=amt 2=user 3=url 4=null 5=site(r,t)
							if(o.tx_queue.length>250){ while(1){ o.tx_queue.shift(); if(o.tx_queue.length<=250) break; } }
							chrome.storage.largeSync.set(o);
						});
						document.getElementById('bchtip_inwrap2_'+id).innerHTML+='(<a id="bchtip_viewq'+id+'" class="bchtip" href="javascript:;">view queue</a>) ';
						document.getElementById('bchtip_inwrap2_'+id).innerHTML+='(<a id="bchtip_reset'+id+'" class="bchtip" href="javascript:;" data-id="'+id+'">reset tip box</a>)<br>';
						document.getElementById('bchtip_viewq'+id).addEventListener('click',function(){ window.open(chrome.extension.getURL("tx.html")); });
						document.getElementById('bchtip_reset'+id).addEventListener('click',function(){ resetTipBox(this.getAttribute('data-id')); });
					}
				});
				// scroll to tip
				if(window.hash=='#tip'){
					document.getElementById('bchtip_div'+id).scrollIntoView(true);
					var viewportH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
					window.scrollBy(0, (document.getElementById('bchtip_div'+id).getBoundingClientRect().height-viewportH)/2+100);
				}
				updateTip(id);
			});
			x0.send(); x1.send(); if(dorate){ x2.send(); x3.send(); x4.send(); }
		} else { document.getElementById('bchtip'+id).innerHTML='set wallet address'; document.getElementById('bchtip'+id).classList.remove('bchtips'); document.getElementById('bchtip'+id).classList.add('bchtip_err'); return; }
	});
}

// add tip links to bylines
var eid=0; // never overwrite this global or load more will break
function addTipLinks(e){
	var x = e.getElementsByClassName("flat-list buttons");
	for(var i=0;i<x.length;i++){
		var y=x[i].getElementsByTagName("li");
		y=y[y.length-1];
		if(!y) continue;
		if(y.getElementsByTagName("a")[0].getAttribute("data-tip")) continue;
		var a=x[i].parentNode.parentNode.getElementsByClassName("author");
		a=a[0].innerHTML;
		if(a=='[deleted]') continue;
		else if(a=='AutoModerator') continue;
		u=x[i].getElementsByTagName("li")[0].getElementsByTagName("a")[0].getAttribute("data-href-url");
		d=eid+';'+a+';'+u;
		y.insertAdjacentHTML('afterend','<li><a id="bchtip'+eid+'" data-id="'+eid+'" data-tip="'+d+'" href="javascript:;">send tip</a>');
		y.nextSibling.getElementsByTagName("a")[0].addEventListener('click',function(){
			sendTipClicked(this.getAttribute('data-tip'));
			return false;
		});
		eid++;
	}
	// add tip links after load more
	var x = e.getElementsByClassName("morecomments");
	for(var i=0;i<x.length;i++){
		x[i].getElementsByTagName("a")[0].addEventListener('click',function(){
			var a=findAncestor(this,'thing');
			try { a=findAncestor(a,'thing'); } catch(e){ a=''; }
			if(!a) a=document;
			var d=a.getElementsByClassName("first").length;
			var si=setInterval(function(){
				if(d!=a.getElementsByClassName("first").length){
					addTipLinks(a);
					d=''; a='';
					clearInterval(si);
				}
			},250); // todo: eliminate interval
		});
	}
}

// update rate and all open estimates
function updateRate(){
	// only if no update recently, due to multi-tabs
	console.log('bchtips updateRate()');
	chrome.storage.sync.get(['rate_last_time','rate_last_value'],function(o){
		//console.log('o='); console.log(o);
		var now=Date.now();
		if(o.rate_last_time && now-o.rate_last_time<20500){ // <21s
			console.log('not time to update rate, stored rate='+o.rate_last_value);
			document.getElementById('bchtip_globals').setAttribute('data-rate',o.rate_last_value);
		} else {
			chrome.storage.sync.set({'rate_last_time':Date.now()});
			var x=new XMLHttpRequest();
			x.open("GET","https://cdn.bchftw.com/bchtips/bchprice.csv",true);
			x.onreadystatechange=function(){
				if(x.readyState==4){
					if(x.status==200){
						x.responseText=x.responseText.trim();
						console.log('rate='+x.responseText);
						if(x.responseText){
							if(!isNaN(x.responseText)){
								chrome.storage.sync.set({'rate_last_value':x.responseText});
								document.getElementById('bchtip_globals').setAttribute('data-rate',x.responseText);
							} else var raterr=1;
						} else var raterr=1;
					} else var raterr=1;
				}
				if(raterr){ console.log("rate_update_error x="); console.log(x); }
			}
			x.send();
		}
	});
}

var utxos=[];
function updateUtxos(){
	// always run on every tab since data may be too large for sync
	//console.log('bchtips updateUtxos()');
	chrome.storage.sync.get(['data'],function(o){
		//console.log('o(data)='); console.log(o);
		if(!o.data || !o.data.waddr){ console.log('no wallet, aborting'); return; }
		var x=new XMLHttpRequest();
		x.open("GET","https://blockdozer.com/insight-api/addr/"+o.data.waddr+"/utxo");
		x.onreadystatechange=function(){
			if(x.readyState==4){
				if(x.status==200){
					if(x.responseText){
						console.log('x='); console.log(x);
						parseUtxos(x.responseText);
					} else var utxoerr=1;
				} else var utxoerr=1;
			}
			if(utxoerr){ console.log("updateUtxos error x="); console.log(x); }
		}
		x.send();
	});
}

// parse utxo ajax response and set utxos global
function parseUtxos(r,n){ // n=dont update all balances, used when first tip open
	//console.log('bchtips parseUtxos() n='+n+' r='); console.log(r);
	var newutxos=JSON.parse(r);
	newutxos.sort(function(a,b){return (a.satoshis > b.satoshis) ? 1 : ((b.satoshis > a.satoshis) ? -1 : 0);} ); // sort asc
	utxos=newutxos;
	//console.log('utxos='); console.log(utxos);
	// create balance out of available utxos
	var bal=0;
	for(i=0;i<utxos.length;i++) bal+=utxos[i].amount;
	bal=toFixed(bal,8);
	//console.log('balance='+bal);
	document.getElementById('bchtip_globals').setAttribute('data-balance',bal);
	// update all balances
	if(!n){
		var r=document.getElementsByClassName('bchtip_div');
		for(var i=0;i<r.length;i++){
			rid=r[i].getAttribute('data-id');
			if(!document.getElementById('bchtip_loaded'+rid)) return;
			if(document.getElementById('bchtip_bal'+rid)!==bal){
				document.getElementById('bchtip_bal'+rid).innerHTML=bal;
				if(document.getElementById('bchtip_unit'+rid).value=='all') document.getElementById('bchtip_amt'+rid).value=bal;
				updateTip(rid);
			}
		}
	}
}

// init
var lastfoc=0;
var blurred='';
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',afterDOMLoaded); else afterDOMLoaded();
function afterDOMLoaded(){
	var p1=/^https:\/\/(.*)\.reddit\.com\/r\/[^\/]*\/$/ // index pages
	var p2=/^https:\/\/(.*)\.reddit\.com\/r\/(.*)\/comments\/(.*)/ // comment pages
	if(!p1.test(window.location.href.split("?")[0])&&!p2.test(window.location.href)) return;
	var x=document.createElement("input");
	x.setAttribute('id','bchtip_globals');
	x.setAttribute('type','hidden')
	document.body.appendChild(x);
	if(p1.test(window.location.href.split("?")[0])) document.getElementById('bchtip_globals').setAttribute('data-index',1);
	if(document.getElementsByClassName('archived-infobar').length>0) document.getElementById('bchtip_globals').setAttribute('data-archived',1);
	addTipLinks(document);
	if(window.location.hash=='#tip') document.getElementById('bchtip0').click();
	setInterval(function(){
		if(document.getElementsByClassName('bchtip_div').length===0 || blurred) return; // skip if no tips open
		updateRate();
		setTimeout(function(){ updateUtxos(); },2000);
	}, 21000);
	window.addEventListener('focus',function(){
		if(Date.now()-lastfoc>=5000 && document.getElementsByClassName('bchtip_div').length!==0){
			updateRate();
			setTimeout(function(){ updateUtxos(); },2000);
		}
		lastfoc=Date.now();
		blurred='';
	});
	window.addEventListener('blur',function(){
		blurred=1;
	});
}