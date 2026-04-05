export const isMarketOpen = () => {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day = ist.getDay();
  const timeInMin = ist.getHours() * 60 + ist.getMinutes();
  return day >= 1 && day <= 5 && timeInMin >= 555 && timeInMin <= 930;
};

export const getISTTime = () => {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }) + ' IST';
};

export const getNextMarketOpen = () => {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day = ist.getDay();
  if (day === 0) return 'Opens Monday 9:15 AM IST';
  if (day === 6) return 'Opens Monday 9:15 AM IST';
  const timeInMin = ist.getHours() * 60 + ist.getMinutes();
  if (timeInMin < 555) return 'Opens today at 9:15 AM IST';
  if (timeInMin > 930) {
    if (day === 5) return 'Opens Monday 9:15 AM IST';
    return 'Opens tomorrow 9:15 AM IST';
  }
  return 'Market is open';
};
