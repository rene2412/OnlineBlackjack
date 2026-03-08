#pragma once
#include <drogon/WebSocketController.h>
#include <drogon/WebSocketConnection.h>
#include <vector>
#include <mutex>
#include "../logic/game.h"
#include "../logic/dealer.h"
#include <string>
using namespace drogon;

class GameWebSocketController
    : public drogon::WebSocketController<GameWebSocketController>
{
public:
    void handleNewConnection(const HttpRequestPtr &req, const WebSocketConnectionPtr &connection) override;
    void handleConnectionClosed(const WebSocketConnectionPtr &connection) override;
    void handleNewMessage(const WebSocketConnectionPtr &connection, std::string &&message, const WebSocketMessageType &type) override;
    static void EventAPI(const std::string &token, const std::string &message);

    WS_PATH_LIST_BEGIN
        WS_PATH_ADD("/ws");
    WS_PATH_LIST_END
};




















