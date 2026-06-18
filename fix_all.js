const fs = require('fs');
const cb = JSON.parse(fs.readFileSync('./frontend/public/code-bank.json','utf8'));

// Helper: update solution by matching title
function update(title, solution) {
  for (const ch of Object.values(cb.chapters))
    for (const ex of ch.exercises)
      if (ex.title === title) { ex.solution = solution; return true; }
  return false;
}

// ===== c3 圆类 =====
update('圆类的设计与实现',
`#include <iostream>
#include <cmath>
using namespace std;

class Point2D {
    float x, y;
public:
    Point2D(float x = 0, float y = 0) { this->x = x; this->y = y; }
    friend float Distance(const Point2D &a, const Point2D &b);
    friend class Circle;
};

float Distance(const Point2D &a, const Point2D &b) {
    return sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
}

class Circle {
    Point2D center;
    float radius;
    static int Num;
public:
    const static float PI;
    Circle(const Point2D &center = Point2D(), float radius = 1.0f) : center(center), radius(radius) { ++Num; }
    ~Circle() { --Num; }
    void setCenter(const Point2D &p) { center.x = p.x; center.y = p.y; }
    Point2D getCenter() const { return center; }
    static int getNum() { return Num; }
};
int Circle::Num = 0;
const float Circle::PI = acos(-1);

int main() {
    int n;
    cout << Circle::PI << endl;
    cin >> n;
    Circle cir_list1[n];
    cout << Circle::getNum() << endl;
    if (n > 1) {
        cir_list1[0].setCenter(Point2D(2.0f, 2.0f));
        cout << Distance(cir_list1[0].getCenter(), cir_list1[n - 1].getCenter()) << endl;
    }
    cout << endl;
    cin >> n;
    float x, y, r;
    Circle *cir_list2[n];
    for (int i = 0; i < n; i++) { cin >> x >> y >> r; cir_list2[i] = new Circle(Point2D(x, y), r); }
    cout << Circle::getNum() << endl;
    if (n > 1) cout << Distance(cir_list2[0]->getCenter(), cir_list2[n - 1]->getCenter()) << endl;
    cout << endl;
    for (int i = 0; i < n; i++) { delete cir_list2[i]; cout << Circle::getNum() << endl; }
    return 0;
}`);

// ===== c3 矩形 =====
update('矩形类的设计与实现',
`#include <iostream>
#include <cmath>
using namespace std;

class CRectangle;
class CPoint2D {
    double x, y;
public:
    static int pointCount;
    CPoint2D(double x = 0, double y = 0) : x(x), y(y) { ++pointCount; }
    CPoint2D(const CPoint2D& o) : x(o.x), y(o.y) { ++pointCount; }
    ~CPoint2D() { --pointCount; }
    friend class CRectangle;
};
int CPoint2D::pointCount = 0;

class CRectangle {
    CPoint2D bottom_left;
    double width, height;
public:
    CRectangle(double x=0, double y=0, double w=1, double h=1) : bottom_left(x,y), width(w), height(h) {}
    CRectangle(const CPoint2D& pt, double w=1, double h=1) : bottom_left(pt), width(w), height(h) {}
    double getDiagonalLength() const { return sqrt(width*width + height*height); }
    void setBottomLeft(double x, double y) { bottom_left.x = x; bottom_left.y = y; }
    void setWidth(double w) { width = w; } void setHeight(double h) { height = h; }
    double getAreaSum(const CRectangle& o) const { return width*height + o.width*o.height; }
};

int main() {
    double x, y, w, h;
    cin >> x >> y >> w >> h;
    CRectangle r1(x,y,w,h), r2(x), r3(CPoint2D(x,y));
    cout << r1.getDiagonalLength() << endl << r2.getDiagonalLength() << endl << r3.getDiagonalLength() << endl;
    cout << r1.getAreaSum(r2) << endl << r2.getAreaSum(r3) << endl << r3.getAreaSum(r1) << endl;
    cout << CPoint2D::pointCount << endl << endl;
    int n; cin >> n;
    CPoint2D static_points[n];
    CPoint2D copy_point(static_points[0]);
    cout << copy_point.pointCount << endl;
    CPoint2D *dynamic_points = new CPoint2D[n];
    cout << dynamic_points[n-1].pointCount << endl;
    delete[] dynamic_points;
    cout << static_points[n-1].pointCount << endl;
    return 0;
}`);

