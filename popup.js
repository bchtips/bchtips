/* BCH Tips popup.js */

var waddr='';
var wleg='';
var sitestatus='';
var fundstatus='Fund your address to start tipping!';

function updateBalance(){
	// dont spam the api, just load from storage if popup opened too quickly
	lu=localStorage.getItem('lastupdate');
	if(!lu) lu=0;
	console.log('lu='+lu);
	var now=Date.now() / 1000 | 0;
	if(now-lu<10){
		if(!isNaN(localStorage.getItem('lastbal') || localStorage.getItem('lastbal_un')!==0)){
			console.log('lastbal='+localStorage.getItem('lastbal')+' lastbal_un='+localStorage.getItem('lastbal_un'));
			document.getElementById('wbal').innerHTML=parseFloat(localStorage.getItem('lastbal')).toFixed(8)+' BCH<br>';
			if(localStorage.getItem('lastbal_un')!=0){
				if(localStorage.getItem('lastbal_un')>0) var sign='+'; else var sign='';
				document.getElementById('wbal').innerHTML+='<div id="wbal_unc">'+sign+parseFloat(localStorage.getItem('lastbal_un')).toFixed(8)+' BCH (Unconfirmed)</div>';
			}
			if(localStorage.getItem('lastbal')==0) document.getElementById('status').innerHTML=fundstatus; else document.getElementById('status').innerHTML=sitestatus;
		}
		return;
	}
	console.log('updating balance');
	var xhr = new XMLHttpRequest();
	//xhr.open("GET", "https://cashexplorer.bitcoin.com/api/addr/"+wleg, true);
	xhr.open("GET", "https://blockdozer.com/insight-api/addr/"+waddr, true);
	xhr.onreadystatechange = function(){
		if(xhr.readyState == 4){
			if(xhr.status == 200){
				localStorage.setItem('lastupdate',now);
				if(xhr.responseText){
					var resp = JSON.parse(xhr.responseText);
					if(!isNaN(resp.balance)){
						//resp.balance=1;
						localStorage.setItem('lastbal',resp.balance);
						localStorage.setItem('lastbal_un',resp.unconfirmedBalance);
						if(resp.unconfirmedBalance!==0) if(resp.unconfirmedBalance>0) var sign='+'; else var sign='';
						document.getElementById('wbal').innerHTML=resp.balance.toFixed(8)+' BCH<br>';
						if(resp.unconfirmedBalance!==0) document.getElementById('wbal').innerHTML+='<div id="wbal_unc">'+sign+resp.unconfirmedBalance.toFixed(8)+' BCH (Unconfirmed)</div>';
						if(resp.balance==0) document.getElementById('status').innerHTML=fundstatus; else document.getElementById('status').innerHTML=sitestatus;
						//	if(resp.balance>=0) document.getElementById('wbal').innerHTML+='<span id="wbal_usd">$'+resp.data[0].sum_value_unspent_usd+' USD</span><br>';
					} else var balerr=1;
				} else var balerr=1;
			} else balerr=1;
		}
		if(balerr){
			document.getElementById('wbal').innerHTML='<span id="wbal_error">Error getting balance.</span><br>';
		}
	}
	xhr.send();
}

function footer(){
	document.body.innerHTML+='<div id="foot_wrap"><a target="_blank" href="https://github.com/bchtips/bchtips/blob/master/README.md">GitHub</a> | <a target="_blank" href="https://twitter.com/bchtips">Twitter</a>  | <a target="_blank" href="https://www.reddit.com/r/bchtips">Reddit</a> | <a target="_blank" href="https://www.reddit.com/r/bchtips/comments/7xwnqq/bch_tips_is_the_easiest_and_most_secure_bitcoin/#tip" id="tipauthor">Tip the author!</a></div>';
}

