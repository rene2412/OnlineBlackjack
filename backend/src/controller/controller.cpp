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
        auto &player = game.GetPlayers()[0];
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
        auto &player = game.GetPlayers()[0];
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

void GameController::DoubleDownController(const drogon::HttpRequestPtr &req,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback)  {
        try {
        auto &game = Game::GetGameInstance();
        auto &dealer = game.GetDealerInstance();
        auto &deck = game.GetDeckInstance();
        auto &player = game.GetPlayers()[0];
        std::cout << "Double Down TIME\n";
        game.DoubleDown(game.GetPlayers(), 0);
        game.PlayerHit(game.GetPlayers(), deck.GetDeck(), 0);
		player->ShowDeck();
		int playerCount = player->GetCount();
        std::string doubleDown = "{\"event\": \"doubleDown\", \"count\": " + std::to_string(playerCount)+ "}";
        GameWebSocketController::EventAPI(doubleDown); 
		game.Play(game.GetPlayers(), dealer, deck.GetDeck(), 0);
        
        Json::Value result;
        result["message"] = "Successful Connection";
        result["action"] = "double down controller";
        auto resp = HttpResponse::newHttpJsonResponse(result);
        callback(resp);

    } catch(...) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k500InternalServerError);
        callback(resp);
    }
}

void GameController::SplitDoubleDownController(const drogon::HttpRequestPtr &req,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback)  {
        try {
        auto &game = Game::GetGameInstance();
        auto &dealer = game.GetDealerInstance();
        auto &deck = game.GetDeckInstance();
        auto &player = game.GetPlayers()[0];
        std::cout << "Split Double Down TIME\n";
        int currentHand = game.GetCurrentHand();
        std::deque<int>& currentSplitHand = player->GetSplitHands()[currentHand];
        int balance = player->GetBalance(); 
        int oldWager = player->GetWager();
        int newWager = oldWager * 2;
        std::cout << "Current Hand: " << currentHand << ", Balance: " << balance << ", Wager: " << newWager << std::endl;
        //mark the hand as doubled down to reset wagers
        player->SetDoubleDownFlag(1, currentHand);
        game.HitMultipleHands(game.GetPlayers(), dealer, deck.GetDeck(), 0);
        int playerCount = player->GetMultiHandCount(currentSplitHand);
        std::cout << "Current Count: " << playerCount << std::endl;
        std::string splitDoubleDown = "{\"event\": \"splitDoubleDown\", \"hand\":" + std::to_string(currentHand) + ",\"count\": " + std::to_string(playerCount)+ "}";
        GameWebSocketController::EventAPI(splitDoubleDown); 
        int newHand = ++currentHand;
        game.SetCurrentHand(newHand);
        std::cout << "NewHand: " << newHand << std::endl; 
        int finalHand = player->GetSplitHands().size();
        if (newHand >= finalHand) {
            game.HandleSplitStand(game.GetPlayers(), dealer, deck.GetDeck(), newHand, 0);
        }
        Json::Value result;
        result["message"] = "Successful Connection";
        result["action"] = "double down controller";
        auto resp = HttpResponse::newHttpJsonResponse(result);
        callback(resp);

    } catch(...) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k500InternalServerError);
        callback(resp);
    }
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
        if (action == "yes") {
            std::cout << "HTTP Request: Ready to split\n";
            int balance = players[0]->GetBalance();
            int wager = players[0]->GetWager();
            if (balance < wager) {
                 std::cout << "Cant afford new Hand" << std::endl;
                 std::string broke = "{\"event\": \"insufficientFunds\"}";
                 GameWebSocketController::EventAPI(broke);
                 return;
            }
            
            game.SetSplitState(true);
            game.SetOnDeal(true);
            for (int i = 0; i < players.size(); i++) {
                game.Split(players, gameDeck, i, action);
            }
        }
        Json::Value result;
        result["message"] = "Successful Connection";
        result["split"] = action;
        auto resp = HttpResponse::newHttpJsonResponse(result);
        callback(resp);

            } catch(...) {}
    }

void GameController::ReSplit(const drogon::HttpRequestPtr &req,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
        try {
        auto json = req->getJsonObject();
        std::string action = (*json)["split"].asString(); // "yes" or "no"
        
        auto &game = Game::GetGameInstance();
		auto &deck = game.GetDeckInstance();
        auto &players = game.GetPlayers();
        auto &gameDeck = deck.GetDeck();
        int nextCard = deck.GetDeck().back();
        int currentHand = game.GetCurrentHand();
        auto &hand = players[0]->GetSplitHands()[currentHand];
        std::cout << "Made it here!\n";
        if (action == "yes") { 
                int balance = players[0]->GetBalance();
                int wager = players[0]->GetWager();
                if (balance < wager) {
                     std::cout << "Cant afford new Hand" << std::endl;
                     std::string broke = "{\"event\": \"insufficientFunds\"}";
                     GameWebSocketController::EventAPI(broke);
                     return;
            }
			    std::cout << "Create the next split hand!\n";
				players[0]->push_back(nextCard); //push next split card into the original
				//if they do want to keep splitting run logic here
				std::deque<int> newHand; //create the newHand and push into the vector of hands
				newHand.push_back(nextCard);
				players[0]->insertHands(newHand);	
				std::string newSplitCounter = "{\"event\": \"newSplitCounter\", \"count\": " + std::to_string(nextCard) + "}";
			    GameWebSocketController::EventAPI(newSplitCounter);
			}
        if (action == "no") {
            std::cout << "USER STANDS NO MORE SPLITTING\n";
            std::cout << "Inserting New Card: " << nextCard << " into " << currentHand << std::endl;
		    players[0]->insertIntoHand(nextCard, currentHand);
		    std::cout << "Updated Size of Hand : " << currentHand << ": " << hand.size() << std::endl;
		    int currentCount = players[0]->GetMultiHandCount(hand);
		    std::cout << "Count: " << currentCount << "On Hand - " << currentHand << std::endl;
            std::string updateCounter = "{\"event\": \"updateCounterOnResplitStand\", \"currentResplitHandCount\": " + std::to_string(currentCount) + ", \"currentResplitHand\": " + std::to_string(currentHand) + "}";
		    GameWebSocketController::EventAPI(updateCounter);
        }
        Json::Value result;
        result["status"] = "ok";
        callback(drogon::HttpResponse::newHttpJsonResponse(result));
    } catch(...) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k500InternalServerError);
        callback(resp);
    }
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

        game.HitMultipleHands(game.GetPlayers(), dealer, deck.GetDeck(), 0);
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
        game.HandleSplitStand(game.GetPlayers(), dealer, card_deck, currentHand, currentPlayer);
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
        game.SetCurrentHand(0);
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
    game.SetCurrentHand(0);
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