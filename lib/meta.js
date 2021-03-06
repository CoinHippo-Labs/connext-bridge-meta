import _ from 'lodash';
import { name, equals_ignore_case } from './utils';

const env = {
  app_name: 'Connext',
  site_url: 'https://bridge.connext.network',
  default_title: 'Connext Bridge | Cross-Chain Transfer',
  default_description: 'Transfer token between chains using NXTP',
};

const meta = (
  path,
  data,
  chains,
  assets,
) => {
  path = !path ? '/' : path.toLowerCase();
  path = path.includes('?') ? path.substring(0, path.indexOf('?')) : path;
  const pathSplit = path.split('/').filter(x => x);

  let title = `${_.cloneDeep(pathSplit).reverse().map(x => name(x, data)).join(' - ')}${pathSplit.length > 0 ? ` | ${env.app_name}` : env.default_title}`;
  let description = env.default_description;
  const image = `${env.site_url}/images/ogimage.png`;
  const url = `${env.site_url}${path}`;
  if (path.includes('from-') && path.includes('to-')) {
    const paths = path.replace('/', '').split('-');
    const from_chain = paths[paths.indexOf('from') + 1];
    const to_chain = paths[paths.indexOf('to') + 1];
    const from_chain_name = chains?.find(c => c.id === from_chain)?.name || name(from_chain);
    const to_chain_name = chains?.find(c => c.id === to_chain)?.name || name(to_chain);
    const asset_id = paths[0] !== 'from' ? paths[0] : null;
    const asset_symbol = assets?.find(a => a.id === asset_id || a.symbol?.toLowerCase() === asset_id)?.symbol || 'tokens';
    title = `Send ${asset_symbol} ${from_chain_name ? `from ${from_chain_name} ` : ''}${to_chain_name ? `to ${to_chain_name} ` : ''}with Connext`;
    description = `The most secure ${from_chain_name} bridge to ${to_chain_name} to move tokens across blockchains in a trustless way`;
  }
  else if (path.includes('on-')) {
    const is_swap = path.includes('/swap');
    const paths = path.replace(`/${is_swap ? 'swap' : 'pool'}/`, '').split('-');
    const chain = paths[paths.indexOf('on') + 1];
    const chain_name = chains?.find(c => c.id === chain)?.name || name(chain);
    const asset_id = paths[0] !== 'on' ? paths[0] : null;
    const asset_symbol = assets?.find(a => a.id === asset_id || a.symbol?.toLowerCase() === asset_id)?.symbol || 'tokens';
    title = `${is_swap ? 'Swap' : 'Add'} ${asset_symbol}${is_swap ? '' : ' liquidity'} ${chain_name ? `on ${chain_name} ` : ''}with Connext`;
    description = `The most secure protocol to move tokens across blockchains in a trustless way`;
  }
  return {
    title,
    description,
    url,
    image,
  };
};

module.exports = {
  env,
  meta,
};