# BCH Tips has been discontinued. Transfer all funds to another wallet.

If you forgot your private key, click the BCH Tips icon in the toolbar, within the popup do Right-click > Inspect, and run the following in Console:

`chrome.storage.largeSync.get(['data'],c=>{ console.log(c.data.wkey); });`

You can do whatever you want with the code in this repository. If you want a copy of the backend scripts email bchtips@hotmail.com

---

BCH Tips is a browser extension for easy, trustless tipping with Bitcoin Cash on social media.

~~[Download it on the Chrome web store](https://chrome.google.com/webstore/detail/bch-tips/idebkiaipjhbpehcbdlbldobffniiicg?authuser=3)~~

**Features**

* All tips on-chain and sent from your browser - no third party ever holds your funds.

* Browser-based wallet - no need to load a separate program. Keys are stored and optional address generation is performed locally in browser. Transactions are transmitted directly from the extension.

* Tip buttons are integrated into social media sites for easy access - just click "send tip" beneath the post or comment you want to tip the author of and a tip box will appear right there. BCH/USD and fee estimates are updated live as you contemplate the amount and any reply.

* After queuing or sending you are presented with generated text that can be applied with one click to a comment or private message telling the recipient about the tip and/or how to retrieve it.

* Automatic detection of tip addresses posted in public user profiles or submitted to our database.

* Queuing of tips to people without addresses and automatic background sending when they add one.

* Transactions are almost always sent with 1 sat/B fees.

* It's not necessary to wait for confirmations when funding your wallet or sending tips. The current UTXOs are used to calculate your available tipping balance and they are updated within seconds of sending and receiving.

* Tip messages are customizable and can be included with your comments to keep clutter to a minimum.


**Reddit Usage**

Each post and comment features a new "send tip" link in the toolbar. When clicked, the poster's user profile page will be searched for a Bitcoin Cash address, with or without the bitcoincash: prefix. If an address is not found a request will be made to our database to see if the user has submitted an address. Tip and optional reply (if available) and PM options will appear on the page. After choosing the tip amount and submitting, if an address was found the transaction will be transmitted. If an address was not found the tip will be pending until the user adds an address to their profile or submits an address via [PM to bchtips](https://www.reddit.com/message/compose/?to=bchtips&subject=my%20bitcoin%20cash%20address) (the address may appear anywhere in the subject or message body). Once the user has an address the extension will automatically send the tip you authorized next time you're online. You can view a history of tips you have sent and monitor the progress of acceptance and confirmation by clicking the extension icon in your browser toolbar.

**Thanks for using BCH Tips!**
