const modelPath = 'models/'
const modelListURL = 'models/list.json'
const noiseLevel = ['None', 'Low', 'Medium', 'High', 'Highest'];

window.onload = function () {
    let app = new Application();
    app.loadImage('miku_small_noisy.jpg');
}

function Application() {
    let app = this;
    app.img = null;
    app.isWorking = false;

    app.fileInput = document.getElementById('file-input');
    app.fileInput.addEventListener('change', function () {
        if (app.isWorking) return;
        if (this.files.length == 0) return;
        let reader = new FileReader();
        reader.readAsDataURL(this.files[0]);
        reader.onload = function () {
            app.loadImage(this.result);
        };
    });

    app.styleRadio = document.getElementsByName('style-radio');
    for (let i = 0; i < app.styleRadio.length; i++) {
        app.styleRadio[i].addEventListener('change', () => { app.submit(); })
    }
    app.scaleTag = document.getElementById('scale-tag');
    app.scaleInput = document.getElementById('scale-input');
    app.scaleInput.addEventListener('change', () => { app.submit(); })

    app.noiseTag = document.getElementById('noise-tag');
    app.noiseInput = document.getElementById('noise-input');
    app.noiseInput.addEventListener('change', () => { app.submit(); });

    app.ttaTag = document.getElementById('tta-tag');
    app.ttaInput = document.getElementById('tta-input');
    app.ttaInput.addEventListener('change', () => { app.submit(); });

    app.modelSelect = document.getElementById('model-select');
    app.modelSelect.addEventListener('change', () => { app.submit(); });

    app.startButton = document.getElementById('start-button');
    app.startButton.addEventListener('click', () => { app.start(); });

    app.messageBox = document.getElementById('message-box');
    app.messageText = document.getElementById('message-text');
    app.progress = document.getElementById('progress');
    app.progressBar = document.getElementById('progress-bar');
    app.stopButton = document.getElementById('stop-button');
    app.stopButton.addEventListener('click', () => { app.stop(); });

    app.imageInfo = document.getElementById('image-info');
    app.imageCanvas = document.getElementById('image-canvas');

    app.loadModelList(modelListURL);
    app.submit();
}

