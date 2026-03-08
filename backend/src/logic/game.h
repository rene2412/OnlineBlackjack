#pragma once
#include "player.h"
#include "dealer.h"
#include "deck.h"
#include <deque>
#include <vector>
#include <memory>
#include <chrono>
#include <cstdint>
#include <iostream>
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

	// WS send callback — set once per session, used by all game methods
	std::function<void(const std::string&)> eventCallback_;

public:
	Game() {
		index       = 0;
		currentHand = 0;
		splitState  = false;
		OnDeal      = false;
	}

	// Inject the send function for this session
	void SetEventCallback(std::function<void(const std::string&)> cb) {
		eventCallback_ = std::move(cb);
	}

	// All game code calls this instead of GameWebSocketController::EventAPI directly
	void SendEvent(const std::string& msg) {
    if (eventCallback_) {
        std::cout << "SendEvent firing: " << msg.substr(0, 60) << std::endl;
        eventCallback_(msg);
    } 
	else {
       	 std::cout << "SendEvent: NO CALLBACK SET" << std::endl;
 	   }
	}
	std::vector<std::shared_ptr<Player>>& GetPlayers() { return players; }
	int  GetCurrentPlayer() const  { return index; }
	int  GetCurrentHand()   const  { return currentHand; }
	void SetCurrentPlayer(int newPlayer) { index = newPlayer; }
	bool GetSplitState()    const  { return splitState; }
	bool GetOnDeal()        const  { return OnDeal; }
	void SetSplitState(bool newState)  { splitState = newState; }
	void SetOnDeal(bool newDeal)       { OnDeal = newDeal; }
	void SetCurrentHand(int newHand)   { currentHand = newHand; }

	static Game& GetGameInstance() {
		static Game instance;
		return instance;
	}

	Dealer& GetDealerInstance() { return dealer; }
	Deck&   GetDeckInstance()   { return deck;   }

	int  DealerStand(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck);
	int  DetermineAceHandValue(std::vector<std::shared_ptr<Player>> &players, int index);
	int  DetermineDealerAceHandValue(Dealer &dealer);
	int  DetermineAceMultipleHandsValue(std::vector<std::shared_ptr<Player>> &players, int playerIndex, int handIndex);
	bool IsSplitValid(std::vector<std::shared_ptr<Player>> &players, int index);
	void DoubleDown(std::vector<std::shared_ptr<Player>> &players, int playerIndex);
	void push_back(const Player &p);
	void Split(std::vector<std::shared_ptr<Player>> &players, std::deque<int> &deck, int index, std::string action);
	void HitMultipleHands(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck, int index);
	void HandleSplitStand(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck, int currentHand, int index);
	void Shuffle();
	void SplitPlay(std::vector<std::shared_ptr<Player>> &players, Dealer &dealer, std::deque<int> &deck);
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