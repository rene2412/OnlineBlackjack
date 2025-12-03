#include <drogon/HttpAppFramework.h>
#include <iostream>
#include <vector>
#include <string>
#include "deck.h"
#include "game.h"
#include "../controller/controller.h"
#include "../socket/webSocket.h"
using namespace std;

Game& game = Game::GetGameInstance();
Deck &card_deck = game.GetDeckInstance();
Dealer &dealer = game.GetDealerInstance();

void PrintPlayerHands() {
	for (auto &p : game.GetPlayers()) {
				p->ShowDeck(); 
			} 
	}	

void PrintDealerHand() {
	dealer.ShowDeck();
}
int main(int argc, char* argv[]) {
    vector<string> json_text;

    int player_count;
	stringstream input(argv[1]);
	input >> player_count;
	cout << "Dealer: \"How Many Players?\"?" << endl; 
    if (player_count == 1) {
	  Player player("Rene Hernandez", 100, 0, 0, false); 
	  game.push_back(player);
    }

    drogon::app()
        .addListener("0.0.0.0", 8080)
        .setDocumentRoot("../../dist");
    
    //Load config file
    drogon::app().registerHandler("/api/shuffle",
        [&card_deck, &game, &dealer](const drogon::HttpRequestPtr &req,
           std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
      try {        
			auto json = req->getJsonObject();
            if (json) { 
	     if ((*json)["deck"].isArray()) { 
		const auto &deckArray = (*json)["deck"];  
		cout << "Received deck: " << json->toStyledString() << endl;
		 card_deck.GetDeck().clear();
		 for (const auto &val : deckArray) {
		    //json_text.push_back(val.asString());
		    string card = val.asString();
			if (card.empty()) {
				continue;
			}
	    	if (card[0] == 'A') { 
				card_deck.push_back(1);
				continue;
			}
		    else if (card[0] == 'K' or card[0] == 'J' or card[0] == 'Q') { 
				card_deck.push_back(10);
				continue;
			}
		    	int number = stoi(card);
		    	card_deck.push_back(number);
		}
	    reverse(card_deck.GetDeck().begin(), card_deck.GetDeck().end());
		game.Deal(game.GetPlayers(), dealer, card_deck.GetDeck());
		/*
		int playerCount = game.GetPlayer()[0]->GetCount();
        string updateCount = "{\"event\": \"updateCount\", \"count\": " + std::to_string(playerCount) + "}";
		GameWebSocket::EventAPI(updateCount);
		*/
		PrintDealerHand();
		PrintPlayerHands();
		}
		else {
                cout << "Error: No JSON received" << endl;
			}         
			Json::Value responseJson;
			responseJson["status"] = "ok";
			auto resp = drogon::HttpResponse::newHttpJsonResponse(responseJson);
			callback(resp);
		}   
	} catch(std::exception &e) {
		std::cerr << "Unknown exception in api/shuffle: " << e.what() << std::endl;
		  auto resp = drogon::HttpResponse::newHttpResponse();
    		resp->setStatusCode(drogon::k500InternalServerError);
    		callback(resp);
		}
	},
        {drogon::Post}
    );
    
    drogon::app().run();
}
