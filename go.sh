#!/bin/sh

echo "Bundling..."
react-native bundle --platform android --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

echo "Launching and Installing..."
react-native run-android
