#pragma once
#include <unordered_map>
#include <shared_mutex>
#include <memory>
#include <string>
#include "../logic/game.h"
#include "../logic/player.h"
#include <drogon/WebSocketConnection.h>
#include <drogon/utils/Utilities.h>

struct GameSession {
    std::shared_ptr<Game>  game;
    WebSocketConnectionPtr connection;
};

class SessionManager {
private:
    SessionManager() = default;
    std::unordered_map<std::string, GameSession> sessions_;
    std::shared_mutex mutex_;

public:
    static SessionManager& instance() {
        static SessionManager mgr;
        return mgr;
    }

    // Called on WS connect — creates a fresh Game with one player, returns token
   std::string createSession(const WebSocketConnectionPtr& conn) {
    auto token = drogon::utils::getUuid();

    auto g = std::make_shared<Game>();
    Player player("Player", 1000, 0, 0, false);
    g->push_back(player);

    auto weakConn = std::weak_ptr<drogon::WebSocketConnection>(conn);
    g->SetEventCallback([weakConn](const std::string& msg) {
        if (auto c = weakConn.lock()) {
            if (c->connected()) c->send(msg);
        }
    });

    std::unique_lock lock(mutex_);
    sessions_[token] = { g, conn };
    return token;
}

    void removeSession(const std::string& token) {
        std::unique_lock lock(mutex_);
        sessions_.erase(token);
    }

    // Returns nullptr if token not found
    GameSession* getSession(const std::string& token) {
        std::shared_lock lock(mutex_);
        auto it = sessions_.find(token);
        return it != sessions_.end() ? &it->second : nullptr;
    }

    void sendToSession(const std::string& token, const std::string& msg) {
        std::shared_lock lock(mutex_);
        auto it = sessions_.find(token);
        if (it != sessions_.end() && it->second.connection &&
            it->second.connection->connected()) {
            it->second.connection->send(msg);
        }
    }

    size_t sessionCount() {
        std::shared_lock lock(mutex_);
        return sessions_.size();
    }
};