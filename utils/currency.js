
const VND_TO_USD_RATE = 0.000041; 

/**
 * 
 * @param {number} vndAmount 
 * @returns {number}
 */
const convertVNDtoUSD = (vndAmount) => {
  if (!vndAmount || vndAmount <= 0) return 0;

  const usdAmount = vndAmount * VND_TO_USD_RATE;
  return Math.round(usdAmount * 100) / 100; 
};

/**
 * 
 * @param {number} usdAmount 
 * @returns {number} 
 */
const convertUSDtoVND = (usdAmount) => {
  if (!usdAmount || usdAmount <= 0) return 0;

  const vndAmount = usdAmount / VND_TO_USD_RATE;
  return Math.round(vndAmount); 
};

/**
 * 
 * @returns {number} 
 */
const getExchangeRate = () => {
  return VND_TO_USD_RATE;
};

export { convertVNDtoUSD, convertUSDtoVND, getExchangeRate };