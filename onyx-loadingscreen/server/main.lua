pcall(function()
    SetConvarReplicated('sv_showBusySpinnerOnLoadingScreen', 'false')
    ExecuteCommand('setr sv_showBusySpinnerOnLoadingScreen false')
end)

local RESOURCE      = GetCurrentResourceName()
local CACHE_TTL     = 1800
local HTTP_TIMEOUT  = 2500
local SYNC_COOLDOWN = 350

local profileCache  = {}
local lastSync      = {}

local function trim(s)
    return (tostring(s or ''):gsub('^%s+', ''):gsub('%s+$', ''))
end

local function getToken()
    local raw = ''

    if Config and Config.DiscordBotToken and type(Config.DiscordBotToken) == 'string' and Config.DiscordBotToken ~= '' then
        raw = Config.DiscordBotToken
    elseif Config and Config.BotToken and type(Config.BotToken) == 'string' and Config.BotToken ~= '' then
        raw = Config.BotToken
    elseif Config and Config.Token and type(Config.Token) == 'string' and Config.Token ~= '' then
        raw = Config.Token
    elseif Config and Config.DiscordToken and type(Config.DiscordToken) == 'string' and Config.DiscordToken ~= '' then
        raw = Config.DiscordToken
    end

    if raw == '' or not raw then
        pcall(function()
            local fileContent = LoadResourceFile(RESOURCE, 'config.lua')
            if fileContent then
                local tokenMatch = fileContent:match('Config%.DiscordBotToken%s*=%s*["\']([^"\']+)["\']')
                if tokenMatch and tokenMatch ~= '' then
                    raw = tokenMatch
                    if not Config then Config = {} end
                    Config.DiscordBotToken = tokenMatch
                end
            end
        end)
    end

    if raw == '' or not raw then
        pcall(function() raw = GetConvar('onyx_discord_bot_token', '') end)
    end
    if raw == '' or not raw then
        pcall(function() raw = GetConvar('discord_bot_token', '') end)
    end

    local token = trim(raw)
    token = token:gsub('^["\']+', ''):gsub('["\']+$', '')
    token = token:gsub('^[Bb]ot%s+', '')

    if token == '' or token == 'BURAYA_DISCORD_BOT_TOKEN_YAZIN' or token == 'BURAYA_DISCORD_BOT_TOKEN_GIRIN' then
        return nil
    end

    if #token < 30 then
        return nil
    end

    return token
end

local function getMaxPlayers()
    local maxP = 48
    pcall(function()
        local svMax = GetConvarInt('sv_maxclients', 48)
        if svMax and svMax > 0 then
            maxP = svMax
        end
    end)
    return maxP
end

local function getOnlineCount(includeConnecting)
    local count = 1
    pcall(function()
        if GetNumPlayerIndices then
            count = GetNumPlayerIndices()
        elseif GetPlayers then
            count = #GetPlayers()
        end
    end)
    if includeConnecting then
        count = math.max(1, count + 1)
    else
        count = math.max(1, count)
    end
    return count
end

local function getPing(src)
    if src then
        local ok, ping = pcall(GetPlayerPing, src)
        if ok and type(ping) == 'number' and ping > 0 then
            return math.floor(ping)
        end
        local ok2, ping2 = pcall(GetPlayerPing, tostring(src))
        if ok2 and type(ping2) == 'number' and ping2 > 0 then
            return math.floor(ping2)
        end
    end
    return math.random(24, 36)
end

local function getDiscordId(src)
    if not src then return nil end
    local srcStr = tostring(src)

    if GetPlayerIdentifierByType then
        local ok, id = pcall(GetPlayerIdentifierByType, srcStr, 'discord')
        if ok and id and id ~= '' then
            return (id:gsub('^discord:', ''))
        end
    end

    local okIds, ids = pcall(GetPlayerIdentifiers, srcStr)
    if okIds and ids then
        for _, id in ipairs(ids) do
            if id and tostring(id):find('^discord:') then
                return (tostring(id):gsub('^discord:', ''))
            end
        end
    end

    if GetNumPlayerIdentifiers and GetPlayerIdentifier then
        local okNum, num = pcall(GetNumPlayerIdentifiers, srcStr)
        if okNum and num and num > 0 then
            for i = 0, num - 1 do
                local okId, id = pcall(GetPlayerIdentifier, srcStr, i)
                if okId and id and tostring(id):find('^discord:') then
                    return (tostring(id):gsub('^discord:', ''))
                end
            end
        end
    end

    return nil
end

local function getFivemNameFromIds(src)
    if not src then return nil end
    local ok, rawName = pcall(GetPlayerName, tostring(src))
    if ok and rawName and rawName ~= '' and rawName ~= '**Invalid**' then
        return rawName
    end
    return nil
end

local function handleFromName(name)
    local cleaned = tostring(name or ''):lower():gsub('[^%w_%.%-]', '')
    if cleaned == '' then cleaned = 'oyuncu' end
    return '@' .. cleaned
end

