function refreshData(){
	chrome.storage.largeSync.get(['options'],function(o){
		if(!o.options) o.options={};
		if(!o.options.queue_run_freq) o.options.queue_run_freq=5;
		if(!o.options.queue_item_delay) o.options.queue_item_delay=3;
		if(!o.options.show_timing_note) o.options.show_timing_note='';
		if(!o.options.bg_sent_notification) o.options.bg_sent_notification='';
		if(!o.options.tip_sent_msg) o.options.tip_sent_msg='I sent you a tip of {amount}{foryourpost} with {bchtips}!';
		if(!o.options.tip_queued_msg) o.options.tip_queued_msg='I tipped you {amount}{foryourpost}! {howto}';
		var html='<table><!--<thead><tr><td>Option</td><td>Value</td></tr></thead>--><tbody>';
		html+='<tr><td>Queue run frequency (mins)<br><div class="option_info">How frequently the script checks every user in queue to see if they\'ve added an address. Won\'t interfere with incomplete runs so can be set as low as desired.</div></td><td><input id="queue_run_freq" type="number" step="1" min="1" max="999" value="'+o.options.queue_run_freq+'"></td></tr>';
		html+='<tr><td>Queue item delay (secs)<br><div class="option_info">The number of seconds between checking each queue item. A minimum of 3 seconds is required.</div></td><td><input id="queue_item_delay" type="number" step="1" min="3" max="999" value="'+o.options.queue_item_delay+'"></td></tr>';
		html+='<tr><td>Show timing note on transactions page<div class="option_info">Disable to keep things compact and tidy. Options can always be accessed by right-clicking the toolbar icon.</div></td><td><input id="show_timing_note" type="checkbox" '; if(o.options.show_timing_note) html+=' checked="checked"'; html+='></td></tr>';
		html+='<tr><td>System notification when tip sent in background<div class="option_info">Notify when a tip is sent during a queue run.</div></td><td><input id="bg_sent_notification" type="checkbox" '; if(o.options.bg_sent_notification) html+=' checked="checked"'; html+='></td></tr>';
		html+='<tr><td>Tip sent suggested message<div class="option_info">Dynamic data is available. <span class="tag">{amount}</span> is replaced with the tip BCH and USD value. <span class="tag">{foryourpost}</span> is replaced with a link to the tipped post or comment and begins with a space (only works in PMs). <span class="tag">{txid}</span> is replaced with the transaction ID. <span class="tag">{bchtips}</span> is replaced with a link to BCH Tips on the current site (please help spread the word).</div></td><td><textarea id="tip_sent_msg" rows="3" cols="45">'; if(o.options.tip_sent_msg) html+=o.options.tip_sent_msg; html+='</textarea></td></tr>';
		html+='<tr><td>Tip queued suggested message<div class="option_info">Dynamic data is the same as in "Tip sent" above, plus <span class="tag">{howto}</span> is replaced with a link to a "How to collect" post on the current site.</div></td><td><textarea id="tip_queued_msg" rows="3" cols="45">'; if(o.options.tip_queued_msg) html+=o.options.tip_queued_msg; html+='</textarea></td></tr>';
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
	if(document.getElementById('queue_run_freq').value>999) document.getElementById('queue_run_freq').value=999;
	o.queue_run_freq=document.getElementById('queue_run_freq').value;
	if(isNaN(document.getElementById('queue_item_delay').value) || document.getElementById('queue_item_delay').value<3) document.getElementById('queue_item_delay').value=3;
	if(document.getElementById('queue_item_delay').value>999) document.getElementById('queue_item_delay').value=999;
	o.queue_item_delay=document.getElementById('queue_item_delay').value;
	itemDelay=o.queue_item_delay; // global, propagate
	for(let i=0;i<chrome.extension.getViews().length;i++){ if(chrome.extension.getViews()[i].location.pathname.indexOf('/_generated_background_page.html')!==-1) chrome.extension.getViews()[i].itemDelay=itemDelay; break; }
	if(document.getElementById('show_timing_note').checked) o.show_timing_note=1; else o.show_timing_note='';
	if(document.getElementById('bg_sent_notification').checked) o.bg_sent_notification=1; else o.bg_sent_notification='';
	if(!document.getElementById('tip_sent_msg').value) document.getElementById('tip_sent_msg').value='I sent you a tip of {amount}{foryourpost} with {bchtips}!';
	o.tip_sent_msg=document.getElementById('tip_sent_msg').value;
	if(!document.getElementById('tip_queued_msg').value) document.getElementById('tip_queued_msg').value='I tipped you {amount}{foryourpost}! {howto}';
	o.tip_queued_msg=document.getElementById('tip_queued_msg').value;
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