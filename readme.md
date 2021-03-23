# Android Builder

An alternative system to gradle for building Android applications.

# Inspiration

All I wanted to do was take my source code and spit out an APK file for my little hobby projects.
Somehow the default build system used by Google (Gradle) seems to make this a complex affair, uses a lot of disk space and takes a long time to run.  So I wrote my own simple system to create and build android projects.  Now my projects can compile in less than a minute and result in small APK files.  Being a JavaScript person I wrote it in Node JS. (I may consider porting it to Java at a later time)

# Usage

To initialize a new project type:
`node andy.js create -n=MyAppName -p=com.example.myapp`

To compile the project and produce and APK file go to the project root:
`cd MyAppName`
then type
`node andy.js compile -c`

The resulting APK file will be in the build folder

