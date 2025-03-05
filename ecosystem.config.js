import 'dotenv/config';

module.exports = {
    apps: [{
      name: "shopify-remix-app",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL,
        SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
        SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET,        
        PORT: process.env.PORT || 3000
      },
      instances: "max",
      exec_mode: "cluster"
    }]
};