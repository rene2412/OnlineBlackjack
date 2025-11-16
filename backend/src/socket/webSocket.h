#pragma once
#include <drogon/WebSocketController.h>
#include <drogon/WebSocketConnection.h>
#include <vector>
#include <mutex>
#include <string>
using namespace drogon;

class GameWebSocketController : public drogon::WebSocketController<GameWebSocketController> {
    private:
        static std::vector<WebSocketConnectionPtr> clients;
        static std::mutex clientsMutex;
    public:
        virtual void handleNewConnection(const HttpRequestPtr &req, const WebSocketConnectionPtr &connection) override;
        virtual void handleNewMessage(const WebSocketConnectionPtr &connection, std::string &&message, const WebSocketMessageType &type) override;
        virtual void handleConnectionClosed(const WebSocketConnectionPtr &connection) override;
        static void EventAPI(const std::string &message);

        WS_PATH_LIST_BEGIN
            WS_PATH_ADD("/ws/game");
        WS_PATH_LIST_END

};