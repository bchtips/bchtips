function refreshData(){
	chrome.storage.largeSync.get(['options'],function(o){
		if(!o.options) o.options={};
		if(!o.options.queue_run_freq) o.options.queue_run_freq=60;
		if(!o.options.queue_item_delay) o.options.queue_item_delay=15;
		if(!o.options.user_update_freq) o.options.user_update_freq=5;
		if(!o.options.user_update_enabled) o.options.user_update_enabled='';
		if(!o.options.show_timing_note) o.options.show_timing_note='';
		if(!o.options.include_tx_enabled) o.options.include_tx_enabled='';
		if(!o.options.bg_sent_notification) o.options.bg_sent_notification='';
		var html='<table><!--<thead><tr><td>Option</td><td>Value</td></tr></thead>--><tbody>';
		html+='<tr><td>Queue run frequency (mins)<br><div class="option_info">How frequently the script checks every user in queue to see if they\'ve added an address.</div></td><td><input id="queue_run_freq" type="number" step="1" min="2" max="1440" value="'+o.options.queue_run_freq+'"></td></tr>';
		html+='<tr><td>Queue item delay (secs)<br><div class="option_info">The number of seconds between checking each queue item.</div></td><td><input id="queue_item_delay" type="number" step="1" min="10" max="43200" value="'+o.options.queue_item_delay+'"></td></tr>';
		html+='<tr style="display:none"><td>User-signaled updates frequency (mins)<br><div class="option_info">A more efficient check to see if a user has added an address. It polls the BCH Tips server to see if a user has manually notified of an address via PM (not all will). This can speed up the first send. 5-10 is recommended.</div></td><td><input id="user_update_enabled" type="checkbox" '; if(o.options.user_update_enabled) html+=' checked="checked"'; html+='><input id="user_update_freq" type="number" step="1" min="3" max="30" value="'+o.options.user_update_freq+'"></td></tr>';
		html+='<tr><td>Show timing note on transactions page<div class="option_info">Disable to keep things compact and tidy. Options can always be accessed by right-clicking the toolbar icon.</div></td><td><input id="show_timing_note" type="checkbox" '; if(o.options.show_timing_note) html+=' checked="checked"'; html+='></td></tr>';
		html+='<tr style="display:none"><td>Include link to transaction in suggested message<div class="option_info">Only available for tips sent immediately and not queued.</div></td><td><input id="include_tx_enabled" type="checkbox" '; if(o.options.include_tx_enabled) html+=' checked="checked"'; html+='></td></tr>';
		html+='<tr><td>System notification when tip sent in background<div class="option_info">Notify when a tip is sent during a queue run<!-- or user-signaled update-->.</div></td><td><input id="bg_sent_notification" type="checkbox" '; if(o.options.bg_sent_notification) html+=' checked="checked"'; html+='></td></tr>';
		html+='<tr><td colspan="2" style="text-align:center; padding-right:0;"><button id="save">Save Options</button></td></tr></tbody></table>';
		document.getElementById('options').innerHTML=html;
		document.getElementById('queue_run_freq').addEventListener('click',function(){ this.select(); });
		document.getElementById('queue_item_delay').addEventListener('click',function(){ this.select(); });
		document.getElementById('user_update_freq').addEventListener('click',function(){ this.select(); });
		document.getElementById('save').addEventListener('click',function(){ saveData(); });
	});
}
function saveData(){
	if(debug) console.log('saveData()');
	var o={};
	if(isNaN(document.getElementById('queue_run_freq').value) || document.getElementById('queue_run_freq').value<2) document.getElementById('queue_run_freq').value=2;
	o.queue_run_freq=document.getElementById('queue_run_freq').value;
	if(isNaN(document.getElementById('queue_item_delay').value) || document.getElementById('queue_item_delay').value<10) document.getElementById('queue_item_delay').value=10;
	o.queue_item_delay=document.getElementById('queue_item_delay').value;
	//if(isNaN(document.getElementById('user_update_freq').value) || document.getElementById('user_update_freq').value<3) document.getElementById('user_update_freq').value=3;
	//o.user_update_freq=document.getElementById('user_update_freq').value;
	//if(o.user_update_freq===0) o.user_update_freq='';
	//if(document.getElementById('user_update_enabled').checked) o.user_update_enabled=1; else o.user_update_enabled='';
	if(document.getElementById('show_timing_note').checked) o.show_timing_note=1; else o.show_timing_note='';
	if(document.getElementById('include_tx_enabled').checked) o.include_tx_enabled=1; else o.include_tx_enabled='';
	if(document.getElementById('bg_sent_notification').checked) o.bg_sent_notification=1; else o.bg_sent_notification='';
	if(debug){ console.log('final o='); console.log(o); }
	/*if(o.user_update_enabled){
		o.user_update_freq=parseInt(o.user_update_freq);
		chrome.alarms.get('usu',function(a){
			if(debug){ console.log('alarm usu a='); console.log(a); }
			if(!a || (a && a.periodInMinutes!=o.user_update_freq)){
				if(debug) console.log('alarm not set or period != '+o.user_update_freq+', setting');
				chrome.alarms.clear('usu');
				chrome.alarms.create('usu',{periodInMinutes:o.user_update_freq});
				if(debug) setTimeout(function(){ chrome.alarms.getAll(function(a){ console.log('alarms='); console.log(a); }); },1000);
			}
		});
	} else {
		if(debug) console.log('clearing usu alarm');
		chrome.alarms.clear('usu');
	}*/
	chrome.storage.largeSync.set({options:o},function(r){
		refreshData();
		iqwerty.toast.Toast('Options saved.',{style:{main:{'font-size':'16px',background:'rgba(0, 85, 0, .85)'}},settings:{duration:5000}})
	});
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',afterDOMLoaded); else afterDOMLoaded();
function afterDOMLoaded(){
	window.addEventListener('focus',function(){
		refreshData();
	});
	refreshData();
}