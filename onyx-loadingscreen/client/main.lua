local active       = true
local isShutting   = false
local SYNC_MS      = 1000

local function safeSendToLoadingScreen(eventName, payload)
    if not active then return end
    pcall(function()
        if SendLoadingScreenMessage then
            local data = { eventName = eventName, payload = payload }
            SendLoadingScreenMessage(json.encode(data))
        end
    end)
end

local function handleSyncResponse(data)
    if not active or type(data) ~= 'table' then return end

    safeSendToLoadingScreen('onyxls:sync', data)
end

RegisterNetEvent('onyx-loadingscreen:client:sync', function(data)
    handleSyncResponse(data)
end)

CreateThread(function()
    while active do
        pcall(function()
            if BusyspinnerIsOn and BusyspinnerIsOn() then
                BusyspinnerOff()
            end
        end)
        Wait(50)
    end
end)

CreateThread(function()
    local started = GetGameTimer()

    Wait(150)
    pcall(function()
        TriggerServerEvent('onyx-loadingscreen:server:sync', GetGameTimer(), true)
    end)

    while active do
        Wait(SYNC_MS)

        if not active then break end

        local sendTime = GetGameTimer()
        pcall(function()
            TriggerServerEvent('onyx-loadingscreen:server:sync', sendTime, false)
        end)

        if (GetGameTimer() - started) > 900000 then
            active = false
            break
        end
    end
end)

local function shutdown()
    if isShutting then return end
    isShutting = true
    active = false

    safeSendToLoadingScreen('onyxls:shutdown', {})

    Wait(450)

    pcall(function()
        if ShutdownLoadingScreen then
            ShutdownLoadingScreen()
        end
    end)

    pcall(function()
        if ShutdownLoadingScreenNui then
            ShutdownLoadingScreenNui()
        end
    end)
end

RegisterNetEvent('QBCore:Client:OnPlayerLoaded', shutdown)
RegisterNetEvent('qbx_core:client:playerLoaded', shutdown)
RegisterNetEvent('esx:playerLoaded', shutdown)
RegisterNetEvent('ox:playerLoaded', shutdown)
RegisterNetEvent('playerSpawned', shutdown)
RegisterNetEvent('onyx-loadingscreen:client:shutdown', shutdown)

AddEventHandler('onResourceStop', function(res)
    if res == GetCurrentResourceName() then
        shutdown()
    end
end)

exports('Shutdown', shutdown)
