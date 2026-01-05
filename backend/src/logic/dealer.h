#pragma once 
#include <deque>
#include <vector>
#include <iostream>
class Dealer {
      private:
	   std::deque<int> cards;
	   std::deque<char> suits;
	   int balance = 0;
	   int wins = 0;
	   int losses = 0; 
       bool ace = false;
      public:
	   Dealer()  {};
	   const std::deque<int>& GetDealerCards() const { return cards; }
	   const std::deque<char>& GetSuitCards() const { return suits; }

	   bool GetAce() const { return ace; }
	   void SetAce(bool newAce) { ace = newAce; }

	   void push_back(int N) { cards.push_back(N); }
	   void insert_suits(char N) { suits.push_back(N); }
	   
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
	   bool DoubleAce() {
		if (cards[0] == 11 and cards[1] == 11) {
			return true;
		}
		else return false;
	   }
	   int& cardAt(size_t index) {
		return cards.at(index);
	   }
	   void ShowDeck() {
		std::cout << "Dealer Cards: ";
	   	for (int i = 0; i < cards.size(); i++) {
			std::cout << cards[i] << " : ";
		}
		std::cout << std::endl;
	   } 
};
