#pragma once 
#include <deque>

class Deck {
   private:
	std::deque<int> deck;   
   public:
	Deck() = default;
	std::deque<int> &GetDeck();
	void push_back(int N);
};
