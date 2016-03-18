var FnInstance = function(fn, el, evebrain){
  this.fn = fn;
  this.el = el;
  this.evebrain = evebrain;
  this.parent = false;
  this.children = []
}

FnInstance.prototype = {
  run: function(children){
    var self = this;
    if(self.fn){
      // This is a function
      self.fn.run(self, self.evebrain, function(state){ self.updateState(state)});
    }else{
      // This is the root container
      for(var i in self.children){
        self.children[i].run();
      }
    }
  },
  updateState: function(state){
    if(state === 'started'){
      $(this.el).addClass('active');
    }else if(state === 'complete'){
      $(this.el).removeClass('active');
    }
    if(this.parent && this.parent.el){
      this.parent.updateState(state);
    }
  },
  addChild: function(child){
    child.parent = this;
    this.children.push(child);
  },
  args: function(){
    var self = this;
    var args ={}
    if(this.fn){
      snack.each(this.fn.content, function(item){
        if(typeof item === 'object'){
          args[item.name] = self.el.querySelector('[name='+ item.name + ']').value;
        }
      });
    }
    return args;
  },
  toObject: function(){
    var out = {
      fn: this.fn ? this.fn.name : 'root',
      parent: this.fn ? this.fn.type === 'parent' : true,
      args: this.args(),
      children: []
    }
    if(this.children.length){
      out.children = this.children.map(function(c){ return c.toObject(); });
    }
    return out;
  }
}

var Builder = function(el, evebrain, disableLocalstorage){
  var self = this;
  this.el = el;
  this.evebrain = evebrain;
  this.fns = {};
  this.paused = false;
  this.following = false;
  this.colliding = false;
  this.store = !disableLocalstorage;
  this.init();

  snack.each(this.functions, function(f){
    self.fns[f.name] = f;
  });
}

