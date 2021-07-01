## Special Notice

Accessing the browser's accelerometer requires HTTPS connections unless it is under localhost environment. If you can't proceed beyond the Terms and Conditions page, try with localhost or an https connections.

## Getting started

- Make sure your node version is 13 or above. If not, you will get a `Cannot find module 'fs/promises'` error
- Run `npm install`
- Run `node scripts.js dev` to start local server at https://localhost:8080
- Run `node scripts.js export` to export the project for deploying onto the server. To avoid caching, the `index.html` file will be renamed into a random file name.
- The live URL would be something like https://postclicks.app/PROJECT_NAME/XXXXX.html. This is fine because when Twitter renders the page, it only shows the domain name as "postclicks.app"

## GIF/WEBP generation
- Run `node scripts.js gif PATH_TO_PNG_FOLDER` to trigger the script
- The animation file will be placed in the `deploy/img` folder
- This script is not tested in Windows, hopefully it works

## Architecture

The project uses a script to stitch multiple parts together. Here are the reasons:

1. Segregate the codes so it is easier to navigate the code.
2. Work around the caching problem in CDN. js/css files will be cached at the CDN level and it is hard to clear it
3. More optimized file size. To lower dropout rate, file size is very crucial for this project.

Here are the files inserted back into the HTML. The script also does some search and replace using `[[VARIABLE]]` as some templating convention.

- src/tnc.md: Terms and conditions, in markdown format. Converted into HTML with code and inserted back into index.html
- src/main.css: minified and insert at the top
- src/main.js: minified and insert at the bottom
- config.json: converted into a js variable as `CONFIG`

## Image Formats

This projects uses webp as the main image format for two reasons. One is to reduce the file size further and the other is to provide a better animation format compared to gif.

The problem is that iOS is still not supporting it. The project users a javascript function to detect if the browser supports webp. If it doesn't, swap static images with jpg format and animated images into gif format. It's quite troublesome for now and hopefully iOS will support webp soon and this effort can make a bigger impact.

## Code locations

- The PAGE_TITLE attribute should just use the client's Twitter display name, unless special request is given. This will be displayed in the website preview card on Twitter timeline.
- The color of timer circle can be adjusted in main.css under #timer-color1 and #timer color2
- It's very unlikely SHAKE_THRESHOLD and SHAKE_INTERVAL need to be adjusted. These 2 parameters will drastically change how many shakes the user can achieve in 8 seconds.
