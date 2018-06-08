var SynthesisMaker = function(){
    this.count = 0;
    this.imgs = [];
    this.datas = [];
    this.onloadLisener = [];
    this.dest = [];
    this.skip = 0;
}

SynthesisMaker.prototype.addOnloadLisener = function(func, id=null){
    this.onloadLisener.push({
        func,
        id
    });
    return this;
}


SynthesisMaker.prototype.loadImg = function(url, alpha=1){
    var  img = new Image()
    img.src = url;
    img.id = 'i' + this.count;
    this.count ++;
    // document.querySelector('body').appendChild(img)
    img.onload = (e) => {
        var width = img.width;
        var height = img.height;
        this.imgs.push({
        id: img.id,
        img,
        height,
        width,
        alpha,
        });

        var c = document.createElement('canvas');
        // document.querySelector('body').appendChild(c);
        c.setAttribute('width', width);
        c.setAttribute('height', height);
        var ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        var data = ctx.getImageData(0, 0, width, height);
        this.datas.push(_.chunk(data.data, width * 4));

        for (const func of this.onloadLisener) {
            if(func.id === null) {
                func.func(e);
            }else if(func.id === img.id){
                func.func(e);
            }
        }
    }


    return this;
}


SynthesisMaker.prototype.getPixel = function(idata, x, y){
    // console.log(idata)
    return {
        R:idata[y][x * 4], 
        G:idata[y][x * 4 + 1], 
        B:idata[y][x * 4 + 2], 
        A:idata[y][x * 4 + 3], 
    }
}

SynthesisMaker.prototype.putPixel = function(x, y, pixel, alpha){
    // this.dest.push(pixel.R);
    // this.dest.push(pixel.G);
    // this.dest.push(pixel.B);
    // this.dest.push(pixel.A);
    if(typeof this.dest[y] === 'undefined'){
        this.dest[y] = []
    }
    this.dest[y][x * 4] = pixel.R;
    this.dest[y][x * 4 + 1] = pixel.G;
    this.dest[y][x * 4 + 2] = pixel.B;
    this.dest[y][x * 4 + 3] = 255 * alpha;
    
}

SynthesisMaker.prototype.make = function(outterAlpha=1){
    this.addOnloadLisener(() => {
        if(this.imgs.length < this.count) return;

        var width = _.maxBy(this.imgs, (img) => img.width).width;
        var height = _.maxBy(this.imgs, (img) => img.height).height;
        var count = this.imgs.length;
        // console.log(`count: ${count}     and: ${this.imgs}`);
        // console.log(this.imgs);
        // console.log(`max width: ${width} height: ${height}`)

        var a = Date.now();
        
        // for (const column of this.datas) {
        for(var i=0; i < width; i++){
            for(var j = 0; j < height; j++){
                // if(index < count){
                    const currentImg = this.imgs[i%count]
                    // console.log(currentImg, i, j)
                    if(currentImg.width<=i || currentImg.height<=j) {
                        this.skip++;
                        // this.putPixel(i, j, {R:0,G:0,B:0,A:0}, 0);
                        if(currentImg.width<=i){
                            var index = parseInt(_.find(this.imgs, {width:width}).id.split('i')[1]);
                            var p = this.getPixel(this.datas[index], i + i%count, j);
                            this.putPixel(i, j, p, this.imgs[index].alpha * outterAlpha);
                        }else{
                            this.putPixel(i, j, {R:0,G:0,B:0,A:0}, 0);
                        }
                        continue;
                    }
                    var p = this.getPixel(this.datas[i%count], i + i%count, j);
                    this.putPixel(i, j, p, this.imgs[i%count].alpha);
            }
            //console.log(j);
        }
        
        var dest = _.flattenDeep(this.dest);
        var destImageData = new ImageData(width, height);
        dest.forEach((e, i) => {
            destImageData.data[i] = e;
        });

        var b = Date.now();
        console.log(`一共用了 ${(b - a)}毫秒  max width: ${width} height: ${height}   total skip: ${this.skip}`)

        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        var bit = createImageBitmap(destImageData);
        bit.then((bit) => {
            canvas.getContext('2d').drawImage(bit, 0, 0);
            document.querySelector('body').appendChild(canvas);
        });
    }, null);
}
