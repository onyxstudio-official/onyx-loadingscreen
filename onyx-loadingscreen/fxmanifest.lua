fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'onyx-loadingscreen'
author 'Can Baygara'
description 'Onyx Studio Loading Screen'
version '2.5.0'

loadscreen 'html/index.html'
loadscreen_cursor 'yes'
loadscreen_manual_shutdown 'yes'

shared_scripts {
    'config.lua'
}

server_scripts {
    'server/main.lua'
}

client_scripts {
    'client/main.lua'
}

files {
    'config.lua',
    'html/index.html',
    'html/style.css',
    'html/script.js',
    'html/assets/**/*',
    'html/assets/**/**/*',
    'html/assets/**/**/**/*'
}
