// import module for http request
const axios = require('axios');

const git_repo = 'CoinHippo-Labs/connext-bridge';
const environment = 'mainnet';

const chains = async () => {
  const res = await axios.get(`https://raw.githubusercontent.com/${git_repo}/main/config/${environment}/chains.json`);
   .catch(error => { return { data: null }; });
  return res?.data || [];
};

const assets = async () => {
  const res = await axios.get(`https://raw.githubusercontent.com/${git_repo}/main/config/${environment}/assets.json`);
   .catch(error => { return { data: null }; });
  return res?.data || [];
};

module.exports = {
  chains,
  assets,
};