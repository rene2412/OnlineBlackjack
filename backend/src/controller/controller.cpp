#include "controller.h"
using namespace drogon;
void GameController::CurrentPlayerDecision(const drogon::HttpRequestPtr &req,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback)  {
        try {
        auto json = req->getJsonObject();
        if (!json or !json->isMember("action")) {
                 auto errorResp = drogon::HttpResponse::newHttpJsonResponse(Json::Value("Missing 'action' field"));
        errorResp->setStatusCode(drogon::k400BadRequest);
        callback(errorResp);
        return;
        }
        std::string action = (*json)["action"].asString();
        std::cout << "Player action received: " << action << std::endl;
        auto &game = Game::GetGameInstance();
        auto &dealer = game.GetDealerInstance();
        auto &deck = game.GetDeckInstance();
        std::cout << "Game Size: " << game.GetPlayers().size() << std::endl;
        //backend update for player HIT or STAND
        game.PlayerDecisions(game.GetPlayers(), deck.GetDeck(), dealer, action);
      // game.Play(game.GetPlayers(), dealer, deck.GetDeck(), 0);
        //tell front end to activatre the card hit animation
        for (auto &p : game.GetPlayers()) {
                p->ShowDeck();
        }
        Json::Value result;
        result["message"] = "Successful Connection";
        result["action"] = action;
        auto resp = HttpResponse::newHttpJsonResponse(result);
        callback(resp);

    } catch(...) {}
}

void GameController::PlayerWager(const drogon::HttpRequestPtr &req,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback)  {
        try {
        auto json = req->getJsonObject();
        if (!json or !json->isMember("wager")) {
                 auto errorResp = drogon::HttpResponse::newHttpJsonResponse(Json::Value("Missing 'wager' field"));
        errorResp->setStatusCode(drogon::k400BadRequest);
        callback(errorResp);
        return;
        }
        std::string wager = (*json)["wager"].asString();
        std::cout << "Player wager received: " << wager << std::endl;
        auto &game = Game::GetGameInstance();
        auto &dealer = game.GetDealerInstance();
        auto &deck = game.GetDeckInstance();
        auto player = game.GetPlayers()[0];
        try {
            int newWager = stoi(wager);
            player->SetWager(newWager);
        }
        catch (std::exception &e) {
            std::cerr << "stoi error" << std::endl;
        }
        Json::Value result;
        result["message"] = "Successful Connection";
        result["wager"] = wager;
        auto resp = HttpResponse::newHttpJsonResponse(result);
        callback(resp);

    } catch(...) {}
}

void GameController::Insurance(const drogon::HttpRequestPtr &req,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback)  {
        try {
        auto json = req->getJsonObject();
        if (!json or !json->isMember("action")) {
                 auto errorResp = drogon::HttpResponse::newHttpJsonResponse(Json::Value("Missing 'action' field"));
        errorResp->setStatusCode(drogon::k400BadRequest);
        callback(errorResp);
        return;
        }
        std::string action = (*json)["action"].asString();
        std::cout << "Player action received: " << action << std::endl;
        auto &game = Game::GetGameInstance();
        auto &dealer = game.GetDealerInstance();
        auto &deck = game.GetDeckInstance();
        auto player = game.GetPlayers()[0];
        if (action == "yes") {
            int insuranceWager = player->GetWager() / 2;
            insuranceWager = insuranceWager + player->GetWager();
            player->SetWager(insuranceWager);
        }
        Json::Value result;
        result["message"] = "Successful Connection";
        result["action"] = action;
        auto resp = HttpResponse::newHttpJsonResponse(result);
        callback(resp);

    } catch(...) {}
}

void GameController::Split(const drogon::HttpRequestPtr &req,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback)  {
        try {
        auto json = req->getJsonObject();
        if (!json or !json->isMember("split")) {
                 auto errorResp = drogon::HttpResponse::newHttpJsonResponse(Json::Value("Missing 'action' field"));
        errorResp->setStatusCode(drogon::k400BadRequest);
        callback(errorResp);
        return;
        }
        std::string action = (*json)["split"].asString();
        std::cout << "Player action received: " << action << std::endl;
        auto &game = Game::GetGameInstance();
        auto &deck = game.GetDeckInstance();
        auto &players = game.GetPlayers();
        auto &gameDeck = deck.GetDeck();
        auto &gameSuitDeck = deck.GetSuitsDeck(); 
        if (action == "yes") {
            std::cout << "HTTP Request: Ready to split\n";
            game.SetSplitState(true);
            game.SetOnDeal(true);
            for (int i = 0; i < players.size(); i++) {
                game.Split(players, gameDeck, gameSuitDeck, i, "yes");
            }
        }
        Json::Value result;
        result["message"] = "Successful Connection";
        result["split"] = action;
        auto resp = HttpResponse::newHttpJsonResponse(result);
        callback(resp);

            } catch(...) {}
    }

