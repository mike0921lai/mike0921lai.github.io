// 所有 JavaScript 程式碼移至此
document.addEventListener('DOMContentLoaded', function() {
    // 初始化程式碼
    initIndustryOptions(STOCKS);
    updateStockOptions();
    
    // 事件監聽器
    document.getElementById('industry').addEventListener('change', (e) => 
        updateStockOptions(e.target.value, document.getElementById('search').value)
    );

    document.getElementById('search').addEventListener('input', 
        debounce((e) => updateStockOptions(
            document.getElementById('industry').value, 
            e.target.value
        ), 300)
    );
});

// 其他函數定義...