// ===== c3 学生统计 =====
update('学生人数统计',
`#include <iostream>
using namespace std;

class Student {
    const int id;
    static int Num;
    const int classNumber;
public:
    Student(int studentId, int cls) : id(studentId), classNumber(cls) { ++Num; cout << "The number of students: " << Num << endl; }
    void Print() const { cout << "ID: " << id << " Class: " << classNumber << endl; }
    static int getNum() { return Num; }
    ~Student() { --Num; cout << "The number of students: " << Num << endl; }
};
int Student::Num = 0;

int main() {
    int n; cin >> n;
    Student* students[n];
    for (int i = 0; i < n; ++i) {
        int id = i+1, cls = (id>=1&&id<=32)?1:(id>=33&&id<=64)?2:3;
        students[i] = new Student(id, cls);
        students[i]->Print();
    }
    for (int i = 0; i < n; ++i) delete students[i];
    return 0;
}`);

// ===== c4 艾琳 =====
update('艾琳类的设计与实现',
`class Magician : virtual public Hero {
protected: int AP;
public: Magician(int damage, int AP) : Hero(damage), AP(AP) {}
    int getAP() const { return AP; }
};
class Shooter : virtual public Hero {
protected: int AD;
public: Shooter(int damage, int AD) : Hero(damage), AD(AD) {}
    int getAD() const { return AD; }
};
class Ailin : public Magician, public Shooter {
public: Ailin(int damage, int AP, int AD) : Hero(damage), Magician(damage,AP), Shooter(damage,AD) {}
};

int main() {
    int damage, AP, AD; cin >> damage >> AP >> AD;
    Ailin ailin(damage, AP, AD);
    cout << ailin.getDamage() << endl << ailin.getAD() << endl << ailin.getAP() << endl;
    return 0;
}`);

// ===== c5 面积 =====
update('基类指针计算派生类面积',
`#include <iostream>
#include <cmath>
using namespace std;

class Shape {
public:
    const static double PI;
    virtual double getArea() const = 0;
    virtual ~Shape() { cout << "DesShape" << endl; }
};
const double Shape::PI = acos(-1);

class Rectangle : public Shape {
    double w, h;
public:
    Rectangle(double w, double h) : Shape(), w(w), h(h) {}
    ~Rectangle() { cout << "DesRect" << endl; }
    double getArea() const { return w * h; }
};

class Circle : public Shape {
    double r;
public:
    Circle(double r) : Shape(), r(r) {}
    ~Circle() { cout << "DesCircle" << endl; }
    double getArea() const { return PI * r * r; }
};

int main() {
    int n; cin >> n;
    Shape *shape[n];
    for (int i = 1; i <= n; i++) {
        if (i % 2 == 0) shape[i-1] = new Rectangle((double)i, (double)i+1);
        else shape[i-1] = new Circle((double)i);
    }
    int index; cin >> index;
    cout << shape[index-1]->getArea() << endl;
    for (int i = 0; i < n; i++) delete shape[i];
    return 0;
}`);

// ===== c5 IntArray IO =====
update('整型数组类 — 输入输出流重载',
`istream& operator>>(istream &in, IntArray &arr) {
    in >> arr.length;
    for (int i = 0; i < arr.length; i++) in >> arr.arr[i];
    return in;
}
ostream& operator<<(ostream &out, const IntArray &arr) {
    for (int i = 0; i < arr.length - 1; i++) out << arr.arr[i] << ' ';
    out << arr.arr[arr.length - 1] << endl;
    return out;
}`);

