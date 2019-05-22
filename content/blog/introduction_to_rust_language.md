+++
title = "A Short Introduction to Rust Language"
date = 2019-04-26
draft = false
tags = []
# category = "diary"
order = 0
weight = 0
aliases = []
template = "page.html"
[extra]
+++

# これは何？

Rust言語についてのイントロダクション。

対象としては、
- C/C++/pythonを使っている
- バイオインフォマティシャン

を想定していて、Fasta/Fastqファイル等々のI/Oを含めて、ある程度読み書きできるようになることを目標にしています。

<!-- more -->

# 内容

## コードを書く前に

### Rust 言語とは？

Rust とは、高速で、メモリ安全な、並列処理を主眼に据えたシステムプログラミング言語です。

C/C++と比べると、次のような利点があります

- データ競合を引き起こさない
- **パッケージの管理がラク**
- まともな使い方をすればまともに型検査をする
- 型推論、クロージャ、ジェネリクス、直和型など、現代的なツールが使える

Pythonと比べると、次のような利点があります。

- コンパイル時に型検査をするため、`int(x)`等の命令で実行時エラーを出すことがない
- 高速
- システムレベルの扱いが容易（ヒープ/スタックの制御）
- **GILがない**

### Installing
```bash
curl https://sh.rustup.rs -sSf | sh
```

### コンパイル&ラン

もし、スクリプト的に扱うなら
```bash
rustc -o foo bar.rs
./foo
```

実用上は、`cargo`と呼ばれるコマンド群を使うことになる（Rustといっしょにインストールされる）。
基本的には三つのコマンドを覚えていればよく、
```bash
cargo new foo # creating a directory named 'foo'
cd foo
cargo build # Building programs, resolving dependencies automatically.　add `--release` whenever you build it for serious prepose.
cargo run # running.
```
でどうにかなる。コンパイルされるのは`./foo/src/main.rs`。

## "Hello, world!"
C, Python, Rust の順にコードを書きます。違いはどこにあるでしょうか。
```C
#include <stdio.h>
int main(int argc, char* argv[]){
  printf("Hello world!\n");
  return 0;
}
```
```python
if __name__ == "__main__":
    print("Hello World!");
```

```Rust
fn main(){
    print!("Hello world!\n");
}
```

Pythonはオフサイドルールに基づく文法ですが、RustはCと同じように波括弧で区切ります。セミコロンで文を終える点も共通しています。
重要なことですが、（体感として）次のようなルールを持っておくと覚えやすいです。

*Rustの文法はCに似せて作ってある*

Pythonは明示的なエントリポイントを持ちませんが、CとRustは`main`という名前の関数をエントリポイントにします。

もう一つ、例として、『コマンドライン引数の数を表示する』プログラムを考えます。
プログラムの*複雑さ*はどのように変わるでしょうか。

```c
#include <stdio.h>
int main(int argc, char* argv[]){
  int num = argc;
  printf("%d\n",num);
  return 0;
}
```
```python
import sys
if __name__ == '__main__':
    num = len(sys.argv)
    print("{}".format(num))
```
```rust
fn main(){
    let num = std::env::args().count();
    println!("{}",num);
}
```

`println!`はprint-lineの略で、`print!`の最後に改行を加えます。

`std`とはC++の`std`と同じようなものです。実際、`::`も同じような意味を持っています。

Cが`%`記法を採用する一方で、PythonとRustは`{}`によるフォーマットを使用しています。また、Cが明示的に全ての型を宣言する一方で、Rustは`let`による型推論を用いた変数宣言を行い、Pythonは動的に型をつけます。

Cがエントリポイントでのみコマンドライン引数を扱うのとは対照的に、PythonとRustは、基本的にどこでも`sys.argv`と`std::env::args()`によって引数を得ることができます。

## Basic syntax(through calculating the mean length of an input)

面倒な文法の説明よりも、実際にプログラムを書くことで言語の説明をします。例としては、『コマンドライン引数としてもらったfasta fileの入力長と、平均長を出す』というプログラムを書くことを考えます。

Cは33行、Pythonは18行、Rustは26行でかけます（ゴルフをするつもりはありませんが、大体、どのようなプログラムを書いても、このような順序になるでしょう）。

まず、Cで書いてみます。

