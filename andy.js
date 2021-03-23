// Android Builder v2.0 - simple Android build system

// INFO
// https://authmane512.medium.com/how-to-build-an-apk-from-command-line-without-ide-7260e1e22676

// Ensure the following variables meet your needs
const ANDROID_SDK_PATH = process.env.ANDROID_SDK_ROOT;
const BUILD_TOOLS_VERSION = '28.0.3'
const PLATFORM_VERSION = '28'
const MINIMUM_SDK_VERSION = '10'


const fs = require('fs')
const path = require('path')
const execSync = require('child_process').execSync;

const Print = console.log

const isWindows = process.platform === 'win32'

// generated folders and files
const BUILD_FOLDER = 'build'
// const SETTINGS_FILE = 'andy.json'

// external commands

const JAVAC_PRG = 'javac' // assumes you have JAVA_HOME variable set and java is in your path
const JAVA_KEYTOOL_PRG = 'keytool' // assumes you have JAVA_HOME variable set and java is in your path

const AIDL_PRG = ANDROID_SDK_PATH + '/build-tools/' + BUILD_TOOLS_VERSION + '/aidl'
const AAPT_PRG = ANDROID_SDK_PATH + '/build-tools/' + BUILD_TOOLS_VERSION + '/aapt'
const DX_PRG = ANDROID_SDK_PATH + '/build-tools/' + BUILD_TOOLS_VERSION + '/d8' + (isWindows ? '.bat' : '')
const ZIPALIGN_PRG = ANDROID_SDK_PATH + '/build-tools/' + BUILD_TOOLS_VERSION + '/zipalign'
const APKSIGNER_PRG = ANDROID_SDK_PATH + '/build-tools/' + BUILD_TOOLS_VERSION + '/apksigner'
const BUILD_TOOLS_PATH = ANDROID_SDK_PATH + '/build-tools/' + BUILD_TOOLS_VERSION
const PLATFORM_PATH = ANDROID_SDK_PATH + '/platforms/android-' + PLATFORM_VERSION
const PLATFORM_LIB = PLATFORM_PATH + '/android.jar'

const ANDROID_SUPPORT_DESIGN_LIB = ANDROID_SDK_PATH + '/extras/support/design/libs/android-support-design.jar'
const ANDROID_SUPPORT_LIB_V4 = ANDROID_SDK_PATH + '/extras/support/v7/appcompat/libs/android-support-v4.jar'
const ANDROID_SUPPORT_LIB_V7 = ANDROID_SDK_PATH + '/extras/support/v7/appcompat/libs/android-support-v7-appcompat.jar'
const ANDROID_SUPPORT_LIB_V7_RECYCLER = ANDROID_SDK_PATH + '/extras/support/v7/recyclerview/libs/android-support-v7-recyclerview.jar'
const ANDROID_SUPPORT_LIB_V13 = ANDROID_SDK_PATH + '/extras/support/v13/android-support-v13.jar'

// command options
const MANIFEST_FILE = '/AndroidManifest.xml'
const DEBUG_KEYSTOREFILE = __dirname + '/andy-debug.jks'

const KEYGEN_DEBUG_OPTIONS = ' -genkey -noprompt -v -keystore ' + DEBUG_KEYSTOREFILE + ' -storepass android ' +
  ' -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000' +
  ' -dname "CN=Android Debug,O=Android,C=US"'

const AAPT_GEN_SUPPORTLIB = '-I ' + ANDROID_SUPPORT_LIB_V13 +
  ' -I ' + ANDROID_SUPPORT_DESIGN_LIB +
  ' -I ' + ANDROID_SUPPORT_LIB_V7 +
  ' -I ' + ANDROID_SUPPORT_LIB_V7_RECYCLER;

const AAPT_GEN_R_OPTIONS =
  ' package -f -m -J $PROJ/src -M $PROJ/AndroidManifest.xml -S $PROJ/res -I $PLATFORM_LIB $SUPPORT_LIB'

const AIDL_OPTIONS = ' -p$PLATFORM_PATH/framework.aidl -o$PROJ/' + BUILD_FOLDER + '/aidl $AIDL_FILES';

const JAVAC_SUPPORTLIB = ' -cp ' + ANDROID_SUPPORT_LIB_V4 +
  ' -cp ' + ANDROID_SUPPORT_DESIGN_LIB +
  ' -cp ' + ANDROID_SUPPORT_LIB_V7_RECYCLER +
  ' -cp ' + ANDROID_SUPPORT_LIB_V7 +
  ' -cp ' + ANDROID_SUPPORT_LIB_V13;