// ===== c5 IntArray 数乘 =====
update('整型数组类 — 数乘运算重载',
`IntArray(const IntArray &arr) {
    length = arr.length;
    if (arr.length != 0) for (int i = 0; i < arr.length; i++) this->arr[i] = arr.arr[i];
}
friend IntArray operator*(int left, const IntArray &right) {
    IntArray result(right);
    for (int i = 0; i < result.length; i++) result.arr[i] *= left;
    return result;
}`);

// ===== c5 IntArray 赋值 =====
update('整型数组类 — 赋值运算符重载',
`IntArray(const IntArray &arr) {
    length = arr.length;
    if (arr.length != 0) for (int i = 0; i < arr.length; i++) this->arr[i] = arr.arr[i];
}
IntArray& operator=(const IntArray &arr) {
    length = arr.length;
    if (arr.length != 0) for (int i = 0; i < arr.length; i++) this->arr[i] = arr.arr[i];
    cout << "Copy done!" << endl;
    return *this;
}`);

// ===== c5 IntArray 下标 =====
update('整型数组类 — 下标运算符重载',
`int& operator[](int index) {
    if (index < 0 || index >= length) exit(0);
    return arr[index];
}`);

// ===== c5 IntArray 自加 =====
update('整型数组类 — 前后缀自加重载',
`IntArray(const IntArray &arr) {
    length = arr.length;
    if (arr.length != 0) for (int i = 0; i < arr.length; i++) this->arr[i] = arr.arr[i];
}
IntArray& operator++() { for (int i = 0; i < length; i++) ++arr[i]; return *this; }
IntArray operator++(int) { IntArray result(*this); for (int i = 0; i < length; i++) arr[i]++; return result; }`);

// ===== ex8 有理数 =====
update('有理数类的设计与实现',
`#include <iostream>
#include <string>
using namespace std;

class CRational {
private:
    int iUp, iDown;
    int Gcd(int a, int b) const { a=a<0?-a:a; b=b<0?-b:b; while(b){int t=a%b;a=b;b=t;} return a; }
    void Reduce() { if(iDown==0)return; int g=Gcd(iUp,iDown); iUp/=g; iDown/=g; if(iDown<0){iUp=-iUp;iDown=-iDown;} }
public:
    CRational(int u=0,int d=1):iUp(u),iDown(d){if(d!=0)Reduce();}
    bool operator!()const{return iDown!=0;}
    CRational operator-()const{return CRational(-iUp,iDown);}
    CRational& operator++(){iUp+=iDown;Reduce();return*this;}
    CRational& operator--(){iUp-=iDown;Reduce();return*this;}
    CRational operator++(int){CRational t(*this);iUp+=iDown;Reduce();return t;}
    CRational operator--(int){CRational t(*this);iUp-=iDown;Reduce();return t;}
    friend CRational operator+(const CRational& a,const CRational& b){return CRational(a.iUp*b.iDown+b.iUp*a.iDown,a.iDown*b.iDown);}
    friend CRational operator-(const CRational& a,const CRational& b){return CRational(a.iUp*b.iDown-b.iUp*a.iDown,a.iDown*b.iDown);}
    friend CRational operator*(const CRational& a,const CRational& b){return CRational(a.iUp*b.iUp,a.iDown*b.iDown);}
    friend CRational operator/(const CRational& a,const CRational& b){if(b.iUp==0)return CRational(a.iUp,0);return CRational(a.iUp*b.iDown,a.iDown*b.iUp);}
    friend bool operator>(const CRational& a,const CRational& b){return a.iUp*b.iDown>b.iUp*a.iDown;}
    friend bool operator<(const CRational& a,const CRational& b){return a.iUp*b.iDown<b.iUp*a.iDown;}
    friend ostream& operator<<(ostream&,const CRational&);
    friend istream& operator>>(istream&,CRational&);
};

ostream& operator<<(ostream& os,const CRational& r){
    if(r.iDown==0){os<<"The denominator cannot be zero!"<<endl;os<<r.iUp<<"/"<<r.iDown;return os;}
    if(r.iUp%r.iDown==0)os<<r.iUp/r.iDown;else os<<r.iUp<<"/"<<r.iDown;
    return os;
}
istream& operator>>(istream& is,CRational& r){
    string s;is>>s;size_t pos=s.find('/');
    if(pos!=string::npos){r.iUp=stoi(s.substr(0,pos));r.iDown=stoi(s.substr(pos+1));}
    else{r.iUp=stoi(s);r.iDown=1;}
    if(r.iDown!=0)r.Reduce();else cout<<"The denominator cannot be zero!"<<endl;
    return is;
}

int main(){
    CRational a,b;
    cout<<"Input rational a: "<<endl;cin>>a;
    cout<<"Input rational b: "<<endl;cin>>b;
    if(!a&&!b){
        cout<<"a+b: "<<(a+b)<<endl; cout<<"a-b: "<<(a-b)<<endl;
        cout<<"a*b: "<<(a*b)<<endl; cout<<"a/b: "<<(a/b)<<endl;
        cout<<"-a: "<<(-a)<<endl; cout<<"++a: "<<(++a)<<endl; cout<<"--a: "<<(--a)<<endl;
        cout<<"a++: "<<(a++)<<endl; cout<<"a--: "<<(a--)<<endl;
        cout<<"a>b: "<<((a>b)?"true":"false")<<endl;
        cout<<"a<b: "<<((a<b)?"true":"false")<<endl;
    }
    return 0;
}`);

