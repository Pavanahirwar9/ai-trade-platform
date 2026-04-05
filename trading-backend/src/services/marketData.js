/**
 * @module services/marketData
 * @description Fetches live quotes and historical OHLCV data from Angel One SmartAPI
 * for NSE-listed stocks. 
 */

const axios = require('axios');
const speakeasy = require('speakeasy');
const config = require('../config/config');
const { logger } = require('../middleware/logger');

const ANGEL_API_KEY = process.env.ANGEL_API_KEY || '';
const ANGEL_CLIENT_CODE = process.env.ANGEL_CLIENT_CODE || '';
const ANGEL_PASSWORD = process.env.ANGEL_PASSWORD || '';
const ANGEL_TOTP_SECRET = process.env.ANGEL_TOTP_SECRET || '';

let jwtToken = null;
let feedToken = null;

/** Authenticates and sets JWT Token */
const loginToAngel = async () => {
  if (!ANGEL_API_KEY || !ANGEL_CLIENT_CODE || !ANGEL_PASSWORD || !ANGEL_TOTP_SECRET) {
    throw new Error('Angel One credentials are missing in .env (ANGEL_API_KEY, ANGEL_CLIENT_CODE, ANGEL_PASSWORD, ANGEL_TOTP_SECRET)');
  }

  try {
    const totp = speakeasy.totp({
      secret: ANGEL_TOTP_SECRET,
      encoding: 'base32'
    });
    const res = await axios.post('https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByPassword', {
      clientcode: ANGEL_CLIENT_CODE,
      password: ANGEL_PASSWORD,
      totp: totp
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': '192.168.1.1',
        'X-ClientPublicIP': '106.193.147.98',
        'X-MACAddress': 'fe-80-00-00-00-00-00-00-02-1a-2b-3c-4d-5e',
        'X-PrivateKey': ANGEL_API_KEY
      }
    });

    if (res.data && res.data.status && res.data.data) {
      jwtToken = res.data.data.jwtToken;
      feedToken = res.data.data.feedToken;
      logger.info('Successfully logged into Angel One API');
    } else {
      throw new Error(res.data.message || 'Login failed');
    }
  } catch (error) {
    const errorDetails = error.response && error.response.data ? error.response.data.message : error.message;
    logger.error(`Failed to login to Angel One: ${errorDetails}`);
    throw new Error(`Angel One Login Failed: ${errorDetails}`);
  }
};

/** Ensure user is logged in before calling any API */
const verifyToken = async () => {
  if (!jwtToken) {
    await loginToAngel();
  }
};

/** Get live LTP for an NSE Symbol (Note: Angel expects '3045' token id instead of 'RELIANCE.NS', but using generic string here) */
const getLiveQuote = async (symbol) => {
  await verifyToken();
  const token = getAngelTokenMap(symbol);

  try {
    const res = await axios.post('https://apiconnect.angelbroking.com/rest/secure/angelbroking/order/v1/getLtpData', {
      exchange: 'NSE',
      tradingsymbol: token.angelSymbol,
      symboltoken: token.angelToken
    }, {
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': '192.168.1.1',
        'X-ClientPublicIP': '106.193.147.98',
        'X-MACAddress': 'fe-80-00-00-00-00-00-00-02-1a-2b-3c-4d-5e',
        'X-PrivateKey': ANGEL_API_KEY
      }
    });

    if (res.data && res.data.status) {
      const data = res.data.data;
      return {
        symbol: symbol,
        name: data.tradingsymbol,
        price: parseFloat(data.ltp),
        change: 0, // Angel LTP returns just LTP
        changePercent: 0,
        dayHigh: parseFloat(data.high || data.ltp),
        dayLow: parseFloat(data.low || data.ltp),
        open: parseFloat(data.open || data.ltp),
        previousClose: parseFloat(data.close || data.ltp),
        volume: 0,
        exchange: 'NSE',
        marketState: 'REGULAR',
        timestamp: new Date().toISOString()
      };
    }
    throw new Error(res.data.message || 'LTP fetch failed');
  } catch (err) {
    logger.error(`Angel API: Failed to get live quote for ${symbol}: ${err.message}`);
    throw err;
  }
};

/** Get Historical OHLCV data */
const getHistoricalData = async (symbol, period) => {
  await verifyToken();
  const token = getAngelTokenMap(symbol);

  const fromdate = new Date();
  // Fetch at least 14 months to ensure ~280 trading days for the SMA-200. 
  fromdate.setMonth(fromdate.getMonth() - (parseInt(period) || 14));
  const todate = new Date();

  // Angel Format 'yyyy-mm-dd HH:MM'
  const formatAngelDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} 09:15`;

  try {
    const res = await axios.post('https://apiconnect.angelbroking.com/rest/secure/angelbroking/historical/v1/getCandleData', {
      exchange: 'NSE',
      symboltoken: token.angelToken,
      interval: 'ONE_DAY',
      fromdate: formatAngelDate(fromdate),
      todate: formatAngelDate(todate)
    }, {
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': '192.168.1.1',
        'X-ClientPublicIP': '106.193.147.98',
        'X-MACAddress': 'fe-80-00-00-00-00-00-00-02-1a-2b-3c-4d-5e',
        'X-PrivateKey': ANGEL_API_KEY
      }
    });

    if (res.data && res.data.status && res.data.data) {
      // response format: [ [time, open, high, low, close, volume], ... ]
      return res.data.data.map(q => ({
        date: q[0].split('T')[0],
        open: parseFloat(q[1]),
        high: parseFloat(q[2]),
        low: parseFloat(q[3]),
        close: parseFloat(q[4]),
        volume: parseInt(q[5])
      })).sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    throw new Error(res.data.message || 'History fetch failed');
  } catch (err) {
    logger.error(`Angel API: Failed history fetch for ${symbol}: ${err.message}`);
    throw err;
  }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getMultipleQuotes = async (symbols) => {
  const results = [];
  for (const s of symbols) {
    try {
      const data = await getLiveQuote(s);
      results.push({ success: true, data });
    } catch (err) {
      results.push({ success: false, symbol: s, error: err.message });
    }
    // Respect API rate limits (Delay 500ms between calls)
    await sleep(500);
  }
  return results;
};

/** Helper map for typical top NSE stocks -> Angel Tokens */
const getAngelTokenMap = (symbol) => {
  const tokens = {
    'RELIANCE.NS': { angelSymbol: 'RELIANCE-EQ', angelToken: '2885' },
    'TCS.NS': { angelSymbol: 'TCS-EQ', angelToken: '11536' },
    'INFY.NS': { angelSymbol: 'INFY-EQ', angelToken: '1594' },
    'HDFCBANK.NS': { angelSymbol: 'HDFCBANK-EQ', angelToken: '1333' },
    'SBIN.NS': { angelSymbol: 'SBIN-EQ', angelToken: '3045' },
    'WIPRO.NS': { angelSymbol: 'WIPRO-EQ', angelToken: '3787' },
    'TATAMOTORS.NS': { angelSymbol: 'TATAMOTORS-EQ', angelToken: '3456' },
    'ICICIBANK.NS': { angelSymbol: 'ICICIBANK-EQ', angelToken: '4963' }
  };
  if (!tokens[symbol]) throw new Error(`Symbol ${symbol} not in hardcoded Angel Token map.`);
  return tokens[symbol];
};

module.exports = { getLiveQuote, getHistoricalData, getMultipleQuotes };
