const { withMainApplication } = require('expo/config-plugins');

/**
 * Expo config plugin that injects OnnxruntimePackage() into MainApplication.kt.
 *
 * When EAS runs `expo prebuild`, it regenerates MainApplication.kt from scratch.
 * onnxruntime-react-native does not autolink properly, so we need to manually
 * add its package registration. This plugin does that automatically.
 */
function withOnnxruntime(config) {
  return withMainApplication(config, (config) => {
    let contents = config.modResults.contents;

    const importLine = 'import ai.onnxruntime.reactnative.OnnxruntimePackage';
    const addPackageLine = 'add(OnnxruntimePackage())';

    // 1. Add the import if not already present
    if (!contents.includes(importLine)) {
      // Insert after the last existing import
      const lastImportIndex = contents.lastIndexOf('import ');
      const endOfLastImport = contents.indexOf('\n', lastImportIndex);
      contents =
        contents.slice(0, endOfLastImport + 1) +
        importLine + '\n' +
        contents.slice(endOfLastImport + 1);
    }

    // 2. Add OnnxruntimePackage() to the packages list if not already present
    if (!contents.includes(addPackageLine)) {
      // Find the apply block inside getPackages()
      const applyIndex = contents.indexOf('.apply {');
      if (applyIndex !== -1) {
        const insertPoint = contents.indexOf('\n', applyIndex);
        contents =
          contents.slice(0, insertPoint + 1) +
          '              ' + addPackageLine + '\n' +
          contents.slice(insertPoint + 1);
      }
    }

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withOnnxruntime;
