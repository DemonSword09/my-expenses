const { getDefaultConfig } = require('expo/metro-config');



const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push(
  // Adds support for `.onnx` files
  'onnx',
  'txt'
);

const defaultBlockList = config.resolver.blockList;
const exclusionRegExp = /\/ml_service\/.*/;

if (defaultBlockList instanceof RegExp) {
  config.resolver.blockList = new RegExp(
    "(" + defaultBlockList.source + "|" + exclusionRegExp.source + ")"
  );
} else if (Array.isArray(defaultBlockList)) {
  config.resolver.blockList = [...defaultBlockList, exclusionRegExp];
} else {
  config.resolver.blockList = exclusionRegExp;
}

module.exports = config;
