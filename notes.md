## reddit.js
- set tip amount box, unit select, reply textarea to browser default like Send button, make sure tip box looks good on variety of subreddit styles
- cancel reply if empty when cancel tip
- refresh open tabs when extension reloads so storage continues working

## popup.js

## tx.js
- enable site field when add more sites

## options page (todo)
- automatically append suggested text to reply, if available (no automatic pms due to captcha?)
- automatically submit comment reply
- add txid to reply or pm
- notifications enabled
- notification persistence
- text to speech or sounds (custom?) enabled

## event.js
- dont set alarm until first tip queued

## misc
- get and sync feerate globally only every 60s
- firefox, opera and other browser support

## minor improvements / may not implement
- dont activate 'view tx' explorer link after send for a couple seconds so the tx is always in mempool when the user clicks
- use multi-ajax to run updateRate and updateUtxos at same time (keeping the 2s offset allows for separate adjustment)
- disable queuing 'all' funds because test address signature and actual signature size can be off by one sat (insufficient funds on final send)
- only query bchtips database if address not found in profile (takes longer and makes code bigger and we cache with cloudflare anyway)
- animation on tip b̶o̶x̶ ̶o̶p̶e̶n̶i̶n̶g̶ ̶a̶n̶d̶ closing, removed queued tips, popup changes, etc.
- notification of wallet fundings (though could be good for notification of received tips)
- add an icon or note about past tips beside posts or comments that are in tx history, e.g. "you tipped _" in green instead of "send tip"
- detect maintenance page when reading user profile (now throws error)
- calculate USD using current exchange rate on queued tips (seems to make sense that all queue/history keep the USD from queuing/sending time)
- use available utxos to calculate balance in popup? (though kind of nice to have 2 types of balances..)
- show BCH amount beside All unit dropdown? meh, balance is right there..
- add link to tx explorer to suggested message after send. privacy implication: everyone knows your balance.. not implementing for that reason. consider mixing option?
- allow user to edit and save suggested message. use templating for dynamic data
- allow queuing tips even if insufficient funds?