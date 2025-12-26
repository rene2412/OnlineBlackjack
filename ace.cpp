#include<deque>
using namespace std;

int sumHand(deque<int> &deck) {
	int sum = 0;
	for (int i = 0; i < deck.size(); i++) {
		sum += deck[i];
	}
	return sum;
}

deque<int> DetermineAceHand(deque<int> &hand) {
	for (int &card : hand) {
		
	}
}

int main() {
deque<int> hand = {11,2, 4, 11};

}
