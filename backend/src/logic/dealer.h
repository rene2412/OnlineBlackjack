#pragma once 
#include <deque>
#include <vector>
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
	   
	   void ClearHand() { cards.clear(); }
	   
	   int firstCard() {
			return cards[0];
	   }

	   int count() {
		int sum = 0;
	   	for (int i = 0; i < cards.size(); i++) {
			sum += cards[i];	
		}	
		return sum;
	   }

	   std::deque<int> GetSum() {
			int sum = 0;
			std::deque<int> deck;
			for (int i = 0; i < cards.size(); i++) {
				sum += cards[i];
				deck.push_back(sum);
			}
			return deck;
	   }

	   void ShowDeck() {
		std::cout << "Dealer Cards: ";
	   	for (int i = 0; i < cards.size(); i++) {
			std::cout << cards[i] << " : ";
		}
		std::cout << std::endl;
	   } 
};
