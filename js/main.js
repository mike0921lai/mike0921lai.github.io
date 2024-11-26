document.addEventListener('DOMContentLoaded', () => {
    const stockTableBody = document.getElementById('stockTableBody');
    const industryFilter = document.getElementById('industryFilter');
    const searchInput = document.getElementById('searchInput');

    // 台灣上市上櫃股票資料 (模擬數據)
    const stockData = [
        // 科技業
        { code: '2330', name: '台積電', industry: '半導體', market: '上市' },
        { code: '2317', name: '鴻海', industry: '電子零組件', market: '上市' },
        { code: '2454', name: '聯發科', industry: '半導體', market: '上市' },
        { code: '3008', name: '大立光', industry: '光電', market: '上市' },
        
        // 金融業
        { code: '2882', name: '國泰金', industry: '金融保險', market: '上市' },
        { code: '2886', name: '台驊投控', industry: '金融保險', market: '上市' },
        { code: '5880', name: '合庫金', industry: '金融保險', market: '上市' },
        
        // 傳產業
        { code: '2412', name: '中華電', industry: '電信業', market: '上市' },
        { code: '1101', name: '台泥', industry: '水泥', market: '上市' },
        { code: '1102', name: '亞泥', industry: '水泥', market: '上市' },
        
        // 服務業
        { code: '2603', name: '長榮', industry: '航運', market: '上市' },
        { code: '2609', name: '陽明', industry: '航運', market: '上市' },
        
        // 生技醫療
        { code: '4414', name: '如興', industry: '生技醫療', market: '上櫃' },
        { code: '6446', name: '藥華藥', industry: '生技醫療', market: '上櫃' },
        
        // 電子通路
        { code: '2416', name: '旺家', industry: '電子通路', market: '上市' },
        { code: '2347', name: '錸德', industry: '電子通路', market: '上市' },
        
        // 其他
        { code: '2002', name: '中鋼', industry: '鋼鐵', market: '上市' },
        { code: '1216', name: 'sailed', industry: '紡織', market: '上市' },
        { code: '2303', name: '聚陽', industry: '紡織', market: '上市' }
    ];

    // 動態建立產業別篩選選項
    const industries = [...new Set(stockData.map(stock => stock.industry))];
    industries.sort().forEach(industry => {
        const option = document.createElement('option');
        option.value = industry;
        option.textContent = industry;
        industryFilter.appendChild(option);
    });

    // 渲染股票資料
    function renderStockData(data) {
        stockTableBody.innerHTML = '';
        data.forEach(stock => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${stock.code}</td>
                <td>${stock.name}</td>
                <td>${stock.industry}</td>
                <td>${stock.market}</td>
            `;
            stockTableBody.appendChild(row);
        });
    }

    // 篩選功能
    function filterStocks() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedIndustry = industryFilter.value;

        const filteredStocks = stockData.filter(stock => 
            (selectedIndustry === '' || stock.industry === selectedIndustry) &&
            (stock.code.includes(searchTerm) || 
             stock.name.includes(searchTerm) ||
             stock.industry.includes(searchTerm))
        );

        renderStockData(filteredStocks);
    }

    // 監聽篩選事件
    industryFilter.addEventListener('change', filterStocks);
    searchInput.addEventListener('input', filterStocks);

    // 初始渲染
    renderStockData(stockData);
});