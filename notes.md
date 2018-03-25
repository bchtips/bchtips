## reddit.js
- pause interval updates when tab not focused, resume immediately on focus
- background sending of queued tips, warning notification when tip can't be sent, confirm notif when tip sent
- make #tip urls, send tip clicks, etc. more graceful when no address set. maybe simply alert when send tip clicked and dont load
- set tip amount box, unit select, reply textarea to browser default like Send button, make sure tip box looks good on variety of subreddit styles
- when click 'send tip' on a comment permalink parent post jump to the post page with hash #tip so can reply
- use multi-ajax to run updateRate and updateUtxos at same time
- change 'send tip' link to 'cancel tip' when open, also cancel reply if empty when cancel
- only query bchtips database if address not found in profile
- refresh open tabs when extension reloads so storage continues working

## popup.js
- change 'Fund your address' to standard message when just have unconfirmed balance because tipping works with unconfirmed utxos (barring reorg)
- also display balance in USD

## tx.js
- enable site field when add more sites

## options page (todo)
- automatically append suggested text to reply, if available (no automatic pms due to captcha?)
- automatically submit comment reply
- notifications enabled
- notification persistence
- text to speech or sounds (custom?) enabled

## event.js

## misc
- get and sync feerate globally only every 60s
- animation on tip b̶o̶x̶ ̶o̶p̶e̶n̶i̶n̶g̶ ̶a̶n̶d̶ closing, removed queued tips, popup changes, etc.

## may not implement
- notification of wallet fundings (though would be good for notification of received tips)
- add an icon or note about past tips beside posts or comments that are in tx history, e.g. "you tipped _" in green instead of "send tip"
- detect maintenance page when reading user profile (now throws error)
- make a non-index-based id for queue item cancellations to avoid race issue if tip is queued while queue is full and confirmation window open
- calculate USD using current exchange rate on queued tips
- use available utxos to calculate balance in popup? (though kind of nice to have 2 types of balances..)
- show BCH amount beside All unit dropdown? meh, balance is right there..
- add link to tx explorer to suggested message after send. privacy implication: everyone knows your balance.. not implementing for that reason. consider mixing option?
- update added reply text automatically when rate changes, replace last with current. make sure cursor doesn't screw up if currently typing.
  - allow user to edit and save suggested message. use templating for dynamic data
- allow queueing tips even if insufficient funds?