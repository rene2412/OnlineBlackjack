#pragma once 
#include <string>
#include <deque>
#include <iostream>
class Player {
   private:
	   std::deque<int> cards;
	   std::string name;
	   int player_count = 0;
	   int balance = 0;
	   int score = 0;
	   int wins = 0; 
	   int losses = 0;
	   int wager = 0;
	   //TO DO LATER: networking connections here	   
   public:
	   Player() = default;
	   Player(std::string new_name, int new_balance, int new_wins, int new_losses) : 
		   name(new_name), balance(new_balance), wins(new_wins), losses(new_losses) {
		   	player_count ++;
		   }
	   
	   std::string GetName() const { return name; }
	   int GetWager() const { return wager; }
	   int GetBalance() const { return balance; }

	   int GetCount() {
	   	int sum = 0;
		for (int i = 0; i < cards.size(); i++) { 
			sum += cards[i];
		}
		return sum;
	   }

	   void SetBalance(int newBalance) { balance = newBalance; }

	   void ShowDeck() {
		std::cout << "Player Cards: ";
	   	for (int i = 0; i < cards.size(); i++) {
	       		std::cout << cards[i] << " : ";
		}
		std::cout << std::endl;	
	   }
	   
	   void push_back(int N) { cards.push_back(N); }
	   std::deque<int> GetDeck() const { return cards; }
	   
};
