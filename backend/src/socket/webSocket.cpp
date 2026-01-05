#include "webSocket.h"
#include <iostream>

std::vector<WebSocketConnectionPtr> GameWebSocketController::clients;
std::mutex GameWebSocketController::clientsMutex;

void GameWebSocketController::handleNewConnection(const HttpRequestPtr &req, const WebSocketConnectionPtr &connection) {
    std::lock_guard<std::mutex> lock(clientsMutex);
    clients.push_back(connection);
    std::cout << "New Web Socket Client estabalished, total: " << clients.size() << std::endl;
    auto &game = Game::GetGameInstance();
        for (auto &player : game.GetPlayers()) {
            int playerCount = player->GetCount();
            std::cout << player->GetName() << ": " << playerCount << std::endl;
        	std::string updateCount = "{\"event\": \"updateCount\", \"count\": " + std::to_string(playerCount) + "}";
			connection->send(updateCount);
    }  
    std::cout << "Sending dealer api\n";
    Dealer &dealer = game.GetDealerInstance();
    int dealerCount = dealer.GetSum()[0];
    std::string updateDealerCount = "{\"event\": \"updateDealerCount\", \"count\": " + std::to_string(dealerCount) + "}";
    connection->send(updateDealerCount);
    //split
    for (int i = 0; i < game.GetPlayers().size(); i++) {
    	if (game.IsSplitValid(game.GetPlayers(), i)) {
		    std::cout << "TIME TO SPLIT\n";
		    std::string split = "{\"event\": \"playerSplitChoice\"}";
		    connection->send(split);
	    }   
    }
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
