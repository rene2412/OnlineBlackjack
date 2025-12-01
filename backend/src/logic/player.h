#pragma once 
#include <string>
#include <deque>
#include <iostream>

#define stand 0
#define hit 1

class Player {
   private:
	   std::deque<int> cards;
	   std::string name;
	   int player_count;
	   int balance;
	   int score;
	   int wins; 
	   int losses;
	   int wager;
	   bool bust;
	   bool decision; //0 for stand, 1 for hit
	   //TO DO LATER: networking connections here	   
   public:
	   Player() = default;
	   Player(std::string new_name, int new_balance = 100, int new_wins = 0, int new_losses = 0, bool new_bust = false) : 
		   name(new_name), balance(new_balance), wins(new_wins), losses(new_losses), bust(new_bust) {
		   	player_count ++;
		    wager = 0;
			decision = 1;
		}
	   
	   const std::deque<int> &GetDeck() const { return cards; }
	   std::string GetName() const { return name; }
	   int GetWager() const { return wager; }
	   int GetBalance() const { return balance; }
	   bool GetBust() const { return bust; }
	   bool GetDecision() const { return decision; }

	   void SetBalance(int newBalance) { balance = newBalance; }
	   void SetWager(int newWager) { wager = newWager; }
	   void SetBust(bool newBust) { bust = newBust; }
	   void SetDecision(bool newDecision) { decision = newDecision; }

	   void push_back(int N) { cards.push_back(N); }
	   void ClearHand() { cards.clear(); }   
	   
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
	   
};
