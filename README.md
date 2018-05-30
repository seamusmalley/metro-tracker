# Metro Tracker on Android Things
Using React Native, a port of the master branch with the web-based metro tracker is available for Android Things.

## Building and Executing
- Install packages from package.json using `yarn`
- Load the android app into Android Studio or Intellij, and perform a Gradle Sync and build.
- Create `private` folder in root directory and add WMATA API key to `API_KEY.js`
- Plug in Android Things device
- Run `go.sh` to create the android assets file and install the app on the device

## Project breakdown
- Android Things app: the `android` folder contains the source code for the Android Things app. The app initializes the React Native root component, and contains links to the SVG graphics library.
- React Native code: All of the app's javascript is inside `index.js`. While the original app had each component as its own file, this port condenses the codebase to one file.

## Used components
- [axios](https://github.com/axios/axios)
- [react](https://reactjs.org/)
- [react-native](https://facebook.github.io/react-native/)
- [react-native-button](https://github.com/ide/react-native-button)
- [react-native-svg](https://github.com/react-native-community/react-native-svg)
- [react-native-table-component](https://github.com/Gil2015/react-native-table-component)
- [underscore](http://underscorejs.org/#)
