/* BCH Tips popup.js */

var waddr='';
var wleg='';
var sitestatus='';

function balDisplay(b,u,r){ // bal, unconfirmed bal, rate
	document.getElementById('bal_wrap').innerHTML='Balance:<br><div id="wbal">&nbsp;</div><div id="wbal_usd">&nbsp;</div>';
	if(b!=0) b=parseFloat(b).toFixed(8);
	document.getElementById('wbal').innerHTML=b+' BCH<br>';
	if(b>0) document.getElementById('wbal_usd').innerHTML=' ($'+parseFloat(r*b).toFixed(2)+' USD)<br>'; else document.getElementById('wbal_usd').innerHTML='';
	if(u!=0){
		document.getElementById('bal_wrap').innerHTML+='<span id="wbalu"></span><span id="wbalu_usd"></span><br>';
		if(u>0) var sign='+'; else var sign='';
		document.getElementById('wbalu').innerHTML=sign+parseFloat(u).toFixed(8)+' BCH ';
		if(u<0) uu=u*-1; else uu=u;
		document.getElementById('wbalu_usd').innerHTML=' ($'+parseFloat(r*uu).toFixed(2)+' USD)';
	}
	document.getElementById('bal_wrap').innerHTML+='<br><div id="status"></div>';
	if((b==0 && u<=0) || b+u<=0) document.getElementById('status').innerHTML='Fund your address to start tipping!'; else document.getElementById('status').innerHTML=sitestatus;
}
		
function updateBalance(){
	// dont spam the api, just load from storage if opened too quickly
	lu=localStorage.getItem('lastupdate');
	if(!lu) lu=0;
	var now=Date.now()/1000|0;
	if(now-lu<10){
		balDisplay(localStorage.getItem('lastbal'),localStorage.getItem('lastbalu'),localStorage.getItem('lastrate'));
		return;
	}
	
	var x0=new XMLHttpRequest(); x0.timeout=15000; x0.open("GET","https://blockdozer.com/insight-api/addr/"+waddr,true);
	var x1=new XMLHttpRequest(); x1.timeout=15000; x1.open("GET","https://cdn.bchftw.com/bchtips/bchprice.csv",true);
	var xs=[x0,x1];
	onRequestsComplete(xs, function(xr, xerr){
		try { var resp=JSON.parse(x0.responseText); } catch(e){}
		var rate=x1.responseText.trim();
		for(let i=0;i<xs.length;i++){
			if(xs[i].status!==200 || xs[i].responseText=='' || isNaN(resp.balance) || isNaN(rate)){
				if(i==0) var m='Error getting balance. Site seems down.<br>This should be temporary.'; else if(i==1) var m='Error getting BCH/USD price.<br>This should be temporary.';
				document.getElementById('bal_wrap').innerHTML='<span id="wbal_error">'+m+'</span>';
				if(debug){ console.log('error '+m+' xs='); console.log(xs); }
				return;
			}
		}
		localStorage.setItem('lastupdate',now);
		localStorage.setItem('lastrate',rate);
		localStorage.setItem('lastbal',resp.balance);
		localStorage.setItem('lastbalu',resp.unconfirmedBalance);
		balDisplay(resp.balance,resp.unconfirmedBalance,rate)
	});
	x0.send(); x1.send();
}

function footer(){
	document.body.innerHTML+='<div id="foot_wrap"><a target="_blank" href="https://github.com/bchtips/bchtips/blob/master/README.md">GitHub</a> | <a target="_blank" href="https://twitter.com/bchtips">Twitter</a>  | <a target="_blank" href="https://www.reddit.com/r/bchtips">Reddit</a> | <a target="_blank" href="https://www.reddit.com/r/bchtips/comments/7xwnqq/bch_tips_is_the_easiest_and_most_secure_bitcoin/#tip" id="tipauthor">Tip the author!</a></div>';
}

