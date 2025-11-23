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
	if (players[index]->GetBust() == true) {
		return;
	}
	int current_card = deck.back();
	deck.pop_back();
	players[index]->push_back(current_card);
}

void Game::ClearHand(std::vector<std::shared_ptr<Player>> &players, int index)  {
	auto player = players[index];
	player->ClearHand();
}

void Game::ResetHands(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer) {
	for (auto &player : players) {
			player->ClearHand();
	}
	dealer.ClearHand();
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

int Game::DealerStand(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck) {
	if (dealer.count() > 17) {
		return 0;
	}
	int animationCount = 0;
	while (dealer.count() <= 17) {
	   if (deck.empty()) {
			std::cout << "Time for Reshuffle\n";
			return -1;
		}
		int card = deck.back();
		deck.pop_back();
		dealer.push_back(card);
		dealer.ShowDeck();
		std::cout << "Dealer Count: " << dealer.count() << std::endl;
		animationCount ++;
	}
	return animationCount;
 }

void Game::PlayerDecisions(std::vector<std::shared_ptr<Player>> &players, std::deque<int> &deck, Dealer &dealer, std::string action) {
	int index = 0;
	for (auto player : players) {
		SetCurrentPlayer(index);
		if (action == "hit" and player->GetCount() < 21) {
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
			int count = DealerStand(players, dealer, deck);
	  		std::string animation = "{\"event\": \"dealerHit\", \"count\": " + std::to_string(count) + "}";
			GameWebSocketController::EventAPI(animation);
		}
	}
}	

void Game::Play(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck, int index) {
		std::cout << "Player Count: " << players[index]->GetCount() << std::endl;
			if (players[index]->GetCount() > 21) {
						ClearHand(players, index);
						int playerBalance = players[index]->GetBalance();
						int playerWager = players[index]->GetWager();
						playerBalance = playerBalance - playerWager;
						players[index]->SetBalance(playerBalance);
						players[index]->SetBust(true);
			}
			if (players[index]->GetBust() == true) {
						std::cout << players[index]->GetName() << ", has busted!"  << std::endl;	
						std::cout << "Balance: $" << players[index]->GetBalance() << std::endl;
						std::cout << "Sending  API\n";
						std::string playerBust = "{\"event\": \"playerBust\"}";
						GameWebSocketController::EventAPI(playerBust);
			}
			if (dealer.count() > 21) {
				std::cout << "Dealer Bust!" << std::endl;
				for (auto &player : players) {
					if (player->GetBust() == false) {
						int playerBalance = player->GetBalance();
						int playerWager = player->GetWager();
						playerBalance = playerBalance + playerWager;
						player->SetBalance(playerBalance);
					}
				}
				ResetHands(players, dealer);
				std::string dealerBust = "{\"event\": \"dealerBust\"}";
				GameWebSocketController::EventAPI(dealerBust);
				return;
			}
			if (dealer.count() >= 18) {
				for (auto &player : players) {
					if (player->GetCount() < dealer.count()) {
						player->ClearHand();
						int playerBalance = player->GetBalance();
						int playerWager = player->GetWager();
						playerBalance = playerBalance - playerWager;
						player->SetBalance(playerBalance);
						std::string playerLoss = "{\"event\": \"playerLoss\"}";
						GameWebSocketController::EventAPI(playerLoss);
					}
				}
			}

	  }