const JAVAC_OPTIONS = (
  ' -d $PROJ/' + BUILD_FOLDER + 
  (isWindows ? ' -bootclasspath $PLATFORM_LIB -cp src/* -cp $PLATFORM_PATH/* -cp $BUILD_TOOLS_PATH/*' : 
    ' -classpath $PLATFORM_LIB:src/*:$PLATFORM_PATH/*:$BUILD_TOOLS_PATH/*') +
  '$SUPPORT_LIB' +
  ' -source 1.8 -target 1.8') // $SOURCE_JAVA
  .replace(/\$PLATFORM_PATH/g, PLATFORM_PATH)
  .replace(/\$BUILD_TOOLS_PATH/g, BUILD_TOOLS_PATH)
  .replace(/\$PROJ/g, '.')
  .replace('$PLATFORM_LIB', PLATFORM_LIB)

const DX_OPTIONS = (' --min-api ' + MINIMUM_SDK_VERSION + ' --lib $PLATFORM_LIB' +
  //  ' $SUPPORT_LIB' +
  ' --output $PROJ/' + BUILD_FOLDER + '/ ')
  .replace('$PLATFORM_LIB', PLATFORM_LIB)

const AAPT_GEN_APK_OPTIONS1 =
  ' package -f -m -F $PROJ/' + BUILD_FOLDER +
  '/unaligned.apk -M $PROJ/AndroidManifest.xml -S $PROJ/res -I $PLATFORM_LIB'

const AAPT_GEN_APK_OPTIONS2 = ' add unaligned.apk classes.dex'

const APKSIGNER_OPTIONS = ' sign --ks $KS_FILE --ks-pass $KS_PASS $TARGET_FILE'
const ZIPALIGN_OPTIONS = ' -f 4 $UNALIGNED_APK $ALIGNED_APK'

const PROJECT_FOLDERS = [
  '/' + BUILD_FOLDER,
  '/src',
  '/res',
  '/res/drawable',
  '/res/layout',
  '/res/values',
]

/* beautify ignore:start */
function MAIN_ACTIVITY_FILE() {/*
package com.example.appy;

import com.example.appy.R;
import android.app.Activity;
import android.os.Bundle;

public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
      super.onCreate(savedInstanceState);
      setContentView(R.layout.activity_main);
    }
}
*/}

function STRINGS_XML_FILE() {/*
<resources>
   <string name="app_name">A Hello Android</string>
   <string name="hello_msg">Hello Android!</string>
   <string name="menu_settings">Settings</string>
   <string name="title_activity_main">MainActivity</string>
</resources>
*/}

function ACTIVITY_MAIN_XML() {/*
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools"
   android:layout_width="match_parent"
   android:layout_height="match_parent" >
   
   <TextView
      android:layout_width="wrap_content"
      android:layout_height="wrap_content"
      android:layout_centerHorizontal="true"
      android:layout_centerVertical="true"
      android:text="@string/hello_msg"
      tools:context=".MainActivity" />
</RelativeLayout>
*/}

function ANDROID_MANIFEST_XML() {/*
<?xml version="1.0"?>
<manifest xmlns:a="http://schemas.android.com/apk/res/android" package="com.example.appy" a:versionCode="0" a:versionName="0">
    <application a:label="A Hello Android">
        <activity a:name="com.example.appy.MainActivity">
             <intent-filter>
                <category a:name="android.intent.category.LAUNCHER"/>
                <action a:name="android.intent.action.MAIN"/>
             </intent-filter>
        </activity>
    </application>
</manifest>
*/}
/* beautify ignore:end */

function getText(functionName) {
  const text = functionName.toString()
  const start = text.indexOf('{/*')
  return text.slice(start + 5, -3)
}

function getJavaSourceFolder(options) {
  // relative to project root
  const appPackageName = options.appPackageName
  return '/src/' + appPackageName.replace(/\./g, '/')
}

function showRun(execSync, cmd) {
  Print('==> ' + cmd + '\n=')
  const result = execSync(cmd).toString();
  if (result) Print(result)
  return result;
}

// ***START CREATE FUNCTIONS
function MakeFullPath(fs, targetDir) {
  var folders = targetDir.split('/');
  var currentPath = '',
    createPath = '';
  for (var i = 0; i < folders.length; i++) {
    currentPath = folders[i] === '' ? '/' : (currentPath + '/' + folders[i]);
    createPath = currentPath.slice(1);
    if (createPath && !fs.existsSync(createPath)) fs.mkdirSync(createPath);
  }
}

