$.fn.extend({
	slider:function(){
		return new Slider(this);
	}
})

function Slider(el){
	this._el = el;	
	this._el.addClass('slider-parent');
	this._slider = el.find('>ul');
	this._slider.addClass('slider-slider');
	this._indicators = $('<div class="indicators"></div>');	
	this._animating = false;
	this._opts = {
		duration:300
	}
	this._init();
	this._move(0);
}

Slider.prototype = {
	_move:function(px,animate){
		this._position += px;
		this._setPosition(this._position,animate);
	},
	_setPosition:function(position, animate, duration){
		//if (this._animating) return;
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
				},duration || this._opts.duration);
			} else {
				this._slider.css('-'+prefix[i]+'-transition-duration','0');			
			}
		}
	},
	_createIndicators:function(){
		var count = 0,
			me = this;

		this._slides.each(function(){
			me._indicators.append($('<div class="indicator" data-order="'+count+'"></div>'));
			count++;
		});

		this._el.append(this._indicators);
		this._indicators.css('margin-left','-'+this._indicators.outerWidth()/2+'px');
		this._indicators.on('click','.indicator',function(e){
				e.stopPropagation();
				e.preventDefault();
				me.showSlide(me._slider.find('[data-order="'+$(this).attr('data-order')+'"]'));
			});
	},
	_setIndicator:function(slide){
		this._indicators.find('.selected').removeClass('selected');
		this._indicators.find('[data-order="'+slide.attr('data-order')+'"]').addClass('selected');
	},
	_init:function(){
		this._slides = this._el.find('li');
		this._position = 0;


		var w = 0,
			me = this,
			count = 0;

		this._slides.each(function(){
			$(this).css({
					'position':'absolute',
					'top':'0px',
					'left':w
			}).attr('data-order',count);


			w += $(this).outerWidth();
			count++;
		});

		this._el.find('>ul').css('width',w);
		this._createIndicators();
		this.showSlide( this.getNearestOfCenter() );

		this._el.on('mousedown touchstart',function(e){me._dragStart(e);});
		$(document).on('mouseup touchend',function(e){me._dragEnd(e);});
		this._el.on('mousemove touchmove',function(e){me._drag(e);});
		$(window).resize(function(){me.checkPosition()});
	},
	_dragStart:function(evt){		
		evt.stopPropagation();		
		this._ondrag = true;
		this._startEvent = evt;
		this._lastEvent = evt;
	},
	_dragEnd:function(evt){	
		evt.stopPropagation();	
		this.checkPosition();
		this._ondrag = false;
		this._startEvent = false;
	},
	_drag:function(evt){
		if (this._startEvent && this._ondrag){
			var dist = this._lastEvent.pageX - evt.pageX;
			this._move(-dist);
			this._lastEvent = evt;
		}
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
			var slideCenter = $(this).offset().left,
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
			this._setIndicator(slide);
			this._setPosition( (this._el.innerWidth()/2) - (slide.position().left + (slide.outerWidth()/2)), true);
		}
	},
	next:function(){
		this._showSlide( this.getNearestOfCenter().next() );
	},
	prev:function(){
		this._showSlide( this.getNearestOfCenter().prev() );	
	}
}