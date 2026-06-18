const fs = require('fs');
const cb = JSON.parse(fs.readFileSync('./frontend/public/code-bank.json', 'utf8'));

// Find and update the card game exercise
for (const ex of cb.chapters['c3-类与对象'].exercises) {
  if (ex.title.includes('扑克牌')) {
    ex.solution = `class Card {
 public:
  char rep[4];
  Card() { rep[0] = '\\0'; }
  void setRep(const char* s) { strcpy(rep, s); }
  int getScore() const {
    const char* v = rep + 1;
    if (strcmp(v, "J") == 0 || strcmp(v, "Q") == 0 || strcmp(v, "K") == 0) return 10;
    if (strcmp(v, "A") == 0) return 11;
    return atoi(v);
  }
};

int main() {
  Card deck[52];
  char inputLine[500];
  cin.getline(inputLine, sizeof(inputLine));
  char* token = strtok(inputLine, " ");
  int idx = 0;
  while (token != nullptr && idx < 52) {
    deck[idx].setRep(token);
    token = strtok(nullptr, " ");
    idx++;
  }
  int indices1[5], indices2[5];
  for (int i = 0; i < 5; ++i) cin >> indices1[i];
  for (int i = 0; i < 5; ++i) cin >> indices2[i];
  Card hand1[5], hand2[5];
  int total1 = 0, total2 = 0;
  for (int i = 0; i < 5; ++i) {
    hand1[i] = deck[indices1[i]]; total1 += hand1[i].getScore();
    hand2[i] = deck[indices2[i]]; total2 += hand2[i].getScore();
  }
  cout << "Player 1 got:";
  for (int i = 0; i < 5; ++i) cout << " " << hand1[i].rep;
  cout << endl << "Player 1 points: " << total1 << endl;
  cout << "Player 2 got:";
  for (int i = 0; i < 5; ++i) cout << " " << hand2[i].rep;
  cout << endl << "Player 2 points: " << total2 << endl;
  if (total1 > total2) cout << "Player 1 wins!" << endl;
  else if (total2 > total1) cout << "Player 2 wins!" << endl;
  else cout << "Draw!" << endl;
  return 0;
}`;
    console.log('Updated card game');
  }
}

fs.writeFileSync('./frontend/public/code-bank.json', JSON.stringify(cb, null, 2), 'utf8');
