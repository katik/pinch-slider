<style scoped>
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
        -o-object-fit: contain;
        object-fit: contain;
        background-size: 100%;
        background-size: 100vw;
        background-position: center center;
        background-repeat: no-repeat;
        background-image: url("../assets/images/loading.gif");
        background-color: black;
        min-height: 2rem;
    }

    .ps-full-mode-slider .ps-img-wrapper img{
        -o-object-fit: contain;
        object-fit: contain;
        height:auto;
    }
</style>

<template>
    <div class="ps-slider"
         v-finger:tap="tap"
         v-finger:long-tap="longTap"
         v-finger:rotate="rotate"
         v-finger:swipe="swipe"
         v-finger:touch-start="touchStart"
         v-finger:touch-move="touchMove"
         v-finger:touch-end="touchEnd"
         v-finger:touch-cancel="touchCancel">
        <div v-for="(slide,index) in domSlides" class="ps-img-wrapper">
            <img
                 :src="(index === 0 || !lazyLoad) ? slide[srcAtr]: loading-img-url"
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
    import To from './To.js';

    //component begin

    export default {
        name: 'pinch-slider',
        props: {
        'slides':Array,
        'srcAtr':{
            type: String,
            default: 'src'
        },
        'enablePinch':{
            type: Boolean,
            default: true
        },
        'currentIndex':{
            type: Number,
            default: 0
        },
        'lazyLoad':{
            type: Boolean,
            default: false,
        },
        'loadingImgUrl':{
            type: String,
            default: ''
        }
    },
    data: function() {
        return{
            //max number of images in DOM
            cachedSize: 15,
            //cache index in the total slides
            currentCacheStartIndex:0,
            currentScale : 1,
            slidesDoms : [],
            curSlideImg : {},
            lastIndex: -100,
            lazyLoadMap: [],
            swipeFlag: false,
        }
    },

    watch:{
        'slides': function(){
            this.cachedSize = Math.min(this.slides.length, 15);
            this.bindTransform();
        },
        'currentCacheStartIndex': function(){
            this.bindTransform();
        },
        'currentIndex': function(){
            this.processCurrentIndexChange();
        },
        'domSlides': function() {
            this.processCurrentIndexChange();
        },
    },

    computed:{
        'domSlides': function() {
            this.lazyLoadMap = new Array(Math.min(this.cachedSize,this.slides.length));
            return this.slides.slice(this.currentCacheStartIndex, Math.min(this.slides.length, this.currentCacheStartIndex + this.cachedSize));
        },
    },

    mounted: function(){
        this.bindTransform();
    },
    
    methods: {
        bindTransform: function(){
            if(this.slides.length > 0){
                (typeof this.$el.translateX) === "undefined" && Transform(this.$el);
                setTimeout(function () {
                    this.slidesDoms = [].slice.call(this.$el.children);

                    this.slidesDoms.map((child,index) => {
                        var $img = child.childNodes[0];
                        $img.translateX || Transform($img);
                    });
                    if(this.slidesDoms[this.currentIndex - this.currentCacheStartIndex]){
                        this.curSlideImg = this.slidesDoms[this.currentIndex - this.currentCacheStartIndex].childNodes[0];
                    }

                    //分发状态
                    this.$emit('on-slide-change', { id: this.$el.id, index: this.currentIndex, slides: this.slides });
                    this.processCurrentIndexChange();
                }.bind(this), 0);
            }
        },

        resetCurrentImg() {
            this.curSlideImg.scaleX = this.curSlideImg.scaleY = 1;
            this.curSlideImg.translateX = 0;
        },

        processCurrentIndexChange: function(){
            if (this.currentIndex < 0) return;

            let windowWidth = document.body.clientWidth;
            let direction = this.lastIndex < this.currentIndex ? "next" : "previous";
            let step = this.lastIndex === this.currentIndex - 1 ? "next" : this.lastIndex === this.currentIndex + 1 ? "previous" : "jump";

            //time to swap slides dom cache
            if(this.currentIndex < this.currentCacheStartIndex + 2 || this.currentIndex > this.currentCacheStartIndex + (this.cachedSize - 2)){
                this.cachedSize = Math.min(this.slides.length, 15);
                this.currentCacheStartIndex = Math.min(this.slides.length - this.cachedSize, Math.max(0, this.currentIndex - Math.floor(this.cachedSize/2)));
                if(step === 'next'){
                    this.$el['translateX'] = -windowWidth * (this.currentIndex - this.currentCacheStartIndex - 1);
                }
                if(step === 'previous'){
                    this.$el['translateX'] = -windowWidth * (this.currentIndex - this.currentCacheStartIndex + 1);
                }
            }

            if(this.slidesDoms[this.currentIndex - this.currentCacheStartIndex]){
                this.curSlideImg = this.slidesDoms[this.currentIndex - this.currentCacheStartIndex].childNodes[0];
            }
            
            this.resetCurrentImg();

            //lastIndex img reset
            if(this.slidesDoms[this.lastIndex - this.currentCacheStartIndex]){
                let lastImg = this.slidesDoms[this.lastIndex - this.currentCacheStartIndex].childNodes[0];
                lastImg.scaleX = lastImg.scaleY = 1;
                lastImg.translateX = 0;
            }

            //lazyLoad
            if(this.lazyLoad){
                this._lazyLoad();
            }

            if (!this.swipeFlag) {
                this.$el['translateX'] = -windowWidth * (this.currentIndex - this.currentCacheStartIndex);
            } else {
                this.swipeFlag = false;
                new To(this.$el, 'translateX', -windowWidth * (this.currentIndex - this.currentCacheStartIndex), 500, this.ease, function () {});
            }

            this.$emit('on-slide-change', { index: this.currentIndex, slides: this.slides });
            this.lastIndex = this.currentIndex;
        },

        _lazyLoad: function () {
            loadImageSrc(this.currentIndex - this.currentCacheStartIndex,this);
            //load next and previouse
            function loadImageSrc(index,that) {
                if(!that.slidesDoms[index] || isNaN(index)){
                    return;
                }
                if(that.lazyLoadMap && that.lazyLoadMap[index]){
                    return false;
                }
                preloadImage(that.slides[index + that.currentCacheStartIndex][that.srcAtr], function() {
                    that.slidesDoms[index].childNodes[0].setAttribute('src', that.slides[index + that.currentCacheStartIndex][that.srcAtr]);
                    that.lazyLoadMap[index] = 1;
                });

                return true;
            }

            function preloadImage(imgSrc, callback){
                var objImagePreloader = new Image();

                objImagePreloader.src = imgSrc;
                if(objImagePreloader.complete){
                    callback();
                    objImagePreloader.onload=function(){};
                }
                else{
                    objImagePreloader.onload = function() {
                        callback();
                        //clear onLoad, IE behaves irratically with animated gifs otherwise
                        objImagePreloader.onload=function(){};
                    }
                }
            }
        },

        tap: function () {},

        multipointStart: function (evt) {
            this.curSlideImg = this.slidesDoms[this.currentIndex - this.currentCacheStartIndex].childNodes[0];
            this.currentScale = this.curSlideImg.scaleX;
            evt.cancelBubble=true;
        },

        longTap: function () {
            //console.log('onLongTap');
        },

        swipe: function (evt) {
            //console.log('swipe' + evt.direction);
            if(this.currentScale > 1){
                return;
            }
            this.swipeFlag = true;
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

        rotate: function (evt) {
            console.log(evt.angle);
        },

        pressMove: function (evt) {
            var windowWidth = document.body.clientWidth;
            var range = (this.currentScale - 1)/2 * windowWidth;
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
            //console.log('onMultipointEnd');
        },

        doubleTap: function () {
            if(this.curSlideImg.scaleX == 1){
                new To(this.curSlideImg, 'scaleX', 2, 200, this.ease, function () {});
                new To(this.curSlideImg, 'scaleY', 2, 200, this.ease, function () {});
                new To(this.curSlideImg, 'translateX', 0, 200, this.ease, function () {});
                //this.curSlideImg.scaleX = this.curSlideImg.scaleY = 2;
                this.currentScale = 2;
            }else{
                //this.curSlideImg.scaleX = this.curSlideImg.scaleY = 1;
                new To(this.curSlideImg, 'scaleX', 1, 200, this.ease, function () {});
                new To(this.curSlideImg, 'scaleY', 1, 200, this.ease, function () {});
                new To(this.curSlideImg, 'translateX', 0, 200, this.ease, function () {});
                this.currentScale = 1;
            }
        },

        singleTap: function (evt) {
            //console.log('onSingleTap');
            evt.cancelBubble = true;
            evt.preventDefault();
            this.$emit('on-img-tap');
        },
        click: function (evt) {
            //console.log('click');
            this.$emit('on-img-click');
            evt.cancelBubble = true;
            evt.preventDefault();
        },
        touchStart: function () {
            //console.log('onTouchStart');
        },

        touchMove: function (evt) {
            //console.log('onTouchMove');
            if (Math.abs(evt.deltaX) >= Math.abs(evt.deltaY)) {
                evt.preventDefault();
            }
        },

        touchEnd: function () {
            //console.log('onTouchEnd');
        },

        touchCancel: function () {
            //console.log('onTouchCancel');
        },

        ease: function (x) {
            return Math.sqrt(1 - Math.pow(x - 1, 2));
        }
    },
}
</script>
