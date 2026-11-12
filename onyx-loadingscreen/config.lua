Config = {}

-- Discord Bot Token (https://discord.com/developers/applications -> Bot -> Token)
Config.DiscordBotToken = "YOUR_DISCORD_BOT_TOKEN_HERE"

Config.DefaultProfile = {
    displayName = "Oyuncu",
    username    = "@oyuncu",
    avatar      = "assets/images/default-avatar.png"
}

Config.Background = {
    Effects = {
        enabled  = true,
        vignette = true,
        contrast = true,
        darkness = 0.88
    },

    Video = {
        enabled = false,
        file    = "assets/video/bg.mp4",
        volume  = 0.0
    },

    Image = {
        enabled       = true,
        slideDuration = 3200,
        fadeDuration  = 2400,
        images = {
            "assets/images/1.png",
            "assets/images/2.png",
            "assets/images/3.png",
            "assets/images/4.png",
            "assets/images/5.png",
            "assets/images/6.png",
            "assets/images/7.png",
            "assets/images/8.png",
            "assets/images/9.png",
        }
    }
}

Config.MusicPlayer = {
    autoplay      = true,
    shuffle       = false,
    defaultVolume = 0.35,
    defaultOpen   = false,

    songs = {
        {
            title  = "Delorean",
            artist = "UZİ",
            file   = "assets/music/song1.mp3",
            cover  = "assets/music/covers/song1.jpg"
        },
        {
            title  = "Fake Stress",
            artist = "BATUBOW X KVCKIN",
            file   = "assets/music/song2.mp3",
            cover  = "assets/music/covers/song2.png"
        },
    }
}

Config.BackgroundEffects = Config.Background.Effects
