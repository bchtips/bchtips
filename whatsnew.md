**1.0.18**

* Updated API URLs

**1.0.17**

* Updated explorer URLs

**1.0.16**

* Fixed infinite loop when sending all with some UTXOs/amounts
* Minor efficiency improvements

**1.0.15**

* Added customization of tip sent and queued messages with dynamic data including txid
* Increased Queue Item Delay minimum to 3 seconds to avoid sync limits
* Added detection of duplicate txids when sending the same amount twice in a row quickly (server ignored tx)
* Fixed a bug in public address detection where final line break wasn't being stripped properly
* Fixed price occasionally being half what it should be due to mishandled bad API response