```c
#include <stdio.h>
#include <string.h>

int mean(char* filename){
  FILE *fp;
  fp = fopen(filename,"r");
  if (fp == NULL){
    return 1;
  }
  int sum = 0;
  int num = 0;
  char *line = NULL;
  size_t len = 0;
  while (getline(&line, &len, fp) != -1){
    if (line[0] == '>'){
      // Encounter a new record.
      num += 1;
    }else{
      sum += strlen(line) - 1;
    }
  }
  fclose(fp);
  return sum / num;
}

int main(int argc, char* argv[]){
  if (argc <= 1){
      return 1;
  }
  int result = mean(argv[1]);
  printf("%d\n",result);
  return 0;
}
```

`getline`が使えないと、もう少し大変です。というのも、fastaは一行の文字数がわからないので、バッファーがあふれる可能性があるからです。

```python
import sys

def mean(file):
    with open(file,'r') as file:
        sum = 0;
        num = 0;
        for line in file:
            if line.startswith('>'):
                num += 1
            else:
                sum += len(line) - 1
        return int(sum / num)


if __name__ == '__main__':
    ARGV = sys.argv
    result = mean(ARGV[1])
    print("{}".format(result));
```

もちろん、どこまでも行きたい人はリスト閉包を使うでしょう。ただし、リスト閉包の中に`if`文を書くと、結局、同じくらいの速度しか出ません（それに、タプルのリストの和をとるのは、そんなに簡単ではありません）。

では、Rustを見てみます。

```rust
use std::io::Read;
use std::path::Path;
use std::fs::File;

fn mean(file:&str)->std::io::Result<usize>{
    let mut file = File::open(Path::new(file))?;
    let mut input = String::new();
    file.read_to_string(&mut input)?;
    let mut sum = 0;
    let mut num = 0;
    for line in input.lines(){
        if line.starts_with('>'){
            num += 1;
        }else{
            sum += line.len();
        }
    }
    Ok(sum / num)
}

fn main()->std::io::Result<()>{
    let args:Vec<_> = std::env::args().collect();
    let result = mean(&args[1])?;
    println!("{}",result);
    Ok(())
}
```

うわあ！　かなりソースコードの顔は違って見えます。
まず、エントリポイント`main`は、実際は関数です。その返り値は`()`（空のタプル）もしくは`Result<T,E>`です。
`Result<T,E>`？はい。これは型`T`と型`E`の直和型です。つまり、Cふうにいうと、例えば`Result<int, char*>`として、『成功したときは`int`、失敗したときはエラーメッセージを`char*`で返す』ということを表現します（ところで、Rustでは文字列は`String`というutf-8コーディングされた構造体です。ヌル終端に関して気をつける必要はあり**ません**）。今回は`std::io::Result<T>`という、『`E`の部分をIOのエラー型で固定した`Result<T,E>`』を使います。

もう少し具体的に言うと、`Result<u32, char>`のインスタンスとしては`Ok(21)`、`Ok(22143)`、`Err('a')`、`Err('z')`などがあります。ここで注意したいのは、**`Ok(u32)`**という型はない、**`32`と`Ok(32)`**は違う、`a` が`Result<T,E>`だったとき、`Ok`と`Err`のどちらが来るかは **実行時にしかわからない**ということです。

まず`let args:Vec<_> = std::env::args().collect();`ですが、前述の`std::env::args()`はPythonでいうところのiterableなオブジェクトを返します。[^1]このオブジェクトは『コレクションに自分を変換する』という関数`collect()`を持ちます。今回の例では、Pythonでいうところの`list()`ですが、コレクトする型によっては`set()`にもなったりします。

このコレクションを指定するのが`let args:Vec<_>`の部分です。つまり、Rustに`args`の型を『`Vec<T>`で、Tは適当に推論しろ』と言うと、Rustは『`collect()`は`Vec`にイテレーターをまとめるんだな』と推論して、具体的な型としては`Vec<String>`を採用します。

上のことからわかるように、次のようなコードは**コンパイルを**通りません。
```rust
fn main(){
    // Rust can not infer the type of `args`
    let args = std::env::args().collect();
}
```

```rust
    // Type mismatch. std::env::args() returns an iterator over String.
    let args:Vec<u32> = std::env::args().collect();
```

一方で、次のようなコードはコンパイルできます。
```rust
    let args:Vec<String> = std::env::args().collect();
    // TurboFish notation.
    let args2 = std::env::args().collect::<Vec<String>>()
    println!("{}",args == args2) // true.
```

