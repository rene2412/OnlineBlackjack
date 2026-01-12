#pragma once 
#include <string>
#include <deque>
#include <vector>
#include <cstdint>
#include <iostream>

#define stand 0
#define hit 1

class Player {
   private:
	   std::deque<int> cards;
	   std::deque<int> suits;
	   std::vector<std::deque<int>> splitHands; //for splitting, so create a vector of hands
	   std::vector<uint8_t> doesHandContainAce; //a vector of "bools" that determines if that hand has an ace in it
	   std::string name;
	   int player_count;
	   int balance;
	   int score;
	   int wins; 
	   int losses;
	   int wager;
	   bool ace;
	   bool bust;
	   bool decision; //0 for stand, 1 for hit
   public:
	   Player() = default;
	   Player(std::string new_name, int new_balance = 100, int new_wins = 0, int new_losses = 0, bool new_bust = false) : 
		   name(new_name), balance(new_balance), wins(new_wins), losses(new_losses), bust(new_bust), doesHandContainAce(10, false) {
		   	player_count ++;
		    wager = 0;
			decision = 1;
			ace = false;
		}
	   
	   const std::deque<int> &GetDeck() const { return cards; }
	   const std::deque<int> &GetCardSuits() const { return suits; }
	   std::vector<std::deque<int>> &GetSplitHands()  { return splitHands; }
	   
	   std::string GetName() const { return name; }
	   int GetWager() const { return wager; }
	   int GetBalance() const { return balance; }
	   bool GetBust() const { return bust; }
	   bool GetDecision() const { return decision; }
	   bool GetAce() const { return ace; }
	   uint8_t GetAceHand(size_t index) const { return doesHandContainAce[index]; }
	   
	   void SetBalance(int newBalance) { balance = newBalance; }
	   void SetWager(int newWager) { wager = newWager; }
	   void SetBust(bool newBust) { bust = newBust; }
	   void SetDecision(bool newDecision) { decision = newDecision; }
	   void SetAce(bool newState) { ace = newState; }
	   void SetAceHand(size_t index, bool newState) { doesHandContainAce[index] = newState; }  
	   
	   void push_back(int N) { cards.push_back(N); }
	   void insert_suits(char N) { suits.push_back(N); }  
	   void insertHands(std::deque<int> hands) { splitHands.push_back(hands); } 
	   
	   void insertIntoHand(int N, int handIndex) {
		 int i = 0; 
		 for (auto &hand : splitHands) {
			 if (handIndex == i) {
		  	 	hand.push_back(N);
	 	    }
			i++; 
		  }
	   }

	   void replace(size_t index, int N) { cards.at(index) = N; }

	   void ClearHand() { cards.clear(); }   

	   int& cardAt(size_t index) {
			return cards.at(index);
	   }
	   int & suitCardAt(size_t index) {
		return suits.at(index);
	   }
	   bool DoubleAce() {
		if (cards[0] == 11 and cards[1] == 11) {
			return true;
		}
		else return false;
	   }
	   int GetCount() {
	   	int sum = 0;
		for (int i = 0; i < cards.size(); i++) { 
			sum += cards[i];
		} 
		return sum;
	   }	
	   void ShowDeck() {
		std::cout << "Player Cards: ";
	   	for (int i = 0; i < cards.size(); i++) {
	       		std::cout << cards[i] << " : ";
		}
		std::cout << std::endl;	
	   }
	   //split functions
	   bool didSplitHandBust(std::deque<int> &splitHand) {
			int count = 0;
			for (int x : splitHand) {
				count += x;
			}
			if (count > 21) return true;
			else return false;
	   }	
	   bool DoubleMultiHandAce(std::deque<int> &deck) {
		if (deck[0] == 11 and deck[1] == 11) { 
			return true;
		}
		else return false;
	  }
	  int &multiHandCardAt(std::deque<int> &deck, size_t index) {
		return deck.at(index);
	  }
	  int GetMultiHandCount(std::deque<int> &deck) {
			int count = 0;
			for (int x : deck) {
				count += x;
			}
			return count;
	  }
};
