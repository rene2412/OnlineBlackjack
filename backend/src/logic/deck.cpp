#include "deck.h"

std::deque<int> &Deck::GetDeck() { return deck; }
std::deque<char> &Deck::GetSuitsDeck()  { return suits; }

void Deck::push_back(int N) { deck.push_back(N); }
void Deck::insertSuits(char N) {suits.push_back(N); }
