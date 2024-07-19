import heic2any from 'heic2any';

const fileReader = new FileReader();
const fileReaderBuffer = new FileReader();

const file  // 图片文件

// 加载图片
function loadImg(img) {
    return new Promise((resolve, reject) => {
        img.onload = (e) => {
            resolve(e.target.result);
        };
        img.onerror = (e) => {
            reject(e);
        };
    });
}

// 压缩图片
fileReader.onload = async (e) => {
    const base64 = e.target.result;
    const img = new Image();
    let imgData = null;
    img.src = base64;
    img.filename = file.name;
    try {
        await loadImg(img);
        imgData = await compressImg(img);
        resolve(imgData);
    } catch (error) {
        console.error(error);
        resolve({
            file: null,
            url: ''
        });
    }
};

// 读取是否是heic格式图片
fileReaderBuffer.onload = async () => {
    const type = getFileType(fileReaderBuffer);
    if (type === 'unknown') {
        console.error('unknown image type');
        resolve({
            file: null,
            url: ''
        });
        return;
    }
    if (type.includes('/heic')) {
        heic2any({ blob: file, toType: 'image/jpeg' }).then((blob) => {
            fileReader.readAsDataURL(blob);
        }).catch(() => {
            resolve({
                file: null,
                url: ''
            });
        });
        return;
    }
    fileReader.readAsDataURL(file);
};

fileReaderBuffer.readAsArrayBuffer(file);