また、別のコレクションにまとめるには、型推論を助けてやるだけで十分です。つまり、
```rust
use std::collections::HashSet;
fn main(){
    let vector:Vec<usize> = (1..10).collect(); // [1,2,3,4,...,9]
    let hashset:HashSet<usize> = (1..10).collect(); // as a set.
    assert!(hashset.contains(2)) // should be true.
}
```
のように、`collect`はジェネリックな関数です。

`mean`の返り値も`std::io::Result<usize>`です。`usize`はメモリ上の大きさを表すときに使います。Cでいうところの`size_t`です。

ところで、`std::io::Result<_>`のエラー部分が返ってくるのはどういうときでしょう。例えば、ファイルが存在しなかったとき、`File::open(Path::new(file))`は`Err(why)`を、存在したときは`Ok(res)`を返します。ここで`why`は適当なエラーメッセージ、`res`はファイルディスクリプタと思ってよいです。このエラーを扱う方法はいくつかありますが、最も簡単なのは、*その場で計算をやめ、上流にエラーを投げる*です。`?`演算子はその役割を果たします。具体的には、`x?`は

- `x`が`Ok(res)`なら、`res`を返し、
- `x`が`Err(why)`なら、`Err(why)`を関数の戻り値とする

ということです[^2]。もちろん、関数の型が`Result<T,E>`だったとき、`x`の型が`Result<_,E>`でなくてはいけないのは、いうまでもありません。

このように開いたファイルを取り扱う際に、中身はだいたいCの`FILE`型と同じだと言うことを忘れないでください。つまり、これは状態を持っています。よって、*全ての読み書きは`file`の状態を変える可能性があります*。このようなとき、Rustでは変数宣言に際して`let mut`という構文を用います。


その他の構文については、だいたいCとPythonの中間のようなものになっています。例えば、`if`文はかっこ`()`がなくても大丈夫です。`for`文はレンジの指定がC流にはできません。というのも、`for(_; _ ; _)`系のループは、三つ目の表現力が強すぎるためです。これはエラーを増やします。

さて、速度について考えてみましょう。

まず、小さなデータセット（100bp * 300 record）での速度です。CはGCC 5.4 で`-O3`付きでコンパイル、Rustは1.32で`-C opt-level=3`でコンパイルしています。
Cは0.015s, Python 0.42sそしてRustは0.017s 程度でした。

大きなデータセット（250bp*400,000）レコードでは、Cは0.49sec、Pythonは0.190s、そしてRustは0.160s程度でした。Cが遅いのは、いちいち`getline`を呼んでいるからでしょうか。

### Safety, concurrency and ergonomics

Rust とは、高速で、メモリ安全な、並列処理を主眼に据えたシステムプログラミング言語です。この章では、これら三つのことを表現する例題を解いてみましょう。

具体的には、まず、メモリ安全性について説明します。その後で、配列中の`A`の数について数えるプログラムを書きながら、並列性について考えていきましょう。

まず、次のようなCコードについて考えてみましょう。

```c
#include <stdio.h>
void plusone(int* x){
  *x = *(x+1);
}
int main(){
  int x = 10;
  plusone(&x);
  printf("%d\n",x);
  return 0;
}
```

あー！　このプログラムはひどい動きをします。本当は`*x = *x + 1`としなければいけませんでした。しかし、C言語にはこれを防ぐ機能が全くありません。

また、`plusone`という関数が、xを手つかずで残しておく保証もありません。

```C
#include <stdio.h>
void void_conversion(void* x){
  *(int *)x = 1;
}
int main(){
  int x = 0;
  void_conversion((void *)x);
  printf("%d\n",x);
}
```
C言語を、やっかいで、デバッグしにくくしている原因の一つが、自由すぎる型変換です。特に、`void *`に型変換することで、実質的に、プログラマは任意の型を任意の型に変換できてしまいます。上記のコードは、実際には、0を`void`型のポインタだと見なし、メモリの0番地を`int`だと思ってアクセスします！　当然、セグメンテーション違反です。

Rustは型変換について、厳しいポリシーを課します。それは、単にほとんどの型変換をデフォルトで許さないということです。64bit整数、32bit整数等々の間での`as u32`が少しある程度です。

また、可変性についても、Rustは厳しくチェックします。それが

- 所有権(ownership)
- 借用(borrowing)
- 生存期間(lifetime)

という三つの概念です。

