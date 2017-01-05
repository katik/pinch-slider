<style>
    .ps-slider{
        white-space: nowrap;
        height:100%;
        width:100%;
    }
    .ps-slider .ps-img-wrapper{
        height:100%;
        width:100%;
        vertical-align: top;
        display: -webkit-inline-box;
        display: -ms-inline-flexbox;
        display: inline-flex;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
    }

    .ps-img-wrapper img{
        height:100%;
        width:100%;
        -o-object-fit: cover;
        object-fit: cover;
    }

    .ps-full-mode-slider .ps-img-wrapper img{
        -o-object-fit: contain;
        object-fit: contain;
        height:auto;
    }
</style>

<template>
    <div class="ps-slider"
         v-finger:swipe="swipe"
         v-finger:touch-move="touchMove">
        <div v-for="(slide,index) in slides" class="ps-img-wrapper">
            <img
             v-finger:multipoint-start="multipointStart"
             v-finger:multipoint-end="multipointEnd"
             v-finger:pinch="pinch"
             v-finger:swipe.stop.prevent="imageSwipe"
             v-finger:press-move="pressMove"
             v-finger:double-tap="doubleTap"
             v-finger:single-tap="singleTap"
             v-on:click="click">
        </div>
    </div>
</template>

<script type="text/javascript">
    import AlloyFinger from './alloy_finger.js'
    import AlloyFingerVue from './alloy_finger.vue.js';
    //To.js
    //a requestAmimation based animation function
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame =
            window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };

    let To=function (el, property, value, time, ease, onEnd,onChange ) {
        var current = el[property];
        var dv = value - current;
        var beginTime = new Date();
        var self = this;
        var currentEase=ease||function(a){return a };
        this.tickID=null;
        var toTick = function () {
            var dt = new Date() - beginTime;
            if (dt >= time) {
                el[property] = value;
                onChange && onChange(value);
                onEnd && onEnd(value);
                cancelAnimationFrame(self.tickID);
                self.toTick=null;
                return;
            }
            el[property] = dv * currentEase(dt / time) + current;
            self.tickID=requestAnimationFrame(toTick);
            onChange && onChange(el[property]);
        };
        toTick();
        To.List.push(this);
    };

    To.List=[];

    To.stopAll=function(){
        for(var i= 0,len=To.List.length;i<len;i++){
            cancelAnimationFrame(To.List[i].tickID);
        }
        To.List.length=0;
    };

    To.stop=function(to) {
        cancelAnimationFrame(to.tickID);
    };

    function ease(x) {
        return Math.sqrt(1 - Math.pow(x - 1, 2));
    }
    //To.js end

    //component begin
    Vue.use(AlloyFingerVue,{AlloyFinger:AlloyFinger}); // use AlloyFinger's plugin

    export default {
        name: 'pinch-slider',
        props: {
            'slides':Array,
            'srcKey':
            {
                type: String,
                default: 'src'
            },
            'enablePinch':
            {
                type: Boolean,
                default: true
            },
            'currentIndex':
            {
                type: Number,
                default: 0
            },
            'lazyLoad':
            {
                type: Boolean,
                default: false,
            }
        },

        data: function() {
            return{
                currentScale : 1,
                slidesDoms : [],
                curSlideImg : {},
                lastIndex:-100,
                allImgLoaded : false,
            }
        },

        watch:{
            'slides': function(){
                this.bindTransform();
            },
            'currentIndex': function(){
                this.processCurrentIndexChange();
            }
        },

        mounted: function(){
            this.bindTransform();
        },

        methods: {
            bindTransform: function(){
                this.allImgLoaded = false;
                if(this.slides.length > 0 && !this.$el.translateX){
                    Transform(this.$el);
                    setTimeout(function () {
                        this.slidesDoms = [].slice.call(this.$el.children);

                        this.slidesDoms.map((child,index) => {
                            var $img = child.childNodes[0];
                            Transform($img);
                        });
                        this.curSlideImg = this.slidesDoms[this.currentIndex].childNodes[0];

                        this.$emit('on-slide-change', { id: this.$el.id, index: this.currentIndex, slides: this.slides });
                        this.processCurrentIndexChange();
                    }.bind(this), 0);
                }
            },

            processCurrentIndexChange: function(){
                if (this.currentIndex < 0) return;

                //lazyLoad
                this._lazyLoad();

                this.curSlideImg = this.slidesDoms[this.currentIndex].childNodes[0];
                this.curSlideImg.scaleX = this.curSlideImg.scaleY = 1;
                this.curSlideImg.translateX = 0;

                let width = this.$el.clientWidth;
                if (this.lastIndex === this.currentIndex - 1 || this.lastIndex === this.currentIndex + 1) {
                    new To(this.$el, 'translateX', -width * this.currentIndex, 500, ease, function () {});
                } else {
                    new To(this.$el, 'translateX', -width * this.currentIndex, 0, ease, function () {});
                }

                this.$emit('on-slide-change', { index: this.currentIndex, slides: this.slides });
                this.lastIndex = this.currentIndex;
            },

            _lazyLoad: function () {
                if(!this.allImgLoaded){
                    let allLoaded = true;
                    this.slidesDoms.map((child,index) => {
                        var $img = child.childNodes[0];
                        if(!this.lazyLoad){
                            $img.setAttribute('src', this.slides[index][this.srcKey]);
                        }else{
                            allLoaded = false;
                            if(!$img.getAttribute('src') && this.currentIndex - 1 <= index && this.currentIndex +  1 >= index){
                                $img.setAttribute('src', this.slides[index][this.srcKey]);
                            }
                        }
                    });
                    this.allImgLoaded = allLoaded;
                }
            },

            multipointStart: function (evt) {
                this.curSlideImg = this.slidesDoms[this.currentIndex].childNodes[0];
                this.currentScale = this.curSlideImg.scaleX;
                evt.cancelBubble=true;
            },

            swipe: function (evt) {
                if(this.currentScale > 1){
                    return;
                }
                if (evt.direction === 'Left') {
                    if (this.currentIndex < this.slides.length - 1) {
                        this.currentIndex++;
                    }
                }else if (evt.direction === 'Right') {
                    if (this.currentIndex > 0) {
                        this.currentIndex--;
                    }
                }
            },

            imageSwipe: function (evt) {
                evt.cancelBubble = true;
                evt.preventDefault();
            },

            pinch: function (evt) {
                if(!this.enablePinch){
                    return;
                }

                this.curSlideImg.translateX = 0;
                if(this.currentScale * evt.scale < 1){
                    this.curSlideImg.scaleX = this.curSlideImg.scaleY = 1;
                }else{
                    this.curSlideImg.scaleX = this.curSlideImg.scaleY = this.currentScale * evt.scale;
                }
                evt.cancelBubble=true;
                evt.preventDefault();
            },

            pressMove: function (evt) {
                var range = (this.currentScale - 1)/2 * this.$el.clientWidth;
                if(this.curSlideImg.translateX + evt.deltaX > range || this.curSlideImg.translateX + evt.deltaX < -range){
                    this.curSlideImg.scaleX = this.curSlideImg.scaleY = 1;
                    this.curSlideImg.translateX = 0;
                    return;
                }else{
                    this.curSlideImg.translateX += evt.deltaX;
                }
            },

            multipointEnd: function () {
                this.currentScale = this.curSlideImg.scaleX;
            },

            doubleTap: function () {
                if(!this.enablePinch){
                    return;
                }
                if(this.curSlideImg.scaleX == 1){
                    new To(this.curSlideImg, 'scaleX', 2, 200, ease, function () {});
                    new To(this.curSlideImg, 'scaleY', 2, 200, ease, function () {});
                    new To(this.curSlideImg, 'translateX', 0, 200, ease, function () {});
                    this.currentScale = 2;
                }else{
                    new To(this.curSlideImg, 'scaleX', 1, 200, ease, function () {});
                    new To(this.curSlideImg, 'scaleY', 1, 200, ease, function () {});
                    new To(this.curSlideImg, 'translateX', 0, 200, ease, function () {});
                    this.currentScale = 1;
                }
            },

            singleTap: function (evt) {
                evt.cancelBubble = true;
                evt.preventDefault();
                this.$emit('on-img-tap');
            },

            click: function (evt) {
                this.$emit('on-img-click');
                evt.cancelBubble = true;
                evt.preventDefault();
            },

            touchMove: function (evt) {
                if (Math.abs(evt.deltaX) >= Math.abs(evt.deltaY)) {
                    evt.preventDefault();
                }
            },
        },
    }
</script>