Builder.prototype = {
  prog:null,
  setEveBrain: function(evebrain){
    this.evebrain = evebrain;
    this.initEveBrain();
  },
  initEveBrain: function(){
    if(typeof this.evebrain === 'undefined') return;
    var self = this;
    this.evebrain.addListener(function(state){ self.evebrainHandler(state) });
  },
  init: function(){
    var self = this;
    var adjustment;
    this.el.addClass('editor');
    this.el[0].innerHTML = this.mainUI;
    this.setSize();
    window.addEventListener('resize', function(){self.setSize();});

    // Stop the whole page scrolling in touch browsers except in the program
    document.addEventListener('touchmove', function(e) {
      var el = e.target;
      while(el = el.parentElement){
        if(el.id === 'program'){
          return;
        }
      }
      e.preventDefault();
    }, false);
    
    this.runner = $('.editor .run');
    this.pause = $('.editor .pause');
    this.stop = $('.editor .stop');
    this.clear = $('.editor .clear');
    this.follow = $('.editor #follow');
    this.collide = $('.editor #collide');
    this.runner.attach('click', function(e){self.runProgram()});
    this.pause.attach('click', function(e){self.pauseProgram()});
    this.stop.attach('click', function(e){self.stopProgram()});
    this.clear.attach('click', function(e){self.clearProgram()});
    this.follow.attach('click', function(e){self.followClick()});
    this.collide.attach('click', function(e){self.collideClick()});
    
    this.initEveBrain();

    this.addFunctions();
    this.resumeProgram();
  },
  supportsLocalStorage: function(){
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
      return false;
    }
  },
  saveProgram: function(){
    var prog = new FnInstance(null, null, null);
    this.generate($('.editor ol.program')[0], prog);
    return JSON.stringify(prog.toObject());
  },
  loadProgram: function(input){
    this.clearProgram();
    var prog = JSON.parse(input);
    if(prog.fn === 'root' && prog.children && prog.children.length > 0){
      this.instantiateProgram(prog.children, document.querySelectorAll('.editor .program')[0]);
      this.showHints();
      this.sortLists();
    }
  },
  storeProgram: function(){
    if(this.supportsLocalStorage() && this.store){
      localStorage['evebrain.currentProgram'] = this.saveProgram();
    }
  },
  resumeProgram: function(){
    if(this.supportsLocalStorage() && localStorage['evebrain.currentProgram'] && this.store){
      this.loadProgram(localStorage['evebrain.currentProgram'])
    }
  },
  instantiateProgram: function(fns, el){
    var self = this;
    if(fns && fns.length){
      for(var i = 0; i< fns.length; i++){
        var newEl = document.querySelectorAll('.functionList .fn-' + fns[i].fn)[0].cloneNode(true);
        el.appendChild(newEl);
        for(var arg in fns[i].args){
          if(fns[i].args.hasOwnProperty(arg)){
            var input = newEl.querySelector("[name='" + arg + "']");
            input.value = fns[i].args[arg];
          }
        }
        self.checkForChanges(newEl);
        snack.wrap(newEl).draggableList({
          target: 'ol.program',
          placeholder: '<li class="placeholder"/>',
          copy: false,
          ondrag: function(){self.showHints()},
          onchange: function(){self.storeProgram(); self.sortLists();}
        });
        if(fns[i].parent){
          this.instantiateProgram(fns[i].children, newEl.getElementsByTagName('ol')[0]);
        }
      }
    }
  },
  setSize: function(){
    var w = window,
      d = document,
      e = d.documentElement,
      g = d.getElementsByTagName('body')[0],
      x = w.innerWidth || e.clientWidth || g.clientWidth,
      y = w.innerHeight|| e.clientHeight|| g.clientHeight;
    var right = this.el[0].getElementsByClassName('right')[0];
    var prog = this.el[0].getElementsByClassName('programWrapper')[0];
    var buttons = this.el[0].getElementsByClassName('buttons')[0];
    right.style.height = y - right.offsetTop - 27 + 'px';
    prog.style.height = buttons.offsetTop - prog.offsetTop + 'px';
  },
  evebrainHandler: function(state){
    if(state === 'program_complete'){
      this.runner.show();
      this.pause.hide();
    }
  },
  showHints: function(){
    $('.editor .programWrapper ol').each(function(el){
      el.getElementsByClassName('hint')[0].style.display = (el.children.length === 1 ? 'block' : 'none')
    });
  },
  sortLists: function(){
    var ends = this.el[0].querySelectorAll('.programWrapper li.end')
    snack.each(ends, function(end){
      end.parentNode.appendChild(end);
    });
  },
  checkForChanges: function(elem){
    var self = this;
    var inputs = elem.querySelectorAll('input, select');
    snack.each(inputs, function(el){
      el.addEventListener('change', function(){ self.storeProgram();});
    });
  },
  addFunctions: function(){
    var self = this;
    snack.each(this.functions, function(i, f){
      f = self.functions[f];
      var fn = '<li class="function fn-' + f.name + ' draggable" data-fntype="' + f.name + '">';
      for(var i in f.content){
        if(typeof(f.content[i]) === 'string'){
          fn += '<span> ' + f.content[i] + ' </span>';
        }else if(typeof(f.content[i]) === 'object'){
          if(f.content[i].input === 'number'){
            fn += '<input type="number" size="4" name="' + f.content[i].name + '" value="' + f.content[i].default + '" />';
          }else if(f.content[i].input === 'option'){
            var select = '<select name="'+ f.content[i].name +'">';
            for(var j in f.content[i].values){
              select += '<option value="' + f.content[i].values[j] + '"';
              if(f.content[i].default === f.content[i].values[j]){
                select += 'selected="selected"';
              }
              select += '>' + f.content[i].values[j] + '</option>';
            }
            select += '</select>';
            fn += select;
          }
        }
      }
      
      if(f.type === 'parent'){
        fn += '<ol><li class="end"><div class="hint">Drag functions into here!</div></li></li></ol>';
      }
      fn += '</li>';
      $('.editor .functionList')[0].innerHTML += fn;
    });
    $('.functionList li.draggable').draggableList({
      target: 'ol.program',
      placeholder: '<li class="placeholder"/>',
      copy: true,
      ondrag: function(){self.showHints()},
      onchange: function(){self.storeProgram(); self.sortLists();},
      onaddelem: function(elem){self.checkForChanges(elem);}
    });
  },
  runProgram: function(){
    if(this.following || this.colliding || !this.evebrain){ return; }
    if(this.paused){
      this.evebrain.resume();
    }else{
      this.prog = new FnInstance(null, null, null);
      this.generate($('.editor ol.program')[0], this.prog);
      this.prog.run()
    }
    this.pause.show();
    this.runner.hide();
    this.paused = false;
  },
  pauseProgram: function(){
    var self = this;
    this.paused = true;
    if(!this.evebrain){ return; }
    this.evebrain.pause(function(){
      self.runner.show();
      self.pause.hide();
    });
  },
  stopProgram: function(cb){
    var self = this;
    if(!this.evebrain){ return; }
    this.evebrain.stop(function(){
      self.runner.show();
      self.pause.hide();
      self.paused = false;
      self.colliding = false;
      self.following = false;
      self.updateState();
      cb && cb();
    });
  },
  clearProgram: function(){
    this.stopProgram();
    $('.editor ol.program li.function').remove();
    this.storeProgram();
    this.showHints();
  },
  updateState: function(){
    this.follow[0].innerHTML = this.following ? "&#9724; Stop Following Lines" : "&#9654; Start Following Lines";
    this.collide[0].innerHTML = this.colliding ? "&#9724; Stop Collision Detection" : "&#9654; Start Collision Detection";
    this.runner[0].className = (this.colliding || this.following) ? "run disabled" : "run";
  },
  followClick: function(e){
    var self = this;
    if(self.following){
      self.stopProgram();
    }else{
      self.stopProgram(function(){
        self.evebrain.follow(function(){
          self.following = true;
          self.updateState();
        });
      });
    }
  },
  collideClick: function(e){
    var self = this;
    if(this.colliding){
      this.stopProgram();
    }else{
      this.stopProgram(function(){
        self.evebrain.collide(function(){
          self.colliding = true;
          self.updateState();
        });
      });
    }
  },
  generate: function(el, parent){
    var self = this;
    snack.each(el.childNodes, function(el){
      if(el.nodeName.toLowerCase() === 'li' && el.className.match(/function/) && el.dataset.fntype){
        var fn = self.fns[el.dataset.fntype];
        var inst = new FnInstance(fn, el, self.evebrain);
        parent.addChild(inst);
        if(fn.type === 'parent'){
          var children = el.childNodes;
          for(var i = 0; i< children.length; i++){
            if(children[i].nodeName.toLowerCase() === 'ol'){
              self.generate(children[i], inst);
            }
          }
        }
      }
    });
  },
  functions:[
    {
      name:'move',
      type:'child',
      content:[
        'Move',
        {input:'option', name:'direction', default:'forward', values:['forward', 'back']},
        'by',
        {input:'number', name:'distance', default:100},
        'mm'
      ],
      run: function(node, evebrain, cb){
        evebrain.move(node.args().direction, node.args().distance, cb);
      }
    },
    {
      name:'turn',
      type:'child',
      content:[
        'Turn',
        {input:'option', name:'direction', default:'left', values:['left', 'right']},
        'by',
        {input:'number', name:'angle', default:90},
        'degrees'
      ],
      run: function(node, evebrain, cb){
        evebrain.turn(node.args().direction, node.args().angle, cb);
      }
    },
    {
      name:'penup',
      type:'child',
      content:['Pen up'],
      run: function(node, evebrain, cb){
        evebrain.penup(cb);
      }
    },
    {
      name:'pendown',
      type:'child',
      content:['Pen down'],
      run: function(node, evebrain, cb){
        evebrain.pendown(cb);
      }
    },
    {
      name:'repeat',
      type:'parent',
      content:[
        'Repeat',
        {input:'number', name:'count', default:2},
        'times'
      ],
      run: function(node, evebrain, cb){
        for(var i=0; i< node.args().count; i++){
          for(var j=0; j< node.children.length; j++){
            node.children[j].run();
          }
        }
      }
    },
    {
      name:'beep',
      type:'child',
      content:[
        'Beep for',
        {input:'number', name:'duration', default:0.5},
        'seconds'
      ],
      run: function(node, evebrain, cb){
        evebrain.beep(node.args().duration * 1000, cb);
      }
    },

    
     //EveOne Commands
    {
      name:'gpio',
      type:'child',
      content:[
        'GPIO D:',
        {input:'option', name:'pin', default:'3', values:['2','3','5','6','7','12','13']},
        {input:'option', name:'pin_state', default:'gpio_on', values:['gpio_on','gpio_off']},
      ],
      run: function(node, evebrain, cb){
        evebrain.gpio(parseInt(node.args().pin),node.args().pin_state,cb);
      }
    },
    {
      name:'analogInput',
      type:'child',
      content:[
        'GPIO Analog In A:',
        {input:'option', name:'pin_number', default:'0', values:['0','1','2','3']},
      ],
      run: function(node, evebrain, cb){
        evebrain.analogInput(parseInt(node.args().pin_number,cb));
        alert(evebrain.analogSensor[node.args().pin_number]);
      }
    },
    {
      name:'gpio_pwm',
      type:'child',
      content:[
        'PWM Pin:',
        {input:'option', name:'pin_name',  default:'gpio_pwm_3', values:['gpio_pwm_3', 'gpio_pwm_5','gpio_pwm_6']},
        'Value:',
        {input:'number', name:'pin_value', default:255},
        '(0-255)',
      ],
      run: function(node, evebrain, cb){
        evebrain.gpio_pwm(node.args().pin_name,parseInt(node.args().pin_value),cb);
      }
    },

  ]
}



Builder.prototype.mainUI = '<div class="left container"><h2>Toolbox</h2>\
<ol class="functionList"></ol>\
<div class="extra"><button id="follow">&#9654; Start Following Lines</button><button id="collide">&#9654; Start Collision Detection</button></div>\
</div>\
<div class="right container"><h2>Program</h2>\
<div class="programWrapper"><ol class="program" id="program">\
<li class="end"><div class="hint">Drag functions from the left over here!</div></li></div>\
</ol>\
<div class="buttons"><button class="run">&#9654; Run</button><button class="pause" style="display:none;">&#10074;&#10074; Pause</button><button class="stop">&#9724; Stop</button><button class="clear">&#10006; Clear</button></div>\
</div>\
';