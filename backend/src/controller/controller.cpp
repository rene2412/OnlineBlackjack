#include "controller.h"
using namespace drogon;

void GameController::CurrentPlayerDecision(const drogon::HttpRequestPtr &req,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    try {
        auto* session = getSession(req, callback);
        if (!session) return;
        auto& game   = *session->game;
        auto& dealer = game.GetDealerInstance();
        auto& deck   = game.GetDeckInstance();
        auto  token  = req->getHeader("X-Session-Token");

        auto json = req->getJsonObject();
        if (!json || !json->isMember("action")) {
            auto errorResp = drogon::HttpResponse::newHttpJsonResponse(Json::Value("Missing 'action' field"));
            errorResp->setStatusCode(drogon::k400BadRequest);
            callback(errorResp);
            return;
        }
        std::string action = (*json)["action"].asString();
        std::cout << "Player action received: " << action << std::endl;
        std::cout << "Game Size: " << game.GetPlayers().size() << std::endl;

        game.PlayerDecisions(game.GetPlayers(), deck.GetDeck(), dealer, action);

        for (auto& p : game.GetPlayers()) p->ShowDeck();

        Json::Value result;
        result["message"] = "Successful Connection";
        result["action"]  = action;
        callback(HttpResponse::newHttpJsonResponse(result));

    } catch (...) {}
}

void GameController::PlayerWager(const drogon::HttpRequestPtr &req,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    try {
       auto token = req->getHeader("X-Session-Token");
       std::cout << "Wager token received: '" << token << "'" << std::endl;
       auto* session = SessionManager::instance().getSession(token);
       std::cout << "Session found: " << (session ? "YES" : "NO") << std::endl;
       
        if (!session) return;
        auto& game = *session->game;

        auto json = req->getJsonObject();
        if (!json || !json->isMember("wager")) {
            auto errorResp = drogon::HttpResponse::newHttpJsonResponse(Json::Value("Missing 'wager' field"));
            errorResp->setStatusCode(drogon::k400BadRequest);
            callback(errorResp);
            return;
        }
        std::string wager  = (*json)["wager"].asString();
        auto&       player = game.GetPlayers()[0];
        std::cout << "Player wager received: " << wager << std::endl;

        try { player->SetWager(stoi(wager)); }
        catch (std::exception& e) { std::cerr << "stoi error: " << e.what() << std::endl; }

        Json::Value result;
        result["message"] = "Successful Connection";
        result["wager"]   = wager;
        callback(HttpResponse::newHttpJsonResponse(result));

    } catch (...) {}
}

void GameController::Insurance(const drogon::HttpRequestPtr &req,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    try {
        auto* session = getSession(req, callback);
        if (!session) return;
        auto& game = *session->game;

        auto json = req->getJsonObject();
        if (!json || !json->isMember("action")) {
            auto errorResp = drogon::HttpResponse::newHttpJsonResponse(Json::Value("Missing 'action' field"));
            errorResp->setStatusCode(drogon::k400BadRequest);
            callback(errorResp);
            return;
        }
        std::string action = (*json)["action"].asString();
        auto&       player = game.GetPlayers()[0];
        std::cout << "Insurance action: " << action << std::endl;

        if (action == "yes") {
            int insuranceWager = player->GetWager() / 2 + player->GetWager();
            player->SetWager(insuranceWager);
        }

        Json::Value result;
        result["message"] = "Successful Connection";
        result["action"]  = action;
        callback(HttpResponse::newHttpJsonResponse(result));

    } catch (...) {}
}

void GameController::DoubleDownController(const drogon::HttpRequestPtr &req,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    try {
        auto* session = getSession(req, callback);
        if (!session) return;
        auto& game   = *session->game;
        auto& dealer = game.GetDealerInstance();
        auto& deck   = game.GetDeckInstance();
        auto& player = game.GetPlayers()[0];
        auto  token  = req->getHeader("X-Session-Token");

        std::cout << "Double Down\n";
        game.DoubleDown(game.GetPlayers(), 0);
        game.PlayerHit(game.GetPlayers(), deck.GetDeck(), 0);
        player->ShowDeck();

        int playerCount = player->GetCount();
        std::string doubleDown = "{\"event\": \"doubleDown\", \"count\": " + std::to_string(playerCount) + "}";
        GameWebSocketController::EventAPI(token, doubleDown);

        game.Play(game.GetPlayers(), dealer, deck.GetDeck(), 0);

        Json::Value result;
        result["message"] = "Successful Connection";
        result["action"]  = "double down controller";
        callback(HttpResponse::newHttpJsonResponse(result));

    } catch (...) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k500InternalServerError);
        callback(resp);
    }
}

