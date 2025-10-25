#pragma once
#include "player.h"
#include "dealer.h"
#include <deque>
#include <vector>
#include <memory>

class Game {
   private:
	std::vector<std::shared_ptr<Player>> players;
   public:
	Game() = default;
	
	std::vector<std::shared_ptr<Player>>& GetPlayers() { return players; } 

	void push_back(const Player &p); 
	void Shuffle();
	void Deal(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck);
	void PlayerHit(std::vector<std::shared_ptr<Player>> &players, std::deque<int> &deck, int index);
	void ClearHand(std::vector<std::shared_ptr<Player>> &players, int index);
	void Push(std::vector<std::shared_ptr<Player>> &players, int index);
	void Insurance(std::vector<std::shared_ptr<Player>> &players, int index);
	void Dealer_BlackJack(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck);
	void PlayerDecisions(std::vector<std::shared_ptr<Player>> &players, std::deque<int> &deck);
	void Play(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck);

};
