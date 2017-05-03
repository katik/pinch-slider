const pinchSlider = PinchSlider.PinchSlider;
const AlloyFingerVue = PinchSlider.AlloyFingerVue;
const AlloyFinger = PinchSlider.AlloyFinger;

Vue.use(AlloyFingerVue,{ AlloyFinger: AlloyFinger }); // use AlloyFinger's plugin

Vue.component('pinchSlider', pinchSlider);
new Vue({
    el: '.vue-wrapper',
    data: {
        imgs: [
            { src: 'https://cdn.pixabay.com/photo/2016/11/07/05/13/map-1804891__480.jpg' },
            { src: 'https://cdn.pixabay.com/photo/2016/12/09/08/09/texture-1893788__480.jpg' },
            {src:'https://cdn.pixabay.com/photo/2016/10/20/18/35/sunrise-1756274__480.jpg'}
        ],
        currentIndex: 0,
        isFull:false
    },
    methods:{
    	showFull(){
    		this.isFull = true;
    	},
    	changePageNo: function (data) {
            this.currentIndex = data.index;
        }
    }
});