function createFolders(fs, options, PROJECT_FOLDERS) {
  const appName = options.appName

  fs.mkdirSync(appName)

  PROJECT_FOLDERS.forEach(function (folder) {
    fs.mkdirSync(appName + folder)
  })

  MakeFullPath(fs, appName + getJavaSourceFolder(options))
}

function writeFile(fs, fileName, fileContent) {
  var fdOut = fs.openSync(fileName, 'w');
  fs.writeSync(fdOut, fileContent);
  fs.closeSync(fdOut);
}

function readFile(fs, fileName) {
  if (!fs.existsSync(fileName)) return null

  return fs.readFileSync(fileName, 'utf-8');
}

function createFiles(fs, options) {
  const appName = options.appName
  const appPackageName = options.appPackageName
  const sourceJavaPath = appName + getJavaSourceFolder(options)

  const stringsXmlFile = getText(STRINGS_XML_FILE)
  const activityMainXmlFile = getText(ACTIVITY_MAIN_XML)
  const androidManifestFile = getText(ANDROID_MANIFEST_XML)
    .replace(/com.example.appy/g, appPackageName)
  const mainActivityFile = getText(MAIN_ACTIVITY_FILE)
    .replace(/com.example.appy/g, appPackageName)

  writeFile(fs, appName + '/res/values/strings.xml', stringsXmlFile)
  writeFile(fs, appName + '/res/layout/activity_main.xml', activityMainXmlFile)
  writeFile(fs, appName + '/AndroidManifest.xml', androidManifestFile)
  writeFile(fs, sourceJavaPath + '/MainActivity.java', mainActivityFile)
}

function saveOptions(fs, options) {
  const appName = options.appName

  const saveOptions = {
    appName: appName,
    appPackageName: options.appPackageName,
    appVersion: '1.0',
  }

  writeFile(fs, appName + '/' + SETTINGS_FILE, JSON.stringify(saveOptions, null, 2))
}

function createDebugKeyStore(fs, execSync, options) {
  if (fs.existsSync(DEBUG_KEYSTOREFILE)) return true

  const appName = options.appName
  const cmd = JAVA_KEYTOOL_PRG + KEYGEN_DEBUG_OPTIONS.replace(/\$PROJ/g, appName)
  return showRun(execSync, cmd)
}
// ***END CREATE FUNCTIONS

// ***START COMPILE FUNCTIONS

function generateRJava(execSync, options) {
  const appName = options.appName
  const appPackageName = options.appPackageName

  const aapt_options = AAPT_GEN_R_OPTIONS
    .replace(/\$PROJ/g, '.')
    .replace('$PLATFORM_LIB', PLATFORM_LIB)
    .replace('$SUPPORT_LIB', options.supportLib ? AAPT_GEN_SUPPORTLIB : '')
  const cmd = AAPT_PRG + aapt_options

  return showRun(execSync, cmd)
}

function compileAidl(execSync, options, aidlFileName) {
  const aidl_options = AIDL_OPTIONS
    .replace(/\$PROJ/g, '.')
    .replace('$PLATFORM_PATH', PLATFORM_PATH)
    .replace('$AIDL_FILES', aidlFileName)

  const cmd = AIDL_PRG + aidl_options
  return showRun(execSync, cmd)
}

function generateAidl(fs, execSync, options) {
  const appPackageName = options.appPackageName
  const aidlFolder = './aidl/' + appPackageName.replace(/\./g, '/')

  const aidlFile = fs.existsSync(aidlFolder) ? fs.readdirSync(aidlFolder) : [];

  aidlFile.forEach(function (file) {
    if (file.slice(-5) === '.aidl') {
      compileAidl(execSync, options, aidlFolder + '/' + file)
    }
  })
}


function directoryList(path, ext, files) {
  // get files in folder
  let filelist = files || [];

  // get folders
  fs.readdirSync(path, { withFileTypes: true }).forEach(function (item) {
    const name = item.name
    if (item.isDirectory()) {
      const folderFiles = directoryList(`${path}/${name}`, ext, filelist)
      if (folderFiles && folderFiles.length > 0) filelist.concat(folderFiles);
    } else {
      if (name.indexOf(ext) > 0) filelist.push(`${path}/${name}`);
    }
  });

  return filelist
}


