#include <drogon/HttpAppFramework.h>
#include <iostream>
#include <vector>
#include <string>
#include "deck.h"
#include "game.h"
#include "../controller/controller.h"
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
int main() {
    vector<string> json_text;

    int player_count;
    cout << "Dealer: \"How Many Players?\"?" << endl; 
    cin >> player_count;
    if (player_count == 1) {
	  Player player("Rene Hernandez", 100, 0, 0); 
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
    		for (const auto &val : deckArray) {
		    //json_text.push_back(val.asString());
		    string card = val.asString();
	    	if (card == "A") card = "1";
		    if (card == "K") card = "10";
		    if (card == "J") card = "10";
		    if (card == "Q") card = "10";
		    int number = stoi(card);
		    card_deck.push_back(number);
		}
	    reverse(card_deck.GetDeck().begin(), card_deck.GetDeck().end());
		game.Deal(game.GetPlayers(), dealer, card_deck.GetDeck());
		PrintDealerHand();
		PrintPlayerHands();
		game.Play(game.GetPlayers(), dealer, card_deck.GetDeck(), 0);
		}
		else {
                cout << "Error: No JSON received" << endl;
			}         
			auto resp = drogon::HttpResponse::newHttpJsonResponse({{"status", "ok"}});
            callback(resp);
		}   
	} catch(...) {
		std::cerr << "Unknown exception in api/shuffle\n";
		}
	},
        {drogon::Post}
    );
    
    drogon::app().run();
}
