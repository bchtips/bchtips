**1.0.15**

* Added customization of tip sent and queued messages with dynamic data including txid
* Increased Queue Item Delay minimum to 3 seconds to avoid sync limits
* Added detection of duplicate txids when sending the same amount twice in a row quickly (server ignored tx)
* Fixed a bug in public address detection where final line break wasn't being stripped properly