local function defaultDiscordAvatar(discordId, discriminator)
    local index = 0
    if discriminator and discriminator ~= '0' and tonumber(discriminator) then
        index = tonumber(discriminator) % 5
    else
        local idNum = tonumber(discordId)
        if idNum then
            index = math.floor(idNum / 4194304) % 6
        end
    end
    return ('https://cdn.discordapp.com/embed/avatars/%d.png'):format(index)
end

local function fallbackProfile(name, discordId)
    local disp = (name and name ~= '' and name ~= '**Invalid**')
        and name
        or ((Config and Config.DefaultProfile and Config.DefaultProfile.displayName) or 'Oyuncu')

    local avatarUrl = (Config and Config.DefaultProfile and Config.DefaultProfile.avatar) or 'assets/images/default-avatar.png'
    if discordId and avatarUrl == 'assets/images/default-avatar.png' then
        avatarUrl = defaultDiscordAvatar(discordId, nil)
    end

    return {
        displayName       = disp,
        username          = handleFromName(disp),
        avatar            = avatarUrl,
        discordId         = discordId,
        isVerifiedDiscord = false
    }
end

local function publicConfig()
    return {
        maxPlayers        = getMaxPlayers(),
        background        = Config and Config.Background,
        backgroundEffects = Config and (Config.BackgroundEffects or (Config.Background and Config.Background.Effects)),
        musicPlayer       = Config and Config.MusicPlayer
    }
end

local function buildProfileFromDiscordObject(user, fallback, discordId)
    local uid = tostring((user and user.id) or discordId or '')
    local avatar = fallback and fallback.avatar or 'assets/images/default-avatar.png'

    if user then
        if user.avatarURL and user.avatarURL ~= '' then
            avatar = user.avatarURL
        elseif user.avatarUrl and user.avatarUrl ~= '' then
            avatar = user.avatarUrl
        elseif user.avatar and type(user.avatar) == 'string' and user.avatar ~= '' then
            if user.avatar:find('^https?://') then
                avatar = user.avatar
            else
                local ext = user.avatar:sub(1, 2) == 'a_' and 'gif' or 'png'
                avatar = ('https://cdn.discordapp.com/avatars/%s/%s.%s?size=256'):format(uid, user.avatar, ext)
            end
        elseif user.avatar and type(user.avatar) == 'table' and user.avatar.link then
            avatar = user.avatar.link .. '?size=256'
        else
            avatar = defaultDiscordAvatar(uid, user.discriminator)
        end
    end

    local dispName = (user and user.global_name and user.global_name ~= '' and user.global_name)
        or (user and user.display_name and user.display_name ~= '' and user.display_name)
        or (user and user.tag and user.tag ~= '' and user.tag:gsub('#0$', ''))
        or (user and user.username and user.username ~= '' and user.username)
        or (fallback and fallback.displayName)
        or 'Oyuncu'

    local usrHandle = (user and user.username and user.username ~= '')
        and ('@' .. user.username)
        or (fallback and fallback.username)
        or '@oyuncu'

    return {
        displayName       = dispName,
        username          = usrHandle,
        avatar            = avatar,
        discordId         = uid,
        isVerifiedDiscord = true
    }
end

local function fetchViaPublicLookup(discordId, fallback, finish)
    if not discordId then return finish(fallback) end

    PerformHttpRequest(('https://japi.rest/discord/v1/user/%s'):format(discordId), function(st1, body1)
        if st1 == 200 and body1 then
            local ok1, res1 = pcall(json.decode, body1)
            if ok1 and type(res1) == 'table' and type(res1.data) == 'table' and res1.data.username then
                local prof = buildProfileFromDiscordObject(res1.data, fallback, discordId)
                profileCache[discordId] = { time = os.time(), data = prof }
                return finish(prof)
            end
        end

        PerformHttpRequest(('https://api.lanyard.rest/v1/users/%s'):format(discordId), function(st2, body2)
            if st2 == 200 and body2 then
                local ok2, res2 = pcall(json.decode, body2)
                if ok2 and type(res2) == 'table' and type(res2.data) == 'table' and type(res2.data.discord_user) == 'table' then
                    local prof = buildProfileFromDiscordObject(res2.data.discord_user, fallback, discordId)
                    profileCache[discordId] = { time = os.time(), data = prof }
                    return finish(prof)
                end
            end

            PerformHttpRequest(('https://discordlookup.mesalytic.moe/v1/user/%s'):format(discordId), function(st3, body3)
                if st3 == 200 and body3 then
                    local ok3, res3 = pcall(json.decode, body3)
                    if ok3 and type(res3) == 'table' and res3.username then
                        local prof = buildProfileFromDiscordObject(res3, fallback, discordId)
                        profileCache[discordId] = { time = os.time(), data = prof }
                        return finish(prof)
                    end
                end

                finish(fallback)
            end, 'GET', '', { ['User-Agent'] = 'onyx-loadingscreen/2.5' })
        end, 'GET', '', { ['User-Agent'] = 'onyx-loadingscreen/2.5' })
    end, 'GET', '', { ['User-Agent'] = 'onyx-loadingscreen/2.5' })
end

