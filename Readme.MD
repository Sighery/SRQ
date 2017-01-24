# Serial Requests Queue

This repository holds the Queue class I created to make serial requests on my JavaScript scripts. This class uses the GM_xmlhttpRequest implementation for the HTTP requests, meaning that for it to work you'll need to use it on a [Tampermonkey](http://www.tampermonkey.net/) or similar script.

JavaScript's HTTP requests are asynchronous by default, most implementations don't even support making them synchronous, and even the ones that do discourage because it freezes the whole browser making it unresponsive until the request is finished.

For this reason, I developed this queue system to have requests execute "synchronously" without completely freezing the browser. To do this, I use callbacks, so only when the request or fallback requests are completed the next request in the queue is sent, faking that way requests being synchronous and waiting until the previous one is done to continue.
