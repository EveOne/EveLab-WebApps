var escapable = /[\x00-\x1f\ud800-\udfff\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufff0-\uffff]/g;

function filterUnicode(quoted){

  escapable.lastIndex = 0;
  if( !escapable.test(quoted)) return quoted;

  return quoted.replace( escapable, function(a){
    return '';
  });
}

var EveBrain = function(url){
  this.url = url;
  this.connect();
  this.cbs = {};
  this.listeners = [];
  this.sensorState = {follow: null, collide: null};
  this.collideListening = false;
  this.followListening = false;
  this.analogSensor = {level: null};
  this.mpr121 = "";
}

EveBrain.prototype = {

  connected: false,
  error: false,
  timeoutTimer: undefined,

  connect: function(){
    if(!this.connected && !this.error){
      var self = this;
      this.has_connected = false;
      this.ws = filterUnicode(new WebSocket(this.url));
      this.ws.onmessage = function(ws_msg){self.handle_ws(ws_msg)};
      this.ws.onopen = function(){
        self.version(function(){
          self.setConnectedState(true);
        });
      }
      this.ws.onerror = function(err){self.handleError(err)}
      this.ws.onclose = function(err){self.handleError(err)}
      this.connTimeout = window.setTimeout(function(){
        if(!self.connected){
          self.ws.close();
        }
      }, 1000);
    }
  },

  setConnectedState: function(state){
    var self = this;
    clearTimeout(self.connTimeout);
    self.connected = state;
    if(state){ self.has_connected = true; }
    if(self.has_connected){
      setTimeout(function(){
        self.broadcast(self.connected ? 'connected' : 'disconnected');
      }, 500);
    }
    // Try to auto reconnect if disconnected
    if(state){
      if(self.reconnectTimer){
        clearTimeout(self.reconnectTimer);
        self.reconnectTimer = undefined;
      }
    }else{
      if(!self.reconnectTimer){
        self.reconnectTimer = setTimeout(function(){
          self.reconnectTimer = undefined;
          self.connect();
        }, 5000);
      }
    }
  },

  broadcast: function(msg){
    for(i in this.listeners){
      if(this.listeners.hasOwnProperty(i)){
        this.listeners[i](msg);
      }
    }
  },

  addListener: function(listener){
    this.listeners.push(listener);
  },

  handleError: function(err){
    if(err instanceof CloseEvent || err === 'Timeout'){
      if(this.ws.readyState === WebSocket.OPEN){
        this.ws.close()
      }
      this.setConnectedState(false);
      this.msg_stack = [];
    }else{
      console.log(err);
    }
  },

  move: function(direction, distance, cb){
    this.send({cmd: direction, arg: distance}, cb);
  },

  turn: function(direction, angle, cb){
    this.send({cmd: direction, arg: angle}, cb);
  },

  forward: function(distance, cb){
    this.move('forward', distance, cb);
  },

  back: function(distance, cb){
    this.move('back', distance, cb);
  },

  left: function(distance, cb){
    this.move('left', distance, cb);
  },

  right: function(distance, cb){
    this.move('right', distance, cb);
  },

  penup: function(cb){
    this.send({cmd: 'penup'}, cb);
  },

  pendown: function(cb){
    this.send({cmd: 'pendown'}, cb);
  },

  beep: function(duration, cb){
    this.send({cmd: 'beep', arg: duration}, cb);
  },

  collide: function(cb){
    this.send({cmd: 'collide'}, cb);
  },

  follow: function(cb){
    this.send({cmd: 'follow'}, cb);
  },



  //EveOneCommands
  gpio: function(pin, pin_state, cb){
    this.send({cmd: pin_state, arg:pin}, cb);
  },

  analogInput: function(pin_number, cb){
    console.log("Entered analogInput");
    var self = this;
    this.send({cmd: 'analogInput', arg:pin_number}, function(state, msg){
      if(state === 'complete'){
        self.analogSensor.level = msg.msg;
        cb(self.analogSensor.level);
      }
    });
  },

  MPR121_read: function(cb){
    var self = this;
    this.send({cmd: 'mpr121'}, function(state, msg){
      if(state === 'complete'){
        self.mpr121 = msg.msg;
        cb(self.mpr121);
      }
    });
  },


  gpio_pwm: function(pin_select,pin_value, cb){
    this.send({cmd: pin_select, arg:pin_value}, cb);
  },


  temp_c: function(cb){
    var self = this;
    this.send({cmd: 'temp_c', arg:""}, function(state, msg){
      if(state === 'complete'){
        self.analogSensor.level = (msg.msg-75)/4.9;
        cb(self.analogSensor.level);
      }
    });
  },
  temp_f: function(cb){
    var self = this;
    this.send({cmd: 'temp_f', arg:""}, function(state, msg){
      if(state === 'complete'){
        self.analogSensor.level = ((msg.msg-75)/4.9)*1.8+32;
        cb(self.analogSensor.level);
      }
    });
  },
  set_temp_pin: function(pin, cb){
     this.send({cmd:"set_temp_pin", arg:pin}, cb);
  },


  cds_read: function(cb){
    var self = this;
    this.send({cmd: 'cds_read', arg:""}, function(state, msg){
      if(state === 'complete'){
        self.analogSensor.level = (msg.msg-30)/10;
        cb(self.analogSensor.level);
      }
    });
  },
  set_cds_pin: function(pin,cb){
    this.send({cmd:"set_cds_pin", arg:pin}, cb);
  },


  set_speaker_pin: function(pin,cb){
    this.send({cmd: 'set_speaker' , arg:pin}, cb);
  },
  play_note: function(note, duration, cb){
    this.send({cmd:note, arg: duration}, cb);
  },


  collisionSensorState: function(cb){
    if(this.sensorState.collide === null || !this.collideListening){
      var self = this;
      this.send({cmd: 'collideState'}, function(state, msg){
        if(state === 'complete'){
          self.sensorState.collide = msg.msg;
          cb(self.sensorState.collide);
        }
      });
    }else{
      cb(this.sensorState.collide);
    }
  },

  followSensorState: function(cb){
    if(this.sensorState.follow === null || !this.followListening){
      var self = this;
      this.send({cmd: 'followState'}, function(state, msg){
        if(state === 'complete'){
          self.sensorState.follow = msg.msg;
          cb(self.sensorState.follow);
        }
      });
    }else{
      cb(this.sensorState.follow);
    }
  },

  collideSensorNotify: function(state, cb){
    var self = this;
    this.send({cmd: 'collideNotify', arg: (state ? 'true' : 'false')}, function(){
      self.collideListening = true;
      cb();
    });
  },

  followSensorNotify: function(state, cb){
    var self = this;
    this.send({cmd: 'followNotify', arg: (state ? 'true' : 'false')}, function(){
      self.followListening = true;
      cb();
    });
  },

  stop: function(cb){
    var self = this;
    this.send({cmd:'stop'}, function(state, msg, recursion){
      if(state === 'complete' && !recursion){
        for(var i in self.cbs){
          self.cbs[i]('complete', undefined, true);
        }
        self.robot_state = 'idle';
        self.msg_stack = [];
        self.cbs = {};
        if(cb){ cb(state); }
      }
    });
  },

  pause: function(cb){
    this.send({cmd:'pause'}, cb);
  },

  resume: function(cb){
    this.send({cmd:'resume'}, cb);
  },

  ping: function(cb){
    this.send({cmd:'ping'}, cb);
  },

  version: function(cb){
    this.send({cmd:'version'}, cb);
  },

  send: function(msg, cb){
    msg = filterUnicode(msg);
    msg.id = Math.random().toString(36).substr(2, 10)
    if(cb){
      this.cbs[msg.id] = cb;
    }
    if(msg.arg){ msg.arg = msg.arg.toString(); }
    if(['stop', 'pause', 'resume', 'ping', 'version'].indexOf(msg.cmd) >= 0){
      this.send_msg(msg);
    }else{
      this.msg_stack.push(msg);
      this.process_msg_queue();
    }
  },

  send_msg: function(msg){
    var self = this;
    msg = filterUnicode(msg);
    console.log(msg);
    this.ws.send(JSON.stringify(msg));
    this.timeoutTimer = window.setTimeout(function(){ self.handleError("Timeout") }, 3000);
  },

  process_msg_queue: function(){
    if(this.robot_state === 'idle' && this.msg_stack.length > 0){
      this.robot_state = 'receiving';
      this.send_msg(this.msg_stack[0]);
    }
  },

  handle_ws: function(ws_msg){
    if (typeof ws_msg != 'undefined') {
      msg = JSON.parse(ws_msg.data);
      msg.msg = filterUnicode(msg.msg);
      msg.id = filterUnicode(msg.id);
      msg.status = filterUnicode(msg.status);
      console.log(msg);
      clearTimeout(this.timeoutTimer);
      if(msg.status === 'notify'){
        this.broadcast(msg.id);
        this.sensorState[msg.id] = msg.msg;
        return;
      }
      if(this.msg_stack.length > 0 && this.msg_stack[0].id == msg.id){
        if(msg.status === 'accepted'){
          if(this.cbs[msg.id]){
            this.cbs[msg.id]('started', msg);
          }
          this.robot_state = 'running';
        }else if(msg.status === 'complete'){
          if(this.cbs[msg.id]){
            this.cbs[msg.id]('complete', msg);
            delete this.cbs[msg.id];
          }
          this.msg_stack.shift();
          if(this.msg_stack.length === 0){
            this.broadcast('program_complete');
          }
          this.robot_state = 'idle';
          this.process_msg_queue();
        }
      }else{
        if(this.cbs[msg.id]){
          this.cbs[msg.id]('complete', msg);
          delete this.cbs[msg.id];
        }
      }
      if(msg.status && msg.status === 'error' && msg.msg === 'Too many connections'){
        this.error = true;
        this.broadcast('error');
      }
    } else {
      ws_msg.data = 0;
      ws_msg.status = 0;
      ws_msg.id = 0;
    }
  },

  robot_state: 'idle',
  msg_stack: []
}
