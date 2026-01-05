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
	int index;
	int currentHand;
	Dealer dealer;
	Deck deck;
	bool splitState;
	bool OnDeal;
  public:
	Game() {
		index = 0;
		currentHand = 0;
		splitState = false;
		OnDeal = false;
	}
	
	std::vector<std::shared_ptr<Player>>& GetPlayers() { return players; } 
	int GetCurrentPlayer() const { return index; } 
	int GetCurrentHand() const { return currentHand; }
	void SetCurrentPlayer(int newPlayer) { index = newPlayer; }
    bool GetSplitState() const { return splitState; }
	bool GetOnDeal() const { return OnDeal; }
    
	void SetSplitState(bool newState) { splitState = newState; }
	void SetOnDeal(bool newDeal) { OnDeal = newDeal; }
	void SetCurrentHand(int newHand) {currentHand = newHand; }

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
	
	int DealerStand(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck);
	int DetermineAceHandValue(std::vector<std::shared_ptr<Player>> &players, int index);
	int DetermineDealerAceHandValue(Dealer &dealer);
	int DetermineAceMultipleHandsValue(std::vector<std::shared_ptr<Player>> &players, int playerIndex, int handIndex);
	bool IsSplitValid(std::vector<std::shared_ptr<Player>> &players, int index);
	void push_back(const Player &p); 
	void Split(std::vector<std::shared_ptr<Player>> &players, std::deque<int> &deck, std::deque<char> &suitDeck, int index, std::string action);
	void HitMultipleHands(std::vector<std::shared_ptr<Player>> &players, std::deque<int> &deck, int index);
	void Shuffle();
	void ResetHands(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer);
	void Deal(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck, std::deque<char> &suits);
	void PlayerHit(std::vector<std::shared_ptr<Player>> &players, std::deque<int> &deck, int index);
	void ClearHand(std::vector<std::shared_ptr<Player>> &players, int index);
	void Push(std::vector<std::shared_ptr<Player>> &players, int index);
	void Insurance(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer);
	void Dealer_BlackJack(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck);
	void Player_BlackJack(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck);
	void PlayerDecisions(std::vector<std::shared_ptr<Player>> &players, std::deque<int> &deck, Dealer &dealer, std::string action);
	void Play(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck, int index);
};

