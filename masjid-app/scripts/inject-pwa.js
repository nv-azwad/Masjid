// Inject PWA meta tags into the built index.html after expo export
const fs = require('fs')
const path = require('path')

const htmlPath = path.join(__dirname, '..', 'dist', 'index.html')
let html = fs.readFileSync(htmlPath, 'utf8')

const pwaTags = `
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#0f1210" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="GA Masjid" />
    <link rel="apple-touch-icon" href="/icon-192.png" />`

// Insert before closing </head>
html = html.replace('</head>', pwaTags + '\n  </head>')

fs.writeFileSync(htmlPath, html)
console.log('PWA tags injected into dist/index.html')