var valid_site_urls=['https://www.reddit.com'];//,'https://twitter.com/'];
document.addEventListener('DOMContentLoaded', () => {
	chrome.storage.sync.get('data',function(obj){
		console.log(obj);
		if(!obj.data || (!obj.data.waddr && !obj.data.wkey)) var error='first'; // no error message
		if(!error && !obj.data.waddr) var error='noaddr';
		if(!error && !obj.data.wkey) var error='nokey';
		if(!error){
			console.log('testing addr');
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
			console.log('converting to cashaddr..');
			obj.data.waddr=bchaddr.toCashAddress(obj.data.waddr).substr(12);
			chrome.storage.sync.set({'data':{ waddr: obj.data.waddr, wkey: obj.data.wkey }});
		}

		if(!error){
			// check if on reddit, if not, gray icon & popup says "site not supported"
			chrome.tabs.query({active:true,currentWindow:true},function(tabArr){
				url=tabArr[0].url;
				for(i=0;i<valid_site_urls.length;i++){
					var q=valid_site_urls[i];
					if(url.substr(0,q.length)==q){
						if(q.indexOf('reddit')!=-1){
							sitestatus='Reddit tipping enabled.<br>Click <span class="greenbold">send tip</span> beneath a comment or post.';
							break;
						} else if(q.indexOf('twitter')!=-1){
							sitestatus='Twitter tipping enabled.<br>Click Tip beneath a tweet.';
							break;
						}
					}
				}
				if(!sitestatus) sitestatus='Browse to a supported site to start tipping!';
				chrome.storage.sync.get('test',function(o){
					console.log(o);
				});

				document.body.innerHTML+='<br><span id="waddr_wrap">'+waddr+'<br><span id="waddrqr"></span></span><span id="wleg_wrap">'+wleg+'<br><span id="wlegqr"></span></span><span id="byline"><a target="_blank" href="tx.html" title="View Transaction History & Queue">View TX</a> | <a target="_blank" href="https://blockdozer.com/insight/address/'+waddr+'" title="Explore Address on Blockdozer" id="vb">Explore</a> | <a href="#" title="Toggle QR Code" id="sqr">Show QR</a> | <a href="#" title="Toggle Format" id="frm"></a> | <a href="#" title="Remove address" id="rw">Remove</a> | <a href="#" id="tn">Test</a></span><br><br>';
				//document.body.innerHTML+='Key:<br>'+obj.data.wkey+'<br><br>';
				document.body.innerHTML+='Balance:<br><span id="wbal">&nbsp;</span><br><span id="status"></span><br><br>';
				
				footer();
				// get balance on a loop
				updateBalance();
				setInterval(updateBalance,15000);
				// for some reason putting the click listener(s) before the if(site) html doesnt work
				// init format
				chrome.storage.sync.get('format',function(fob){
					console.log('fob=');
					console.log(fob);
					if(!fob.format || fob.format=='c'){
						document.getElementById('wleg_wrap').style.display='none';
						document.getElementById('waddr_wrap').style.display='';
						document.getElementById('frm').innerHTML='Legacy';
						chrome.storage.sync.set({'format':'c'});
					} else {
						document.getElementById('waddr_wrap').style.display='none';
						document.getElementById('wleg_wrap').style.display='';
						document.getElementById('frm').innerHTML='CashAddr';
					}
				});
				document.getElementById('frm').addEventListener('click',function(){ // toggle format
					if(document.getElementById('waddr_wrap').style.display=='none'){
						document.getElementById('wleg_wrap').style.display='none';
						document.getElementById('waddr_wrap').style.display='';
						document.getElementById('frm').innerHTML='Legacy';
						chrome.storage.sync.set({'format':'c'});
					} else {
						document.getElementById('waddr_wrap').style.display='none';
						document.getElementById('wleg_wrap').style.display='';
						document.getElementById('frm').innerHTML='CashAddr';
						chrome.storage.sync.set({'format':'l'});
					}
				});
				document.getElementById('sqr').addEventListener('click',function(){
					if(document.getElementById('waddrqr').innerHTML===''){
						document.getElementById('waddrqr').innerHTML='<img src="http://chart.apis.google.com/chart?chs=240x240&cht=qr&choe=ISO-8859-1&chl='+waddr+'"><br>';
						document.getElementById('wlegqr').innerHTML='<img src="http://chart.apis.google.com/chart?chs=240x240&cht=qr&choe=ISO-8859-1&chl='+wleg+'"><br>';
						document.getElementById('sqr').innerHTML='Hide QR';
					} else {
						document.getElementById('waddrqr').innerHTML='';
						document.getElementById('wlegqr').innerHTML='';
						document.getElementById('sqr').innerHTML='Show QR';
					}
				});
				document.getElementById('rw').addEventListener('click',function(){
					if(confirm('Are you sure you want to remove the address? If you don\'t have a copy of the private key your funds will be lost!')){
						chrome.storage.sync.set({'data':{ waddr: '', wkey: '' }});
						location.reload();
					}
				});
				document.getElementById('tn').addEventListener('click',function(){
					var m=new SpeechSynthesisUtterance('Tip sent');
					speechSynthesis.speak(m);
					var m=new SpeechSynthesisUtterance('Fund your wallet to send pending tips');
					speechSynthesis.speak(m);
					var m=new SpeechSynthesisUtterance('Wallet funded');
					speechSynthesis.speak(m);
					//var a=new Audio('snd/sent.mp3');
					//a.play();
					chrome.notifications.create('',{'type':'basic','iconUrl':'img/icon.png','title':'Tip sent','message':'Pending tip of 0.00001234 BCH ($14 USD) sent to JohnDoe on Reddit.','requireInteraction':true,'buttons':[{'title':'View Post/Comment'},{'title':'View TX on Blockchain'}]},function(){});
					chrome.notifications.onButtonClicked.addListener(function(ni,bi){
							console.log('ni='+ni+' bi='+bi);
					});

				});
			});
		} else {
			// address entry page
			console.log('error='+error);
			if(error!='first'){
				if(obj.data.waddr) localStorage.setItem('waddr',obj.data.waddr);
				if(obj.data.wkey) localStorage.setItem('wkey',obj.data.wkey);
			}
			chrome.storage.sync.set({'data':{ waddr: '', wkey: '' }});
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
				chrome.storage.sync.set({'data':{ waddr: document.getElementById('waddr').value, wkey: document.getElementById('wkey').value }});
				document.getElementById('waddr').removeEventListener('blur',waddrblur);
				document.getElementById('wkey').removeEventListener('blur',wkeyblur);
				localStorage.setItem('waddr','');
				localStorage.setItem('wkey','');
				location.reload();
			});
		}
	});
});