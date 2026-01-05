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
        if (action == "yes") {
            std::cout << "HTTP Request: Ready to split\n";
            game.SetSplitState(true);
            game.SetOnDeal(true);
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
        auto resp = drogon::HttpResponse::newHttpJsonResponse(
            Json::Value("Invalid split action payload"));
        resp->setStatusCode(drogon::k400BadRequest);
        callback(resp);
        return;
    }

    std::string action = (*json)["action"].asString();
    int handIndex = (*json)["handIndex"].asInt();
    std::cout << "MADE IT TO SPLIT DECISION HTTP\n";
    auto &game = Game::GetGameInstance();
    auto &deck = game.GetDeckInstance();
    if (!game.GetSplitState()) {
        callback(drogon::HttpResponse::newHttpResponse());
        return;
    }

    if (action == "hit") {
        std::cout << "Ready To HIT hand: " << game.GetCurrentHand() << std::endl;
        game.Split(game.GetPlayers(), deck.GetDeck(), deck.GetSuitsDeck(), 0, action); 
        std::cout << "Made it Past SPLIT\n";
        game.SetOnDeal(false);
    }
    else if (action == "stand") {
        int nextHand = game.GetCurrentHand() + 1;
        game.SetCurrentHand(nextHand);
    }

    Json::Value result;
    result["ok"] = true;
    callback(drogon::HttpResponse::newHttpJsonResponse(result));
}
