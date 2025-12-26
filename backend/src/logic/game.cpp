#include "game.h"
#include "../socket/webSocket.h"
#define BLACKJACK 21
using namespace drogon;
const int ACE_11 = 11;
const int ACE_1 = 1;

void Game::push_back(const Player &p) {
	players.push_back(std::make_shared<Player>(p));
}

int Game::DetermineAceHandValue(std::vector<std::shared_ptr<Player>>& players, int index) {
	auto &playerHand = players[index]->GetDeck();
	//Case 0: Player Draws 2 Aces at the start
	 if (players[index]->DoubleAce() == true) {
			std::cout << "Case 0\n";
			//throw split API
			players[index]->cardAt(0) = 1;
			return ACE_11;
	 }
	
	//Case 1: PlayerHand already has an ace in their hand
	for (int x : playerHand) {
		if (x == ACE_11) {
			std::cout << "Case 1\n";
			 int sum = players[index]->GetCount() + ACE_11;
			 if (sum > 21) {	    
					return ACE_1;
			 	}
			else return ACE_11;
			 }
		}
	//Case 2: Ace is drawn after the default game start draw
	if (players[index]->GetCount() + ACE_11 > 21) {
		std::cout << "Case 2\n";
		return ACE_1;
	}  
	else return ACE_11;   
}

int Game::DetermineDealerAceHandValue(Dealer &dealer)  {
		 if (dealer.DoubleAce() == true) {
			dealer.cardAt(0) = 1;
			return ACE_11;
	 }
	auto& dealerHand = dealer.GetDealerCards();
	//Case 1: PlayerHand already has an ace in their hand
	for (int x : dealerHand) {
		if (x == ACE_11) {
			std::cout << "Case 1\n";
			 int sum = dealer.count() + ACE_11;
			 if (sum > 21) {	    
					return ACE_1;
			 	}
			else return ACE_11;
			 }
		}
	//Case 2: Ace is drawn after the default game start draw
	if (dealer.count() + ACE_11 > 21) {
		std::cout << "Case 2\n";
		return ACE_1;
	}  
	else return ACE_11;  
} 