極めて簡単に言うと、所有権(ownership)というのは、*複製できない*、*値*[^3]に対するひものようなものです。これは一つの変数しか得ることができません。また、関数が終了すると、その関数が所有している*全ての*オブジェクトにひもづいている値は解放されます。
具体的には、参照をもらわない関数は、**すべて**所有権をもらいます。つまり、
```rust
fn add_one(x:u32, y:u32)->u32{
     x + y
}
```
は、`x`と`y`の値の所有権を得て、`x+y`を返します（`x+y`の値の所有権を渡すと思ってもいいです）。最後に、`x`の値と`y`の値をスタックから解放します。これ以降、この二つの変数は（呼び出し元でも）使えません。このような理由で、Rustでは数学で言うところの写像のように関数を書くほうが、所有権をいちいちもらったり、返したりするより、簡単です。線形型という言い方をします。

一方で、ベクタなどのコレクションに対して、こういった考えをするのは大変です。つまり、ベクタ`Vec<usize>`の大きさを知りたいときに、いちいち
```rust
fn callee(vec:Vec<u32>)->(usize,Vec<u32>){
    (vec.len(), vec)
}
fn caller(){
let vec = Vec::new();
// something
let (len, vec) = callee(vec);
// continued ....
}
```
などと、`vec`の所有権をやりとりするのは煩雑ですし、関数の型も見にくくなります。

そこで用いられるのが、借用(borrwing)です。これは直感的には参照で、C言語的に言うならポインタで、Pythonユーザがいつも関数に渡しているものです。

特筆するべきは、この借用は所有権を奪い*ません*。つまり、借用はいくらでも配れますし、受け取れます！　つまり、

```rust
fn callee(vec:&Vec<u32>)->usize{
    vec.len()
}
fn caller(){
let vec = Vec::new();
// something
let len = callee(vec);
// continued ....
}
```
としても、大丈夫です。

しかし、ちょっと待ってください。次のような状況に置かれたとしましょう。


1. あなたはある変数を宣言する
1. その変数の借用を、別の構造体に渡す
1. 最初に宣言した変数を解放する
1. 構造体の中にある借用を使用する

あー！　あなたはメモリ安全性を犯しています！　これは例えば、次のようなときに起こります。
```rust
fn main(){
    let pointer:&u32;
    {
        let x = 1;
        pointer = &x;
    }
    println!("{}", pointer);
}
```
これは**コンパイル時に**弾かれなければいけません。そのために、Rustが使うのが変数の生存期間(lifetime)という概念です。これは単に、ある変数が、宣言されてから解放されるまでの**コードの中での**領域です。そして、主要なルールは次の通りです。

*参照は実体より長く生きてはいけない*

これら三つの特性によって、RustはCのようなメモリについての危険性を完全に回避します。また、メモリの管理、引数の挙動を明示的に行う（GCがないことに気がつきますか？）ことで、次のような、非直感的な挙動を防ぎます。

```python
def foo(strage = []):
    strage.appned(1)
    return strage

test = foo() #test is [1],
test.append(2) #  test is [1,2]
test2 = foo() # test2 is [1,2,1] and so is test.
```
なぜ、デフォルト引数がグローバルに共有されるのでしょうか？

また、『`mut`マークがついた変数が、`mut &`の形で渡されたとき』以外は変数は呼び出し前と後で変更を受けません。なので、我々は

```rust
fn test(){
    let important_variable = 24;
    give_mouse(&important_variable);
    // important_variable is the same.
}
```
を安全に使用できます。

このように、言語に制限を加えることで、私たちは次の事実に気がつきます：一度`mut`なしで宣言された変数は、生存期間中に限り、いくらでも参照を配ることができ、*それはほかのプロセスにも配ることができる*[^4]。

では、『fastaファイルを読み込み、その中の'A','C','G','T'の数を出力する』プログラムを書いてみます。

