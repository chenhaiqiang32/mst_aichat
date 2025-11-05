const { override } = require('customize-cra');

module.exports = override(
  // Exclude @fortaine/fetch-event-source from source map processing
  // This prevents errors when source maps reference non-existent source files
  (config) => {
    // Find and modify source-map-loader rules to exclude the problematic package
    if (config.module && config.module.rules) {
      config.module.rules.forEach(rule => {
        if (rule && rule.use) {
          const uses = Array.isArray(rule.use) ? rule.use : [rule.use];
          uses.forEach(use => {
            const loader = typeof use === 'string' ? use : (use.loader || '');
            if (loader.includes('source-map-loader')) {
              // Exclude the problematic package from source map processing
              const excludePattern = /node_modules\/@fortaine\/fetch-event-source/;
              if (!rule.exclude) {
                rule.exclude = excludePattern;
              } else if (Array.isArray(rule.exclude)) {
                if (!rule.exclude.some(ex => String(ex) === String(excludePattern))) {
                  rule.exclude.push(excludePattern);
                }
              } else if (String(rule.exclude) !== String(excludePattern)) {
                rule.exclude = [rule.exclude, excludePattern];
              }
            }
          });
        }
      });
    }
    
    // Also configure webpack to ignore source map errors
    if (config.ignoreWarnings) {
      config.ignoreWarnings = [].concat(config.ignoreWarnings || []);
    } else {
      config.ignoreWarnings = [];
    }
    
    // Ignore warnings about missing source files in source maps
    config.ignoreWarnings.push({
      module: /node_modules\/@fortaine\/fetch-event-source/,
    });
    
    return config;
  }
);