function compileFile(execSync, options, fileName) {
  const javac_option_common = JAVAC_OPTIONS.replace('$SUPPORT_LIB', options.supportLib ? JAVAC_SUPPORTLIB : '')
  const javac_option1 = javac_option_common + ' -sourcepath ./src $SOURCE_JAVA'.replace('$SOURCE_JAVA', fileName);
  const cmd = JAVAC_PRG + javac_option1

  return showRun(execSync, cmd)
}


function compileSource(fs, execSync, options) {
  const appPackageName = options.appPackageName
  const sourceJavaPath = '.' + getJavaSourceFolder(options)
  const aidlJavaFolder = './' + BUILD_FOLDER + '/aidl/' + appPackageName.replace(/\./g, '/')

  let sourceFiles = sourceJavaPath + '/*.java'
  sourceFiles += fs.existsSync(aidlJavaFolder) ? ' ' + aidlJavaFolder + '/*.java ' : ''

  compileFile(execSync, options, sourceFiles)

  showRun(execSync, 'jar -cvf ./' + BUILD_FOLDER + '/classes.jar ./' + BUILD_FOLDER)
}

function javaToDalvikByteCode(execSync, options) {
  let dx_options = DX_OPTIONS.replace(/\$PROJ/g, '.')
    .replace('$SUPPORT_LIB', options.supportLib ? ' ' + ANDROID_SUPPORT_LIB_V13 : '');

  dx_options += ' ./' + BUILD_FOLDER + '/classes.jar'
  const cmd = DX_PRG + dx_options
  showRun(execSync, cmd)
}

function buildApk(execSync, options) {
  const aapt_options1 = AAPT_GEN_APK_OPTIONS1.replace(/\$PROJ/g, '.')
    .replace('$PLATFORM_LIB', PLATFORM_LIB)
  const cmd1 = AAPT_PRG + aapt_options1

  var result = showRun(execSync, cmd1)

  // AAPT tool is sensitve to relative paths so move into build folder before running aapt add command
  process.chdir('./' + BUILD_FOLDER)
  const aapt_options2 = AAPT_GEN_APK_OPTIONS2.replace(/\$PROJ/g, '.')
  const cmd2 = AAPT_PRG + aapt_options2
  result = showRun(execSync, cmd2)
  process.chdir('../')
  return result
}

function signAndAlign(execSync, options) {
  const appName = options.appName
  const finalApk = './' + BUILD_FOLDER + '/' + appName + '-debug.apk'

  // zip align final apk file
  const zipalign_options = ZIPALIGN_OPTIONS
    .replace('$UNALIGNED_APK', './' + BUILD_FOLDER + '/unaligned.apk')
    .replace('$ALIGNED_APK', finalApk)

  const cmd2 = ZIPALIGN_PRG + zipalign_options
  showRun(execSync, cmd2)

  // sign apk
  const apksigner_options = APKSIGNER_OPTIONS.replace(/\$PROJ/g, '.')
    .replace('$KS_FILE', DEBUG_KEYSTOREFILE)
    .replace('$KS_PASS', 'pass:android')
    .replace('$TARGET_FILE', finalApk)

  const cmd = APKSIGNER_PRG + apksigner_options
  return showRun(execSync, cmd)
}
// ***END COMPILE FUNCTIONS

function errorInvalidOption(option) {
  Print('Invalid option: ', option)
  process.exit(1);
}

function isInvalidAppName(appName) {
  if (appName.indexOf(' ') >= 0) return true
  return !appName.match(/^[a-z][a-z0-9]+$/i)
}

function showHelp(isFullHelp) {
  var msg = 'andy (c)2019 v1.0 - simplified Android build system'
  if (isFullHelp) msg += ('\n\nUsage: andy.js <commands> <options>' +
    '\nWhere <command>:' +
    '\n  create            create new project' +
    '\n  compile           compile project' +
    '\n  clean             clear build folder' +
    '\n  help              show help screen' +
    '\n  version           show version only' +
    '\nWhere create <options> are:' +
    '\n  -n=AppName        set AppName. Where AppName is an alphanumeric string' +
    '\n                    that can not contain spaces or start with a number' +
    '\n  -p=com.eg.AppName set package name.  Generally a reverse DNS' +
    '\nWhere compile <options> are:' +
    '\n  -c                clear build folder before compiling' +
    '\n  -s                include support libraries when compiling app'
  )

  Print(msg);

  process.exit(0);
}

