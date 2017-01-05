# Overview

pinch-slider is a touch slider for which can be zoomed or pinched vue.js.

# Install

```bash
$ npm install pinch-slider
```

## Import using module
Import components to your project:

```JavaScript
require('pinch-slider/dist/pinch-slider.css');

// in ES6 modules
import { PinchSlider } from 'pinch-slider';

// in CommonJS
const { PinchSlider } = require('pinch-slider');

// in Global variable
const { PinchSlider } = PinchSlider;
```

And register components:

```javascript
Vue.component('pinch-slider', PinchSlider);
```

## Import using script tag

``` HTML
<link rel="stylesheet" href="../node-modules/pinch-slider/dist/pinch-slider.css" charset="utf-8">
<script src="../node-modules/pinch-slider/dist/pinch-slider.js"></script>
```

```JavaScript
const vueSwipe = VueSwipe.Swipe;
const vueSwipeItem = VueSwipe.SwipeItem;

new Vue({
  el: 'body',
  components: {
    'swipe': vueSwipe,
    'swipe-item': vueSwipeItem
  }
});
```

# Usage

Work on a Vue instance:

```HTML
<div class="slider-container">
      <pinch-slider :slides="imgs" :enable-pinch="false" :current-index='currentIndex' @on-slide-change="changePageNo" @on-img-click="showFull">
      </pinch-slider>
</div>
```

```CSS
.slider-container {
        width: 100%;
        height: 500px;
        overflow: hidden;
    }
```

# Options

Here list Props on swipe component

| Option | Description |
| ----- | ----- |
| slides | Array(default: []) image lists to be loaded. |
| enablePinch | Boolean(default: true). |
| currentIndex | Number (default:0) - current image showing |
| srcKey | String (default:'src') - key for the slider object which contains the image. |
| lazyLoad | Boolean (default:false) - if true, the images won't be downloaded until swiped near to them. |

# Develop

```bash
$ npm run build
```
# License
MIT