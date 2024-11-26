     // Interactive UI elements
     const holdingPeriodInput = document.getElementById('holdingPeriod');
     const holdingPeriodValue = document.getElementById('holdingPeriodValue');
     const confidenceThresholdInput = document.getElementById('confidenceThreshold');
     const confidenceThresholdValue = document.getElementById('confidenceThresholdValue');
     const analyzeButton = document.getElementById('analyzeButton');
     const tradingRulesElement = document.getElementById('tradingRules');
     const stockChart = document.getElementById('stockChart');

     // Update display values for sliders
     holdingPeriodInput.addEventListener('input', () => {
         holdingPeriodValue.textContent = holdingPeriodInput.value;
     });

     confidenceThresholdInput.addEventListener('input', () => {
         confidenceThresholdValue.textContent = confidenceThresholdInput.value;
     });

     // Simulated stock data (would be replaced by real backend in production)
     const mockStockData = {
         '2330': {
             historicalPrices: [100, 110, 105, 115, 120, 118, 125, 130, 128, 135],
             tradingRules: "買進規則範例：\n- 當股價在 100-120 區間時買入\n- 停損點：95\n- 獲利機率：75%"
         },
         '2317': {
             historicalPrices: [50, 55, 52, 58, 60, 59, 62, 65, 64, 67],
             tradingRules: "買進規則範例：\n- 當股價在 50-60 區間時買入\n- 停損點：47\n- 獲利機率：70%"
         }
     };

     analyzeButton.addEventListener('click', () => {
         const selectedStock = document.getElementById('stockSelect').value;
         const holdingPeriod = holdingPeriodInput.value;
         const confidenceThreshold = confidenceThresholdInput.value;

         const stockData = mockStockData[selectedStock];

         // Display trading rules
         tradingRulesElement.innerHTML = `<pre>${stockData.tradingRules}</pre>`;

         // Create stock price chart
         new Chart(stockChart, {
             type: 'line',
             data: {
                 labels: stockData.historicalPrices.map((_, i) => `Day ${i+1}`),
                 datasets: [{
                     label: '股價走勢',
                     data: stockData.historicalPrices,
                     borderColor: 'blue',
                     backgroundColor: 'rgba(0, 0, 255, 0.1)'
                 }]
             },
             options: {
                 responsive: true,
                 plugins: {
                     title: {
                         display: true,
                         text: `${selectedStock} 股票分析`
                     }
                 }
             }
         });
     });