void Game::Deal(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck) {
	  int turn = 0;
	  while (turn < 2) {
		int current_card = deck.back();
		deck.pop_back();
			if (current_card == 11) { //ace defaults to 11
				dealer.SetAce(true); 
				std::cout << "sending card to ace func\n";
				current_card = DetermineDealerAceHandValue(dealer);
		}
		dealer.push_back(current_card);	
	 for (int i = 0; i < players.size(); i++) {
 		current_card = deck.back();
		deck.pop_back();
		if (current_card == 11) { //ace defaults to 11
				players[i]->SetAce(true); 
				std::cout << "sending card to ace func\n";
				current_card = DetermineAceHandValue(players, i);
		}
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
     		if (current_card == 11) { 
				players[index]->SetAce(true); 
				std::cout << "sending card to ace func\n";
				current_card = DetermineAceHandValue(players, index);
		}
		if (players[index]->GetAce()) {
			if (current_card + players[index]->GetCount() > 21) {
				std::cout << "Modifying Player Ace Hand Deck\n";
				auto &playerHand = players[index]->GetDeck();
				for (int j = 0; j < playerHand.size(); j++) {
						if (playerHand[j] == 11) {
							players[index]->cardAt(j) = 1;
							break;
						}
				  }
			}
		}

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

void Game::Insurance(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer) {
		if (dealer.firstCard() == 10) {
			for (auto &player : players) {
				//cout for testing, but later should be API to front
				std::cout << player->GetName() << ", do you want Insurance?" << std::endl;
			}
				std::string playerInsuranceChoice =  "{\"event\": \"playerInsuranceChoice\"}";
				GameWebSocketController::EventAPI(playerInsuranceChoice);
	}
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
	if (dealer.count() >= 17) {
		return 0;
	}
	int animationCount = 0;
	while (dealer.count() < 17) {
	   if (deck.empty()) {
			std::cout << "Time for Reshuffle\n";
			return -1;
		}
		int current_card = deck.back();
		deck.pop_back();           
		 if (current_card == 11) { 
				dealer.SetAce(true); 
				std::cout << "sending card to ace func\n";
				current_card = DetermineDealerAceHandValue(dealer);
		}
		if (dealer.GetAce()) {
			if (current_card + dealer.count() > 21) {
				std::cout << "Modifying Player Ace Hand Deck\n";
				auto &dealerHand = dealer.GetDealerCards();
				for (int j = 0; j < dealerHand.size(); j++) {
						if (dealerHand[j] == 11) {
							dealer.cardAt(j) = 1;
							break;
						}
				  }
			}
		}
		dealer.push_back(current_card);
		dealer.ShowDeck();
		std::cout << "Dealer Count: " << dealer.count() << std::endl;
		animationCount ++;
	}
	return animationCount;
 }

void Game::PlayerDecisions(std::vector<std::shared_ptr<Player>> &players, std::deque<int> &deck, Dealer &dealer, std::string action) {
	int index = 0;
	for (auto &player : players) {
		SetCurrentPlayer(index);
		std::cout << player->GetName() << ": " <<  player->GetCount() << std::endl;
		if (!player->GetBust()) {
			if (action == "hit") {
				player->SetDecision(1);
    			PlayerHit(players, deck, index);
				player->ShowDeck();
				Play(players, dealer, deck, index);
				int playerCount = player->GetCount();
				std::string updateCount = "{\"event\": \"updateCount\", \"count\": " + std::to_string(playerCount) + "}";
				GameWebSocketController::EventAPI(updateCount);
			try {
				if (player->GetCount() <= 21) {
					std::cout << "Sending Hit API but hasnt busted yet\n";	
					std::string animation = "{\"event\": \"hit\"}";
					GameWebSocketController::EventAPI(animation);
				}
			} catch(const std::exception& e) {
				std::cerr << "Event API exception: " << e.what() << std::endl;
			}
			index ++;
	  }
	  	if (action == "stand") {
			int count = DealerStand(players, dealer, deck);
			std::cout << "Turn: " << count << std::endl;
	  		std::string animation = "{\"event\": \"dealerHit\", \"count\": " + std::to_string(count) + ", \"values\": [";
			for (auto &x : dealer.GetSum()) {
				std::cout << x << ", " << std::endl;
			}
			for (size_t i = 1; i < dealer.GetSum().size(); i++) {
				animation += std::to_string(dealer.GetSum()[i]);
				if (i < dealer.GetSum().size() - 1) {
					animation += ",";
				}
			}
			animation += "]}";
			std::cout << "Dealer Hand: " << animation << std::endl;
			GameWebSocketController::EventAPI(animation);
			player->SetDecision(0);
			Play(players, dealer, deck, index);
			}
		}
	}
}	

void Game::Play(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck, int index) {
		std::cout << "Player Count: " << players[index]->GetCount() << std::endl;
			if (players[index]->GetCount() > 21) {
						int playerBalance = players[index]->GetBalance();
						int playerWager = players[index]->GetWager();
						playerBalance = playerBalance - playerWager;
						players[index]->SetBalance(playerBalance);
						players[index]->SetBust(true);
			}
			if (players[index]->GetBust() == true) {
						std::cout << players[index]->GetName() << ", has busted!"  << std::endl;	
						std::cout << "Balance: $" << players[index]->GetBalance() << std::endl;
						std::cout << "Sending Busted API\n";	
						std::string playerBust = "{\"event\": \"playerBust\", \"playerName\": \"" + players[index]->GetName() + "\"}";
						std::cout << "PlayerBust API: " << playerBust << std::endl;
						GameWebSocketController::EventAPI(playerBust);
						return;
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
				std::string dealerBust = "{\"event\": \"dealerBust\"}";
				GameWebSocketController::EventAPI(dealerBust);
				return;
			}
				for (auto &player : players) {
					if (player->GetCount() == 21 and player->GetDecision() == 0) {
						std::cout << "Player is at 21" << std::endl;
					}
					if ((dealer.count() <= 21 and dealer.count() >= 17) and player->GetDecision() == 0) {
						if (player->GetCount() < dealer.count()) {
						std::cout << "Dealer Beats: " << player->GetName() << std::endl;
						int playerBalance = player->GetBalance();
						int playerWager = player->GetWager();
						playerBalance = playerBalance - playerWager;
						player->SetBalance(playerBalance);
						std::string dealerWin = "{\"event\": \"dealerWin\"}";
						GameWebSocketController::EventAPI(dealerWin);
					}
				}
				if (dealer.count() >= 17 and player->GetCount() >= 17 and player->GetDecision() == 0) {
					if (dealer.count() == player->GetCount()) {
					std::cout << "Push!" << std::endl;
					Push(players, index);
					std::string animation =  "{\"event\": \"push\"}";
					GameWebSocketController::EventAPI(animation);
					}
				}
				if (player->GetDecision() == 0 and (player->GetCount() <= 21 and dealer.count() < 21) and player->GetCount() > dealer.count()) {
					std::cout << player->GetName() <<  " wins!" << std::endl;
					std::string playerName = "{\"event\": \"playerWin\"}";
					GameWebSocketController::EventAPI(playerName);
				}
			}
	  }

