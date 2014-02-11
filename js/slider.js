$.fn.extend({
	slider:function(opts){
		return new Slider(this,opts);
	}
});

function Slider(el,opts){
	this._el = el;	
	this._el.addClass('slider-parent');
	this._slider = el.find('>ul');
	this._slider.addClass('slider');
	this._indicators = $('<div class="slider-indicators"></div>');	
	this._animating = false;
	this._deltaX = 0;
	this._content = {};
	this._idletimer = false;
	this._opts = {
		duration:300,
		tension:0.2,
		velocity:2,
		indicators:true,
	}

	if (opts){
		for (var i in opts){
			this._opts[i] = opts[i];
		}
	}

	this._init();
	this._move(0);
}

Slider.prototype = {
	_init:function(){
		this._slides = this._el.find('>ul>li');
		this._position = 0;

		var me = this;
		this._setWidth();
		if (this._opts.indicators){
			this._createIndicators();
		}
		
		this._el.hammer().on('tap','.link',function(e){
			e.stopPropagation();
			me._setTimer();
			me._click(e,$(this));
		});

		this._el.hammer().on('dragstart dragend drag',function(e){
			e.stopPropagation();
			e.preventDefault();
			if (me['_'+e.type]) me['_'+e.type](e);
		});
		
		$(window).resize(function(){me._setWidth(); me.checkPosition()});		
		this.showSlide( this._slides.first() );
	},	
	_click:function(evt,el){
		
		this._onclick(evt,el);
		if (el.attr('data-link')){
			this.show('#'+el.attr('data-link'));
		}
	},	
	_onclick:function(e,el){
		if (this.onClick){
			this.onClick.call(el,e);
		}
	},
	_onshow:function(slide){
		if (this.onShow){
			this.onShow(slide);
		}
	},
	_onchange:function(slide){
		if (this.onChange){
			this.onChange(slide);
		}
	},
	hasMoved:function(evt){
		var deltaX = evt.gesture.deltaX - this._startEvent.gesture.deltaX,
			deltaY = evt.gesture.deltaY - this._startEvent.gesture.deltaY;
		return Math.abs(deltaX) > 20 || Math.abs(deltaY) > 20;
	},
	_move:function(px,animate){
		this._position += px;
		this._deltaX += px;
		this._setPosition(this._position,animate);
	},
	_setPosition:function(position, animate, duration){		
		var me = this;
	
		this._position = position;
		this._setPrefix(this._slider,'transform','translate3d('+this._position+'px,0px,0px)');
			
		if (animate){
			this._animating = true;				
			this._setPrefix(this._slider,'transition-duration',duration || this._opts.duration+'ms');				
			setTimeout(function(){
				me._animating = false;
				me._onchange(me.getNearestOfCenter());
			},duration || this._opts.duration);
		} else {
			this._setPrefix(this._slider,'transition-duration','0')
			this._onchange(this.getNearestOfCenter());
		}		
	},
	_setPrefix:function(el,prop,attr){
		var prefix = 'moz ie o webkit'.split(' ');
		for (var i in prefix){
			el.css('-'+prefix[i]+'-'+prop,attr);
		}
	},
	_createIndicators:function(){
		var count = 0,
			me = this;

		this._slides.each(function(){
			me._indicators.append($('<div class="slider-indicator link" data-link="'+$(this).attr('id')+'"></div>'));
			count++;
		});

		this._el.append(this._indicators);
		this._indicators.css('margin-left','-'+this._indicators.outerWidth()/2+'px');
	},
	_setIndicator:function(slide){
		this._indicators.find('.selected').removeClass('selected');
		this._indicators.find('[data-link="'+slide.attr('id')+'"]').addClass('selected');
	},
	_setWidth:function(){
		var w = 0,
			me = this,			
			auto = false;
		this._setPrefix(this._slider,'transition-duration','0');
		if (this._el.hasClass('autosize')) auto = true;
		this._slides.each(function(){
			
			if ($(this).attr('data-disabled') != 'true'){

				$(this).css({
						'position':'absolute',
						'top':'0px',
						'left':w
				});

				if (!$(this).attr('id')){
					$(this).attr('id','slide-'+$(this).index());
				}

				if (auto){
					$(this).css({width:me._el.innerWidth(),height:me._el.innerHeight()});
				}			

				w += $(this).outerWidth();			
			}
		});
		this._el.find('>ul').css('width',w);
	},
	_clearTimer:function(){
		clearTimeout(this._idletimer);
	},
	_setTimer:function(){
		var me = this;
		this._clearTimer();
		this._idletimer = setTimeout(function(){
			console.log('timer');
			me.checkPosition();
		},2000);
	},
	_dragstart:function(evt){
		this._deltaX = 0;		
		this._ondrag = true;
		this._startEvent = evt;
		this._lastEvent = evt;
		this._clearTimer();
	},
	_dragend:function(evt){
		var changed = this._checkChanged();
		if (!changed){
			this.checkPosition();
		}
		this._ondrag = false;
		this._startEvent = false;
		this._setTimer();
	},
	_drag:function(evt){
		if (this._startEvent.gesture && this._ondrag){
			if(Math.abs(evt.gesture.deltaX - this._startEvent.gesture.deltaX) > 20){			
				var dist = this._lastEvent.gesture.deltaX - evt.gesture.deltaX;
				if (dist > 0){
					if (!this.hasNext()){
						dist = dist/3;
					}
				} else if (dist < 0){
					if (!this.hasPrev()){
						dist = dist /3;
					}
				}
				this._move(-dist);
			}
			this._lastEvent = evt;
		}
	},
	_checkChanged:function(){
		if (this._lastEvent.gesture){
			var dist = this._lastEvent.gesture.deltaX - this._startEvent.gesture.deltaX,
				velocity = dist / (this._lastEvent.timeStamp - this._startEvent.timeStamp);		

			if (Math.abs(dist) > (this._visibleSlide.outerWidth()*this._opts.tension)){
				if (Math.abs(dist) > this._visibleSlide.outerWidth()){
					this.showSlide( this.getNearestOfCenter() );
					return true;
				} else if (dist< 0){
					this.next();
					return true;
				} else {
					this.prev();
					return true;
				}
			}

			if (Math.abs(velocity) > this._opts.velocity){
				if (velocity < 0){
					this.next();
					return true;
				} else {
					this.prev();
					return true;
				}
			}
		}
		return false;
	},
	checkPosition:function(){			
		this.showSlide( this.getNearestOfCenter() );
	},
	getNearestOfCenter:function(){
		var pos = this._position,
			center = this._el.outerWidth()/2,
			closest = Infinity,
			onCenter = false;
		
		this._slides.each(function(){
			if ($(this).attr('data-disabled') != 'true'){				
				var slideCenter = $(this).offset().left + $(this).outerWidth()/2,
					distToCenter = Math.abs( center - slideCenter );

				if (distToCenter < closest){
					onCenter = $(this);
					closest = distToCenter;				
				}				
			}
		});
		return onCenter;
	},
	show:function(slide){
		this.showSlide(this._slider.find(slide));
	},
	showSlide:function(slide){
		if (slide && slide.length > 0 && slide.attr('data-disabled') != 'true'){
			this._setIndicator(slide);
			this._setPosition( (this._el.innerWidth()/2) - (slide.position().left + (slide.outerWidth()/2)), true);
			this._onshow(slide);			
			this._visibleSlide = slide;
			return true;
		}
		return false;
	},
	hasNext:function(){
		if (this._visibleSlide.next().length > 0){
			return this._visibleSlide.next().attr('data-disabled') != 'true';
		}
		return false;
	},
	hasPrev:function(){
		if (this._visibleSlide.prev().length > 0){
			return this._visibleSlide.prev().attr('data-disabled') != 'true';
		}
		return false;
	},
	next:function(){
		if (this.hasNext()){
			this.showSlide( this._visibleSlide.next() );
		} else {
			this.showSlide( this._visibleSlide );
		}
	},
	prev:function(){
		if (this.hasPrev() ){
			this.showSlide( this._visibleSlide.prev() );	
		} else {
			this.showSlide( this._visibleSlide );
		}
	},
	disable:function(slide){
		$(slide).attr('data-disabled','true');
		this._setWidth();
	},
	enable:function(slide){
		$(slide).removeAttr('data-disabled');
		this._setWidth();
	},
	addContent:function(content){
		var c = $(content);
		if (!c.attr('id')){
			c.attr('id') = Date.now() + (Math.random()*1000);
		}

		this._content[c.attr('id')] = c;

		return c.attr('id');
	},
	getContent:function(id){
		return this._content[id];
	},
	showContent:function(slide,content_id){
		this._slider.find(slide).html( this.getContent(content_id));
	}
}