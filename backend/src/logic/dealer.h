#pragma once 
#include <deque>
#include <iostream>
class Dealer {
      private:
	   std::deque<int> cards;
	   int balance = 0;
	   int wins = 0;
	   int losses = 0; 
      	   	
      public:
	   Dealer()  {};
	   const std::deque<int>& GetDealerCards() const { return cards; }
	   
	   void push_back(int N) { cards.push_back(N); }
	   
	   int count() {
		int sum = 0;
	   	for (int i = 0; i < cards.size(); i++) {
			sum += cards[i];	
		}	
		return sum;
	   }
	   void ShowDeck() {
		std::cout << "Dealer Cards: ";
	   	for (int i = 0; i < cards.size(); i++) {
			std::cout << cards[i] << " : ";
		}
		std::cout << std::endl;
	   } 
};
