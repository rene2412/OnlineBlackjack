#include <drogon/HttpAppFramework.h>
#include <iostream>
#include <vector>
#include <string>
#include "deck.h"
#include "game.h"

using namespace std;

int main() {
    vector<string> json_text;
    Deck card_deck;
    Game game;
    Dealer dealer;

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
    //drogon::app().loadConfigFile("../config.json");
    drogon::app().registerHandler("/api/shuffle",
        [&card_deck, &game, &dealer](const drogon::HttpRequestPtr &req,
           std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
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
		    try {
		    int number = stoi(card);
		    card_deck.push_back(number);
		    } catch(...) {}	    
		  }
		}
		for (int x : card_deck.GetDeck()) {
			cout << x << endl;
     		} 
		game.Deal(game.GetPlayers(), dealer, card_deck.GetDeck());
	  	dealer.ShowDeck();
	   	for (auto &p : game.GetPlayers()) {
			p->ShowDeck(); 
		}
	    }
	    else
                cout << "Error: No JSON received" << endl;
            
            auto resp = drogon::HttpResponse::newHttpJsonResponse({{"status", "ok"}});
            callback(resp);
        },
        {drogon::Post}
    );
    
    drogon::app().run();
}