void GameController::SplitDecision(const drogon::HttpRequestPtr &req, std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    auto json = req->getJsonObject();
    if (!json || !json->isMember("action") || !json->isMember("handIndex")) {
        std::cout << "Invalid JSON\n";
        auto resp = drogon::HttpResponse::newHttpJsonResponse(
            Json::Value("Invalid split action payload"));
        resp->setStatusCode(drogon::k400BadRequest);
        callback(resp);
        return;
    }

    std::string action = (*json)["action"].asString();
    int handIndex = (*json)["handIndex"].asInt();
    auto &game = Game::GetGameInstance();
    auto &dealer = game.GetDealerInstance();
    auto &deck = game.GetDeckInstance();
    if (!game.GetSplitState()) {
        callback(drogon::HttpResponse::newHttpResponse());
        return;
    }
    if (action == "hit") {
        std::cout << "Ready To HIT hand: " << game.GetCurrentHand() << std::endl;

        //game.Split(game.GetPlayers(), deck.GetDeck(), deck.GetSuitsDeck(), 0, action); 
        game.HitMultipleHands(game.GetPlayers(), deck.GetDeck(), 0);
        game.SetOnDeal(false);
    }
    else if (action == "stand") {
        std::cout << "USER STANDS ON HAND: " << game.GetCurrentHand() << std::endl;
        int currentPlayer = game.GetCurrentPlayer();
        int currentHand = game.GetCurrentHand() + 1;
        auto &players = game.GetPlayers(); 
        int finalHand = players[currentPlayer]->GetSplitHands().size();
        game.SetCurrentHand(currentHand);
        //send the new count update
        if (currentHand < finalHand) {
            for (auto &player : game.GetPlayers()) { 
                    int secondCard = player->cardAt(currentHand);
                    std::string playerCount = "{\"event\": \"updateCount\", \"count\": " + std::to_string(secondCard) + "}";
                    GameWebSocketController::EventAPI(playerCount); 
                }
        }
        std::deque<int> &card_deck = deck.GetDeck();
        std::cout << "HAND: " << currentHand << std::endl;
        game.HandleSplitStand(game.GetPlayers(), game, dealer, card_deck, currentHand, currentPlayer);
    }

    Json::Value result;
    result["ok"] = true;
    callback(drogon::HttpResponse::newHttpJsonResponse(result));
}

void GameController::NextGame(const drogon::HttpRequestPtr &req, std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
        try {
        auto json = req->getJsonObject();
        if (!json or !json->isMember("action")) {
                 auto errorResp = drogon::HttpResponse::newHttpJsonResponse(Json::Value("Missing 'action' field"));
        errorResp->setStatusCode(drogon::k400BadRequest);
        callback(errorResp);
        return;
        }
        std::string action = (*json)["action"].asString();
        auto &game = Game::GetGameInstance();
        auto &dealer = game.GetDealerInstance();
        auto &deck = game.GetDeckInstance();
        auto player = game.GetPlayers()[0];
		dealer.ClearHand();
        dealer.SetAce(false);
        if (player->GetBalance() <= 0) {
            std::cout << "Player has ran out of money, end game and display stats" << std::endl;
            std::string endGame = "{\"event\": \"endGame\"}";
                GameWebSocketController::EventAPI(endGame); 
        }
        std::cout << "Cleared table\n";
        //clear variables
        for (auto& player : game.GetPlayers()) {
            player->SetBust(false);
            player->ClearHand();
            player->SetDecision(false);
            player->SetAce(false);
            player->SetDoubleAce(false);
        }
        //reverse(deck.GetDeck().begin(), deck.GetDeck().end());
		//reverse(deck.GetSuitsDeck().begin(), deck.GetSuitsDeck().end());
	    game.Deal(game.GetPlayers(), dealer, deck.GetDeck(), deck.GetSuitsDeck());
        player->ShowDeck();
        dealer.ShowDeck();

        for (int i = 0; i < game.GetPlayers().size(); i++) {
    	    if (game.IsSplitValid(game.GetPlayers(), i)) {
		        std::cout << "Asking for split choice\n";
                std::string split = "{\"event\": \"playerSplitChoice\"}";
                GameWebSocketController::EventAPI(split); 
	    }   
    }


        Json::Value result;
        result["message"] = "Successful Connection";
        result["action"] = action;
        auto resp = HttpResponse::newHttpJsonResponse(result);
        callback(resp);

    } catch(...) {}
}

void GameController::EndSession(const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback) {

    auto &game   = Game::GetGameInstance();
    auto &dealer = game.GetDealerInstance();
    auto &deck   = game.GetDeckInstance();
    std::cout << "Clearing data for new session\n";
    dealer.ClearHand();
    dealer.SetAce(false);
    for (auto& player : game.GetPlayers()) {
            player->SetBust(false);
            player->ClearHand();
            player->SetDecision(false);
            player->SetAce(false);
            player->SetDoubleAce(false);
        }
  
    Json::Value result;
    result["ok"] = true;
    callback(drogon::HttpResponse::newHttpJsonResponse(result));
}