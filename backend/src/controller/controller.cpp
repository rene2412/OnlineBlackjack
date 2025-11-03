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
        game.PlayerDecisions(game.GetPlayers(), deck.GetDeck(), action);
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
