const fs = require('fs');
const path = require('path');

const modules = {};

// Read all files in the current directory
fs.readdirSync(__dirname)
  .filter(file => {
    // Get only .js files, but exclude this index.js file
    return (file.indexOf('.') !== 0) && (file !== 'index.js') && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    // Get the filename without the .js extension to use as the key
    const moduleName = path.basename(file, '.js');
    // Require the file and add it to the modules object
    modules[moduleName] = require(path.join(__dirname, file));
  });

// Export the populated modules object
module.exports = modules;