Application.prototype = {

    submit: function() {
        let app = this;
        let style = '';
        for (let i = 0; i < app.styleRadio.length; i++) {
            let r = app.styleRadio[i];
            if (r.checked) {
                style = r.value;
                break;
            }
        }
        let scale = parseInt(app.scaleInput.value, 10);
        let noise = parseInt(app.noiseInput.value, 10);
        let tta = Math.pow(2, parseInt(app.ttaInput.value, 10));

        app.scaleTag.innerHTML = scale + 'x';
        app.noiseTag.innerHTML = noiseLevel[noise + 1];
        app.ttaTag.innerHTML = tta;

        let config = {
            'style': style,
            'scale': scale,
            'noise': noise,
            'tta': tta,
        };

        let validModel = [];
        for (let i = app.modelInfoList.length - 1; i >= 0; i--) {
            let m = app.modelInfoList[i];
            if (m['style'] == style &&
                m['scale'] == scale &&
                m['noise'] == noise) {
                validModel.push(m);
            }
        }

        let modelName = app.modelSelect.selectedIndex < 0 ? "" : 
            app.modelSelect.options[app.modelSelect.selectedIndex].text;

        while (app.modelSelect.length > 0) {
            app.modelSelect.remove(0);
        }

        let selectIdx = 0;
        for (let i = 0; i < validModel.length; i++) {
            let opt = document.createElement("option");
            opt.text = validModel[i]['name'];
            app.modelSelect.add(opt);
            if (validModel[i].name == modelName) {
                selectIdx = i;
            }
        }
        if (app.modelSelect.length > 0) {
            app.modelSelect.selectedIndex = selectIdx;
            config['info'] = validModel[selectIdx];
        }
        return config;
    },

    loadModelList: function(url) {
        let app = this;
        app.modelInfoList = [];
        let xmlhttp = new XMLHttpRequest();
        app.showMessage(true, 'Loading...', null, false);
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4) {
                if (xmlhttp.status == 200) {
                    app.modelInfoList = JSON.parse(xmlhttp.responseText);
                    for (let i = 0; i < app.modelInfoList.length; i++) {
                        let m = app.modelInfoList[i];
                        m['model'] = null;
                    }
                    app.showMessage(false);
                    app.submit();
                }
                else {
                    alert('Load Failed');
                }
            }
        }
        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    },

    loadImage: function(file) {
        let app = this;
        let img = new Image();
        img.src = file;
        img.onload = () =>{
            app.img = img;
            let can = app.imageCanvas;
            can.width = img.width;
            can.height = img.height;
            can.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
            app.showImageInfo(null);
        };
    },

    stop: function() {
        let app = this;
        app.showMessage(false);
        app.isWorking = false;
    },

    showMessage: function(show, msg, bar, button){
        let app = this;
        if (!show) {
            app.messageBox.style.display = 'none';
            return;
        }
        app.messageBox.style.display = 'flex';

        if (msg == null) {
            app.messageText.style.display = 'none';
            app.messageText.innerHTML = '';
        } else {
            app.messageText.style.display = 'block';
            app.messageText.innerHTML = msg;
        }

        if (bar == null) {
            app.progress.style.display = 'none';
        } else {
            app.progress.style.display = 'block';
            app.progressBar.style.width = (bar*100) + '%';
        }

        app.stopButton.style.display = button ? 'block': 'none';
    },

    showImageInfo: function(config) {
        let app = this;
        app.imageInfo.innerHTML = "";
        if (config == undefined || config == null) {
            return;
        }
        let ul = document.createElement('ul');

        let style = document.createElement('li');
        style.innerHTML = config['style'] == 'art' ? 'Anime' : config['style'];
        ul.appendChild(style);

        let size = document.createElement('li');
        size.innerHTML = config['width'] + 'x' + config['height'];
        if (config['height'] != config['yHeight']) {
            size.innerHTML += ' -> ' + config['yWidth'] + 'x' + config['yHeight'];
        }
        ul.appendChild(size);

        let noise = document.createElement('li');
        noise.innerHTML = noiseLevel[config['noise'] + 1] + ' noise reduction';
        ul.appendChild(noise);

        let tta = document.createElement('li');
        tta.innerHTML = config['tta'] + 'x TTA';
        ul.appendChild(tta);

        let time = document.createElement('li');
        let d = config['timeStop'].getTime() - config['timeStart'].getTime();
        time.innerHTML = (d / 1000).toFixed(2) + 's';
        ul.appendChild(time);

        app.imageInfo.appendChild(ul);
    },

    start: function() {
        let app = this;
        if (app.isWorking) return;
        if (app.img == null) return;
        let config = app.submit();
        if (config['info'] == undefined) return;

        app.isWorking = true;
        app.showMessage(true, 'loading model', null, false);

        config['image'] = app.img;
        let url = modelPath + config['info']['name'] + '/model.json';
        tf.loadLayersModel(url).then((m) => {
            config['model'] = m;
            requestAnimationFrame(() => {
                app.prepare(config);
            });
        });
    },

    prepare: function(config) {
        let app = this;
        app.showMessage(true, '0%', 0, true);

        let img = config['image'];
        let m = config['model'];
        config['height'] = img.height;
        config['width'] = img.width;

        let is = m.inputs[0].shape[1];
        let os = m.outputShape[1];
        let scale = config['scale'];
        let x;
        if (scale == 2 && os < is) {
            scale = 1;
            let can = document.createElement('canvas');
            can.width = img.width * 2;
            can.height = img.height * 2;
            can.getContext('2d').drawImage(img, 0, 0, img.width * 2, img.height * 2);
            x = tf.browser.fromPixels(can, 4);
        } else {
            x = tf.browser.fromPixels(img, 4);
        }

        let a = tf.slice(x, [0, 0, 3], [-1, -1, 1])
        let offset = (is - os / scale) / 2;
        let gs = is - offset * 2;
        let h = x.shape[0];
        let w = x.shape[1];
        let hb = Math.floor(h / gs) + (h % gs == 0 ? 0 : 1);
        let wb = Math.floor(w / gs) + (w % gs == 0 ? 0 : 1);
        let h2 = (hb * gs) + offset * 2;
        let w2 = (wb * gs) + offset * 2;

        config['inputSize'] = is;
        config['outputSize'] = os;
        config['offset'] = offset;
        config['gridSize'] = gs;
        config['hasAlpha'] =  !isOneColor(a);
        config['row'] = hb;
        config['column'] = wb;
        config['xHeight'] =  h;
        config['xWidth'] =  w;
        config['yHeight']  = h * scale;
        config['yWidth'] = w * scale;
        config['timeStart'] = new Date();

        x = padding(x, offset, h2 - offset - h, offset, w2 - offset - w);
        let tasks = preProcess(x, config);

        app.isWorking = true;
        app.process(tasks, config, 0);
    },

    process: function(tasks, config, idx) {
        let app = this;
        if (!app.isWorking) return;
        if (idx >= tasks.length) {
            let y = postProcess(tasks, config);
            config['timeStop'] = new Date();
            app.isWorking = false;
            tf.browser.toPixels(tf.clipByValue(y, 0, 1), app.imageCanvas);
            app.showImageInfo(config);
            app.stop();
            return;
        }
        app.showMessage(true, Math.floor(100 * idx / tasks.length) + '%',
            idx / tasks.length, true);
        requestAnimationFrame(() => {
            if (!app.isWorking) return;
            if (idx > 0) {
                tasks[idx-1]['y'].dataSync();
            }
            let x = tasks[idx].x.toFloat().div(255.0);
            let y = config['model'].predict(x);
            tasks[idx]['y'] = y;
            app.process(tasks, config, idx+1);   
        });
    }
};

