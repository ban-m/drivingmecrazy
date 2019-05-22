+++
title = "Rust言語でファイルI/Oと入力の処理を別のスレッドで実行する(非同期I/O)"
date = 2019-05-22
draft = false
tags = []
order = 0
weight = 0
aliases = []
template = "page.html"
[extra]
+++

# これは何？

タイトル通り、Rust言語で、入力（ファイルの読み込み）をあるスレッドで行い、入力の処理を別のスレッドで行うプログラムを書く。

なぜこんな処理が必要になっているかというと、ファイルシステムが（単にインターネットを介しているなどの理由で）遅いことがあるからだ。また、データを一つずつ処理できるときは、いちいち`Vec<T>`などのコンテナにアロケートするより、出てきた順に処理した方が早くなりそう。

要点としては、

- `Arc<Mutex<T>>`を使ってデータのやり取りをするのはヤバい
- Multiple producer, single consumer channelが標準ライブラリに実装されているので、それを使う 

となる。

<!--more-->

# 内容

## 入力のモックを作る

ファイル入出力を再現するようなコードをまず作る。本当は`std::io::Read`トレイトを実装すればいいだけの話だが、それもやり過ぎだろう。

重要なのは、1．いくつの要素が入っているか 2.読むときにどのくらいの遅延が生じるか なので、ここを設定できるような構造体を作る。

```rust
struct FileStream {
    count: usize,
    read_time: std::time::Duration,
}
```

"入力を読み込む"ことは、バッファーを用いた関数で再現する。はじめに述べたような状況では、ほとんどの人が簡単で、可読性を損なわない程度の最適化を書いている。従って、大体の場合、バッファーを使い回すような実装を行うからだ。

```rust
impl FileStream {
    fn new(count: usize, micro: u64) -> Self {
        let read_time = std::time::Duration::from_micros(micro);
        FileStream { count, read_time }
    }
    fn read(&mut self, record:&mut Vec<u8>) -> Option<()> {
        if self.count != 0 {
            self.count -= 1;
            thread::sleep(self.read_time);
            record.clear();
            (0..1000).for_each(|e| record.push((e % 255) as u8));
            Some(())
        } else {
            None
        }
    }
}
```
`read`関数は、バッファーを受け取り、レコード数に達するまで、バッファーを消去して、新しい要素で置き換える。その際、`read_time`だけの遅延が発生する。


さて、レコードを処理する関数は、だいたい1ミリ秒で1レコード処理できるとしよう。ここは適当にしてある。
```rust
fn process<T>(_: T) {
    thread::sleep(std::time::Duration::from_millis(1))
}
```

シングルスレッドで行う場合、次のような関数を使うことになるだろう。本当は、`process`の結果をまとめて返すはずだが、そこは外してある。

```rust
fn single_test() {
    let mut fs = FileStream::new(10_000, 1000);
    let mut record = vec![];
    while let Some(record) = fs.read(&mut record) {
        process(record);
    }
    println!("Single:OK");
}
```

さて、これを非同期I/Oっぽく書きたい。次のライブラリを名前空間に持ち込んでおく。

`mpsc`はMulti-producer, Single-consumerの略で、『複数のスレッドが何かを生産して、一つのスレッドがそれらを処理する』ことを抽象化する。もちろん、`T`を適当な型として、Producerは`Sender<T>`、Consumerは`Receiver<T>`の型を持つ。

難しく聞こえるが、実際には単にスレッド間に共有されたFIFOキューだ。直感的にもSPMCよりもMPSCの方がシンプルなのは分かるだろう。というのも、受信者が複数いると、**複数のスレッドが同じ要素を受信してしまう**という様な状況が起こりうるからだ（`Mutex<T>`を使え）。

`thread`はRustの標準ライブラリに入っているスレッドライブラリだ。良い知らせ：**RustにGILはない。**つまり、スレッドはそれぞれ別のプロセスで同時に動く。

これも、使い方は非常に単純で、`thread::spawn(function)`で、`function`を新しく生やしたスレッドで実行する。`thread::spawn(|| print!("{}",1213+3);)`みたいな感じだ。

注意：Rustの生存期間ルールはスレッドにも適用される。**参照は本体より長生きしてはいけない**ルールのことだ。ところで、生えたスレッドは、元のスレッドより長生きする可能性があるのだから（本当にある。例えば、ものすごく長い処理をスレッドに投げて、自分は`return`すればいい）、スレッドに参照を投げるのは、やや難しい。出来ないことはない。


```rust
use std::sync::mpsc;
use std::thread;
```

MPSCは`mpsc::channel<T>()`と`mpsc::sync_channel<T>()`という二つの関数を持っている。前者が送信を非同期に行い、後者が送信を同期しながら行う。もちろん、受信はだいたいブロッキングで行う。

具体的には、

```rust
let (tx,rx) = mpsc::channel();
tx.send(12).unwrap();
rx.recv().unwrap();
```

などのように使う。

では、データを処理する側の関数を書こう。`rx`というデータの受信チャネルと、`tx2`と言う結果の送信チャネルをもらう関数になる。

```rust
fn consumer_process(rx: mpsc::Receiver<Vec<u8>>, tx2: mpsc::Sender<String>){
    while let Ok(record) = rx.recv() {
        process(record);
    }
    tx2.send("OK".to_string()).unwrap();
}
```

ファイルを読み込む側の関数はも簡単だ。シングルスレッド用の関数に、チャネルを開く関数を足してやればいい。

```rust
fn parallel_test() {
    let mut fs = FileStream::new(10_000, 1000);
    let mut record = vec![];
    let (tx2, rx2) = mpsc::channel(); // To send answers
    let (tx, rx) = mpsc::channel(); // To send data
    thread::spawn(move || consumer_process(rx,tx2));
    while let Some(_) = fs.read(&mut record){
        tx.send(record.clone()).unwrap();
    }
    drop(tx);
    let result = rx2.recv().unwrap();
    println!("Mult:{}", result);
}
```

いくつか注意がある。

まず、スレッドに渡すときの`move`を忘れてはいけない。これは所有権を別のスレッドに渡すことを明示的に書く必要があるためだ。

また、明示的に`drop(tx)`を行わないと、いつ入力が終わったかを受信側が知ることが出来なくなる。簡単に言えば、ものすごくファイルの読み込みに時間が掛かっているだけなのか、それとも、チャンネルの向こう側では、入力が終わっているのかを、受信側からは知る手段がない為だ。

これを教えるために、`drop(tx)`を使う。これは、チャネルがハングアップしたことを向こう側に知らせる。受信側はそれを受けて、`recv()`が呼ばれたときに、`Err(_)`を返すようになる。

もちろん、スコープを作って
```rust
{
let (rx,tx) = mpsc::channel();
thread::spawn(move || // receive.)
// send
} // rx will drop here, and tx would notice it.
```
としてもいい。

最後に、明示的に`let handle = thread::spawn();`と変数をバインドして、`handle.join()`を`rx2.recv()`の前で呼ぶ必要は無い。というのも、`recv()`は無限に待つからだ。

最後に、メインの関数を書く。
```rust
fn main() {
    let single_start = std::time::Instant::now();
    single_test();
    let single_end = std::time::Instant::now();
    let parallel_start = std::time::Instant::now();
    parallel_test();
    let parallel_end = std::time::Instant::now();
    println!(
        "Single:{:?}\nMulti:{:?}",
        single_end - single_start,
        parallel_end - parallel_start
    );
}
```

当然の結果だが、1.5倍程度早くなる。

