$.fn.extend({
	slider:function(opts){
		return new Slider(this,opts);
	}
})

function Slider(el){
	this._el = el;	
	this._el.addClass('slider-parent');
	this._slider = el.find('>ul');
	this._slider.addClass('slider');
	this._indicators = $('<div class="slider-indicators"></div>');	
	this._animating = false;
	this._opts = {
		duration:300,
		tension:0.2,
		velocity:2,
		indicators:true,
	}
	this._init();
	this._move(0);
}

Slider.prototype = {
	_onchange:function(){

	},
	_move:function(px,animate){
		this._position += px;
		this._setPosition(this._position,animate);
	},
	_setPosition:function(position, animate, duration){		
		var prefix = 'moz ie o webkit'.split(' ');
		var me = this;
		
		this._position = position;

		for (var i in prefix){
			this._slider.css('-'+prefix[i]+'-transform','translate3d('+this._position+'px,0px,0px)');
			
			if (animate){
				this._animating = true;
				this._slider.css('-'+prefix[i]+'-transition-duration',duration || this._opts.duration+'ms');
				setTimeout(function(){
					me._animating = false;
					me._onchange();
				},duration || this._opts.duration);
			} else {
				this._slider.css('-'+prefix[i]+'-transition-duration','0');			
				me._onchange();
			}
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

		if (this._el.hasClass('autosize')) auto = true;
		this._slides.each(function(){
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
		});
		this._el.find('>ul').css('width',w);
	},
	_init:function(){
		this._slides = this._el.find('li');
		this._position = 0;

		var me = this;

		this._setWidth();
		if (this._opts.indicators){
			this._createIndicators();
		}

		this._el.on('click','.link',function(e){e.stopPropagation();me._link($(this));});
		this._el.on('mousedown touchstart',function(e){me._dragStart(e);});
		this._el.on('mousemove touchmove',function(e){me._drag(e);});
		$(document).on('mouseup touchend',function(e){me._dragEnd(e);});
		$(window).resize(function(){me._setWidth(); me.checkPosition()});
		this.showSlide( this._slides.first() );
	},
	_link:function(link){
		if (link.attr('data-link')){
			this.showSlide(this._slider.find('#'+link.attr('data-link')));
		}
	},
	_dragStart:function(evt){		
		evt.stopPropagation();		
		this._ondrag = true;
		this._startEvent = evt;
		this._lastEvent = evt;
	},
	_dragEnd:function(evt){	
		evt.stopPropagation();
		if (!this._checkChanged()){
			this.checkPosition();
		}
		this._ondrag = false;
		this._startEvent = false;
	},
	_drag:function(evt){
		if (this._startEvent && this._ondrag){
			evt.stopPropagation();
			var dist = this._lastEvent.pageX - evt.pageX;
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
			this._lastEvent = evt;
		}
	},
	_checkChanged:function(){
		var dist = this._lastEvent.pageX - this._startEvent.pageX,
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
			var slideCenter = $(this).offset().left + $(this).outerWidth()/2,
				distToCenter = Math.abs( center - slideCenter );

			if (distToCenter < closest){
				onCenter = $(this);
				closest = distToCenter;				
			}				
		});
		return onCenter;
	},
	showSlide:function(slide){
		if (slide && slide.length > 0){
			this._visibleSlide = slide;
			this._setIndicator(slide);
			this._setPosition( (this._el.innerWidth()/2) - (slide.position().left + (slide.outerWidth()/2)), true);
			return true;
		}
		return false;
	},
	hasNext:function(){
		return this._visibleSlide.next().length > 0;
	},
	hasPrev:function(){
		return this._visibleSlide.prev().length > 0;
	},
	next:function(){
		if (this._visibleSlide.next().length > 0){
			this.showSlide( this._visibleSlide.next() );
		} else {
			this.showSlide( this._visibleSlide );
		}
	},
	prev:function(){
		if (this._visibleSlide.prev().length > 0 ){
			this.showSlide( this._visibleSlide.prev() );	
		} else {
			this.showSlide( this._visibleSlide );
		}
	}
}