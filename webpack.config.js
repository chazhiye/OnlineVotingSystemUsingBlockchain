const path = require('path');

module.exports = {
  mode: 'development', // Set mode to 'development' or 'production'
  entry: './src/js/login.js', // Entry point of your application

  output: {
    path: path.resolve(__dirname, 'dist'), // Output directory
    filename: 'bundle.js' // Output bundle file name
  },
  resolve: {
    fallback: {
      "path": false
    }
  }
};
