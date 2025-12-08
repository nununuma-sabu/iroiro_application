document.addEventListener('DOMContentLoaded', () => {
    const volumeSlider = document.getElementById('volume');
    // ★ 修正: 新しい表示要素のIDを使用
    const volumeDisplay = document.getElementById('volume-display'); 

    /**
     * スライダーの値のみを更新する関数
     * (位置調整や非表示制御は不要になりました)
     * @param {string} value - スライダーの現在値
     */
    function updateVolumeDisplay(value) {
        const current = parseFloat(value);
        
        // 小数点第2位まで表示し、ラベルの横に設定
        volumeDisplay.textContent = current.toFixed(2); 
    }

    // スライダー操作時に値を更新
    volumeSlider.addEventListener('input', (e) => {
        updateVolumeDisplay(e.target.value);
    });

    // ページロード時に初期値を設定
    updateVolumeDisplay(volumeSlider.value);

    // フォーム送信時の処理 (以前のバージョンと同じ。API連携のプレースホルダー)
    const form = document.querySelector('form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // console.log(data);
    });
});
