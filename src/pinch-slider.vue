<style scoped>
    .ps-slider{
        white-space: nowrap;
        height:100%;
        width:100%;
    }
    .ps-slider .ps-img-wrapper{
        height:100%;
        min-width:100%;
        vertical-align: top;
        display: -webkit-inline-box;
        display: -ms-inline-flexbox;
        display: inline-flex;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
        position: relative;
        text-align: center;
        overflow:hidden;
    }

    .ps-img-wrapper img{
        height:100%;
        /*min-width:100%;*/
        -o-object-fit: contain;
        object-fit: contain;
        background-size: 100%;
        background-size: 100vw;
        background-position: center center;
        background-repeat: no-repeat;
        /*background-image: url("../assets/images/loading.gif");*/
        background-color: black;
        min-height: 2rem;
        position: absolute;
        top: -99999px;
        right: -99999px;
        left: -99999px;
        bottom: -99999px;
        margin: auto;
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
            <img :width='windowWidth'
                 :src="(index === 0 || !lazyLoad) ? slide[srcAtr]: loadingImgUrl"
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
                ratio : 1,
                lastIndex: -100,
                lazyLoadMap: [],
                swipeFlag: false,
                windowWidth: window.innerWidth,
                multipointFlag: 0,
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
                            this.ratio = this.curSlideImg.naturalHeight/this.curSlideImg.naturalWidth;
                        }

                        //分发状态
                        this.$emit('on-slide-change', { id: this.$el.id, index: this.currentIndex, slides: this.slides });
                        this.processCurrentIndexChange();
                    }.bind(this), 0);
                }
            },

            resetCurrentImg() {
                this.curSlideImg.width = window.innerWidth;
                this.curSlideImg.translateX = 0;
                this.curSlideImg.translateY = 0;
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
                    this.ratio = this.curSlideImg.naturalHeight/this.curSlideImg.naturalWidth;
                }

                this.resetCurrentImg();

                //lastIndex img reset
                if(this.slidesDoms[this.lastIndex - this.currentCacheStartIndex]){
                    let lastImg = this.slidesDoms[this.lastIndex - this.currentCacheStartIndex].childNodes[0];
                    lastImg.width = window.innerWidth;
                    lastImg.height = window.innerWidth * this.ratio;
                    this.curSlideImg.width = window.innerWidth;
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
                        that.ratio = that.curSlideImg.naturalHeight/that.curSlideImg.naturalWidth;
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
                this.ratio = this.curSlideImg.naturalHeight/this.curSlideImg.naturalWidth;
                evt.cancelBubble=true;
            },

            longTap: function () {
                //console.log('onLongTap');
            },

            swipe: function (evt) {
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
                if(!this.multipointFlag){
                    this.multipointFlag = setTimeout(() => {
                        this.multipointFlag = 0;
                    },500);
                }else{
                    clearTimeout(this.multipointFlag);
                    this.multipointFlag = setTimeout(() => {
                        this.multipointFlag = 0;
                    },500);
                }

                if(!this.enablePinch){
                    return;
                }

                if(this.currentScale * evt.scale < 1){
                    this.curSlideImg.width = window.innerWidth;
                    this.curSlideImg.height = window.innerWidth * this.ratio;
                }else if(this.currentScale * evt.scale < 10){
                    this.curSlideImg.width = this.currentScale * evt.scale * window.innerWidth;
                    this.curSlideImg.height = this.currentScale * evt.scale * window.innerWidth * this.ratio;
                }
                if(evt.scale < 1) {
                    this.curSlideImg.translateX = 0;
                    this.curSlideImg.translateY = 0;
                }
                evt.cancelBubble=true;
                evt.preventDefault();
            },

            rotate: function (evt) {
//            console.log(evt.angle);
            },

            pressMove: function (evt) {
                var range = (this.currentScale - 1)/2 * window.innerWidth;
                var rangeY = this.currentScale * window.innerWidth * this.ratio/2 -  window.innerHeight / 2;
                if((this.curSlideImg.translateX + evt.deltaX > range || this.curSlideImg.translateX + evt.deltaX < -range)){
                    //若此时放大状态，且滑倒边界，则用户滑动距离很大才会出发滑倒下一张
                    if (this.currentScale >= 1 && Math.abs(evt.deltaX) < this.currentScale * 12) {
                        //
                    }else{
                        this.curSlideImg.width = window.innerWidth;
                        this.curSlideImg.translateX = 0;
                        this.curSlideImg.translateY = 0;
                        return;
                    }
                }else{
                    this.curSlideImg.translateX += evt.deltaX;
                }
                if(rangeY > 0 && (this.curSlideImg.translateY + evt.deltaY <= rangeY && this.curSlideImg.translateY + evt.deltaY >= -rangeY)){
                    this.curSlideImg.translateY += evt.deltaY;
                }
                evt.cancelBubble=true;
                evt.preventDefault();
            },

            multipointEnd: function () {
                this.currentScale = this.curSlideImg.width/window.innerWidth;
            },

            doubleTap: function () {
                if(this.curSlideImg.width == window.innerWidth){
                    new To(this.curSlideImg, 'width', window.innerWidth * 2, 200, this.ease);
                    new To(this.curSlideImg, 'height', window.innerWidth * this.ratio * 2, 200, this.ease, function () {});
                    new To(this.curSlideImg, 'translateX', 0, 200, this.ease, function () {});
                    this.currentScale = 2;
                }else{
                    new To(this.curSlideImg, 'width', window.innerWidth, 200, this.ease);
                    new To(this.curSlideImg, 'height', window.innerWidth * this.ratio, 200, this.ease, function () {});
                    new To(this.curSlideImg, 'translateX', 0, 200, this.ease, function () {});
                    new To(this.curSlideImg, 'translateY', 0, 200, this.ease, function () {});
                    this.currentScale = 1;
                }
            },

            singleTap: function (evt) {
                if(!this.multipointFlag) {
                    evt.cancelBubble = true;
                    evt.preventDefault();
                    this.$emit('on-img-tap');
                }
            },

            click: function (evt) {
                //console.log('click');
                if(!this.multipointFlag) {
                    this.$emit('on-img-click');
                    evt.cancelBubble = true;
                    evt.preventDefault();
                }
            },
            touchStart: function () {
                //console.log('onTouchStart');
            },

            touchMove: function (evt) {
                //console.log('onTouchMove');
//            if (Math.abs(evt.deltaX) >= Math.abs(evt.deltaY)) {
//                evt.preventDefault();
//            }
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
