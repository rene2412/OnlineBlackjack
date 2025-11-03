#include "deck.h"

std::deque<int> &Deck::GetDeck()  { return deck; }

void Deck::push_back(int N) { deck.push_back(N); }

