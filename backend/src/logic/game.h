#pragma once
#include "player.h"
#include "dealer.h"
#include "deck.h"
#include <deque>
#include <vector>
#include <memory>
#include <drogon/HttpController.h>

class Game {
   private:
   	std::vector<std::shared_ptr<Player>> players;
    int index = 0;
	Dealer dealer;
	Deck deck;
  public:
	Game() = default;
	
	std::vector<std::shared_ptr<Player>>& GetPlayers() { return players; } 
	int GetCurrentPlayer() const { return index; } 
	void SetCurrentPlayer(int newPlayer) { index = newPlayer; }

	static Game& GetGameInstance() {
		static Game instance;
		return instance;
	}
	
	Dealer &GetDealerInstance() {
		return dealer;
	}

	Deck &GetDeckInstance() {
		return deck;
	}
	
	void push_back(const Player &p); 
	void Shuffle();
	void Deal(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck);
	void PlayerHit(std::vector<std::shared_ptr<Player>> &players, std::deque<int> &deck, int index);
	void ClearHand(std::vector<std::shared_ptr<Player>> &players, int index);
	void Push(std::vector<std::shared_ptr<Player>> &players, int index);
	void Insurance(std::vector<std::shared_ptr<Player>> &players, int index);
	void Dealer_BlackJack(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck);
	void Player_BlackJack(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck);
	void PlayerDecisions(std::vector<std::shared_ptr<Player>> &players, std::deque<int> &deck, std::string action);
	void Play(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck, int index);
};

