SpriteMorph.prototype.categories.push('Evelab');
SpriteMorph.prototype.blockColor.Evelab = new Color(232, 20, 165);

//Functions to handle events coming from evebrain
StageMorph.prototype.setupEveBrainEvents = function () {
    var procs = [],
        ide = this.parentThatIsA(IDE_Morph),
        myself = this;

    this.children.concat(this).forEach(function (morph) {
    });
    var handler = function(e){
    }
    return procs;
}

StageMorph.prototype.stopEveBrainEvents = function () {
    evebrain.stop(function(){
    });
}

StageMorph.prototype.fireEveBrainEvent = function (type) {
    var procs = [],
        hats = [],
        ide = this.parentThatIsA(IDE_Morph),
        myself = this;

    this.children.concat(this).forEach(function (morph) {
        if (morph instanceof SpriteMorph || morph instanceof StageMorph) {
            hats = hats.concat(morph.allHatBlocksFor('__evebrain_' + type + '__'));
        }
    });
    hats.forEach(function (block) {
        procs.push(myself.threads.startProcess(
            block,
            myself.isThreadSafe
        ));
    });
    return procs;
}

Process.prototype.evebrainGpio_on = function (pin) {
    // interpolated
    if (typeof this.context.proceed === 'undefined') {
        var self = this;
        this.context.proceed = false;
        evebrain.gpio(pin,"gpio_on", function(state, msg){
          if(state === 'complete' && self.context){
            self.context.proceed = true;
          }
        });
    }
    if(this.context.proceed){
        return null;
    }
    this.pushContext('doYield');
    this.pushContext();
}

Process.prototype.evebrainGpio_off = function (pin) {
    // interpolated
    if (typeof this.context.proceed === 'undefined') {
        var self = this;
        this.context.proceed = false;
        evebrain.gpio(pin,"gpio_off", function(state, msg){
          if(state === 'complete' && self.context){
            self.context.proceed = true;
          }
        });
    }
    if(this.context.proceed){
        return null;
    }
    this.pushContext('doYield');
    this.pushContext();
}

Process.prototype.evebrainStop = function () {
    // interpolated
    if (typeof this.context.proceed === 'undefined') {
        var self = this;
        this.context.proceed = false;
        evebrain.stop(function(state, msg){
          if(state === 'complete' && self.context){
            self.context.proceed = true;
            location.reload();
          }
        });
    }
    if(this.context.proceed){
        return null;
    }
    this.pushContext('doYield');
    this.pushContext();
}

Process.prototype.evebrainGpio_read = function (pin) {
    // interpolated
    if (typeof this.context.proceed === 'undefined') {
        var self = this;
        this.context.proceed = false;
        this.context.result = null;
        evebrain.analogInput(pin, function(state){
            self.context.result = state;
            self.context.proceed = true;
        });
    }
    if(this.context.proceed){
        return this.context.result;
    }
    //return evebrain.analogSensor.level;
    this.pushContext('doYield');
    this.pushContext();
}

Process.prototype.evebrainMPR121_read = function (pin) {
    // interpolated
    if (typeof this.context.proceed === 'undefined') {
        var self = this;
        this.context.proceed = false;
        this.context.result = null;
        evebrain.MPR121_read(function(state){
            self.context.result = state;
            self.context.proceed = true;
        });
    }
    if(this.context.proceed){
        return this.context.result;
    }
    //return evebrain.analogSensor.level;
    this.pushContext('doYield');
    this.pushContext();
}

Process.prototype.evebrainGpio_pwm = function (pin, value) {
    // interpolated
    if (typeof this.context.proceed === 'undefined') {
        var self = this;
        this.context.proceed = false;
        evebrain.gpio_pwm(pin, value, function(state, msg){
          if(state === 'complete' && self.context){
            self.context.proceed = true;
          }
        });
    }
    if(this.context.proceed){
        return null;
    }
    this.pushContext('doYield');
    this.pushContext();
}

Process.prototype.evebrainTemp_c= function () {
    // interpolated
    if (typeof this.context.proceed === 'undefined') {
        var self = this;
        this.context.proceed = false;
        this.context.result = null;
        evebrain.temp_c(function(state){
            self.context.result = state;
            self.context.proceed = true;
        });
    }
    if(this.context.proceed){
        return this.context.result;
    }
    //return evebrain.analogSensor.level;
    this.pushContext('doYield');
    this.pushContext();
}

Process.prototype.evebrainTemp_f= function () {
    // interpolated
    if (typeof this.context.proceed === 'undefined') {
        var self = this;
        this.context.proceed = false;
        this.context.result = null;
        evebrain.temp_f(function(state){
            self.context.result = state;
            self.context.proceed = true;
        });
    }
    if(this.context.proceed){
        return this.context.result;
    }
    //return evebrain.analogSensor.level;
    this.pushContext('doYield');
    this.pushContext();
}

Process.prototype.evebrainCDS= function () {
    // interpolated
    if (typeof this.context.proceed === 'undefined') {
        var self = this;
        this.context.proceed = false;
        this.context.result = null;
        evebrain.cds_read(function(state){
            self.context.result = state;
            self.context.proceed = true;
        });
    }
    if(this.context.proceed){
        return this.context.result;
    }
    //return evebrain.analogSensor.level;
    this.pushContext('doYield');
    this.pushContext();
}

Process.prototype.evebrainSetTempPin = function (pin) {
    // interpolated
    if (typeof this.context.proceed === 'undefined') {
        var self = this;
        this.context.proceed = false;
        evebrain.set_temp_pin(pin, function(state, msg){
          if(state === 'complete' && self.context){
            self.context.proceed = true;
          }
        });
    }
    if(this.context.proceed){
        return null;
    }
    this.pushContext('doYield');
    this.pushContext();
}

Process.prototype.evebrainSetCDSPin = function (pin) {
    // interpolated
    if (typeof this.context.proceed === 'undefined') {
        var self = this;
        this.context.proceed = false;
        evebrain.set_cds_pin(pin, function(state, msg){
          if(state === 'complete' && self.context){
            self.context.proceed = true;
          }
        });
    }
    if(this.context.proceed){
        return null;
    }
    this.pushContext('doYield');
    this.pushContext();
}

Process.prototype.evebrainSetSpeakerPin = function (pin) {
    // interpolated
    if (typeof this.context.proceed === 'undefined') {
        var self = this;
        this.context.proceed = false;
        evebrain.set_speaker_pin(pin, function(state, msg){
          if(state === 'complete' && self.context){
            self.context.proceed = true;
          }
        });
    }
    if(this.context.proceed){
        return null;
    }
    this.pushContext('doYield');
    this.pushContext();
}


Process.prototype.evebrainPlayNote = function (note, duration) {
    // interpolated
    if (typeof this.context.proceed === 'undefined') {
        var self = this;
        this.context.proceed = false;
        evebrain.play_note(note, duration, function(state, msg){
          if(state === 'complete' && self.context){
            self.context.proceed = true;
          }
        });
    }
    if(this.context.proceed){
        return null;
    }
    this.pushContext('doYield');
    this.pushContext();
}