// ===== ex8 形状多态 =====
update('形状类的设计与实现（多态）',
`#include <iostream>
#include <vector>
#include <algorithm>
#include <math.h>
using namespace std;
const double EPS = 1e-6;

class CShape {
protected:
    double rectWidth, rectHeight;
public:
    CShape(double w=0, double h=0):rectWidth(w),rectHeight(h){}
    virtual ~CShape(){}
    virtual void Show()const=0;
    virtual double Area()const=0;
    friend bool operator==(const CShape& a,const CShape& b){return fabs(a.Area()-b.Area())<EPS;}
    friend bool operator>(const CShape& a,const CShape& b){return a.Area()-b.Area()>EPS;}
    friend bool operator<(const CShape& a,const CShape& b){return b.Area()-a.Area()>EPS;}
};

class CRectangle:public CShape{
public: CRectangle(double w,double h):CShape(w,h){}
    void Show()const{cout<<"W = "<<rectWidth<<", H = "<<rectHeight<<", Area = "<<Area()<<endl;}
    double Area()const{return rectWidth*rectHeight;}
};

class CEllipse:public CShape{
public: static const double PI;
    CEllipse(double w,double h):CShape(w,h){}
    void Show()const{cout<<"W = "<<rectWidth<<", H = "<<rectHeight<<", Area = "<<Area()<<endl;}
    double Area()const{return PI*rectWidth*rectHeight/4.0;}
};
const double CEllipse::PI=3.1416;

class CDiamond:public CShape{
public: CDiamond(double w,double h):CShape(w,h){}
    void Show()const{cout<<"W = "<<rectWidth<<", H = "<<rectHeight<<", Area = "<<Area()<<endl;}
    double Area()const{return rectWidth*rectHeight/2.0;}
};

string GetType(CShape* p){
    if(dynamic_cast<CRectangle*>(p))return"(rectangle)";
    if(dynamic_cast<CEllipse*>(p))return"(ellipse)";
    if(dynamic_cast<CDiamond*>(p))return"(diamond)";
    return"";
}
bool compare(CShape* a,CShape* b){return*a>*b;}

int main(){
    int num;cin>>num;
    vector<CShape*>sarr;string str;double w,h;
    for(int i=0;i<num;i++){cin>>str>>w>>h;
        if(str=="R")sarr.push_back(new CRectangle(w,h));
        else if(str=="E")sarr.push_back(new CEllipse(w,h));
        else if(str=="D")sarr.push_back(new CDiamond(w,h));}
    num=sarr.size();
    for(int i=0;i<num;i++)sarr[i]->Show();
    for(int i=0;i<num-1;i++)for(int j=i+1;j<num;j++)
        if((*sarr[i])==(*sarr[j]))
            cout<<"Area of Shape["<<i<<"]"<<GetType(sarr[i])<<" is equal to Shape["<<j<<"]"<<GetType(sarr[j])<<endl;
    sort(sarr.begin(),sarr.end(),compare);
    for(int i=0;i<num;i++)sarr[i]->Show();
    for(int i=0;i<num;i++)delete sarr[i];
    return 0;
}`);

