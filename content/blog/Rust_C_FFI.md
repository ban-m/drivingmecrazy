+++
title = "RustからCの関数/構造体/ポインタをFFIを用いて使用する"
date = 2019-06-14
draft = false
order = 0
weight = 0
aliases = []
template = "page.html"
[taxonomies]
tags = ["C", "Rust", "Programming", "FFI"]
categories = ["Programming"]
[extra]

+++

# これは何？

Cのライブラリや関数をRustから呼ぶときの方法を記したもの。かなり互換性はあるが、変なところで詰まるので注意。

<!-- more -->

# 内容


## 前置き

Cのコードを使いたいが、Cのコードは書きたくないことがある。例えば、Cで書かれたライブラリを使用するときなどだ。Bzip、Openssl、CPLEXなど、Cで書かれた高速・優秀なコードは山のようにあり、それらをRustで再発明するのは単に時間の無駄だ。

有名なライブラリだと、すでにラッパーライブラリや互換ライブラリが作られていることが多い。極端な話をすると、libcはRustに移植されて、[libc](https://github.com/rust-lang/libc)というライブラリになっている。ラッパーを書くのが大変/プラットフォーム依存のコードがある場合は、[bindgen](https://github.com/rust-lang/rust-bindgen)という、C/C++ライブラリから、自動でRustのバインディングを作るライブラリもある。これはコンパイル時にバインディングを作るので、プラットフォーム依存のコードもうまく扱える。

一方で、一瞬だけCで書いて、それをRustから呼ぶ、ということもある。Cのあるライブラリのごく一部だけを使ったサブルーチンを書いて、それをRustから直接呼びたいときだ。要するに、

データ -> Rust -> C -> Rust -> 出力

な時がある。アラインメントソフトは多くがCで書かれているため、実際にこれをしたいことは頻繁に起こる。当然、一時ファイルをかませて、

データ -> Rust -> 中間ファイル -> C -> 中間ファイル -> Rust -> 出力　としてもいいが、余分なI/Oが入ってしまう。

## 実装

[bitbucket レポジトリ](https://bitbucket.org/ban-m/call_c_function_from_rust/src)にコードを全て置いてあるので、再現したいひとは、クローンして `make`して`cargo run`してください。

### Cのnullary function を呼ぶ

まず、Cの関数を定義してみよう。
```c
#include <stdio.h>
#include <stdlib.h>
void hello_world(){
  fprintf(stdout,"hello from C\n");
}
```
`gcc`でコンパイルして、ライブラリを作成しよう。
```bash
gcc -g -Wall -fPIC -c -O2 ./src/test.c -o ./target/libtest.a
```
これで`./target/libtest.a`がコンパイルできた。このライブラリをインクルードして、`hello_world`をRustから呼ぶには、すこし工夫が必要になる。

まず、ビルドツール`cargo`に、このライブラリをリンクすることと、このライブラリのパスを教えないといけない:[^path]。

[^path]: Cで言うところの`-L /path/to/library -l[library name]`をする。ちなみに、Rustもデフォルトのリンカーは`ld`なので、`ld`の探すパスを変更すると、`cargo`も影響を受ける

そのために、**プロジェクトのルートに**`build.rs`というファイルを作成する。中身を次のようにする。

```rust
use std::env;
fn main(){
    let project_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    println!("cargo:rustc-link-search={}/target/", project_dir); // the "-L" flag
    println!("cargo:rustc-link-lib=test"); // the "-l" flag
}
```
ここに書いたプログラムは、`./src/`のファイルがコンパイルされる前にコンパイルされる。そのときに、標準出力をキャッチして、それを環境変数に組み込む。けっこうとんでもない設定だが、[そうしろと書いてあるのでそうする](https://doc.rust-lang.org/cargo/reference/build-scripts.html)。

この後、**./src/main.rs**に、先ほどのCのコードのバインディングを書く。
```rust
// Binding
extern "C"  {
    fn hello_world();
}
fn main(){
    unsafe{hello_world()};
}
```
Cの関数は（内部で何をするか、本当にわからないので）`unsafe`ブロックで囲う必要がある。この中で起きていることに関しては、コンパイラは本当に何も言わないので、本当に注意する必要がある。例えば、この中では**生ポインタに加算して参照を外**せたりする。

`cargo run`すると、標準出力に`hello,world`と表示されるはずだ。:[^fPIC]

[^fPIC]: たまに長大なエラーが出ることがある。エラーメッセージを読むと、たいてい、`-fPIC`フラグを**ライブラリのビルド時に**渡せと書いてある。その通りにすると、うまく動く。

### C のunary functionを呼ぶ。

```c
int two_times(int x){
  fprintf(stdout,"%d",x);
  return 2*x;
}
```

これも同じようにすればいい。

```rust
use std::os::raw::c_int; // Integer in C language. Almost always, it is just i32.
extern "C"  {
    fn two_times(x:c_int)->c_int;
}
fn main(){
    unsafe{
        println!("{}",two_times(10));
    }
}
```

簡単！　型に注意しよう。

###  Rust の型と C の構造体を同一視する

Cの関数で、C言語内部で定められた型を要求するものがある。例えば、

```c
typedef struct {
  int inner;
} Test;

void print_test(Test t){
  fprintf(stdout,"%d\n",t.inner);
}
```

というコードなどだ。

バインディングを書くときは、構造体もRust内で用意してやる必要がある。構える必要はなくて、単に`#[repr(C)]`と書いてやれば、Cがやる通りに変数を並べる。つまり、バイト列としても互換性がある型を用意できる。

```rust

#[derive(Debug)]
#[repr(C)]
struct Test{
    inside:c_int,
}
extern "C"{
    fn print_test(t:Test);
}
fn main(){
    let test = Test{inside:10};
    unsafe{
        print_test(test);
    };
}
```
構造体をRustで作って、Cに渡している。ここには境界がないように見える！

### Cから配列をもらう

当然、配列の受け渡しも可能だ。というのも、つまるところ、Cにおいて、配列とは、ヒープにおける配列の先頭を指すポインタに過ぎない。ポインタは単なるメモリ番地だと思うことができる。

```c
int * construct_array(int length){
  int * array = (int*)(malloc(sizeof(int) * length));
  for (int i = 0 ; i < length ; i ++){
    array[i] = i;
  }
  return array;
}
void free_array(int *array){
  free(array);
}
```

ただ、注意するべきこととして、使い終わったメモリについてはよく考える必要がある。Rustは所有権システムを用いていて、所有権を持っているものは何であれ、スコープから抜けたときに削除する。配列も例外ではなく、`free()`が呼ばれるのもこのタイミングだ。

一方で、Cでアロケーションされたメモリを、Rustで`free()`するのは**本当に危険だ**。というのも、このメモリはRustのメモリアロケーションプログラムで確保されたものではないため、Rustのデアロケーションはうまくいかない可能性がある。

短く言うとこうだ：**Cが確保したメモリはCが解放する。Rustが確保したメモリはRustが解放する**。

なぜCの方で`free_array`があるかわかってもらえたと思う。

Rustのバインディングは
```rust
extern "C"{
    fn construct_array(length:c_int)-> *mut c_int;
    fn free_array(array:*mut c_int);
}
fn main(){
    let length = 10;
    let mut array = unsafe{
        let a = construct_array(length);
        Vec::from_raw_parts(a, length as usize, length as usize)
    };
    println!("{:?}",array);
    unsafe{
        free_array(array.as_mut_ptr())
    };
    std::mem::forget(array); // Indeed needed.
}
```
最後の`std::mem::forget(array)`を行わないと、ダブルフリーに似た現象が起こる。つまり、`free_array()`で解放したメモリを、Rustのデアロケータが解放しようとする。実際、この行をコメントアウトするとセグフォする:[^mem]。

もう一つ例として、配列を持った構造体を考えてみる。
```c
typedef struct {
  int* array;
  int length;
} IntVector;

IntVector construct_seq(int length){
  int * array = construct_array(length);
  IntVector res = {array,length};
  return res;
}

void free_vec(IntVector* vec){
  fprintf(stdout,"dropping from C...:%p\n",vec->array);
  free(vec->array);
}
```
Rustのバインディングは次の通りになる。

```rust
extern "C"{
    fn construct_seq(length:c_int)-> IntVector;
    fn free_vec(iv:&IntVector);
}
#[derive(Debug)]
#[repr(C)]
struct IntVector{
    array:*const c_int,
    length: c_int,
}

fn main(){
    let array = unsafe{
        construct_seq(length)
    };
    eprintln!("{:?}",array);
    unsafe{
        free_vec(&array);
    }
}
```
今回は`mem::forget()`によってデストラクタが走るのを防ぐのは必要ではない。この例では、内側の配列は`*const c_int`で表される、単なるポインタなので、Drop時にも、とくに`free()`されることはない。
しかし、当然、`free_vec()`を呼ぶ必要はあり、そうしないとメモリリークする（`valgrind`等で検出できる）。


### 難しい例

最後に、『内側に`Test`という構造体の配列を持った構造体の配列』を渡すことを考えてみる。この例はよくあり、例えば、あるリードをリファレンスに当てて、アラインメントを全て持ってくると、それは『Cigarという構造体の配列を持った、アラインメントという構造体の配列』になる。

```c

typedef struct {
  Test *array;
  int length;
} TestVec;


void free_tv(TestVec* tv){
  fprintf(stdout,"dropping from C...%p\n",tv->array);
  free(tv->array);
}


TestVec* allocate_testvec(int* totlen){
  int len = 10;
  TestVec *result = (TestVec*)(malloc(sizeof(TestVec)*len));
/* Initialization start */
  for (int i = 0 ; i < len ; i ++){
    result[i].array = (Test*)(malloc(sizeof(Test)*i));
    for (int j = 0 ; j < i ; j ++){
      result[i].array[j].inner = i*j;
    }
    result[i].length = i;
  }
/* init end */
  *totlen = len;
  return result;
}

void free_testvec_vec(TestVec *tv, int length){
  for (int i = 0 ; i < length ; i ++){
    free_tv(&tv[i]);
  }
  free(tv);
}
```

Rustのバインディングを書くとき、*これはRustの`free()`が走る構造体か？*と考えながら書かなければいけない。`Vec`は`free()`が走る。もっと言うと、ヒープにアロケートされる構造体は全て`free()`が走る。

```rust
extern "C"  {
    fn free_tv(tv:&TestVec);
    fn allocate_testvec(totlen:*mut c_int)->*mut TestVec;
    fn free_testvec_vec(tvs:*mut TestVec, length:c_int);
}

#[derive(Debug)]
#[repr(C)]
struct TestVec{
    array:*const Test,
    length:c_int,
}

fn main(){
    let mut totlen = 0;
    let mut result = unsafe{
        std::vec::Vec::from_raw_parts(result,totlen as usize,totlen as usize)
    };
    for tv in &result{
        println!("{:?}",tv);
    }
    unsafe{
        free_testvec_vec(result.as_mut_ptr(),totlen);
    };
    std::mem::forget(result);
}
```
最後の`mem::forget()`を忘れないこと。

余談だが、場合によっては`Drop`トレイトを実装して、Rust側の`free()`が呼ばれるのを防ぐこともできる。ただ、`Vec<T>`に対して、`Drop`を上書きして実装することはできない。というのも、このとき、構造体もトレイトも標準ライブラリ由来で、自分が作ったものではないからだ。どちらかが自分の作ったものであるならば、実装できるので、ラッパー構造体を作るのもよい。



[^mem]: `mem::forget()`は`unsafe`ではない。これはちょっと不思議だが、実は、Rustは一方向の安全性しか担保してないことを思い出すと、納得できる。つまり、*参照した場所は必ずあるが、参照できなくなった場所が必ずなくなるとは限らない*。例えば、途中で`exit()`すると、確保されていたオブジェクトたちは`free()`されない。