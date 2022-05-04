const names = {
  btc: 'Bitcoin',
  eth: 'Ethereum',
};
const capitalize = s => typeof s !== 'string' ? '' : s.trim().split(' ').join('_').split('-').join('_').split('_').map(x => x.trim()).filter(x => x).map(x => `${x.substr(0, 1).toUpperCase()}${x.substr(1)}`).join(' ');
module.exports.name = (s, data) => names[s] ? names[s] : data?.name && data.id === s ? data.name : s && s.length <= 3 ? s.toUpperCase() : capitalize(s);