local function fetchProfile(src, playerName, callback)
    local realName  = (playerName and playerName ~= '' and playerName ~= '**Invalid**') and playerName or getFivemNameFromIds(src) or 'Oyuncu'
    local discordId = getDiscordId(src)
    local fallback  = fallbackProfile(realName, discordId)

    if not discordId then
        return callback(fallback)
    end

    local cached = profileCache[discordId]
    if cached and (os.time() - cached.time) < CACHE_TTL then
        return callback(cached.data)
    end

    local finished = false
    local function finish(data)
        if finished then return end
        finished = true
        callback(data)
    end

    SetTimeout(HTTP_TIMEOUT, function()
        finish(fallback)
    end)

    local token = getToken()
    if token then
        PerformHttpRequest(('https://discord.com/api/v10/users/%s'):format(discordId), function(status, body)
            if status == 200 and body then
                local ok, user = pcall(json.decode, body)
                if ok and type(user) == 'table' and user.id then
                    local prof = buildProfileFromDiscordObject(user, fallback, discordId)
                    profileCache[discordId] = { time = os.time(), data = prof }
                    return finish(prof)
                end
            end
            fetchViaPublicLookup(discordId, fallback, finish)
        end, 'GET', '', {
            ['Authorization'] = 'Bot ' .. token,
            ['Content-Type']  = 'application/json',
            ['User-Agent']    = 'DiscordBot (onyx-loadingscreen, 2.5.0)'
        })
    else
        fetchViaPublicLookup(discordId, fallback, finish)
    end
end

local function cleanOldCache()
    local now = os.time()
    for id, item in pairs(profileCache) do
        if not item or not item.time or (now - item.time) > CACHE_TTL then
            profileCache[id] = nil
        end
    end
end

AddEventHandler('playerConnecting', function(name, _, deferrals)
    local src = source

    if not deferrals then return end

    pcall(function() deferrals.defer() end)
    Wait(50)

    local discordId = getDiscordId(src)

    local initialPing = getPing(src)
    if initialPing <= 0 then initialPing = 28 end

    local stats = {
        ping          = initialPing,
        onlinePlayers = getOnlineCount(true),
        maxPlayers    = getMaxPlayers()
    }

    if not discordId then
        Wait(100)
        discordId = getDiscordId(src)
    end

    local fallback = fallbackProfile(name, discordId)

    if not discordId then
        pcall(function()
            if deferrals.handover then
                deferrals.handover({
                    onyxls = {
                        config = publicConfig(),
                        player = fallback,
                        stats  = stats
                    }
                })
            end
        end)
        pcall(function() deferrals.done() end)
        return
    end

    local cached = profileCache[discordId]
    if cached and (os.time() - cached.time) < CACHE_TTL then
        pcall(function()
            if deferrals.handover then
                deferrals.handover({
                    onyxls = {
                        config = publicConfig(),
                        player = cached.data,
                        stats  = stats
                    }
                })
            end
        end)
        pcall(function() deferrals.done() end)
        return
    end

    local doneCalled = false
    local function finishConnecting(profileData)
        if doneCalled then return end
        doneCalled = true

        pcall(function()
            if deferrals.handover then
                deferrals.handover({
                    onyxls = {
                        config = publicConfig(),
                        player = profileData,
                        stats  = stats
                    }
                })
            end
        end)

        pcall(function() deferrals.done() end)
    end

    SetTimeout(1200, function()
        finishConnecting(fallback)
    end)

    fetchProfile(src, name, function(profile)
        finishConnecting(profile)
    end)
end)

local function handleSyncRequest(src, clientSendTime, withProfile)
    if not src then return end
    local now = GetGameTimer()
    if lastSync[src] and (now - lastSync[src]) < SYNC_COOLDOWN then return end
    lastSync[src] = now

    if type(clientSendTime) == 'boolean' and withProfile == nil then
        withProfile = clientSendTime
        clientSendTime = 0
    end

    local svPing = getPing(src)
    local stats = {
        ping          = svPing,
        onlinePlayers = getOnlineCount(false),
        maxPlayers    = getMaxPlayers()
    }

    local playerName = getFivemNameFromIds(src) or 'Oyuncu'

    if withProfile then
        fetchProfile(src, playerName, function(profile)
            pcall(function()
                TriggerClientEvent('onyx-loadingscreen:client:sync', src, {
                    config = publicConfig(),
                    player = profile,
                    stats  = stats
                }, clientSendTime, svPing)
            end)
        end)
    else
        pcall(function()
            TriggerClientEvent('onyx-loadingscreen:client:sync', src, {
                stats = stats
            }, clientSendTime, svPing)
        end)
    end
end

RegisterNetEvent('onyx-loadingscreen:server:sync', function(a, b)
    handleSyncRequest(source, a, b)
end)

AddEventHandler('playerDropped', function()
    lastSync[source] = nil
end)

AddEventHandler('onResourceStart', function(res)
    if res ~= RESOURCE then return end

    pcall(function()
        SetConvarReplicated('sv_showBusySpinnerOnLoadingScreen', 'false')
        ExecuteCommand('setr sv_showBusySpinnerOnLoadingScreen false')
    end)

    cleanOldCache()
end)

CreateThread(function()
    while true do
        Wait(1800000)
        cleanOldCache()
    end
end)
