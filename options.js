function refreshData(){
	chrome.storage.largeSync.get(['options'],function(o){
		if(!o.options) o.options={};
		if(!o.options.queue_run_freq) o.options.queue_run_freq=60;
		if(!o.options.queue_item_delay) o.options.queue_item_delay=15;
		if(!o.options.show_timing_note) o.options.show_timing_note='';
		if(!o.options.include_tx_enabled) o.options.include_tx_enabled='';
		if(!o.options.bg_sent_notification) o.options.bg_sent_notification='';
		var html='<table><!--<thead><tr><td>Option</td><td>Value</td></tr></thead>--><tbody>';
		html+='<tr><td>Queue run frequency (mins)<br><div class="option_info">How frequently the script checks every user in queue to see if they\'ve added an address. Won\'t interfere with incomplete runs so can be set as low as desired.</div></td><td><input id="queue_run_freq" type="number" step="1" min="1" max="1440" value="'+o.options.queue_run_freq+'"></td></tr>';
		html+='<tr><td>Queue item delay (secs)<br><div class="option_info">The number of seconds between checking each queue item. Won\'t interfere with incomplete items so can be set as low as desired.</div></td><td><input id="queue_item_delay" type="number" step="1" min="1" max="43200" value="'+o.options.queue_item_delay+'"></td></tr>';
		html+='<tr><td>Show timing note on transactions page<div class="option_info">Disable to keep things compact and tidy. Options can always be accessed by right-clicking the toolbar icon.</div></td><td><input id="show_timing_note" type="checkbox" '; if(o.options.show_timing_note) html+=' checked="checked"'; html+='></td></tr>';
		html+='<tr style="display:none"><td>Include link to transaction in suggested message<div class="option_info">Only available for tips sent immediately and not queued.</div></td><td><input id="include_tx_enabled" type="checkbox" '; if(o.options.include_tx_enabled) html+=' checked="checked"'; html+='></td></tr>';
		html+='<tr><td>System notification when tip sent in background<div class="option_info">Notify when a tip is sent during a queue run<!-- or user-signaled update-->.</div></td><td><input id="bg_sent_notification" type="checkbox" '; if(o.options.bg_sent_notification) html+=' checked="checked"'; html+='></td></tr>';
		html+='<tr><td colspan="2" style="text-align:center; padding-right:0;"><button id="save">Save Options</button></td></tr></tbody></table>';
		document.getElementById('options').innerHTML=html;
		document.getElementById('queue_run_freq').addEventListener('click',function(){ this.select(); });
		document.getElementById('queue_item_delay').addEventListener('click',function(){ this.select(); });
		document.getElementById('save').addEventListener('click',function(){ saveData(); });
	});
}
function saveData(){
	if(debug) console.log('saveData()');
	var o={};
	if(isNaN(document.getElementById('queue_run_freq').value) || document.getElementById('queue_run_freq').value<1) document.getElementById('queue_run_freq').value=1;
	o.queue_run_freq=document.getElementById('queue_run_freq').value;
	if(isNaN(document.getElementById('queue_item_delay').value) || document.getElementById('queue_item_delay').value<1) document.getElementById('queue_item_delay').value=1;
	o.queue_item_delay=document.getElementById('queue_item_delay').value;
	itemDelay=o.queue_item_delay; // global, propagate
	for(let i=0;i<chrome.extension.getViews().length;i++){ if(chrome.extension.getViews()[i].location.pathname.indexOf('/_generated_background_page.html')!==-1) chrome.extension.getViews()[i].itemDelay=itemDelay; break; }
	if(document.getElementById('show_timing_note').checked) o.show_timing_note=1; else o.show_timing_note='';
	if(document.getElementById('include_tx_enabled').checked) o.include_tx_enabled=1; else o.include_tx_enabled='';
	if(document.getElementById('bg_sent_notification').checked) o.bg_sent_notification=1; else o.bg_sent_notification='';
	if(debug){ console.log('final o='); console.log(o); }
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