var valid_site_urls=['https://www.reddit.com'];//,'https://twitter.com/'];
document.addEventListener('DOMContentLoaded', () => {
	chrome.storage.largeSync.get(['data'],function(obj){
		if(debug) console.log(obj);
		if(!obj.data || (!obj.data.waddr && !obj.data.wkey)) var error='first'; // no error message
		if(!error && !obj.data.waddr) var error='noaddr';
		if(!error && !obj.data.wkey) var error='nokey';
		if(!error){
			if(debug) console.log('testing addr');
			try {
				var isleg=bchaddr.isLegacyAddress(obj.data.waddr);
				var iscash=bchaddr.isCashAddress(obj.data.waddr);
			} catch(err){
				var error='invalidaddr';
			}
		}
		if(!error){
			waddr=bchaddr.toCashAddress(obj.data.waddr).substr(12);
			wleg=bchaddr.toLegacyAddress(obj.data.waddr);
			try {
				var wif=obj.data.wkey;
				address=new bch.PrivateKey(wif).toAddress().toString();
			} catch(err){
				var error='invalidkey';
			}
		}
		if(!error) if(address!=wleg) var error='wrongkey';
		// if not cashaddress, fix
		if(isleg){
			if(debug) console.log('converting to cashaddr..');
			obj.data.waddr=bchaddr.toCashAddress(obj.data.waddr).substr(12);
			chrome.storage.largeSync.set({data:{ waddr: obj.data.waddr, wkey: obj.data.wkey }});
		}

		if(!error){
			chrome.tabs.query({active:true,currentWindow:true}, function(tabs){
				if(tabs[0] && tabs[0].url && tabs[0].url.indexOf('.reddit.com/')!==-1){
					sitestatus='<img src="https://www.redditstatic.com/desktop2x/img/favicon/favicon-16x16.png">  Reddit tipping enabled.<br>Click <span class="greenbold">send tip</span> beneath a comment or post.';
				}
				if(!sitestatus) sitestatus='Browse to a supported site to start tipping!';

				document.body.innerHTML+='<br><span id="waddr_wrap">'+waddr+'<br><span id="waddrqr" style="display:none"><img src="http://chart.apis.google.com/chart?chs=240x240&cht=qr&choe=ISO-8859-1&chl=bitcoincash:'+waddr+'"><br></span></span><span id="wleg_wrap" style="display:none">'+wleg+'<br><span id="wlegqr" style="display:none"><img src="http://chart.apis.google.com/chart?chs=240x240&cht=qr&choe=ISO-8859-1&chl='+wleg+'"><br></span></span><div id="byline"><a target="_blank" href="tx.html" title="Transaction History & Queue">Transactions</a> | <a target="_blank" href="https://blockdozer.com/address/'+waddr+'" title="Explore Address on Blockdozer" id="vb">Explore</a> | <a href="#" title="Toggle QR Code" id="sqr">Show QR</a> | <a href="#" title="Toggle Format" id="frm"></a> | <a href="#" title="Remove address" id="rw">Remove</a></div>';
				//document.body.innerHTML+='Key:<br>'+obj.data.wkey+'<br><br>';
				document.body.innerHTML+='<div id="bal_wrap">Balance:<br><div id="wbal">&nbsp;</div><div id="wbal_usd">&nbsp;</div>';
				footer();
				updateBalance();
				setInterval(updateBalance,15000);
				// init format
				chrome.storage.largeSync.get(['format','showqr'],function(fob){
					if(!fob.format || fob.format=='c'){
						document.getElementById('wleg_wrap').style.display='none';
						document.getElementById('waddr_wrap').style.display='';
						document.getElementById('frm').innerHTML='Legacy';
						chrome.storage.largeSync.set({format:'c'});
					} else {
						document.getElementById('waddr_wrap').style.display='none';
						document.getElementById('wleg_wrap').style.display='';
						document.getElementById('frm').innerHTML='CashAddr';
					}
					/*if(fob.showqr){
						document.getElementById('waddrqr').style.display='';
						document.getElementById('wlegqr').style.display='';
						document.getElementById('sqr').innerHTML='Hide QR';
					} else {
						document.getElementById('waddrqr').style.display='none';
						document.getElementById('wlegqr').style.display='none';
						document.getElementById('sqr').innerHTML='Show QR';
					}*/
				});
				document.getElementById('frm').addEventListener('click',function(){ // toggle format
					if(document.getElementById('waddr_wrap').style.display=='none'){
						document.getElementById('wleg_wrap').style.display='none';
						document.getElementById('waddr_wrap').style.display='';
						document.getElementById('frm').innerHTML='Legacy';
						chrome.storage.largeSync.set({format:'c'});
					} else {
						document.getElementById('waddr_wrap').style.display='none';
						document.getElementById('wleg_wrap').style.display='';
						document.getElementById('frm').innerHTML='CashAddr';
						chrome.storage.largeSync.set({format:'l'});
					}
				});
				document.getElementById('sqr').addEventListener('click',function(){
					if(document.getElementById('waddrqr').style.display=='none'){
						document.getElementById('waddrqr').style.display='';
						document.getElementById('wlegqr').style.display='';
						document.getElementById('sqr').innerHTML='Hide QR';
						//chrome.storage.largeSync.set({showqr:1});
					} else {
						document.getElementById('waddrqr').style.display='none';
						document.getElementById('wlegqr').style.display='none';
						document.getElementById('sqr').innerHTML='Show QR';
						//chrome.storage.largeSync.set({showqr:''});
					}
				});
				document.getElementById('rw').addEventListener('click',function(){
					if(confirm('Are you sure you want to remove the address? If you don\'t have a copy of the private key your funds will be lost!')){
						chrome.storage.largeSync.set({data:{ waddr: '', wkey: '' }});
						location.reload();
					}
				});
			});
		} else {
			// address entry page
			if(debug) console.log('error='+error);
			if(error!='first'){
				if(obj.data.waddr) localStorage.setItem('waddr',obj.data.waddr);
				if(obj.data.wkey) localStorage.setItem('wkey',obj.data.wkey);
			}
			chrome.storage.largeSync.set({data:{ waddr: '', wkey: '' }});
			if(error=='noaddr') document.body.innerHTML+='<div id="error">Please enter an address.</div>';
			else if(error=='nokey') document.body.innerHTML+='<div id="error">Please enter a key.</div>';
			else if(error=='invalidaddr'){ document.body.innerHTML+='<div id="error">Not a valid address. Please try again.</div>'; localStorage.setItem('waddr',''); }
			else if(error=='invalidkey'){ document.body.innerHTML+='<div id="error">Not a valid key. Please try again.</div>'; localStorage.setItem('wkey',''); }
			else if(error=='wrongkey'){ document.body.innerHTML+='<div id="error">Not the right key. Please try again.</div>'; localStorage.setItem('wkey',''); }
			document.body.innerHTML+='<br>First, you\'re going to need to add an address.<br>Enter an address (cashaddr or legacy) and key below:<br><br><table border=0 cellspacing=0 cellpadding=0><tr><td>Address:</td><td><input id="waddr" size="30"></td></tr><tr><td>Key:</td><td><input id="wkey" size="30"></td></tr></table><button id="gen">Generate</button> <button id="add">Add</button><br><span id="genhelp"></span><br>';
			footer();
			document.getElementById('waddr').value=localStorage.getItem('waddr');
			document.getElementById('wkey').value=localStorage.getItem('wkey');
			if(document.getElementById('waddr').value==='') document.getElementById('waddr').focus(); else if(document.getElementById('wkey').value==='') document.getElementById('wkey').focus();
			document.getElementById('waddr').addEventListener('blur', waddrblur = function(){ localStorage.setItem('waddr', document.getElementById('waddr').value); localStorage.setItem('wkey', document.getElementById('wkey').value); });
			document.getElementById('wkey').addEventListener('blur', wkeyblur = function(){ localStorage.setItem('waddr', document.getElementById('waddr').value); localStorage.setItem('wkey', document.getElementById('wkey').value); });
			document.getElementById('waddr').addEventListener('focus', waddrsel = function(){ document.getElementById('waddr').select(); });
			document.getElementById('wkey').addEventListener('focus', wkeysel = function(){ document.getElementById('wkey').select(); });
			document.getElementById('gen').addEventListener('click',function(){
				//var r=genVanityKeypair('1bch');
				key = new bch.PrivateKey();
				address = key.toAddress();
				document.getElementById('waddr').value=bchaddr.toCashAddress(address.toString()).substr(12);
				document.getElementById('wkey').value=key;
				localStorage.setItem('waddr', document.getElementById('waddr').value);
				localStorage.setItem('wkey', document.getElementById('wkey').value);
				document.getElementById('genhelp').innerHTML='Make sure you copy the private key somewhere safe!<br>It won\'t be shown again!<br>';
			});
			document.getElementById('add').addEventListener('click',function(){
				// save wallet infos
				chrome.storage.largeSync.set({data:{ waddr: document.getElementById('waddr').value, wkey: document.getElementById('wkey').value }});
				document.getElementById('waddr').removeEventListener('blur',waddrblur);
				document.getElementById('wkey').removeEventListener('blur',wkeyblur);
				localStorage.setItem('waddr','');
				localStorage.setItem('wkey','');
				location.reload();
			});
		}
	});
});