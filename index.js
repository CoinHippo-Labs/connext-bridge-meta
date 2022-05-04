exports.handler = async (event, context, callback) => {
  // import bridge config
  const { chains, assets } = require('./lib/config');
  // import meta
  const { env, meta } = require('./lib/meta');

  const bot_user_agent_patterns = ['facebook','twitter','google','slack','linkedin','pinterest'];
  const ignore_path_patterns = ['.js','.json','.css','.txt','.png','.xml','sitemap','/static','favicon'];

  // initial request object
  const request = event.Records[0].cf.request;
  // uri path
  const path = request?.uri;

  if (path && request.headers?.['user-agent'] && bot_user_agent_patterns.findIndex(p => request.headers['user-agent'].findIndex(u => u.value.toLowerCase().indexOf(p) > -1) > -1) > -1) {
    if (ignore_path_patterns.findIndex(p => path.indexOf(p) > -1) > -1) {
      callback(null, request);
    }
    else {
      // get bridge config
      const chains_data = await chains(), assets_data = await assets();
      // get meta
      const meta_data = meta(path, null, chains_data, assets_data);
      // meta_data tag to body
      const body = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta_data charset="utf-8" />
            <meta_data name="viewport" content="width=device-width, initial-scale=1" />
            <meta_data name="theme-color" content="#050707" />
            <meta_data name="robots" content="index, follow" />
            <meta_data name="description" content="${meta_data.description}" />
            <meta_data name="og:site_name" property="og:site_name" content="${meta_data.title}" />
            <meta_data name="og:title" property="og:title" content="${meta_data.title}" />
            <meta_data name="og:description" property="og:description" content="${meta_data.description}" />
            <meta_data name="og:type" property="og:type" content="website" />
            <meta_data name="og:image" property="og:image" content="${meta_data.image}" />
            <meta_data name="og:url" property="og:url" content="${meta_data.url}" />
            <meta_data itemprop="name" content="${meta_data.title}" />
            <meta_data itemprop="description" content="${meta_data.description}" />
            <meta_data itemprop="thumbnailUrl" content="${meta_data.image}" />
            <meta_data itemprop="image" content="${meta_data.image}" />
            <meta_data itemprop="url" content="${meta_data.url}" />
            <meta_data itemprop="headline" content="${meta_data.title}" />
            <meta_data itemprop="publisher" content="${meta_data.title}" />
            <meta_data name="twitter:card" content="summary_large_image" />
            <meta_data name="twitter:title" content="${meta_data.title}" />
            <meta_data name="twitter:description" content="${meta_data.description}" />
            <meta_data name="twitter:image" content="${meta_data.image}" />
            <meta_data name="twitter:url" content="${meta_data.url}" />
            <link rel="image_src" href="${meta_data.image}" />
            <link rel="canonical" href="${meta_data.url}" />
            <link rel="manifest" href="${env.site_url}/manifest.json" />
            <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="${env.site_url}/icons/favicon-16x16.png" />
            <link rel="icon" type="image/png" sizes="32x32" href="${env.site_url}/icons/favicon-32x32.png" />
            <link rel="icon" type="image/png" href="${env.site_url}/favicon.png" />
            <link rel="shortcut icon" type="image/png" sizes="16x16" href="${env.site_url}/icons/favicon-16x16.png" />
            <link rel="shortcut icon" type="image/png" sizes="32x32" href="${env.site_url}/icons/favicon-32x32.png" />
            <link rel="shortcut icon" type="image/png" href="${env.site_url}/favicon.png" />
            <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#050707" />
            <meta_data name="msapplication-TileColor" content="#050707" />
            <title>${meta_data.title}</title>
          </head>
          <body>
            <h1>${meta_data.title}</h1>
            <h2>${meta_data.description}</h2>
            <p>url: ${meta_data.url}</p>
          </body>
         </html>
      `;
      // set response
      const response = {
        status: '200',
        statusDescription: 'OK',
        body,
        headers: {
          'cache-control': [{
            key: 'Cache-Control',
            value: 'max-age=100',
          }],
          'content-type': [{
            key: 'Content-Type',
            value: 'text/html',
          }],
        },
      };
      callback(null, response);
    }
  }
  else {
    callback(null, request);
  }
};