```python
import sys

def count_line(line):
    sum = [0,0,0,0]
    for char in line:
        if char == 'A':
            sum[0] +=1
        elif char  == 'C':
            sum[1] += 1
        elif char == 'G':
            sum[2] += 1
        elif char == 'T':
            sum[3] += 1
    return sum

def count(file):
    with open(file,'r') as file:
        sum = [0,0,0,0];
        for line in file:
            if not line.startswith('>'):
                num = count_line(line);
                for i in range(4):
                    sum[i] += num[i];
        return sum

if __name__ == '__main__':
    ARGV = sys.argv
    result = count(ARGV[1])
    print("[A,C,G,T] = {}".format(result));
```
```rust
use std::io::Read;
use std::path::Path;
use std::fs::File;

#[inline]
fn count_line(line:&str)->[u32;4]{
    let mut sum = [0;4];
    for char in line.chars(){
        match char {
            'A' => sum[0] += 1,
            'C' => sum[1] += 1,
            'G' => sum[2] += 1,
            'T' => sum[3] += 1,
            _ => {},
        }
    }
    sum
}

fn count(file:&str)->std::io::Result<[u32;4]>{
    let mut file = File::open(Path::new(file))?;
    let mut input = String::new();
    file.read_to_string(&mut input)?;
    let mut sum = [0;4];
    for line in input.lines(){
        if !line.starts_with('>'){
            let num = count_line(line);
            for i in 0..4{
                sum[i] += num[i]
            }
        }
    }
    Ok(sum)
}

fn main()->std::io::Result<()>{
    let args:Vec<_> = std::env::args().collect::<Vec<String>>();
    let result = count(&args[1])?;
    println!("[A,C,G,T] = {:?}",result);
    Ok(())
}
```
10~15倍くらい速くなります。

並列化版
```rust
use std::fs::File;
use std::io::{BufRead,BufReader};
use std::path::Path;
// use std::sync::mpsc::channel;
use std::thread;
const THR: usize = 2;

#[inline]
fn count_line(line: String) -> [u32; 4] {
    let mut sum = [0; 4];
    for char in line.chars() {
        match char {
            'A' => sum[0] += 1,
            'C' => sum[1] += 1,
            'G' => sum[2] += 1,
            'T' => sum[3] += 1,
            _ => {}
        }
    }
    sum
}

#[inline]
fn count_lines(lines:Vec<String>)->[u32;4]{
    let mut sum = [0;4];
    for line in lines{
        let num = count_line(line);
        for i in 0..4 {
            sum[i] += num[i]
        }
    }
    sum
}


fn main() -> std::io::Result<()> {
    let args: Vec<_> = std::env::args().collect::<Vec<String>>();
    let mut sum = [0; 4];
    let input:Vec<String> = BufReader::new(File::open(Path::new(&args[1]))?).lines()
        .filter_map(|e|e.ok()).collect();
    let bucket_size = input.len() / THR;    
    let handlers: Vec<_> = (0..THR)
        .map(|i|{
            let bucket = if i == THR - 1{
                input[i*bucket_size..].to_vec()
            }else{
                input[i*bucket_size..(i+1)*bucket_size].to_vec()
            };
            thread::spawn(move || count_lines(bucket))
        })
        .collect();
    for handler in handlers {
        let num = handler.join().unwrap();
        for i in 0..4 {
            sum[i] += num[i]
        }
    }
    println!("[A,C,G,T] = {:?}", sum);
    Ok(())
}
```
本来はこんなに頑張る必要はありません！ [Rayon](https://docs.rs/rayon/1.0.3/rayon/)というライブラリは、イテレータを精製するメソッド`iter()`を`par_iter()`に変えるだけで、プログラムを並列化します！

他に話せなかった話題としては、次のようなものがあります。

- パッケージマネージャ
- クロージャ
- 暗黙の型変換
- 構造体とメソッド、トレイト
- ジェネリクス
- テストとアサーション

これらのどれも、Rust言語を書きやすく、強力なものにしています。Rust とは、高速で、メモリ安全な、並列処理を主眼に据えたシステムプログラミング言語です。みなさんも日頃の小さなスクリプトから初めて、Rustでアプリケーションを書いてみましょう。

[^1]: C言語ふうにいうと、`next()`というメンバ関数を持つ構造体を返します。`next()`は`NULL`か、何かの内容物を返します（ジェネリクス）。この`next()`を使って、Rustコンパイラはいくつかのメンバ関数を自動的に実装します。それが`collect()`です。

[^2]: エラーメッセージが受け取れることを除けば、これは、Pythonふうにいうと`with`文で、C風にいうと、ファイルディスクリプタが`NULL`かチェックして、`NULL`のときに早期リターンすることに等しいです。

[^3]: 所有権は値に存在しています。なので、例えば`x`がある値の所有権を持っている、という風に言います。面倒なので、よく変数の所有権と言って、その値の所有権について語ることが多いです。

[^4]: とはいえ、注意してください。例えば、参照をほかのスレッドに配ったとき、その参照は親のスレッドより長生きしてはいけません。一方で、よく知られているように、親のプロセスよりも子の方が長く続くことはままあるので、単純にスレッドを産むだけでは、うまく並列化できません。最も単純な解決策としては、所有権を渡してしまう、というものがあります。

