#include "webSocket.h"
#include "../session/sessionManager.h"
#include <iostream>

void GameWebSocketController::handleNewConnection(
    const HttpRequestPtr &req,
    const WebSocketConnectionPtr &connection)
{
    // If frontend passes existing token as ?token=xxx, reuse that session
    std::string token = req->getParameter("token");
    bool isReconnect = false;

    if (!token.empty()) {
        auto* existing = SessionManager::instance().getSession(token);
        if (existing) {
            // Reuse session — just update the callback to new connection
            isReconnect = true;
            auto weakConn = std::weak_ptr<drogon::WebSocketConnection>(connection);
            existing->game->SetEventCallback([weakConn](const std::string& msg) {
                if (auto c = weakConn.lock()) {
                    if (c->connected()) c->send(msg);
                }
            });
            existing->connection = connection;
            connection->setContext(std::make_shared<std::string>(token));
            std::cout << "WebSocket reconnected. Token: " << token
                      << " | Total sessions: " << SessionManager::instance().sessionCount()
                      << std::endl;
        }
    }

    if (!isReconnect) {
        // Fresh connection — create new session
        token = SessionManager::instance().createSession(connection);
        connection->setContext(std::make_shared<std::string>(token));
        std::cout << "New WebSocket client. Token: " << token
                  << " | Total sessions: " << SessionManager::instance().sessionCount()
                  << std::endl;
    }

    // Send session token to frontend
    connection->send("{\"event\":\"sessionInit\",\"sessionToken\":\"" + token + "\"}");

    // Send initial counts
    auto* session = SessionManager::instance().getSession(token);
    if (!session) return;

    auto& game   = *session->game;
    auto& dealer = game.GetDealerInstance();
    if (!isReconnect) dealer.ClearHand();

    for (auto& player : game.GetPlayers()) {
        int playerCount = player->GetCount();
        std::string updateCount = "{\"event\": \"updateCount\", \"count\": "
                                + std::to_string(playerCount) + "}";
        connection->send(updateCount);
    }

    int dealerCount = dealer.GetSum()[0];
    std::string updateDealerCount = "{\"event\": \"updateDealerCount\", \"count\": "
                                  + std::to_string(dealerCount) + "}";
    connection->send(updateDealerCount);
}

void GameWebSocketController::handleConnectionClosed(
    const WebSocketConnectionPtr &connection)
{
    // Do NOT remove session — game state must survive reconnects
    auto tokenPtr = connection->getContext<std::string>();
    if (tokenPtr) {
        std::cout << "WebSocket client disconnected. Token: " << *tokenPtr
                  << " (session preserved)" << std::endl;
    }
    std::cout << "Total sessions remaining: "
              << SessionManager::instance().sessionCount() << std::endl;
}

void GameWebSocketController::handleNewMessage(
    const WebSocketConnectionPtr &connection,
    std::string &&message,
    const WebSocketMessageType &type)
{
    std::cout << "Message from client: " << message << std::endl;
}

// Send a message to one specific session — replaces the old broadcast
void GameWebSocketController::EventAPI(
    const std::string &token,
    const std::string &message)
{
    SessionManager::instance().sendToSession(token, message);
}