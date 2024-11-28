// script.js

const axios = require('axios');

class TWStockCrawler {
    constructor() {
        this.TWSE_URL = 'https://www.twse.com.tw/exchangeReport/STOCK_DAY';
        this.TWSE_OPENAPI_URL = 'https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL';
        this.TWSE_INSTITUTIONAL_URL = 'https://www.twse.com.tw/exchangeReport/BFIAUU';
        this.TWSE_REALTIME_URL = 'https://mis.twse.com.tw/stock/api/getStockInfo.jsp';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7'
        };
    }

    async getHistoricalData(stockId, date) {
        const url = `${this.TWSE_URL}?response=json&date=${date}&stockNo=${stockId}`;
        try {
            const response = await axios.get(url, { headers: this.headers });
            const data = response.data;
            if (data.data) {
                return data.data.map(row => ({
                    date: row,
                    volume: parseInt(row[1].replace(/,/g, '')),
                    value: parseInt(row[2].replace(/,/g, '')),
                    open: parseFloat(row[3]),
                    high: parseFloat(row[4]),
                    low: parseFloat(row[5]),
                    close: parseFloat(row),
                    change: parseFloat(row),
                    transactions: parseInt(row.replace(/,/g, ''))
                }));
            } else {
                return [];
            }
        } catch (error) {
            console.error(`Failed to fetch historical data for ${stockId}:`, error);
            return [];
        }
    }

    async getRealTimeQuote(stockId) {
        const exCh = `tse_${stockId}.tw`;
        const url = `${this.TWSE_REALTIME_URL}?ex_ch=${exCh}&_=${new Date().getTime()}`;
        try {
            const response = await axios.get(url, { headers: this.headers });
            const data = response.data;
            if (data.msgArray && data.msgArray.length > 0) {
                const stockInfo = data.msgArray;
                return {
                    stockId: stockInfo.c,
                    name: stockInfo.n,
                    time: stockInfo.t,
                    price: parseFloat(stockInfo.z),
                    change: parseFloat(stockInfo.v),
                    changePercent: parseFloat(stockInfo.w),
                    volume: parseInt(stockInfo.tv),
                    best5Asks: this.parseBest5(stockInfo.a, stockInfo.f),
                    best5Bids: this.parseBest5(stockInfo.b, stockInfo.g)
                };
            } else {
                return null;
            }
        } catch (error) {
            console.error(`Failed to fetch real-time quote for ${stockId}:`, error);
            return null;
        }
    }

    async getInstitutionalTrades(stockId, date) {
        const url = `${this.TWSE_INSTITUTIONAL_URL}?response=json&date=${date}&stockNo=${stockId}`;
        try {
            const response = await axios.get(url, { headers: this.headers });
            const data = response.data;
            if (data.data) {
                return {
                    foreignInvestors: parseInt(data.data[4].replace(/,/g, '')),
                    investmentTrusts: parseInt(data.data[5].replace(/,/g, '')),
                    dealers: parseInt(data.data.replace(/,/g, ''))
                };
            } else {
                return null;
            }
        } catch (error) {
            console.error(`Failed to fetch institutional trades for ${stockId}:`, error);
            return null;
        }
    }

    parseBest5(prices, volumes) {
        if (!prices || !volumes) return [];
        const priceArr = prices.split('_');
        const volumeArr = volumes.split('_');
        return priceArr.map((price, index) => ({
            price: parseFloat(price),
            volume: parseInt(volumeArr[index])
        })).filter(item => !isNaN(item.price) && !isNaN(item.volume));
    }
}

// Function to draw the stock chart
async function drawStockChart(stockId, historicalData) {
    anychart.onDocumentReady(function() {
        // Create a stock chart
        let chart = anychart.stock();

        // Create a data table
        let dataTable = anychart.data.table();
        dataTable.addData(historicalData);

        // Map the data
        let mapping = dataTable.mapAs({ date: 0, value: 6 });

        // Create a plot
        let plot = chart.plot(0);
        let series = plot.line(mapping).name(stockId);

        // Set the title
        chart.title(`Stock Chart for ${stockId}`);

        // Add a scroller
        chart.scroller().line(mapping);

        // Draw the chart
        chart.container('container').draw();
    });
}

// Main function to initialize and fetch data
async function main() {
    const crawler = new TWStockCrawler();
    const stockId = '2330';
    const date = '20231001';

    try {
        // Fetch historical data
        const historicalData = await crawler.getHistoricalData(stockId, date);
        if (!historicalData) {
            alert('Failed to fetch historical data');
            return;
        }

        // Draw the stock chart
        drawStockChart(stockId, historicalData);

        // Fetch real-time quote
        const realTimeQuote = await crawler.getRealTimeQuote(stockId);
        console.log('Real-Time Quote:', realTimeQuote);

        // Fetch institutional trades
        const institutionalTrades = await crawler.getInstitutionalTrades(stockId, date);
        console.log('Institutional Trades:', institutionalTrades);
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('Error fetching data');
    }
}

// Initialize the application
main();