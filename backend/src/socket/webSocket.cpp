#include "webSocket.h"
#include <iostream>

std::vector<WebSocketConnectionPtr> GameWebSocketController::clients;
std::mutex GameWebSocketController::clientsMutex;

void GameWebSocketController::handleNewConnection(const HttpRequestPtr &req, const WebSocketConnectionPtr &connection) {
    std::lock_guard<std::mutex> lock(clientsMutex);
    clients.push_back(connection);
    std::cout << "New Web Socket Client estabalished, total: " << clients.size() << std::endl;
}

void GameWebSocketController::handleConnectionClosed(const WebSocketConnectionPtr &connection) {
    std::lock_guard<std::mutex> lock(clientsMutex);
    clients.erase(std::remove(clients.begin(), clients.end(), connection), clients.end());
    std::cout << "WebSocket client disconnected. Total: " << clients.size() << std::endl;
}

void GameWebSocketController::handleNewMessage(const WebSocketConnectionPtr &connection, std::string &&message, const WebSocketMessageType &type) {
    std::cout << "Message from client: " << message << std::endl;
}

void GameWebSocketController::EventAPI(const std::string &message) {
    std::lock_guard<std::mutex> lock(clientsMutex);
    for (const auto &client : clients) {
        if (client and client->connected()) {
            client->send(message);           
        }
    }
}
