#include "game.h"
#define BLACKJACK 21

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


void Game::Push(std::vector<std::shared_ptr<Player>> &players) {
		ClearHand(players);
}

void Game::Dealer_BlackJack(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck) {
	if (dealer.count() == BLACKJACK) {
		for (auto &player : players) {
			if (player->count() == BLACKJACK) { 
				Push(players);							
			 }	
		 }
         }

}


void Game::Play(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck) {
	for (int i = 0; i < players.size(); i++) {
		auto player = players[i];
		Dealer_BlackJack(players, dealer, deck);
		if (dealer.count() > player->count()) {
			//do tmmmrw
		}	
	}
}