// ===== ex8 智能指针 =====
update('智能指针操作媒体资源类',
`#include <iostream>
#include <string>
#include <vector>
#include <memory>
using namespace std;

class MediaAsset{
public:
    MediaAsset(){cout<<"Constructor media asset"<<endl;}
    virtual~MediaAsset(){cout<<"Destructor media asset"<<endl;}
    virtual void Show()=0;
};

class Song:public MediaAsset{
    string artist,title;
public:
    Song(const string& a,const string& t):MediaAsset(),artist(a),title(t){cout<<"Constructor song"<<endl;}
    ~Song(){cout<<"Destructor song"<<endl;}
    void Show()override{cout<<artist<<", "<<title<<endl;}
};

class Photo:public MediaAsset{
    string date,location,subject;
public:
    Photo(const string& d,const string& l,const string& s):MediaAsset(),date(d),location(l),subject(s){cout<<"Constructor photo"<<endl;}
    ~Photo(){cout<<"Destructor photo"<<endl;}
    void Show()override{cout<<date<<", "<<location<<", "<<subject<<endl;}
};

int main(){
    string type;cin>>type;
    if(type=="shared_ptr"){
        vector<shared_ptr<MediaAsset>>assets{make_shared<Song>("Himesh Reshammiya","Tera Surroor"),make_shared<Song>("Penaz Masani","Tu Dil De De"),make_shared<Photo>("2011-04-06","Redmond, WA","Soccer field at a park."),make_shared<Song>("Bob Dylan","The Times They Are A Changing"),make_shared<Song>("Aretha Franklin","Bridge Over Troubled Water"),make_shared<Song>("Thala","Entre El Mar y Una Estrella"),make_shared<Photo>("2021-12-06","Xian, China","Snowing at bell tower.")};
        vector<shared_ptr<MediaAsset>>photos;
        for(const auto& p:assets){p->Show();shared_ptr<Photo>temp=dynamic_pointer_cast<Photo>(p);if(temp.get()!=nullptr)photos.push_back(p);}
        for(const auto& p:photos)p->Show();
    }else if(type=="new"){
        vector<MediaAsset*>assets{new Song("Himesh Reshammiya","Tera Surroor"),new Song("Penaz Masani","Tu Dil De De"),new Photo("2011-04-06","Redmond, WA","Soccer field at a park."),new Song("Bob Dylan","The Times They Are A Changing"),new Song("Aretha Franklin","Bridge Over Troubled Water"),new Song("Thala","Entre El Mar y Una Estrella"),new Photo("2021-12-06","Xian, China","Snowing at bell tower.")};
        vector<MediaAsset*>photos;
        for(const auto& p:assets){p->Show();Photo*temp=dynamic_cast<Photo*>(p);if(temp!=nullptr)photos.push_back(p);}
        for(const auto& p:photos)p->Show();
    }else cout<<"Input error!"<<endl;
    return 0;
}`);

// Save
fs.writeFileSync('./frontend/public/code-bank.json', JSON.stringify(cb, null, 2), 'utf8');

// Report
let total=0, withMain=0;
for (const ch of Object.values(cb.chapters)) for (const ex of ch.exercises) {
  total++;
  if (ex.solution.includes('int main(')) withMain++;
}
console.log('Total: ' + total + ', with main: ' + withMain);