function preProcess(x, config) {
    x = x.expandDims();
    let gs = config['gridSize'];
    let is = config['inputSize'];
    let tasks = [];
    for (let i = 0; i  < config['row']; i++) {
        for (let j = 0; j < config['column']; j++) {
            let grid = tf.slice(x, [0, i * gs, j * gs, 0], [1, is, is, -1]);
            for (let k = 0; k < config['tta']; k++) {
                let t = ttaForward(grid, k);

                let rgb = tf.slice(t, [0, 0, 0, 0], [-1, -1, -1, 3]);
                tasks.push({'x' : rgb});
                if (config['hasAlpha']) {
                    let a = tf.tile(
                        tf.slice(t, [0, 0, 0, 3], [-1, -1, -1, 1]),
                        [1, 1, 1, 3]);
                    tasks.push({'x' : a});
                }
            }
        }
    }
    return tasks;
}

function postProcess(tasks, config) {
    let ptr = 0;
    let img = [];
    for (let i = 0; i < config['row']; i++) {
        let row = [];
        for (let j = 0; j < config['column']; j++) {
            let tta = [];
            for (let k = 0; k < config['tta']; k++) {
                if (config['hasAlpha']) {
                    let rgb = tasks[ptr++].y;
                    let a = tf.mean(tasks[ptr++].y, -1, true);
                    let rgba = tf.concat([rgb, a], -1);
                    tta.push(ttaBackward(rgba, k));
                } else {
                    tta.push(ttaBackward(tasks[ptr++].y, k));
                }
            }
            if (tta.length > 1) {
                row.push(tf.mean(tf.concat(tta, 0), 0, true));
            } else {
                row.push(tta[0]);
            }
        }
        img.push(tf.concat(row, -2));
    }
    let y = tf.concat(img, -3);
    y = tf.slice(y, [0, 0, 0, 0], [-1, config['yHeight'], config['yWidth'], -1]);
    return tf.squeeze(y, 0);
}

function isOneColor(x) {
    let tmp = x.flatten().dataSync();
    if (tmp.length <= 0) return true;
    let c = tmp[0];
    for (let i = 0; i < tmp.length; i++) {
        if (tmp[i] != c) return false;
    }
    return true;
}

function padding(x, top, bottom, left, right) {
    //return tf.pad(x, [[0, 0], [top, bottom], [left, right], [0, 0]], 0);
    let h = x.shape[0];
    let w = x.shape[1];
    let t = tf.tile(tf.slice(x, [0, 0], [1, -1]), [top, 1, 1]);
    let b = tf.tile(tf.slice(x, [h - 1, 0], [1, -1]), [bottom, 1, 1]);
    let l = tf.tile(tf.slice(x, [0, 0], [-1, 1]), [1, left, 1]);
    let r = tf.tile(tf.slice(x, [0, w - 1], [-1, 1]), [1, right, 1]);
    let tl = tf.tile(tf.slice(x, [0, 0], [1, 1]), [top, left, 1]);
    let bl = tf.tile(tf.slice(x, [h - 1, 0], [1, 1]), [bottom, left, 1]);
    let tr = tf.tile(tf.slice(x, [0, w - 1], [1, 1]), [top, right, 1]);
    let br = tf.tile(tf.slice(x, [h - 1, w - 1], [1, 1]), [bottom, right, 1]);

    return tf.concat([
        tf.concat([tl, l, bl], 0),
        tf.concat([t, x, b], 0),
        tf.concat([tr, r, br], 0)
    ], 1);
}

function ttaForward(x, type) {
    switch (type) {
        case 0:
            break;
        case 1:
            x = tf.transpose(x, [0, 2, 1, 3]);
            break;
        case 2:
            x = tf.reverse(x, 1);
            break;
        case 3:
            x = tf.transpose(x, [0, 2, 1, 3]);
            x = tf.reverse(x, 1);
            break;
        case 4:
            x = tf.reverse(x, 2);
            break;
        case 5:
            x = tf.transpose(x, [0, 2, 1, 3]);
            x = tf.reverse(x, 2);
            break;
        case 6:
            x = tf.reverse(x, 2);
            x = tf.reverse(x, 1);
            break;
        case 7:
            x = tf.transpose(x, [0, 2, 1, 3]);
            x = tf.reverse(x, 1);
            x = tf.reverse(x, 2);
            break;
    }
    return x;
}

function ttaBackward(x, type) {
    switch (type) {
        case 0:
            break;
        case 1:
            x = tf.transpose(x, [0, 2, 1, 3]);
            break;
        case 2:
            x = tf.reverse(x, 1);
            break;
        case 3:
            x = tf.reverse(x, 1);
            x = tf.transpose(x, [0, 2, 1, 3]);
            break;
        case 4:
            x = tf.reverse(x, 2);
            break;
        case 5:
            x = tf.reverse(x, 2);
            x = tf.transpose(x, [0, 2, 1, 3]);
            break;
        case 6:
            x = tf.reverse(x, 1);
            x = tf.reverse(x, 2);
            break;
        case 7:
            x = tf.reverse(x, 2);
            x = tf.reverse(x, 1);
            x = tf.transpose(x, [0, 2, 1, 3]);
            break;
    }
    return x;
}
