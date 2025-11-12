#include "game.h"
#include "../socket/webSocket.h"
#define BLACKJACK 21
using namespace drogon;

void Game::push_back(const Player &p) {
	players.push_back(std::make_shared<Player>(p));
}

void Game::Deal(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck) {
	  int turn = 0;
	  while (turn < 2) {
		int current_card = deck.back();
		deck.pop_back();
		dealer.push_back(current_card);	
	 for (int i = 0; i < players.size(); i++) {
 		current_card = deck.back();
		deck.pop_back();
		players[i]->push_back(current_card);
		}
	 	turn ++;
	  }
	    Dealer_BlackJack(players, dealer, deck);
		Player_BlackJack(players, dealer, deck);
}

void Game::PlayerHit(std::vector<std::shared_ptr<Player>> &players, std::deque<int> &deck, int index) {
	if (deck.empty()) {
		std::cout << "Deck Is Empty: Time to reshuffle\n";
		return;
	}
	int current_card = deck.back();
	deck.pop_back();
	players[index]->push_back(current_card);
}

void Game::ClearHand(std::vector<std::shared_ptr<Player>> &players, int index)  {
	auto player = players[index];
	player->GetDeck().clear();
}

void Game::Insurance(std::vector<std::shared_ptr<Player>> &players, int index) {
	auto player = players[index];
	std::string name = player->GetName();
	//cout for testing, but later should be API to front
	std::cout << name << ", do you want Insurance?" << std::endl;
}

void Game::Push(std::vector<std::shared_ptr<Player>> &players, int index) {
		ClearHand(players, index);
}

void Game::Dealer_BlackJack(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck) {
	if (dealer.count() == BLACKJACK) {
		std::cout << "Dealer Blackjack!\n";
		int index = 0;
		for (auto player : players) {
			if (player->GetCount() == BLACKJACK) { 
				Push(players, index);							
				}	
			 	index ++;
		 	}
      }
}

void Game::Player_BlackJack(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck) {
	if (dealer.count() != BLACKJACK) {
		int index = 0;
		for (auto &player : players) {
			if (player->GetCount() == BLACKJACK) {
				std::cout << "Player Blackjack!\n";
				int payout = player->GetWager() * 1.5;
				int newBalance = payout + player->GetBalance();
				player->SetBalance(newBalance);
			}
		}
	}
}

void Game::PlayerDecisions(std::vector<std::shared_ptr<Player>> &players, std::deque<int> &deck, std::string action) {
	int index = 0;
	for (auto player : players) {
		SetCurrentPlayer(index);
		if (action == "hit") {
    			PlayerHit(players, deck, index);
				player->ShowDeck();
			try {	
				std::string animation = "{\"event\": \"hit\"}";
				GameWebSocketController::EventAPI(animation);
			} catch(const std::exception& e) {
				std::cerr << "Event API exception: " << e.what() << std::endl;
			}
			index ++;
	  }
	  	if (action == "stand") {
	  		std::string animation = "{\"event\": \"dealerHit\"}";
			GameWebSocketController::EventAPI(animation);
		}
	}
}	

void Game::Play(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck, int index) {
		std::cout << "Player Count: " << players[index]->GetCount() << std::endl;
			if (players[index]->GetCount() > 21) {
						std::cout << players[index]->GetName() << ", has busted!" << std::endl;
						ClearHand(players, index);
						std::string playerBust = "{\"event\": \"playerBust\"}";
						GameWebSocketController::EventAPI(playerBust);
		}
}

