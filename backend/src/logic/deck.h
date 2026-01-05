#pragma once 
#include <deque>

class Deck {
   private:
	std::deque<int> deck;
	std::deque<char> suits; 
   public:
	Deck() = default;
    std::deque<int> &GetDeck();
	std::deque<char> &GetSuitsDeck();
	void push_back(int N);
	void insertSuits(char N);
};
