Page({
  data: {
    scores: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
    currentQuestionIndex: 0
  },
  
  // 用户点击选项时触发
  chooseOption(e) {
    const value = e.currentTarget.dataset.value; // 获取选项的 value，比如 'E'
    this.data.scores[value]++; // 对应字母分数 +1
    
    if (this.data.currentQuestionIndex < 11) {
      // 进入下一题
      this.setData({ currentQuestionIndex: this.data.currentQuestionIndex + 1 });
    } else {
      // 12题答完，计算最终MBTI
      this.calculateMBTI();
    }
  },

  calculateMBTI() {
    const s = this.data.scores;
    const mbti = 
      (s.E >= s.I ? 'E' : 'I') +
      (s.S >= s.N ? 'S' : 'N') +
      (s.T >= s.F ? 'T' : 'F') +
      (s.J >= s.P ? 'J' : 'P');
    
    // 携带结果跳转到结果页
    wx.redirectTo({
      url: `/pages/result/result?mbti=${mbti}`
    });
  }
})