function getPackageNameFromManifest() {
  const manifestText = readFile(fs, '.' + MANIFEST_FILE)
  const flattened = manifestText.replace(/(\r\n|\n)/g, " ")

  const search = flattened.match(/<manifest (.*)package="([^"]*)"/i);
  if (search) return search[2];

  Print(flattened)
  Print('Error could not determine package name from .' + MANIFEST_FILE)
  process.exit(1)
  return ''
}

function getCompileOptions(fs, path) {
  const userOptions = {}
  userOptions.appName = path.basename(process.cwd())
  userOptions.appPackageName = getPackageNameFromManifest()

  return userOptions
}

function processOptions(fs, path) {
  var userOptions = {
    command: '',
    appName: '',
    appPackageName: 'com.example.app',
  }
  const optsLength = process.argv.length;

  if (optsLength < 3) showHelp(true);
  const command = process.argv[2]

  switch (command) {
    case 'create':
      break;
    case 'compile':
      userOptions = getCompileOptions(fs, path)
      if (optsLength === 4) userOptions.addSupportLib = process.argv[3] === 'support';
      break;
    case 'clean':
      break;
    case 'help':
      showHelp(true);
      break;
    case 'version':
      showHelp(false);
      break;
    case 'test':
      userOptions = getCompileOptions(fs, path)
      break;
    default:
      errorInvalidOption('command ' + command + ' is unknown')
  }

  userOptions.command = command;

  process.argv.forEach(function (opt, index) {
    if (index < 3) return;

    const optLength = opt.length
    if (optLength >= 2 && opt.slice(0, 1) === '-') {
      // simple options without parameters
      if (optLength === 2) {
        switch (opt) {
          case '-s':
            userOptions.supportLib = true;
            break;
          case '-c':
            userOptions.cleanBuild = true;
            break;
          case '-z':
          default:
            errorInvalidOption(opt);
        }
      } else if (optLength >= 4 && opt.slice(2, 3) === '=') {
        const optValue = opt.slice(3)
        const optKey = opt.slice(0, 2)
        switch (optKey) {
          case '-p':
            userOptions.appPackageName = optValue
            break;
          case '-n':
            userOptions.appName = optValue
            break;
          default:
            errorInvalidOption(opt)
        }
      } else errorInvalidOption(opt)

    } else errorInvalidOption(opt)

  })

  if (userOptions.command === 'create' &&
    (!userOptions.appName || isInvalidAppName(userOptions.appName)))
    errorInvalidOption('Missing AppName')

  return userOptions
}

function cleanBuild() {
  try {
    showRun(execSync, 'rm -rf ' + BUILD_FOLDER)
  } catch (e) { }
  showRun(execSync, 'mkdir ' + BUILD_FOLDER)
}



function testFunction(execSync, userOptions) {
  //Print(path.basename(process.cwd()))
  // getPackageNameFromManifest(execSync, userOptions)
  // generateAidl(fs, execSync, userOptions)
  // const test = fs.readdirSync('./src/main/')
  // test.forEach(function(entry) {

  //   // Print(entry.name + '  ' + entry.isDirectory)
  //   Print(entry.slice(-4))
  // })

  Print('script path: ' + __dirname)
}

const userOptions = processOptions(fs, path);

Print('## OPTIONS: ', userOptions, '\n')

if (userOptions.command === 'create') {
  createFolders(fs, userOptions, PROJECT_FOLDERS)
  createFiles(fs, userOptions)
  // saveOptions(fs, userOptions)
  createDebugKeyStore(fs, execSync, userOptions)
} else if (userOptions.command === 'compile') {
  if (userOptions.cleanBuild) cleanBuild()

  generateRJava(execSync, userOptions)
  generateAidl(fs, execSync, userOptions)
  compileSource(fs, execSync, userOptions)

  try { fs.unlinkSync('./' + BUILD_FOLDER + '/classes.dex') } catch (e) { }
  try { fs.unlinkSync('./' + BUILD_FOLDER + '/unaligned.apk') } catch (e) { }
  try { fs.unlinkSync('./' + BUILD_FOLDER + '/' + userOptions.appName + '-debug.apk') } catch (e) { }

  javaToDalvikByteCode(execSync, userOptions)
  buildApk(execSync, userOptions)
  signAndAlign(execSync, userOptions)
} else if (userOptions.command === 'clean') {
  cleanBuild()
} else if (userOptions.command === 'test') {
  testFunction(execSync, userOptions);
}