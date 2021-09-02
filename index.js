/**
 * @format
 */

import {AppRegistry} from 'react-native';
//import App from './App'; 
import MyApp from './src/views/App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => MyApp);