void GameController::SplitDoubleDownController(const drogon::HttpRequestPtr &req,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    try {
        auto* session = getSession(req, callback);
        if (!session) return;
        auto& game   = *session->game;
        auto& dealer = game.GetDealerInstance();
        auto& deck   = game.GetDeckInstance();
        auto& player = game.GetPlayers()[0];
        auto  token  = req->getHeader("X-Session-Token");

        std::cout << "Split Double Down\n";
        int currentHand = game.GetCurrentHand();
        std::deque<int>& currentSplitHand = player->GetSplitHands()[currentHand];

        int balance  = player->GetBalance();
        int oldWager = player->GetWager();
        int newWager = oldWager * 2;
        std::cout << "Hand: " << currentHand << " Balance: " << balance << " Wager: " << newWager << std::endl;

        player->SetDoubleDownFlag(1, currentHand);
        game.HitMultipleHands(game.GetPlayers(), dealer, deck.GetDeck(), 0);

        int playerCount = player->GetMultiHandCount(currentSplitHand);
        std::cout << "Count: " << playerCount << std::endl;

        std::string splitDoubleDown = "{\"event\": \"splitDoubleDown\", \"hand\": " + std::to_string(currentHand)
                                    + ", \"count\": " + std::to_string(playerCount) + "}";
        GameWebSocketController::EventAPI(token, splitDoubleDown);

        int newHand  = ++currentHand;
        int finalHand = (int)player->GetSplitHands().size();
        game.SetCurrentHand(newHand);
        std::cout << "NewHand: " << newHand << std::endl;

        if (newHand >= finalHand) {
            game.HandleSplitStand(game.GetPlayers(), dealer, deck.GetDeck(), newHand, 0);
        }

        Json::Value result;
        result["message"] = "Successful Connection";
        result["action"]  = "split double down controller";
        callback(HttpResponse::newHttpJsonResponse(result));

    } catch (...) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k500InternalServerError);
        callback(resp);
    }
}

void GameController::Split(const drogon::HttpRequestPtr &req,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    try {
        auto* session = getSession(req, callback);
        if (!session) return;
        auto& game    = *session->game;
        auto& deck    = game.GetDeckInstance();
        auto& players = game.GetPlayers();
        auto  token   = req->getHeader("X-Session-Token");

        auto json = req->getJsonObject();
        if (!json || !json->isMember("split")) {
            auto errorResp = drogon::HttpResponse::newHttpJsonResponse(Json::Value("Missing 'split' field"));
            errorResp->setStatusCode(drogon::k400BadRequest);
            callback(errorResp);
            return;
        }
        std::string action = (*json)["split"].asString();
        std::cout << "Split action: " << action << std::endl;

        if (action == "yes") {
            int balance = players[0]->GetBalance();
            int wager   = players[0]->GetWager();
            if (balance < wager) {
                std::cout << "Can't afford split\n";
                GameWebSocketController::EventAPI(token, "{\"event\": \"insufficientFunds\"}");
                Json::Value result; result["message"] = "insufficient funds";
                callback(HttpResponse::newHttpJsonResponse(result));
                return;
            }
            game.SetSplitState(true);
            game.SetOnDeal(true);
            for (int i = 0; i < (int)players.size(); i++) {
                game.Split(players, deck.GetDeck(), i, action);
            }
        }

        Json::Value result;
        result["message"] = "Successful Connection";
        result["split"]   = action;
        callback(HttpResponse::newHttpJsonResponse(result));

    } catch (...) {}
}

void GameController::ReSplit(const drogon::HttpRequestPtr &req,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    try {
        auto* session = getSession(req, callback);
        if (!session) return;
        auto& game    = *session->game;
        auto& deck    = game.GetDeckInstance();
        auto& players = game.GetPlayers();
        auto  token   = req->getHeader("X-Session-Token");

        auto json = req->getJsonObject();
        if (!json || !json->isMember("split")) {
            auto errorResp = drogon::HttpResponse::newHttpJsonResponse(Json::Value("Missing 'split' field"));
            errorResp->setStatusCode(drogon::k400BadRequest);
            callback(errorResp);
            return;
        }
        std::string action = (*json)["split"].asString();

        int  currentHand = game.GetCurrentHand();
        int  nextCard    = deck.GetDeck().back();
        auto& hand       = players[0]->GetSplitHands()[currentHand];
        std::cout << "ReSplit action: " << action << "\n";

        if (action == "yes") {
            int balance = players[0]->GetBalance();
            int wager   = players[0]->GetWager();
            if (balance < wager) {
                std::cout << "Can't afford resplit\n";
                GameWebSocketController::EventAPI(token, "{\"event\": \"insufficientFunds\"}");
                Json::Value result; result["message"] = "insufficient funds";
                callback(HttpResponse::newHttpJsonResponse(result));
                return;
            }
            std::cout << "Creating next split hand\n";
            players[0]->push_back(nextCard);
            std::deque<int> newHand;
            newHand.push_back(nextCard);
            players[0]->insertHands(newHand);
            std::cout << "Next Card: " << nextCard << std::endl;
            std::string newSplitCounter = "{\"event\": \"newSplitCounter\", \"count\": " + std::to_string(nextCard) + "}";
            GameWebSocketController::EventAPI(token, newSplitCounter);
        }

        if (action == "no") {
            std::cout << "User declines resplit — inserting card into hand " << currentHand << "\n";
            players[0]->insertIntoHand(nextCard, currentHand);
            int currentCount = players[0]->GetMultiHandCount(hand);
            std::string updateCounter = "{\"event\": \"updateCounterOnResplitStand\", \"currentResplitHandCount\": "
                                      + std::to_string(currentCount)
                                      + ", \"currentResplitHand\": " + std::to_string(currentHand) + "}";
            GameWebSocketController::EventAPI(token, updateCounter);
        }

        Json::Value result;
        result["status"] = "ok";
        callback(drogon::HttpResponse::newHttpJsonResponse(result));

    } catch (...) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k500InternalServerError);
        callback(resp);
    }
}

