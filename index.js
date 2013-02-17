var request = require('request'),
    htmlparser = require('htmlparser'),
    select = require('soupselect').select,
    FormData = require('form-data'),
    Emitter = require('emitter');

var PUSHBULLET_HOST = 'https://www.pushbullet.com';

var PushBullet = function(email, password) {
  Emitter.call(this);

  this._email = email;
  this._password = password;
  this._cookies = request.jar();
  this._csrf = '';

  this.devices = null;

  // Set some defaults for the requests.
  request = request.defaults({
    jar: this._cookies,
    followAllRedirects: true
  });

  this._authenticate();
};

Emitter(PushBullet.prototype);

PushBullet.prototype._authenticate = function() {
  var self = this;

  var signinPostCallback = function(error, response) {
    if('https://' + response.request.host != PUSHBULLET_HOST || response.request.path != '/') throw new Error('Couldn\'t sign in.');
    self._listDevices();
  };

  var signinGetCallback = function(error, response, body) {
    var handler = new htmlparser.DefaultHandler(function(error, dom) {
      if(error) throw new Error(error);

      var fields = {};
      var form = select(dom, '#gaia_loginform')[0];
      select(form, 'input').forEach(function(input) {
        fields[input.attribs.name] = input.attribs.value;
      });
      fields['Email'] = self._email;
      fields['Passwd'] = self._password;

      request.post(form.attribs.action, {form: fields}, signinPostCallback);
    });

    var parser = new htmlparser.Parser(handler);
    parser.parseComplete(body);
  };
  request(PUSHBULLET_HOST + '/signin', {jar: this._cookies}, signinGetCallback);
};

PushBullet.prototype._listDevices = function() {
  var self = this;
  var devicesCallback = function(error, response, json) {
    self.devices = json.devices.map(function(d) {
      return d.id;
    });
    self._csrf = json.csrf;
    self.emit('ready', self.devices);
  };
  request(PUSHBULLET_HOST + '/devices', {json: true}, devicesCallback);
};

PushBullet.prototype.push = function(type, device, title, body) {
  var self = this;
  var data = {
    _csrf: this._csrf,
    type: type,
    device_id: device,
    title: title,
    body: body
  };
  var pushCallback = function(error, response, json) {
    self.emit('pushed', json);
  };
  request.post(PUSHBULLET_HOST + '/push/' + type, {json: true, body: data}, pushCallback);
};

module.exports = PushBullet;
