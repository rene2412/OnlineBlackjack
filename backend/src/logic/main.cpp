#include <drogon/HttpAppFramework.h>
#include <iostream>
#include <vector>
#include <string>
#include "deck.h"
#include "game.h"
#include "../controller/controller.h"
#include "../socket/webSocket.h"
#include "../session/sessionManager.h"
using namespace std;

int main(int argc, char* argv[]) {

    drogon::app()
    //.addListener("0.0.0.0", 8080);
    .addListener("127.0.0.1", 8081);
    drogon::app().registerHandler("/api/.*",
    [](const drogon::HttpRequestPtr &req,
       std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k200OK);
        resp->addHeader("Access-Control-Allow-Origin", "http://localhost:5173");
        resp->addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        resp->addHeader("Access-Control-Allow-Headers", "Content-Type, X-Session-Token");
        callback(resp);
    },
    {drogon::Options}
);
    // /api/shuffle — receives the frontend shoe, initializes the deck and deals
    drogon::app().registerHandler("/api/shuffle",
        [](const drogon::HttpRequestPtr &req,
           std::function<void(const drogon::HttpResponsePtr &)> &&callback)
        {
            // Identify which session this request belongs to
            auto token = req->getHeader("X-Session-Token");
            auto* session = SessionManager::instance().getSession(token);
            if (!session) {
                auto resp = drogon::HttpResponse::newHttpResponse();
                resp->setStatusCode(drogon::k401Unauthorized);
                callback(resp);
                return;
            }

            auto& game = *session->game;
            auto& card_deck = game.GetDeckInstance();
            auto& dealer = game.GetDealerInstance();

            try {
                cout << "Regenerating new deck!\n";
                //clear the game state
                dealer.ClearHand();
                card_deck.ClearDeck();
                dealer.SetAce(false);
                game.SetCurrentHand(0);

                for (auto& player : game.GetPlayers()) {
                    player->SetBust(false);
                    player->ClearHand();
                    player->SetDecision(false);
                    player->SetAce(false);
                    player->SetDoubleAce(false);
                }


                auto json = req->getJsonObject();
                if (json && (*json)["deck"].isArray()) {
                    const auto &deckArray = (*json)["deck"];
                    cout << "Received deck for session " << token << endl;

                    for (const auto &val : deckArray) {
                        string card = val.asString();
                        if (card.empty()) continue;

                        char suit = card[0];
                        if (card[0] == 'A') {
                            card_deck.push_back(11);
                            card_deck.insertSuits(suit);
                            continue;
                        } else if (card[0] == 'K' || card[0] == 'J' || card[0] == 'Q') {
                            card_deck.push_back(10);
                            card_deck.insertSuits(suit);
                            continue;
                        }
                        int number = stoi(card);
                        card_deck.push_back(number);
                        card_deck.insertSuits(suit);
                    }

                    reverse(card_deck.GetDeck().begin(), card_deck.GetDeck().end());
                    reverse(card_deck.GetSuitsDeck().begin(), card_deck.GetSuitsDeck().end());

                    game.Deal(game.GetPlayers(), dealer,
                              card_deck.GetDeck(), card_deck.GetSuitsDeck());
                } else {
                    cout << "Error: No JSON deck received" << endl;
                }

                Json::Value responseJson;
                responseJson["status"] = "ok";
                auto resp = drogon::HttpResponse::newHttpJsonResponse(responseJson);
                callback(resp);

            } catch (std::exception &e) {
                cerr << "Exception in /api/shuffle: " << e.what() << endl;
                auto resp = drogon::HttpResponse::newHttpResponse();
                resp->setStatusCode(drogon::k500InternalServerError);
                callback(resp);
            }
        },
        {drogon::Post}
    );
drogon::app().registerHandler(".*",
    [](const drogon::HttpRequestPtr &req,
       std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k200OK);
        callback(resp);
    },
    {drogon::Options}
);

    drogon::app().run();
}