void GameController::SplitDecision(const drogon::HttpRequestPtr &req,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    auto* session = getSession(req, callback);
    if (!session) return;
    auto& game   = *session->game;
    auto& dealer = game.GetDealerInstance();
    auto& deck   = game.GetDeckInstance();
    auto  token  = req->getHeader("X-Session-Token");

    auto json = req->getJsonObject();
    if (!json || !json->isMember("action") || !json->isMember("handIndex")) {
        auto resp = drogon::HttpResponse::newHttpJsonResponse(Json::Value("Invalid split action payload"));
        resp->setStatusCode(drogon::k400BadRequest);
        callback(resp);
        return;
    }

    std::string action    = (*json)["action"].asString();
    int         handIndex = (*json)["handIndex"].asInt();

    if (!game.GetSplitState()) {
        callback(drogon::HttpResponse::newHttpResponse());
        return;
    }

    if (action == "hit") {
        std::cout << "HIT hand: " << game.GetCurrentHand() << "\n";
        game.HitMultipleHands(game.GetPlayers(), dealer, deck.GetDeck(), 0);
        game.SetOnDeal(false);
    }
    else if (action == "stand") {
        std::cout << "STAND on hand: " << game.GetCurrentHand() << "\n";
        int currentPlayer = game.GetCurrentPlayer();
        int currentHand   = game.GetCurrentHand() + 1;
        auto& players     = game.GetPlayers();
        int finalHand     = (int)players[currentPlayer]->GetSplitHands().size();
        game.SetCurrentHand(currentHand);

        if (currentHand < finalHand) {
            for (auto& player : game.GetPlayers()) {
                int secondCard = player->cardAt(currentHand);
                std::string playerCount = "{\"event\": \"updateCount\", \"count\": "
                                        + std::to_string(secondCard) + "}";
                GameWebSocketController::EventAPI(token, playerCount);
            }
        }
        game.HandleSplitStand(game.GetPlayers(), dealer, deck.GetDeck(), currentHand, currentPlayer);
    }

    Json::Value result;
    result["ok"] = true;
    callback(drogon::HttpResponse::newHttpJsonResponse(result));
}

void GameController::NextGame(const drogon::HttpRequestPtr &req,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    try {
        auto* session = getSession(req, callback);
        if (!session) return;
        auto& game   = *session->game;
        auto& dealer = game.GetDealerInstance();
        auto& deck   = game.GetDeckInstance();
        auto  token  = req->getHeader("X-Session-Token");

        auto json = req->getJsonObject();
        if (!json || !json->isMember("action")) {
            auto errorResp = drogon::HttpResponse::newHttpJsonResponse(Json::Value("Missing 'action' field"));
            errorResp->setStatusCode(drogon::k400BadRequest);
            callback(errorResp);
            return;
        }
        std::string action = (*json)["action"].asString();
        auto& player = game.GetPlayers()[0];

        dealer.ClearHand();
        dealer.SetAce(false);

        if (player->GetBalance() <= 0) {
            std::cout << "Player out of money — ending game\n";
            GameWebSocketController::EventAPI(token, "{\"event\": \"endGame\"}");
        }

        for (auto& p : game.GetPlayers()) {
            p->SetBust(false);
            p->ClearHand();
            p->SetDecision(false);
            p->SetAce(false);
            p->SetDoubleAce(false);
        }

        game.Deal(game.GetPlayers(), dealer, deck.GetDeck(), deck.GetSuitsDeck());
        game.SetCurrentHand(0);
        player->ShowDeck();
        dealer.ShowDeck();
        
        for (int i = 0; i < (int)game.GetPlayers().size(); i++) {
            if (game.IsSplitValid(game.GetPlayers(), i)) {
                std::cout << "Asking for split choice\n";
                GameWebSocketController::EventAPI(token, "{\"event\": \"playerSplitChoice\"}");
            }
        }

        Json::Value result;
        result["message"] = "Successful Connection";
        result["action"]  = action;
        callback(HttpResponse::newHttpJsonResponse(result));

    } catch (...) {}
}

void GameController::EndSession(const drogon::HttpRequestPtr &req,
        std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
    auto* session = getSession(req, callback);
    if (!session) return;
    auto& game   = *session->game;
    auto& dealer = game.GetDealerInstance();
    auto& deck = game.GetDeckInstance();
    std::cout << "Clearing data for session end\n";
    dealer.ClearHand();
    deck.ClearDeck();
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