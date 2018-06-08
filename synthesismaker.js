var SynthesisMaker = function(){
    this.count = 0;
    this.imgs = [];
    this.datas = [];
    this.onloadLisener = [];
    this.dest = [];
}

SynthesisMaker.prototype.addOnloadLisener = function(func, id=null){
    this.onloadLisener.push({
        func,
        id
    });
    return this;
}


SynthesisMaker.prototype.loadImg = function(url){
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
        });

        var c = document.createElement('canvas');
        // document.querySelector('body').appendChild(c);
        c.setAttribute('width', width);
        c.setAttribute('height', height);
        var ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        var data = ctx.getImageData(0, 0, width, height);
        this.datas.push(_.chunk(data.data, 1920 * 4));

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

SynthesisMaker.prototype.putPixel = function(x, y, pixel){
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
    this.dest[y][x * 4 + 3] = pixel.A;
    
}

SynthesisMaker.prototype.make = function(){
    this.addOnloadLisener(() => {
        if(this.imgs.length < this.count) return;

        var width = _.maxBy(this.imgs, (img) => img.width).width;
        var height = _.maxBy(this.imgs, (img) => img.height).height;
        var count = this.imgs.length;
        // console.log(`count: ${count}     and: ${this.imgs}`);
        // console.log(this.imgs);

        var a = Date.now();
        
        // for (const column of this.datas) {
        for(var i=0; i < width; i++){
            for(var j = 0; j < height; j++){
                // if(index < count){
                    if(this.imgs[i%count].width<=i || this.imgs[i%count].height<=j) {
                        console.log('跳过了！');
                        continue;
                    }
                    var p = this.getPixel(this.datas[i%count], i + i%count, j);
                    this.putPixel(i, j, p);
            }
            //console.log(j);
        }
        
        var dest = _.flattenDeep(this.dest);
        var destImageData = new ImageData(width, height);
        dest.forEach((e, i) => {
            destImageData.data[i] = e;
        });

        var b = Date.now();
        console.log(`一共用了 ${(b - a)}毫秒  max width: ${width} height: ${height}`)

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