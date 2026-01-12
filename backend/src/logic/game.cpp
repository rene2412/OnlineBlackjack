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

int Game::DetermineAceMultipleHandsValue(std::vector<std::shared_ptr<Player>> &players, int playerIndex, int handIndex) {
	auto &playerHands = players[playerIndex]->GetSplitHands();
	auto &currentHand = playerHands[handIndex]; 
	 if (players[index]->DoubleMultiHandAce(currentHand) == true) {
			players[index]->multiHandCardAt(currentHand, 0) = 1;
			return ACE_11;
	 }
	for (int x : currentHand) {
		if (x == ACE_11) {
			 int sum = players[index]->GetMultiHandCount(currentHand) + ACE_11;
			 if (sum > 21) {	    
					return ACE_1;
			 	}
			else return ACE_11;
			 }
		}
	if (players[index]->GetMultiHandCount(currentHand) + ACE_11 > 21) {
		return ACE_1;
	}  
	else return ACE_11; 
}

void Game::Deal(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck, std::deque<char> &suits) {
	  SetOnDeal(true);
	  int turn = 0;
	  while (turn < 2) {
		int current_card = deck.back();
		char current_suit = suits.back();
		deck.pop_back();
		suits.pop_back();
			if (current_card == 11) { //ace defaults to 11
				dealer.SetAce(true); 
				std::cout << "sending card to ace func\n";
				current_card = DetermineDealerAceHandValue(dealer);
		}
		dealer.push_back(current_card);
		dealer.insert_suits(current_suit);
	 for (int i = 0; i < players.size(); i++) {
 		current_card = deck.back();
		current_suit = suits.back();
		deck.pop_back();
		suits.pop_back();
		if (current_card == ACE_11) { //ace defaults to 11
				players[i]->SetAce(true); 
				std::cout << "sending card to ace func\n";
				current_card = DetermineAceHandValue(players, i);
		}
			players[i]->push_back(current_card);
			players[i]->insert_suits(current_suit);
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

bool Game::IsSplitValid(std::vector<std::shared_ptr<Player>> &players, int index) {
	auto &playerSuitHand = players[index]->GetCardSuits();
	char firstCard = playerSuitHand[0]; 
	char secondCard =  playerSuitHand[1];
	if (firstCard == secondCard) {
		return true;
	}
	else return false;
}

void Game::Split(std::vector<std::shared_ptr<Player>> &players, std::deque<int> &deck, std::deque<char>& suitDeck, int index, std::string action) {
	if (IsSplitValid(players, index))  {
		if (GetOnDeal()) {
			int deckSize = players[index]->GetDeck().size();
			std::deque<int> firstHand, secondHand; 
			int firstCard = players[index]->cardAt(0);
			int secondCard = players[index]->cardAt(1);
			std::string sendFirstCounter =  "{\"firstSplitCounter\":  " + std::to_string(firstCard) + "}";
			GameWebSocketController::EventAPI(sendFirstCounter);
			if (secondCard == 1) {
			//this is 2nd ace, but in its own seperate hand it should count as 11
			secondCard = 11;
			//make the 2nd card of the original hand worth 11
			players[index]->replace(1, 11);
			std::string sendSecondCounter =  "{\"secondSplitCounter\": " + std::to_string(secondCard) + "}";
			GameWebSocketController::EventAPI(sendSecondCounter);
			}
			firstHand.push_back(firstCard);
			secondHand.push_back(secondCard);
			players[index]->insertHands(firstHand);
			players[index]->insertHands(secondHand);
			}
	  	char firstSuit = players[index]->suitCardAt(0);
	  	char nextSuit = suitDeck.back();
 	  	int nextCard = deck.back();
		int currentHand = GetCurrentHand();
		//will hit one card to the furthest left hand (0)
	 	HitMultipleHands(players, deck, index);
		//what if the next card is the same as the 2 cards in players hands
  		if (nextSuit == firstSuit) {
			suitDeck.pop_back();
			deck.pop_back();

		//if the next card is the same, ask user if they want to keep splitting, send api here
		std::string split = "{\"event\": \"playerSplitChoice\"}";
		GameWebSocketController::EventAPI(split);
		if (action == "yes") {
			    std::cout << "Create the split hand!\n";
				players[index]->push_back(nextCard); //push next split card into the original
				//if they do want to keep splitting run logic here
				std::deque<int> newHand; //create the newHand and push into the vector of hands
				newHand.push_back(nextCard);
				players[index]->insertHands(newHand);	
				std::string newSplitCounter =  "{\"newSplitCounter\": " + std::to_string(nextCard) + "}";
			    GameWebSocketController::EventAPI(newSplitCounter);
			}
		}
		//move on to next card and exit the loop if theres no more matching that qualifies for splitting
		 nextSuit = suitDeck.back();
		 nextCard = deck.back();
	}
}

void Game::HitMultipleHands(std::vector<std::shared_ptr<Player>> &players, std::deque<int> &deck, int index) {
	int currentHand = GetCurrentHand();
	std::cout << "Current Hand: " << currentHand << std::endl;
	auto &playerSplitHands = players[index]->GetSplitHands();
	auto &hand = playerSplitHands[currentHand];
	//print the hands
		   for (int x : hand) {
			std::cout << "Hand: " << currentHand << "| Current Card: " << x << std::endl;
		   }
		if (deck.empty()) {
			std::cout << "Deck Is Empty: Time to reshuffle\n";
			return;
		}
	   if (players[index]->didSplitHandBust(hand)) {
		 std::cout << "Player Hand has busted" << std::endl;  
			return;
		}
			int nextCard = deck.back();
			deck.pop_back();
			int firstCard = hand[0];
			int currentCount = players[index]->GetMultiHandCount(hand);
		//send the card to the front end
		std::string splitHit = "{\"event\": \"splitHit\", \"currentHandCount\": " + std::to_string(currentCount) + ", \"currentHand\": " + std::to_string(currentHand) + ",\"firstCard\": " + std::to_string(firstCard) + "}";
		GameWebSocketController::EventAPI(splitHit);
		if (firstCard == 11) { 
				players[index]->SetAceHand(currentHand, true); 
		}
		if (nextCard == 11) {
			if (!players[index]->GetAceHand(currentHand)) {
				players[index]->SetAceHand(currentHand, true); 
			}
				nextCard = DetermineAceMultipleHandsValue(players, index, currentHand);
		}
		if (players[index]->GetAceHand(currentHand)) {
			if (nextCard + players[index]->GetMultiHandCount(hand) > 21) {
				for (int j = 0; j < hand.size(); j++) {
						if (hand[j] == 11) {
							players[index]->multiHandCardAt(hand, j) = 1;
							break;
						}
				  }
			}
		}
		players[index]->insertIntoHand(nextCard, currentHand);
		currentCount = players[index]->GetMultiHandCount(hand);
		std::string updateCount = "{\"event\": \"updateCount\", \"count\": " + std::to_string(currentCount) + "}";
		GameWebSocketController::EventAPI(updateCount);
		for (int x : hand) { std::cout << "Hand: " << currentHand << "| Current Card: " << x << std::endl; }  
		//this bust will run the hands are still active, 
		if (players[index]->didSplitHandBust(hand)) {
		 	std::cout << "Player Hand: " << currentHand << " has busted!" << std::endl;
			std::string playerBust = "{\"event\": \"playerSplitBust\", \"hand\": " + std::to_string(currentHand) + "}";
			GameWebSocketController::EventAPI(playerBust);
			return;
		}
	}

void Game::HandleSplitStand(std::vector<std::shared_ptr<Player>> &players, Game &game, Dealer &dealer, std::deque<int> &deck, int currentHand, int index) {
	int finalHand = players[index]->GetSplitHands().size();
	if (currentHand >= finalHand) {
			int count = game.DealerStand(players, dealer, deck);
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
			GameWebSocketController::EventAPI(animation);
			SplitPlay(players, dealer, deck);
	}
}

void Game::SplitPlay(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck) {
	//will run after the entire players hands have been decided, so player cant bust here since they cant exceed more cards. The bust code happens in the HitMultipleFunctions 
	int currentHand = 0;
	int currentPlayer = 0;
	for (auto& player : players) {
			for (auto& hand : player->GetSplitHands()) {
					int handCount = player->GetMultiHandCount(hand);
				    bool hasHandBusted = player->didSplitHandBust(hand);   
					if (hasHandBusted) continue;
					//push
					if (hasHandBusted == false and handCount == dealer.count()) {
							std::string splitPush = "{\"event\": \"playerSplitPush\", \"handCount\": " + std::to_string(currentHand) + "}";
							GameWebSocketController::EventAPI(splitPush);
					}
					//player Hand beats dealers
					if ((hasHandBusted == false and handCount > dealer.count() and dealer.count () <= 21) or (dealer.count() > 21 and hasHandBusted == false)) {
							int payout = player->GetWager() * 2;
							int newBalance = player->GetBalance() + payout;
							player->SetBalance(newBalance);
							std::string splitPlayerWin = "{\"event\": \"playerSplitWin\", \"handCount\": " + std::to_string(currentHand) + ", \"updateBalance\": " + std::to_string(newBalance) + "}";
							GameWebSocketController::EventAPI(splitPlayerWin);
					}
					//dealer beats player hand
					if (hasHandBusted == false and  (handCount < dealer.count() and dealer.count() < 21)) {
							int payLoss = player->GetWager() * 2;
							int newBalance = player->GetBalance() - payLoss;
							if (newBalance < 0) newBalance = 0;
							player->SetBalance(newBalance);
							std::string splitDealerWin = "{\"event\": \"dealerSplitWin\", \"handCount\": " + std::to_string(currentHand) + ", \"updateBalance\": " + std::to_string(newBalance) + "}";
							GameWebSocketController::EventAPI(splitDealerWin);
					}
			}
	 currentPlayer ++;
	 currentHand ++;
	}
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

