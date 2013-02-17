node-pushbullet
=============

node.js PushBullet client

### Install ###

Install node-pushbullet using npm:

    npm install node-pushbullet

### Example ###

```js
var PushBullet = require('index');

var p = new PushBullet('your-email@domain.com', 'your-password');
p.on('ready', function(devices) {
  p.send('note', devices[0], 'Testing 123', 'Some content');
});

p.on('done', function(response) {
  console.log(response);
});
```
