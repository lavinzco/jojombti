const stands = require('../../data/jojo-stands.json');

const BG_IMAGE = '/assets/poster-bg.png';
const QR_IMAGE = '/assets/miniapp-qrcode.png';

Page({
  data: {
    mbti: '',
    stand: {},
    panelList: [],
    posterPath: '',
    canvasReady: false
  },

  onLoad(options) {
    const mbti = (options.mbti || '').toUpperCase();
    const stand = stands[mbti] || stands.DEFAULT;
    const panelList = Object.keys(stand.panel).map((key) => ({
      key,
      value: stand.panel[key]
    }));

    this.setData({ mbti, stand, panelList });
    this.initCanvas();
  },

  initCanvas() {
    const query = wx.createSelectorQuery();
    query
      .select('#posterCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvasNode = res[0] && res[0].node;
        const width = (res[0] && res[0].width) || 300;
        const height = (res[0] && res[0].height) || 500;
        if (!canvasNode) {
          wx.showToast({ title: 'Canvas 初始化失败', icon: 'none' });
          return;
        }

        const dpr = wx.getWindowInfo().pixelRatio;
        canvasNode.width = width * dpr;
        canvasNode.height = height * dpr;

        const ctx = canvasNode.getContext('2d');
        ctx.scale(dpr, dpr);

        this.canvas = canvasNode;
        this.ctx = ctx;
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.setData({ canvasReady: true });
      });
  },

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = this.canvas.createImage();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  },

  async generatePoster() {
    if (!this.data.canvasReady) {
      wx.showToast({ title: 'Canvas 未准备好', icon: 'none' });
      return;
    }

    const { mbti, stand, panelList } = this.data;
    const ctx = this.ctx;
    const w = this.canvasWidth;
    const h = this.canvasHeight;

    ctx.clearRect(0, 0, w, h);

    try {
      const bg = await this.loadImage(BG_IMAGE);
      ctx.drawImage(bg, 0, 0, w, h);
    } catch (e) {
      ctx.fillStyle = '#1f1f2e';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`MBTI: ${mbti}`, 24, 48);

    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(stand.name, 24, 95);

    ctx.font = '18px sans-serif';
    ctx.fillText(`本体：${stand.user}`, 24, 128);

    ctx.font = '16px sans-serif';
    this.drawMultilineText(ctx, stand.desc, 24, 160, w - 48, 24);

    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('面板属性', 24, 250);

    ctx.font = '16px sans-serif';
    panelList.forEach((item, idx) => {
      const y = 282 + idx * 28;
      ctx.fillText(`${item.key}: ${item.value}`, 24, y);
    });

    try {
      const qr = await this.loadImage(QR_IMAGE);
      const qrSize = 100;
      ctx.drawImage(qr, w - qrSize - 24, h - qrSize - 24, qrSize, qrSize);
      ctx.font = '12px sans-serif';
      ctx.fillText('扫码体验小程序', w - qrSize - 24, h - qrSize - 32);
    } catch (e) {
      ctx.font = '12px sans-serif';
      ctx.fillText('请在 /assets 放置小程序二维码图片', 24, h - 24);
    }

    wx.canvasToTempFilePath({
      canvas: this.canvas,
      success: (res) => {
        this.setData({ posterPath: res.tempFilePath });
        wx.showToast({ title: '海报生成成功', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '海报生成失败', icon: 'none' });
      }
    });
  },

  drawMultilineText(ctx, text, x, y, maxWidth, lineHeight) {
    let line = '';
    let lineY = y;

    for (let i = 0; i < text.length; i += 1) {
      const testLine = line + text[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, x, lineY);
        line = text[i];
        lineY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, lineY);
  },

  savePosterToAlbum() {
    if (!this.data.posterPath) {
      wx.showToast({ title: '请先生成海报', icon: 'none' });
      return;
    }

    wx.getSetting({
      success: (res) => {
        const hasAuth = res.authSetting['scope.writePhotosAlbum'];
        if (hasAuth === false) {
          wx.openSetting({});
          return;
        }

        const save = () => {
          wx.saveImageToPhotosAlbum({
            filePath: this.data.posterPath,
            success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
            fail: () => wx.showToast({ title: '保存失败', icon: 'none' })
          });
        };

        if (hasAuth) {
          save();
        } else {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: save,
            fail: () => wx.showToast({ title: '未授权相册权限', icon: 'none' })
          });
        }
      }
    });
  }
});
